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

function displayUnitValue(value: number | string | null | undefined) {
	const numericValue = Number(value);
	if (Number.isFinite(numericValue) && numericValue === 1) {
		return '';
	}
	return String(value ?? '');
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
	const [selectedVoucherIds, setSelectedVoucherIds] = useState<string[]>([]);
	const [deleteInProgress, setDeleteInProgress] = useState(false);

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
			finalTotal: isMyanmarLanguage ? 'စုစုပေါင်း' : 'Final Total',
			details: isMyanmarLanguage ? 'အသေးစိတ်' : 'Details',
			viewDetails: isMyanmarLanguage ? 'အသေးစိတ်ကြည့်ရန်' : 'View details',
			hideDetails: isMyanmarLanguage ? 'အသေးစိတ်ဖျောက်ရန်' : 'Hide details',
			selectAll: isMyanmarLanguage ? 'အားလုံးရွေးရန်' : 'Select all',
			deleteSelected: isMyanmarLanguage ? 'ရွေးထားသောဘောင်ချာများ ဖျက်ရန်' : 'Delete selected vouchers',
			deleteVoucher: isMyanmarLanguage ? 'ဖျက်ရန်' : 'Delete',
			deleting: isMyanmarLanguage ? 'ဖျက်နေသည်...' : 'Deleting...',
			printVoucher: isMyanmarLanguage ? 'ဘောင်ချာ ပုံနှိပ်ရန်' : 'Print voucher',
			filterHistory: isMyanmarLanguage ? 'မှတ်တမ်း စီစစ်ရန်' : 'Filter history',
			loading: isMyanmarLanguage ? 'ဘောင်ချာ အသေးစိတ်ကို ဖတ်နေသည်...' : 'Loading voucher summary...',
			empty: isMyanmarLanguage ? 'ဘောင်ချာ မရှိသေးပါ။' : 'No vouchers loaded yet.',
			noItems: isMyanmarLanguage ? 'ဤဘောင်ချာတွင် line item မရှိသေးပါ။' : 'No line items found for this voucher.',
			subtotal: isMyanmarLanguage ? 'စုစုပေါင်း' : 'Subtotal',
			lastPaymentDue: isMyanmarLanguage ? 'ယခင်လက်ကျန်ငွေ' : 'Last Payment Due',

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

	useEffect(() => {
		const currentIds = new Set(vouchers.map((voucher) => voucher.id));
		setSelectedVoucherIds((current) => current.filter((id) => currentIds.has(id)));
	}, [vouchers]);

	const allVisibleSelected = vouchers.length > 0 && vouchers.every((voucher) => selectedVoucherIds.includes(voucher.id));

	const toggleSelectVoucher = (voucherId: string) => {
		setSelectedVoucherIds((current) => (current.includes(voucherId) ? current.filter((id) => id !== voucherId) : [...current, voucherId]));
	};

	const toggleSelectAllVouchers = () => {
		if (allVisibleSelected) {
			setSelectedVoucherIds([]);
			return;
		}
		setSelectedVoucherIds(vouchers.map((voucher) => voucher.id));
	};

	const clearDeletedVoucherState = (deletedIds: string[]) => {
		const deletedIdSet = new Set(deletedIds);
		setVouchers((current) => current.filter((voucher) => !deletedIdSet.has(voucher.id)));
		setSelectedVoucherIds((current) => current.filter((id) => !deletedIdSet.has(id)));
		setVoucherDetails((current) => {
			const next = { ...current };
			for (const id of deletedIds) {
				delete next[id];
			}
			return next;
		});
		setDetailsErrors((current) => {
			const next = { ...current };
			for (const id of deletedIds) {
				delete next[id];
			}
			return next;
		});
		setExpandedVoucherId((current) => (current && deletedIdSet.has(current) ? null : current));
	};

	const handleDeleteVouchers = async (ids: string[]) => {
		if (!ids.length || deleteInProgress) return;

		const confirmed = window.confirm(
			isMyanmarLanguage
				? `ရွေးထားသော ဘောင်ချာ ${ids.length} ခုကို ဖျက်မှာ သေချာပါသလား?`
				: `Are you sure you want to delete ${ids.length} selected voucher(s)?`,
		);
		if (!confirmed) return;

		setDeleteInProgress(true);
		setErrorMessage(null);
		try {
			if (ids.length === 1) {
				await api.deleteVoucher(ids[0]);
				clearDeletedVoucherState(ids);
			} else {
				const result = await api.deleteVouchers(ids);
				clearDeletedVoucherState(result.deletedIds.length ? result.deletedIds : ids);
			}
		} catch (error: unknown) {
			setErrorMessage(error instanceof Error ? error.message : 'Failed to delete voucher(s).');
		} finally {
			setDeleteInProgress(false);
		}
	};

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

				const maxRowsPerPage = 22;
				const rowsPerCarryPage = 20;

				const itemChunks: typeof detail.items[] = [];
				if (!detail.items.length) {
					itemChunks.push([]);
				} else {
					let cursor = 0;
					while (cursor < detail.items.length) {
						const remaining = detail.items.length - cursor;
						const pageSize = remaining > maxRowsPerPage ? rowsPerCarryPage : remaining;
						itemChunks.push(detail.items.slice(cursor, cursor + pageSize));
						cursor += pageSize;
					}
				}

				const tableHeaderHtml = `
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
				`;

				let rowOffset = 0;
				const pagesHtml = itemChunks
					.map((pageItems, pageIndex) => {
						const pageRows = pageItems.length
							? pageItems
								.map((item, index) => `
									<tr>
										<td class="center">${rowOffset + index + 1}</td>
										<td>${escapeHtml(item.item_name)}</td>
										<td class="num">${item.quantity}</td>
										<td class="num">${escapeHtml(displayUnitValue(item.unit))}</td>
										<td class="num">${escapeHtml(displayUnitValue(item.unit2))}</td>
										<td class="num">${formatAmount(item.unit_price)}</td>
										<td class="num strong">${formatAmount(item.line_total)}</td>
									</tr>`)
								.join('')
							: `<tr><td colspan="7" class="empty">${escapeHtml(labels.noItems)}</td></tr>`;

						rowOffset += pageItems.length;
						const isLastPage = pageIndex === itemChunks.length - 1;
						const pageBreakClass = isLastPage ? '' : ' page-break';

						return `
							<div class="sheet${pageBreakClass}">
								<div class="page-number">Page ${pageIndex + 1}</div>
								<div style="text-align:center; margin-top:18px; margin-bottom:10px;">
									<div style="font-size:22px; font-weight:700; line-height:1;">ကိုဝင်းမြင့် + မဝင်နီကျော်</div>
									<div style="font-size:16px; font-weight:600;">မုန့်မျိုးစုံ ရောင်းဝယ်ရေး</div>
									<div style="font-size:12px; font-weight:500; margin-top:6px;">Phone number - 09-409 611 449, 09-895 480 600</div>
								</div>
								<div class="header">
									<div>
										<div class="meta">
											${escapeHtml(t('voucher.summary.buyer_name'))}: <span class="buyer-name-value">${escapeHtml(voucher.buyer_name || '-')}</span>
										</div>
									</div>
									<div class="header-center meta">${escapeHtml(t('voucher.summary.voucher_number'))}: ${escapeHtml(voucher.voucher_number)}</div>
									<div class="meta" style="text-align:right;">
										<div>${escapeHtml(t('voucher.summary.date'))}: ${escapeHtml(formatVoucherDate(voucher.voucher_date, isMyanmarLanguage))}</div>
									</div>
								</div>

								<table>
									${tableHeaderHtml}
									<tbody>${pageRows}</tbody>
								</table>

								${isLastPage ? `<div class="summary" style="margin-top:14px; margin-left:auto; max-width:280px;"><div>${escapeHtml(labels.total)}</div><div class="num strong">${formatAmount(detail.total)}</div>${detail.last_payment_due > 0 ? `<div>${escapeHtml(labels.lastPaymentDue)}</div><div class="num strong">${formatAmount(detail.last_payment_due)}</div><div>${escapeHtml(labels.finalTotal)}</div><div class="num strong">${formatAmount(detail.total + detail.last_payment_due)}</div>` : ''}</div>` : ''}
							</div>
						`;
					})
					.join('');

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
							.buyer-name-value {
								font-size: 14px;
								font-weight: 700;
							}
							.sheet {
								position: relative;
								padding: 0;
							}
							.page-break {
								break-after: page;
								page-break-after: always;
							}
							.header {
								display: flex;
								justify-content: space-between;
								gap: 16px;
								margin-bottom: 10px;
								font-size: 12px;
							}
							.header-center {
								flex: 1;
								text-align: center;
							}
							.meta { line-height: 1.6; }
							table { width: 100%; border-collapse: collapse; font-size: 10px; }
							thead th {
								background: #f8fafc;
								font-size: 10px;
								text-transform: uppercase;
								letter-spacing: 0.12em;
								color: #6b7280;
							}
							th, td { border: 1px solid #d1d5db; padding: 5px 6px; vertical-align: top; }
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
							.page-number {
								position: absolute;
								top: 0;
								left: 0;
								font-size: 11px;
								font-weight: 600;
								color: #374151;
							}
							.footer { margin-top: 18px; font-size: 11px; color: #6b7280; }
							@media print {
								body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
							}
						</style>
					</head>
					<body>
						${pagesHtml}
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
					<Input label={t('filters.voucher_number')} placeholder="WM-DDMMYY-01" value={filters.voucher} onChange={(event) => setFilters((current) => ({ ...current, voucher: event.target.value }))} />
					<Input label={t('filters.date_from')} type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} />
					<Input label={t('filters.date_to')} type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} />
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-wrap items-center justify-between gap-3">
					<CardTitle>{labels.recent}</CardTitle>
					{selectedVoucherIds.length > 0 ? (
						<Button
							type="button"
							variant="primary"
							onClick={() => void handleDeleteVouchers(selectedVoucherIds)}
							disabled={deleteInProgress}
							className="!h-auto min-h-10 whitespace-normal bg-rose-600 px-3 py-2 text-center text-xs leading-tight text-white hover:bg-rose-700"
						>
							{deleteInProgress ? labels.deleting : `${labels.deleteSelected} (${selectedVoucherIds.length})`}
						</Button>
					) : null}
				</CardHeader>
				<CardContent className="overflow-hidden p-0">
					{errorMessage ? <div className="px-4 py-5 text-sm text-rose-600">{errorMessage}</div> : null}
					<div className="divide-y divide-slate-200">
						<div className={`grid grid-cols-[40px_1.2fr_1fr_1.2fr_1fr_1fr_1fr] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 ${isMyanmarLanguage ? 'tracking-normal' : ''}`}>
							<div className="flex items-center justify-center">
								<input
									type="checkbox"
									checked={allVisibleSelected}
									onChange={toggleSelectAllVouchers}
									aria-label={labels.selectAll}
									className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
								/>
							</div>
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
									<div className="grid grid-cols-[40px_1.2fr_1fr_1.2fr_1fr_1fr_1fr] gap-3 px-4 py-4 text-sm">
										<div className="flex items-center justify-center">
											<input
												type="checkbox"
												checked={selectedVoucherIds.includes(voucher.id)}
												onChange={() => toggleSelectVoucher(voucher.id)}
												aria-label={`${labels.voucherNumber} ${voucher.voucher_number}`}
												className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
											/>
										</div>
										<div className="font-medium text-slate-900">{voucher.voucher_number}</div>
										<div className="text-slate-600">{displayDate}</div>
										<div className="text-slate-700">{voucher.buyer_name || '-'}</div>
										<div className="text-right text-slate-900 capitalize">{voucher.status}</div>
										<div className="text-right text-slate-900">{formatAmount(voucher.total)}</div>
										<div className="flex justify-end">
											<div className="flex gap-2">
												<Button type="button" variant="secondary" className="h-8 rounded-lg px-3 text-xs" onClick={() => handleToggleDetails(voucher)}>
													{isExpanded ? labels.hideDetails : labels.viewDetails}
													{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
												</Button>
												<Button
													type="button"
													variant="primary"
													className="!h-auto min-h-8 rounded-lg bg-rose-600 px-3 py-1.5 text-xs text-white hover:bg-rose-700"
													onClick={() => void handleDeleteVouchers([voucher.id])}
													disabled={deleteInProgress}
												>
													{labels.deleteVoucher}
												</Button>
											</div>
										</div>
									</div>

									{isExpanded ? (
										<div className="bg-slate-50 px-4 pb-4">
											<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
													<div className="mb-4 flex flex-wrap items-start justify-between gap-3">
														<div className="w-full text-center">
															<div className="text-xs uppercase tracking-wide text-slate-500">{t('voucher.summary.voucher_number')}</div>
															<div className="mt-1 text-base font-bold text-slate-900">{voucher.voucher_number}</div>
														</div>
														<div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
													<div className="rounded-lg bg-slate-50 p-3">
														<div className="text-xs uppercase tracking-wide text-slate-500">{t('voucher.summary.date')}</div>
														<div className="mt-1 text-sm font-semibold text-slate-900">{displayDate}</div>
													</div>
													<div className="rounded-lg bg-slate-50 p-3">
														<div className="text-xs uppercase tracking-wide text-slate-500">{t('voucher.summary.buyer_name')}</div>
														<div className="mt-1 text-base font-bold text-slate-900">{voucher.buyer_name || '-'}</div>
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
															<div className={`grid grid-cols-[56px_minmax(0,1.5fr)_80px_90px_90px_140px_140px] bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600 ${isMyanmarLanguage ? 'tracking-normal' : ''}`}>
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
																	<div key={item.id} className="grid grid-cols-[56px_minmax(0,1.5fr)_80px_90px_90px_140px_140px] px-3 py-1.5 text-xs">
																		<div className="text-center font-medium text-slate-700">{index + 1}</div>
																		<div className="font-medium text-slate-900">{item.item_name}</div>
																		<div className="text-right text-slate-600">{item.quantity}</div>
																		<div className="text-right text-slate-600">{displayUnitValue(item.unit)}</div>
																		<div className="text-right text-slate-600">{displayUnitValue(item.unit2)}</div>
																		<div className="text-right text-slate-600">{formatAmount(item.unit_price)}</div>
																		<div className="text-right font-medium text-slate-900">{formatAmount(item.line_total)}</div>
																	</div>
																)) : <div className="px-3 py-3 text-sm text-slate-500">{labels.noItems}</div>}
															</div>
														</div>

														<div className="ml-auto grid w-full gap-2 rounded-xl bg-slate-50 p-3 text-sm md:w-80">
															<div className="flex items-center justify-between">
																<span className="text-slate-600">{labels.total}</span>
																<span className="font-medium text-slate-900">{formatAmount(detail.total)}</span>
															</div>
															{detail.last_payment_due > 0 ? (
																<>
																	<div className="flex items-center justify-between">
																		<span className="text-slate-600">{labels.lastPaymentDue}</span>
																		<span className="font-medium text-slate-900">{formatAmount(detail.last_payment_due)}</span>
																	</div>
																	<div className="flex items-center justify-between border-t border-slate-200 pt-2">
																		<span className="font-semibold text-slate-700">{labels.finalTotal}</span>
																		<span className="text-base font-bold text-slate-900">{formatAmount(detail.total + detail.last_payment_due)}</span>
																	</div>
																</>
															) : null}
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
