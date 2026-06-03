import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Header, Input } from '../../../ui';
import { api, type VoucherApiRecord } from '../../../lib/api';
import { formatMMK } from '../../../lib/currency';

// History table removed — type previously used for manual rows is no longer needed

export function SalesHistoryPage() {
	const [filters, setFilters] = useState({ voucher: '', from: '', to: '' });
	const [vouchers, setVouchers] = useState<VoucherApiRecord[]>([]);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		void api
			.listVouchers()
			.then(setVouchers)
			.catch((error: unknown) => {
				setErrorMessage(error instanceof Error ? error.message : 'Failed to load vouchers');
			});
	}, []);

	return (
		<div className="space-y-6">
			<Header
				eyebrow="Reports"
				title="Sales History"
				description="Search, filter, and enter completed vouchers manually."
				actions={
					<Button type="button" variant="secondary">
						<Search className="h-4 w-4" />
						Filter history
					</Button>
				}
			/>

			<Card>
				<CardHeader>
					<CardTitle>Filters</CardTitle>
					<CardDescription>Type the voucher number or date range to narrow results.</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					<Input label="Voucher number" placeholder="VCH-20250602-001" value={filters.voucher} onChange={(event) => setFilters((current) => ({ ...current, voucher: event.target.value }))} />
					<Input label="Date from" type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} />
					<Input label="Date to" type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} />
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Recent vouchers</CardTitle>
					<CardDescription>Loaded from the backend API.</CardDescription>
				</CardHeader>
				<CardContent className="overflow-hidden p-0">
					{errorMessage ? <div className="px-4 py-5 text-sm text-rose-600">{errorMessage}</div> : null}
					<div className="divide-y divide-slate-200">
						{vouchers.length ? vouchers.map((voucher) => (
							<div key={voucher.id} className="grid grid-cols-4 gap-3 px-4 py-4 text-sm">
								<div className="font-medium text-slate-900">{voucher.voucher_number}</div>
								<div className="text-slate-600">{voucher.voucher_date}</div>
								<div className="text-right text-slate-900">{voucher.status}</div>
								<div className="text-right text-slate-900">{formatMMK(voucher.total)}</div>
							</div>
						)) : (
							<div className="px-4 py-5 text-sm text-slate-500">No vouchers loaded yet.</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* History table removed — only filters/search retained per request */}
		</div>
	);
}
