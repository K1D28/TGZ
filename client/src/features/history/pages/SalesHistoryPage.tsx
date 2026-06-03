import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Card, CardContent, CardHeader, CardTitle, Header, Input } from '../../../ui';
import { api, type VoucherApiRecord, type VoucherLineItemRecord } from '../../../lib/api';

function formatAmount(value: number) {
	return new Intl.NumberFormat('en-US', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(value);
}

function formatVoucherDate(value: string, isMyanmarLanguage: boolean) {
	if (!value) return '-';
	const parts = value.split('-');
	if (parts.length !== 3) return value;

	return isMyanmarLanguage ? `${parts[2]}/${parts[1]}/${parts[0]}` : `${parts[0]}-${parts[1]}-${parts[2]}`;
}

function escapeHtml(value: string | null | undefined) {
	return String(value ?? '')
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

// History table removed — type previously used for manual rows is no longer needed

export function SalesHistoryPage() {
	const { t, i18n } = useTranslation();
	const isMyanmarLanguage = i18n.language.startsWith('my');
	const [filters, setFilters] = useState({ voucher: '', from: '', to: '' });
	const [vouchers, setVouchers] = useState<VoucherApiRecord[]>([]);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [expandedVoucherId, setExpandedVoucherId] = useState<string | null>(null);
	const [detailsLoadingId, setDetailsLoadingId] = useState<string | null>(null);
	const [detailsErrors, setDetailsErrors] = useState<Record<string, string>>({});
	const [voucherDetails, setVoucherDetails] = useState<Record<string, VoucherApiRecord & { items: VoucherLineItemRecord[] }>>({});

	const labels = useMemo(
		() => ({
			eyebrow: isMyanmarLanguage ? 'အစီရင်ခံစာများ' : 'Reports',
			title: isMyanmarLanguage ? 'ရောင်းအားမှတ်တမ်း' : 'Sales History',
			filters: isMyanmarLanguage ? 'စီစစ်မှုများ' : 'Filters',
			recent: isMyanmarLanguage ? 'လတ်တလော ဘောင်ချာများ' : 'Recent vouchers',
			voucherNumber: isMyanmarLanguage ? 'ဘောင်ချာအမှတ်' : 'Voucher number',
			date: isMyanmarLanguage ? 'ရက်စွဲ' : 'Date',
			buyer: isMyanmarLanguage ? 'ဝယ်သူအမည်' : 'Buyer name',
			status: isMyanmarLanguage ? 'အခြေအနေ' : 'Status',
			total: isMyanmarLanguage ? 'စုစုပေါင်း' : 'Total',
			details: isMyanmarLanguage ? 'အသေးစိတ်' : 'Details',
			viewDetails: isMyanmarLanguage ? 'အသေးစိတ်ကြည့်ရန်' : 'View details',
			hideDetails: isMyanmarLanguage ? 'အသေးစိတ်ဖျောက်ရန်' : 'Hide details',
			printVoucher: isMyanmarLanguage ? 'ဘောင်ချာ ပုံနှိပ်ရန်' : 'Print voucher',
			filterHistory: isMyanmarLanguage ? 'မှတ်တမ်း စီစစ်ရန်' : 'Filter history',
			loading: isMyanmarLanguage ? 'ဘောင်ချာ အသေးစိတ်ကို ဖတ်နေသည်...' : 'Loading voucher summary...',
			empty: isMyanmarLanguage ? 'ဘောင်ချာ မရှိသေးပါ။' : 'No vouchers loaded yet.',
			noItems: isMyanmarLanguage ? 'ဤဘောင်ချာတွင် line item မရှိသေးပါ။' : 'No line items found for this voucher.',
			subtotal: isMyanmarLanguage ? 'စုစုပေါင်း' : 'Subtotal',
			discount: isMyanmarLanguage ? 'လျှော့စျေး' : 'Discount',

		}),
		[isMyanmarLanguage],
	);

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

		const handlePrintVoucher = async (voucher: VoucherApiRecord) => {
			try {
				const detail = voucherDetails[voucher.id] ?? (await api.getVoucher(voucher.id));
				if (!voucherDetails[voucher.id]) {
					setVoucherDetails((current) => ({ ...current, [voucher.id]: detail }));
				}

				const printWindow = window.open('', '_blank', 'width=1100,height=900');
				if (!printWindow) {
					setErrorMessage(isMyanmarLanguage ? 'ပေါ့ပ်အပ်ကို ပိတ်ထားပါသည်။' : 'Popup blocked.');
					return;
				}

				const rows = detail.items.length
					? detail.items
						.map((item, index) => `
							<tr>
								<td class="center">${index + 1}</td>
								<td>${escapeHtml(item.item_name)}</td>
								<td class="num">${item.quantity}</td>
								<td class="num">${item.unit}</td>
								<td class="num">${item.unit2}</td>
								<td class="num">${formatAmount(item.unit_price)}</td>
								<td class="num strong">${formatAmount(item.line_total)}</td>
							</tr>`)
							.join('')
					: `<tr><td colspan="7" class="empty">${escapeHtml(labels.noItems)}</td></tr>`;

				const printHtml = `
					<!doctype html>
					<html>
					<head>
						<meta charset="utf-8" />
						<meta name="viewport" content="width=device-width, initial-scale=1" />
						<title>${escapeHtml(voucher.voucher_number)}</title>
						<style>
							@page { size: A4 portrait; margin: 12mm; }
							* { box-sizing: border-box; }
							body {
								margin: 0;
								font-family: 'Noto Sans Myanmar', 'Myanmar Text', 'Pyidaungsu', Arial, sans-serif;
								color: #111827;
								background: #fff;
							}
							.sheet {
								padding: 0;
							}
							.header {
								display: flex;
								justify-content: space-between;
								gap: 16px;
								margin-bottom: 14px;
								font-size: 12px;
							}
							.title {
								font-size: 20px;
								font-weight: 700;
								margin-bottom: 4px;
							}
							.meta { line-height: 1.6; }
							table { width: 100%; border-collapse: collapse; font-size: 11px; }
							thead th {
								background: #f8fafc;
								font-size: 10px;
								text-transform: uppercase;
								letter-spacing: 0.12em;
								color: #6b7280;
							}
							th, td { border: 1px solid #d1d5db; padding: 7px 8px; vertical-align: top; }
							.num { text-align: right; white-space: nowrap; }
							.center { text-align: center; }
							.strong { font-weight: 700; }
							.empty { text-align: center; color: #6b7280; padding: 18px 8px; }
							.summary {
								margin-top: 14px;
								display: grid;
								grid-template-columns: 1fr auto;
								gap: 8px 24px;
								font-size: 12px;
							}
							.footer { margin-top: 18px; font-size: 11px; color: #6b7280; }
							@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
						</style>
					</head>
					<body>
						<div class="sheet">
							<div class="header">
								<div>
									<div class="meta">${escapeHtml(t('voucher.summary.buyer_name'))}: ${escapeHtml(voucher.buyer_name || '-')}</div>
									<div class="meta">${escapeHtml(t('voucher.summary.voucher_number'))}: ${escapeHtml(voucher.voucher_number)}</div>
								</div>
								<div class="meta" style="text-align:right;">
									<div>${escapeHtml(t('voucher.summary.date'))}: ${escapeHtml(formatVoucherDate(voucher.voucher_date, isMyanmarLanguage))}</div>
								</div>
							</div>

							<table>
								<thead>
									<tr>
										<th style="width:42px;">${escapeHtml(t('voucher.summary.table.no'))}</th>
										<th>${escapeHtml(t('voucher.summary.table.name'))}</th>
										<th style="width:56px;" class="num">${escapeHtml(t('voucher.summary.table.qty'))}</th>
										<th style="width:54px;" class="num">${escapeHtml(t('voucher.summary.table.unit'))}</th>
										<th style="width:54px;" class="num">${escapeHtml(t('voucher.summary.table.unit2'))}</th>
										<th style="width:88px;" class="num">${escapeHtml(t('voucher.summary.table.unit_price'))}</th>
										<th style="width:92px;" class="num">${escapeHtml(t('voucher.summary.table.total'))}</th>
									</tr>
								</thead>
								<tbody>${rows}</tbody>
							</table>

							<div class="summary">
								<div>${escapeHtml(labels.subtotal)}</div><div class="num strong">${formatAmount(detail.subtotal)}</div>
								<div>${escapeHtml(labels.discount)}</div><div class="num strong">${formatAmount(detail.discount)}</div>
								<div>${escapeHtml(labels.total)}</div><div class="num strong">${formatAmount(detail.total)}</div>
							</div>


						</div>
						<script>
							window.onload = function() {
								window.focus();
								window.print();
							};
						</script>
					</body>
					</html>
				`;

				printWindow.document.open();
				printWindow.document.write(printHtml);
				printWindow.document.close();
			} catch (error) {
				setErrorMessage(error instanceof Error ? error.message : 'Failed to print voucher.');
			}
		};

	return (
		<div className="space-y-6">
			<Header
				eyebrow={labels.eyebrow}
				title={labels.title}
				actions={
					<Button type="button" variant="secondary">
						<Search className="h-4 w-4" />
						{labels.filterHistory}
					</Button>
				}
			/>

			<Card>
				<CardHeader>
					<CardTitle>{labels.filters}</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					<Input label={t('filters.voucher_number')} placeholder="VCH-20250602-001" value={filters.voucher} onChange={(event) => setFilters((current) => ({ ...current, voucher: event.target.value }))} />
					<Input label={t('filters.date_from')} type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} />
					<Input label={t('filters.date_to')} type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} />
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{labels.recent}</CardTitle>
				</CardHeader>
				<CardContent className="overflow-hidden p-0">
					{errorMessage ? <div className="px-4 py-5 text-sm text-rose-600">{errorMessage}</div> : null}
					<div className="divide-y divide-slate-200">
						<div className={`grid grid-cols-6 gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 ${isMyanmarLanguage ? 'tracking-normal' : ''}`}>
							<div>{t('voucher.summary.voucher_number')}</div>
							<div>{t('voucher.summary.date')}</div>
							<div>{t('voucher.summary.buyer_name')}</div>
							<div className="text-right">{labels.status}</div>
							<div className="text-right">{labels.total}</div>
							<div className="text-right">{labels.details}</div>
						</div>
						{vouchers.length ? vouchers.map((voucher) => {
							const isExpanded = expandedVoucherId === voucher.id;
							const detail = voucherDetails[voucher.id];
							const detailError = detailsErrors[voucher.id];
							const isLoading = detailsLoadingId === voucher.id;
							const displayDate = formatVoucherDate(voucher.voucher_date, isMyanmarLanguage);

							return (
								<div key={voucher.id}>
									<div className="grid grid-cols-6 gap-3 px-4 py-4 text-sm">
										<div className="font-medium text-slate-900">{voucher.voucher_number}</div>
										<div className="text-slate-600">{displayDate}</div>
										<div className="text-slate-700">{voucher.buyer_name || '-'}</div>
										<div className="text-right text-slate-900 capitalize">{voucher.status}</div>
										<div className="text-right text-slate-900">{formatAmount(voucher.total)}</div>
										<div className="flex justify-end">
											<Button type="button" variant="secondary" className="h-8 rounded-lg px-3 text-xs" onClick={() => handleToggleDetails(voucher)}>
												{isExpanded ? labels.hideDetails : labels.viewDetails}
												{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
											</Button>
										</div>
									</div>

									{isExpanded ? (
										<div className="bg-slate-50 px-4 pb-4">
											<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
												<div className="mb-4 flex flex-wrap items-start justify-between gap-3">
													<div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
													<div className="rounded-lg bg-slate-50 p-3">
														<div className="text-xs uppercase tracking-wide text-slate-500">{t('voucher.summary.voucher_number')}</div>
														<div className="mt-1 text-sm font-semibold text-slate-900">{voucher.voucher_number}</div>
													</div>
													<div className="rounded-lg bg-slate-50 p-3">
														<div className="text-xs uppercase tracking-wide text-slate-500">{t('voucher.summary.date')}</div>
														<div className="mt-1 text-sm font-semibold text-slate-900">{displayDate}</div>
													</div>
													<div className="rounded-lg bg-slate-50 p-3">
														<div className="text-xs uppercase tracking-wide text-slate-500">{t('voucher.summary.buyer_name')}</div>
														<div className="mt-1 text-sm font-semibold text-slate-900">{voucher.buyer_name || '-'}</div>
													</div>
													<div className="rounded-lg bg-slate-50 p-3">
														<div className="text-xs uppercase tracking-wide text-slate-500">{labels.status}</div>
														<div className="mt-1 text-sm font-semibold capitalize text-slate-900">{voucher.status}</div>
													</div>
													</div>
													<div className="flex flex-col gap-2 md:items-end">
														<Button type="button" variant="secondary" className="h-9 rounded-lg px-3 text-xs" onClick={() => void handlePrintVoucher(voucher)}>
															{labels.printVoucher}
														</Button>
													</div>
												</div>

												{isLoading ? <div className="text-sm text-slate-600">{labels.loading}</div> : null}
												{detailError ? <div className="text-sm text-rose-600">{detailError}</div> : null}

												{detail && !isLoading && !detailError ? (
													<div className="space-y-3">
														<div className="overflow-hidden rounded-xl border border-slate-200">
															<div className={`grid grid-cols-[56px_minmax(0,1.5fr)_80px_90px_90px_140px_140px] bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 ${isMyanmarLanguage ? 'tracking-normal' : ''}`}>
																<div className="text-center">{t('voucher.summary.table.no')}</div>
																<div>{t('voucher.summary.table.name')}</div>
																<div className="text-right">{t('voucher.summary.table.qty')}</div>
																<div className="text-right">{t('voucher.summary.table.unit')}</div>
																<div className="text-right">{t('voucher.summary.table.unit2')}</div>
																<div className="text-right">{t('voucher.summary.table.unit_price')}</div>
																<div className="text-right">{t('voucher.summary.table.total')}</div>
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
																)) : <div className="px-3 py-3 text-sm text-slate-500">{labels.noItems}</div>}
															</div>
														</div>

														<div className="ml-auto grid w-full gap-2 rounded-xl bg-slate-50 p-3 text-sm md:w-80">
															<div className="flex items-center justify-between">
																<span className="text-slate-600">{labels.subtotal}</span>
																<span className="font-medium text-slate-900">{formatAmount(detail.subtotal)}</span>
															</div>
															<div className="flex items-center justify-between">
																<span className="text-slate-600">{labels.discount}</span>
																<span className="font-medium text-slate-900">{formatAmount(detail.discount)}</span>
															</div>
															<div className="flex items-center justify-between border-t border-slate-200 pt-2">
																<span className="font-semibold text-slate-700">{labels.total}</span>
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
							<div className="px-4 py-5 text-sm text-slate-500">{labels.empty}</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* History table removed — only filters/search retained per request */}
		</div>
	);
}
