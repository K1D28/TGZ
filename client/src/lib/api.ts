export type SnackApiRecord = {
	id: string;
	name: string;
};

export type SnackApiInput = {
	name: string;
};

export type VoucherLineItemInput = {
	snackId?: string | null;
	name: string;
	qty: number;
	unit?: number;
	unit2?: number;
	price: number;
};

export type VoucherLineItemRecord = {
	id: string;
	voucher_id: string;
	snack_id: string | null;
	item_name: string;
	quantity: number;
	unit: number;
	unit2: number;
	unit_price: number;
	line_total: number;
	created_at: string;
	updated_at: string;
};

export type SnackLookupRecord = Pick<SnackApiRecord, 'id' | 'name'>;

export type VoucherApiRecord = {
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

export type VoucherApiInput = {
	voucherNumber: string;
	voucherDate: string;
	buyerName?: string | null;
	status?: 'draft' | 'complete';
	discount?: number;
	lastPaymentDue?: number;
	items: VoucherLineItemInput[];
};

export type VoucherBulkDeleteResponse = {
	deletedIds: string[];
	deletedCount: number;
};

const apiBase = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '/api' : 'https://tgz-production.up.railway.app/api');

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(`${apiBase}${path}`, {
		...init,
		headers: {
			'Content-Type': 'application/json',
			...(init?.headers ?? {}),
		},
	});

	if (!response.ok) {
		const message = await response.text();
		throw new Error(message || `Request failed with ${response.status}`);
	}

	const contentType = response.headers.get('content-type') ?? '';
	if (!contentType.includes('application/json')) {
		const body = await response.text();
		throw new Error(
			`Expected JSON from ${apiBase}${path}, but received ${contentType || 'unknown content type'}. ` +
				`Check VITE_API_BASE_URL and backend CORS. Body preview: ${body.slice(0, 120)}`,
		);
	}

	return response.json() as Promise<T>;
}

export const api = {
	listSnacks: () => requestJson<SnackApiRecord[]>('/snacks'),
	createSnack: (payload: SnackApiInput) => requestJson<SnackApiRecord>('/snacks', { method: 'POST', body: JSON.stringify(payload) }),
	updateSnack: (id: string, payload: SnackApiInput) => requestJson<SnackApiRecord>(`/snacks/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
	deleteSnack: async (id: string) => {
		const response = await fetch(`${apiBase}/snacks/${id}`, { method: 'DELETE' });
		if (!response.ok) {
			const message = await response.text();
			throw new Error(message || `Request failed with ${response.status}`);
		}
		return;
	},
	listVouchers: () => requestJson<VoucherApiRecord[]>('/vouchers'),
	getVoucher: (id: string) => requestJson<VoucherApiRecord & { items: VoucherLineItemRecord[] }>(`/vouchers/${id}`),
	createVoucher: (payload: VoucherApiInput) => requestJson<VoucherApiRecord & { items: VoucherLineItemRecord[] }>('/vouchers', { method: 'POST', body: JSON.stringify(payload) }),
	updateVoucher: (id: string, payload: VoucherApiInput) => requestJson<VoucherApiRecord & { items: VoucherLineItemRecord[] }>(`/vouchers/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
	deleteVoucher: async (id: string) => {
		const response = await fetch(`${apiBase}/vouchers/${id}`, { method: 'DELETE' });
		if (!response.ok) {
			const message = await response.text();
			throw new Error(message || `Request failed with ${response.status}`);
		}
		return;
	},
	deleteVouchers: (ids: string[]) => requestJson<VoucherBulkDeleteResponse>('/vouchers/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
	listSnacksForLookup: () => requestJson<SnackLookupRecord[]>('/snacks'),
};
