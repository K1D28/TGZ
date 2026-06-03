import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Header, Input } from '../../../ui';
import { api, type VoucherApiRecord, type VoucherLineItemRecord } from '../../../lib/api';

function formatAmount(value: number) {
	return new Intl.NumberFormat('en-US', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(value);
}

// History table removed — type previously used for manual rows is no longer needed

export function SalesHistoryPage() {
	const [filters, setFilters] = useState({ voucher: '', from: '', to: '' });
	const [vouchers, setVouchers] = useState<VoucherApiRecord[]>([]);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [expandedVoucherId, setExpandedVoucherId] = useState<string | null>(null);
	const [detailsLoadingId, setDetailsLoadingId] = useState<string | null>(null);
	const [detailsErrors, setDetailsErrors] = useState<Record<string, string>>({});
	const [voucherDetails, setVoucherDetails] = useState<Record<string, VoucherApiRecord & { items: VoucherLineItemRecord[] }>>({});

	useEffect(() => {
		void api
			.listVouchers()
			.then(setVouchers)
			.catch((error: unknown) => {
				setErrorMessage(error instanceof Error ? error.message : 'Failed to load vouchers');
			});
	}, []);

	const handleToggleDetails = (voucher: VoucherApiRecord) => {
		if (expandedVoucherId === voucher.id) {
			setExpandedVoucherId(null);
			return;
		}

		setExpandedVoucherId(voucher.id);
		if (voucherDetails[voucher.id]) {
			return;
		}

		setDetailsLoadingId(voucher.id);
		setDetailsErrors((current) => ({ ...current, [voucher.id]: '' }));
		void api
			.getVoucher(voucher.id)
			.then((detail) => {
				setVoucherDetails((current) => ({ ...current, [voucher.id]: detail }));
			})
			.catch((error: unknown) => {
				setDetailsErrors((current) => ({
					...current,
					[voucher.id]: error instanceof Error ? error.message : 'Failed to load voucher summary',
				}));
			})
			.finally(() => {
				setDetailsLoadingId((current) => (current === voucher.id ? null : current));
			});
	};

	return (
		<div className="space-y-6">
			<Header
				eyebrow="Reports"
				title="Sales History"
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
				</CardHeader>
				<CardContent className="overflow-hidden p-0">
					{errorMessage ? <div className="px-4 py-5 text-sm text-rose-600">{errorMessage}</div> : null}
					<div className="divide-y divide-slate-200">
						<div className="grid grid-cols-6 gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
							<div>Voucher number</div>
							<div>Date</div>
							<div>Buyer name</div>
							<div className="text-right">Status</div>
							<div className="text-right">Total</div>
							<div className="text-right">Details</div>
						</div>
						{vouchers.length ? vouchers.map((voucher) => {
							const isExpanded = expandedVoucherId === voucher.id;
							const detail = voucherDetails[voucher.id];
							const detailError = detailsErrors[voucher.id];
							const isLoading = detailsLoadingId === voucher.id;

							return (
								<div key={voucher.id}>
									<div className="grid grid-cols-6 gap-3 px-4 py-4 text-sm">
										<div className="font-medium text-slate-900">{voucher.voucher_number}</div>
										<div className="text-slate-600">{voucher.voucher_date}</div>
										<div className="text-slate-700">{voucher.buyer_name || '-'}</div>
										<div className="text-right text-slate-900">{voucher.status}</div>
										<div className="text-right text-slate-900">{formatAmount(voucher.total)}</div>
										<div className="flex justify-end">
											<Button type="button" variant="secondary" className="h-8 rounded-lg px-3 text-xs" onClick={() => handleToggleDetails(voucher)}>
												{isExpanded ? 'Hide details' : 'View details'}
												{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
											</Button>
										</div>
									</div>

									{isExpanded ? (
										<div className="bg-slate-50 px-4 pb-4">
											<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
												<div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
													<div className="rounded-lg bg-slate-50 p-3">
														<div className="text-xs uppercase tracking-wide text-slate-500">Voucher number</div>
														<div className="mt-1 text-sm font-semibold text-slate-900">{voucher.voucher_number}</div>
													</div>
													<div className="rounded-lg bg-slate-50 p-3">
														<div className="text-xs uppercase tracking-wide text-slate-500">Date</div>
														<div className="mt-1 text-sm font-semibold text-slate-900">{voucher.voucher_date}</div>
													</div>
													<div className="rounded-lg bg-slate-50 p-3">
														<div className="text-xs uppercase tracking-wide text-slate-500">Buyer name</div>
														<div className="mt-1 text-sm font-semibold text-slate-900">{voucher.buyer_name || '-'}</div>
													</div>
													<div className="rounded-lg bg-slate-50 p-3">
														<div className="text-xs uppercase tracking-wide text-slate-500">Status</div>
														<div className="mt-1 text-sm font-semibold capitalize text-slate-900">{voucher.status}</div>
													</div>
												</div>

												{isLoading ? <div className="text-sm text-slate-600">Loading voucher summary...</div> : null}
												{detailError ? <div className="text-sm text-rose-600">{detailError}</div> : null}

												{detail && !isLoading && !detailError ? (
													<div className="space-y-3">
														<div className="overflow-hidden rounded-xl border border-slate-200">
															<div className="grid grid-cols-[56px_minmax(0,1.5fr)_80px_90px_90px_140px_140px] bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
																<div className="text-center">No</div>
																<div>Item</div>
																<div className="text-right">Qty</div>
																<div className="text-right">Unit</div>
																<div className="text-right">Unit 2</div>
																<div className="text-right">Unit price</div>
																<div className="text-right">Line total</div>
															</div>
															<div className="divide-y divide-slate-200">
																{detail.items.length ? detail.items.map((item, index) => (
																	<div key={item.id} className="grid grid-cols-[56px_minmax(0,1.5fr)_80px_90px_90px_140px_140px] px-3 py-2 text-sm">
																		<div className="text-center font-medium text-slate-700">{index + 1}</div>
																		<div className="font-medium text-slate-900">{item.item_name}</div>
																		<div className="text-right text-slate-600">{item.quantity}</div>
																		<div className="text-right text-slate-600">{item.unit}</div>
																		<div className="text-right text-slate-600">{item.unit2}</div>
																		<div className="text-right text-slate-600">{formatAmount(item.unit_price)}</div>
																		<div className="text-right font-medium text-slate-900">{formatAmount(item.line_total)}</div>
																	</div>
																)) : <div className="px-3 py-3 text-sm text-slate-500">No line items found for this voucher.</div>}
															</div>
														</div>

														<div className="ml-auto grid w-full gap-2 rounded-xl bg-slate-50 p-3 text-sm md:w-80">
															<div className="flex items-center justify-between">
																<span className="text-slate-600">Subtotal</span>
																<span className="font-medium text-slate-900">{formatAmount(detail.subtotal)}</span>
															</div>
															<div className="flex items-center justify-between">
																<span className="text-slate-600">Discount</span>
																<span className="font-medium text-slate-900">{formatAmount(detail.discount)}</span>
															</div>
															<div className="flex items-center justify-between border-t border-slate-200 pt-2">
																<span className="font-semibold text-slate-700">Total</span>
																<span className="text-base font-bold text-slate-900">{formatAmount(detail.total)}</span>
															</div>
														</div>
													</div>
												) : null}
											</div>
										</div>
									) : null}
								</div>
							);
						}) : (
							<div className="px-4 py-5 text-sm text-slate-500">No vouchers loaded yet.</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* History table removed — only filters/search retained per request */}
		</div>
	);
}
