import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
// For Node.js < 22, supabase realtime needs an explicit WebSocket transport (ws package)
import WebSocket from 'ws';

dotenv.config();

type SnackPayload = {
  name?: string;
};

type SnackRow = {
  id: string;
  name: string;
};

type VoucherItemPayload = {
  snackId?: string | null;
  name?: string;
  qty?: number | string;
  unit?: number | string;
  unit2?: number | string;
  price?: number | string;
};

type VoucherPayload = {
  voucherNumber?: string;
  voucherDate?: string;
  buyerName?: string | null;
  status?: 'draft' | 'complete';
  discount?: number | string;
  lastPaymentDue?: number | string;
  items?: VoucherItemPayload[];
};

type VoucherBulkDeletePayload = {
  ids?: string[];
};

type VoucherRow = {
  id: string;
  voucher_number: string;
  voucher_date: string;
  buyer_name: string | null;
  status: 'draft' | 'complete';
  subtotal: number;
  discount: number;
  total: number;
  last_payment_due: number;
  created_at: string;
  updated_at: string;
};

type VoucherItemRow = {
  id: string;
  voucher_id: string;
  snack_id: string | null;
  item_name: string;
  quantity: number;
  unit: number;
  unit_2: number;
  unit_price: number;
  line_total: number;
  created_at: string;
  updated_at: string;
};

const port = Number(process.env.PORT || 3001);
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const allowedOrigins = clientOrigin
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  realtime: {
    transport: WebSocket as any,
  },
});
const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  }),
);
app.use(express.json());

