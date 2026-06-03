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
	status: 'draft' | 'paid' | 'pending' | 'void';
	subtotal: number;
	discount: number;
	total: number;
	created_at: string;
	updated_at: string;
};

export type VoucherApiInput = {
	voucherNumber: string;
	voucherDate: string;
	buyerName?: string | null;
	status?: 'draft' | 'pending';
	discount: number;
	items: VoucherLineItemInput[];
};

const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api';

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

	return response.json() as Promise<T>;
}

export const api = {
	listSnacks: () => requestJson<SnackApiRecord[]>('/snacks'),
	createSnack: (payload: SnackApiInput) => requestJson<SnackApiRecord>('/snacks', { method: 'POST', body: JSON.stringify(payload) }),
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
	listSnacksForLookup: () => requestJson<SnackLookupRecord[]>('/snacks'),
};
