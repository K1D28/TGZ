export type Database = {
	public: {
		Enums: {
			voucher_status: 'draft' | 'complete';
		};
		Tables: {
			snacks: {
				Row: {
					id: string;
					name: string;
				};
				Insert: {
					id?: string;
					name: string;
				};
				Update: {
					id?: string;
					name?: string;
				};
			};
			vouchers: {
				Row: {
					id: string;
					voucher_number: string;
					voucher_date: string;
					buyer_name: string | null;
					status: Database['public']['Enums']['voucher_status'];
					subtotal: number;
					discount: number;
					total: number;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					voucher_number: string;
					voucher_date?: string;
					buyer_name?: string | null;
					status?: Database['public']['Enums']['voucher_status'];
					subtotal?: number;
					discount?: number;
					total?: number;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					voucher_number?: string;
					voucher_date?: string;
					buyer_name?: string | null;
					status?: Database['public']['Enums']['voucher_status'];
					subtotal?: number;
					discount?: number;
					total?: number;
					created_at?: string;
					updated_at?: string;
				};
			};
			voucher_items: {
				Row: {
					id: string;
					voucher_id: string;
					snack_id: string | null;
					item_name: string;
					unit: number;
					unit_1: number;
					unit_2: number;
					unit_3: number;
					quantity: number;
					unit_price: number;
					line_total: number;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					voucher_id: string;
					snack_id?: string | null;
					item_name: string;
					unit?: number;
					unit_1?: number;
					unit_2?: number;
					unit_3?: number;
					quantity: number;
					unit_price: number;
					line_total?: number;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					voucher_id?: string;
					snack_id?: string | null;
					item_name?: string;
					unit?: number;
					unit_1?: number;
					unit_2?: number;
					unit_3?: number;
					quantity?: number;
					unit_price?: number;
					line_total?: number;
					created_at?: string;
					updated_at?: string;
				};
			};
		};
		Relationships: [];
	};
};