function toNumber(value: number | string | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeSnack(payload: SnackPayload) {
  return {
    name: (payload.name ?? '').trim(),
  };
}

function mapSnack(row: SnackRow) {
  return {
    id: row.id,
    name: row.name,
  };
}

function mapVoucherItem(row: VoucherItemRow) {
  return {
    id: row.id,
    voucher_id: row.voucher_id,
    snack_id: row.snack_id,
    item_name: row.item_name,
    quantity: row.quantity,
    unit: row.unit,
    unit2: row.unit_2,
    unit_price: row.unit_price,
    line_total: row.line_total,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function normalizeVoucherItems(items: VoucherItemPayload[]) {
  const normalized: Array<{
    snack_id: string | null;
    item_name: string;
    quantity: number;
    unit: number;
    unit2: number;
    unit_price: number;
  }> = [];

  for (const item of items) {
    const qty = Math.max(1, toNumber(item.qty, 1));
    const unit = Math.max(1, toNumber(item.unit, 1));
    const unit2 = Math.max(1, toNumber(item.unit2, 1));
    const snackId = item.snackId?.trim() || null;

    if (snackId) {
      const { data: snack, error } = await supabase
        .from('snacks')
        .select('id, name')
        .eq('id', snackId)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!snack) {
        throw new Error('Selected snack not found.');
      }

      normalized.push({
        snack_id: snack.id,
        item_name: snack.name,
        quantity: qty,
        unit,
        unit2,
        unit_price: Math.max(0, toNumber(item.price, 0)),
      });
      continue;
    }

    const name = (item.name ?? '').trim();
    if (!name) {
      continue;
    }

    normalized.push({
      snack_id: null,
      item_name: name,
      quantity: qty,
      unit,
      unit2,
      unit_price: Math.max(0, toNumber(item.price, 0)),
    });
  }

  return normalized;
}

app.get('/api/health', (_request: Request, response: Response) => {
  response.json({ ok: true });
});

app.get('/api', (_request: Request, response: Response) => {
  response.json({
    ok: true,
    message: 'Snack Voucher API',
    endpoints: ['/api/health', '/api/snacks', '/api/vouchers'],
  });
});

app.get('/favicon.ico', (_request: Request, response: Response) => {
  // Redirect favicon requests to the client dev server where the SVG lives.
  const target = clientOrigin.replace(/\/$/, '') + '/favicon.svg';
  response.redirect(target);
});

app.get('/', (request: Request, response: Response) => {
  // Return JSON status for API root. If the client explicitly wants HTML, include a hint.
  const acceptsHtml = String(request.headers.accept || '').includes('text/html');

  const payload = {
    ok: true,
    service: 'Snack Voucher API',
    message: 'API is running. Use /api/health for a lightweight check.',
    endpoints: ['/api/health', '/api/snacks', '/api/vouchers'],
    clientOrigin,
  };

  if (acceptsHtml) {
    // For browser visits, still return JSON but with content-type text/html to be viewable.
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
  }

  response.json(payload);
});

app.get('/api/snacks', async (_request: Request, response: Response) => {
  const { data, error } = await supabase.from('snacks').select('id, name').order('name', { ascending: true });

  if (error) {
    response.status(500).json({ error: error.message });
    return;
  }

  response.json((data ?? []).map((row: SnackRow) => mapSnack(row)));
});

app.post('/api/snacks', async (request: Request<unknown, unknown, SnackPayload>, response: Response) => {
  const payload = normalizeSnack(request.body as SnackPayload);

  if (!payload.name) {
    response.status(400).json({ error: 'Snack name is required.' });
    return;
  }

  const { data, error } = await supabase.from('snacks').insert(payload).select('id, name').single();

  if (error || !data) {
    response.status(500).json({ error: error?.message ?? 'Failed to create snack.' });
    return;
  }

  response.status(201).json(mapSnack(data as SnackRow));
});

app.get('/api/snacks/:id', async (request: Request, response: Response) => {
  const id = String(request.params.id || '');
  if (!id) {
    response.status(400).json({ error: 'Snack id is required.' });
    return;
  }

  const { data, error } = await supabase.from('snacks').select('id, name').eq('id', id).maybeSingle();
  if (error) {
    response.status(500).json({ error: error.message });
    return;
  }

  if (!data) {
    response.status(404).json({ error: 'Snack not found.' });
    return;
  }

  response.json(mapSnack(data as SnackRow));
});

app.patch('/api/snacks/:id', async (request: Request, response: Response) => {
  const id = String(request.params.id || '');
  if (!id) {
    response.status(400).json({ error: 'Snack id is required.' });
    return;
  }

  const payload = normalizeSnack(request.body as SnackPayload);

  try {
    const { data, error } = await supabase.from('snacks').update(payload).eq('id', id).select('id, name').maybeSingle();
    if (error) {
      response.status(500).json({ error: error.message });
      return;
    }

    if (!data) {
      response.status(404).json({ error: 'Snack not found.' });
      return;
    }

    response.json(mapSnack(data as SnackRow));
  } catch (e: any) {
    response.status(500).json({ error: e?.message ?? String(e) });
  }
});

app.delete('/api/snacks/:id', async (request: Request, response: Response) => {
  const id = String(request.params.id || '');
  if (!id) {
    response.status(400).json({ error: 'Snack id is required.' });
    return;
  }

  const { error } = await supabase.from('snacks').delete().eq('id', id);
  if (error) {
    response.status(500).json({ error: error.message });
    return;
  }

  response.status(204).end();
});
app.get('/api/vouchers', async (_request: Request, response: Response) => {
  const { data, error } = await supabase
    .from('vouchers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    response.status(500).json({ error: error.message });
    return;
  }

  response.json(data ?? []);
});

app.get('/api/vouchers/:id', async (request: Request, response: Response) => {
  const id = String(request.params.id || '');
  if (!id) {
    response.status(400).json({ error: 'Voucher id is required.' });
    return;
  }

  const { data: voucherData, error: voucherError } = await supabase.from('vouchers').select('*').eq('id', id).maybeSingle();
  if (voucherError) {
    response.status(500).json({ error: voucherError.message });
    return;
  }

  if (!voucherData) {
    response.status(404).json({ error: 'Voucher not found.' });
    return;
  }

  const { data: itemsData, error: itemsError } = await supabase
    .from('voucher_items')
    .select('*')
    .eq('voucher_id', id)
    .order('created_at', { ascending: true });
  if (itemsError) {
    response.status(500).json({ error: itemsError.message });
    return;
  }

  response.json({
    ...(voucherData as VoucherRow),
    items: (itemsData ?? []).map((row) => mapVoucherItem(row as VoucherItemRow)),
  });
});

app.patch('/api/vouchers/:id', async (request: Request, response: Response) => {
  const id = String(request.params.id || '');
  if (!id) {
    response.status(400).json({ error: 'Voucher id is required.' });
    return;
  }

  const payload = request.body as VoucherPayload;
  const update: Partial<VoucherRow> = {};
  if ((payload as any).buyerName !== undefined) update.buyer_name = (payload as any).buyerName?.trim() || null;
  if ((payload as any).status !== undefined) update.status = (payload as any).status === 'complete' ? 'complete' : 'draft';
  if (payload.voucherDate !== undefined) update.voucher_date = payload.voucherDate as unknown as string;
  if (payload.voucherNumber !== undefined) update.voucher_number = (payload.voucherNumber ?? '').trim();
  update.discount = 0;
  if (payload.lastPaymentDue !== undefined) update.last_payment_due = Math.max(0, toNumber(payload.lastPaymentDue, 0));

  // fetch existing items to allow rollback if items replacement fails
  const { data: existingItems } = await supabase.from('voucher_items').select('*').eq('voucher_id', id);

  try {
    const { data: updatedVoucher, error: updateError } = await supabase.from('vouchers').update(update).eq('id', id).select('*').maybeSingle();
    if (updateError) {
      response.status(500).json({ error: updateError.message });
      return;
    }

    if (!updatedVoucher) {
      response.status(404).json({ error: 'Voucher not found.' });
      return;
    }

    // If items are provided, replace them
    if (Array.isArray(payload.items)) {
      const normalizedItems = await normalizeVoucherItems(payload.items);
      const itemsInsert = normalizedItems.map((item) => ({
        voucher_id: id,
        snack_id: item.snack_id,
        item_name: item.item_name,
        quantity: item.quantity,
        unit: item.unit,
        unit_2: item.unit2,
        unit_price: item.unit_price,
      }));

      // backup existing items already fetched
      await supabase.from('voucher_items').delete().eq('voucher_id', id);

      if (itemsInsert.length > 0) {
        const itemsResult = await supabase.from('voucher_items').insert(itemsInsert);
        if (itemsResult.error) {
          // attempt rollback by restoring previous items
          if (existingItems && existingItems.length > 0) {
            await supabase.from('voucher_items').insert(
              existingItems.map((it: any) => ({
                voucher_id: id,
                snack_id: it.snack_id,
                item_name: it.item_name,
                quantity: it.quantity,
                unit: it.unit,
                unit_price: it.unit_price,
              })),
            );
          }
          response.status(500).json({ error: itemsResult.error.message });
          return;
        }
      }
    }

    // re-fetch voucher with items
    const { data: finalVoucher } = await supabase.from('vouchers').select('*').eq('id', id).maybeSingle();
    const { data: finalItems } = await supabase.from('voucher_items').select('*').eq('voucher_id', id).order('created_at', { ascending: true });

    response.json({
      ...(finalVoucher as VoucherRow),
      items: (finalItems ?? []).map((row) => mapVoucherItem(row as VoucherItemRow)),
    });
  } catch (e: any) {
    response.status(500).json({ error: e?.message ?? String(e) });
  }
});

app.delete('/api/vouchers/:id', async (request: Request, response: Response) => {
  const id = String(request.params.id || '');
  if (!id) {
    response.status(400).json({ error: 'Voucher id is required.' });
    return;
  }

  const { error } = await supabase.from('vouchers').delete().eq('id', id);
  if (error) {
    response.status(500).json({ error: error.message });
    return;
  }

  response.status(204).end();
});

app.post('/api/vouchers/bulk-delete', async (request: Request<unknown, unknown, VoucherBulkDeletePayload>, response: Response) => {
  const rawIds = Array.isArray(request.body?.ids) ? request.body.ids : [];
  const ids = Array.from(new Set(rawIds.map((id) => String(id || '').trim()).filter(Boolean)));

  if (!ids.length) {
    response.status(400).json({ error: 'At least one voucher id is required.' });
    return;
  }

  const { error } = await supabase.from('vouchers').delete().in('id', ids);
  if (error) {
    response.status(500).json({ error: error.message });
    return;
  }

  response.json({
    deletedIds: ids,
    deletedCount: ids.length,
  });
});

app.post('/api/vouchers', async (request: Request<unknown, unknown, VoucherPayload>, response: Response) => {
  const payload = request.body as VoucherPayload;
  const voucherNumber = (payload.voucherNumber ?? '').trim();
  const voucherDate = payload.voucherDate || new Date().toISOString().slice(0, 10);
  const buyerName = payload.buyerName?.trim() || null;
  const status = payload.status === 'complete' ? 'complete' : 'draft';
  const lastPaymentDue = Math.max(0, toNumber(payload.lastPaymentDue, 0));
  const items = Array.isArray(payload.items) ? payload.items : [];

  if (!voucherNumber) {
    response.status(400).json({ error: 'Voucher number is required.' });
    return;
  }

  let normalizedItems: Array<{
    snack_id: string | null;
    item_name: string;
    quantity: number;
    unit: number;
    unit2: number;
    unit_price: number;
    line_total: number;
  }> = [];

  try {
    const builtItems = await normalizeVoucherItems(items);
    normalizedItems = builtItems.map((item) => ({
      ...item,
      line_total: item.quantity * item.unit * item.unit_price,
    }));
  } catch (e: any) {
    response.status(400).json({ error: e?.message ?? 'Invalid voucher items.' });
    return;
  }

  const subtotal = normalizedItems.reduce((total, item) => total + item.line_total, 0);
  const total = subtotal;

  const voucherInsert = {
    voucher_number: voucherNumber,
    voucher_date: voucherDate,
    buyer_name: buyerName,
    status,
    subtotal,
    discount: 0,
    total,
    last_payment_due: lastPaymentDue,
  };

  const voucherResult = await supabase.from('vouchers').insert(voucherInsert).select('*').single();

  if (voucherResult.error || !voucherResult.data) {
    response.status(500).json({ error: voucherResult.error?.message ?? 'Failed to create voucher.' });
    return;
  }

  const voucher = voucherResult.data as VoucherRow;
  const itemsInsert = normalizedItems.map((item) => ({
    voucher_id: voucher.id,
    snack_id: item.snack_id,
    item_name: item.item_name,
    quantity: item.quantity,
    unit: item.unit,
      unit_2: item.unit2,
    unit_price: item.unit_price,
  }));

  if (itemsInsert.length > 0) {
    const itemsResult = await supabase.from('voucher_items').insert(itemsInsert);
    if (itemsResult.error) {
      await supabase.from('voucher_items').delete().eq('voucher_id', voucher.id);
      await supabase.from('vouchers').delete().eq('id', voucher.id);
      response.status(500).json({ error: itemsResult.error.message });
      return;
    }
  }

  const { data: insertedItems } = await supabase.from('voucher_items').select('*').eq('voucher_id', voucher.id).order('created_at', { ascending: true });

  response.status(201).json({
    ...voucher,
    items: (insertedItems ?? []).map((row) => mapVoucherItem(row as VoucherItemRow)),
  });
});

app.use((_request: Request, response: Response) => {
  response.status(404).json({ error: 'Not found' });
});

app.listen(port, () => {
  console.log(`Snack Voucher API running on http://localhost:${port}`);
});
