import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ReceiptText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Card, CardContent, CardHeader, CardTitle, Header, Input } from '../../../ui';
import { api, type SnackLookupRecord, type VoucherApiRecord, type VoucherLineItemRecord } from '../../../lib/api';

const DRAFT_STORAGE_KEY = 'voucher-draft-id';

type VoucherLineItem = {
	id: string;
	snackId: string | null;
	name: string;
	qty: string;
	unit: string;
	unit2: string;
	price: string;
};

function createLineItem(): VoucherLineItem {
	return {
		id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
		snackId: null,
		name: '',
		qty: '1',
		unit: '1',
		unit2: '1',
		price: '',
	};
}

type VoucherDraftRecord = VoucherApiRecord & {
	items: VoucherLineItemRecord[];
};

function buildVoucherNumberForDate(
	dateValue: string,
	voucherIndex: Array<{ id: string; voucher_number: string; voucher_date: string; status: VoucherApiRecord['status'] }>,
) {
	const dateParts = dateValue.split('-');
	if (dateParts.length !== 3) return '';

	const [year, month, day] = dateParts;
	const dateCode = `${day}${month}${year.slice(-2)}`;
	const prefix = `WM-${dateCode}-`;

	const usedSerials = voucherIndex
		.filter((record) => record.voucher_date === dateValue && record.voucher_number.startsWith(prefix))
		.map((record) => {
			const serialText = record.voucher_number.slice(prefix.length);
			const serial = Number(serialText);
			return Number.isFinite(serial) ? serial : 0;
		});

	const nextSerial = String((usedSerials.length ? Math.max(...usedSerials) : 0) + 1).padStart(2, '0');
	return `${prefix}${nextSerial}`;
}

function formatAmountWithoutCurrency(value: number) {
	return new Intl.NumberFormat('en-US', {
		maximumFractionDigits: 2,
		minimumFractionDigits: 2,
	}).format(Number.isFinite(value) ? value : 0);
}

function escapeHtml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

export function VoucherPage() {
	const { t, i18n } = useTranslation();
	const isMyanmarLanguage = i18n.language.startsWith('my');
	const [voucherNumber, setVoucherNumber] = useState('');
	const [voucherNumberAuto, setVoucherNumberAuto] = useState(false);
	const [voucherDate, setVoucherDate] = useState('');
	const [discount, setDiscount] = useState('0');
	const [buyerName, setBuyerName] = useState('');
	const [infoSubmitted, setInfoSubmitted] = useState(false);
	const [snacks, setSnacks] = useState<SnackLookupRecord[]>([]);
	const [voucherIndex, setVoucherIndex] = useState<Array<{ id: string; voucher_number: string; voucher_date: string; status: VoucherApiRecord['status'] }>>([]);
	const [draftVoucherId, setDraftVoucherId] = useState<string | null>(null);
	const [restoringDraft, setRestoringDraft] = useState(true);
	const [snackStatus, setSnackStatus] = useState<string | null>(null);
	const [nameFocused, setNameFocused] = useState(false);
	const [items, setItems] = useState<VoucherLineItem[]>([]);
	const [itemForm, setItemForm] = useState<VoucherLineItem>(createLineItem());
	const [saveStatus, setSaveStatus] = useState<string | null>(null);
	const itemSaveInFlightRef = useRef(false);
	const canSaveVoucher = infoSubmitted && buyerName.trim() !== '' && voucherDate.trim() !== '' && voucherNumber.trim() !== '';

	useEffect(() => {
		let active = true;

		api
			.listSnacks()
			.then((records) => {
				if (!active) return;
				setSnacks(records);
				setSnackStatus(null);
			})
			.catch((error) => {
				if (!active) return;
				setSnackStatus(error instanceof Error ? error.message : 'Failed to load snack catalog.');
			});

		return () => {
			active = false;
		};
	}, []);

	useEffect(() => {
		let active = true;

		api
			.listVouchers()
			.then((records) => {
				if (!active) return;
				setVoucherIndex(records.map((record) => ({ id: record.id, voucher_number: record.voucher_number, voucher_date: record.voucher_date, status: record.status })));
			})
			.catch(() => {
				if (!active) return;
				setVoucherIndex([]);
			});

		return () => {
			active = false;
		};
	}, []);

	useEffect(() => {
		let active = true;

		async function restoreDraft() {
			async function applyDraft(record: VoucherDraftRecord) {
				setDraftVoucherId(record.id);
				setBuyerName(record.buyer_name ?? '');
				setVoucherDate(record.voucher_date);
				setVoucherNumber(record.voucher_number);
				setVoucherNumberAuto(false);
				setDiscount(String(record.discount ?? 0));
				setItems(
					record.items.map((item) => ({
						id: item.id,
						snackId: item.snack_id,
						name: item.item_name,
						qty: String(item.quantity),
						unit: String(item.unit),
						unit2: String(item.unit2),
						price: String(item.unit_price),
					})),
				);
				setItemForm(createLineItem());
				setInfoSubmitted(true);
			}

			const storedDraftId = window.localStorage.getItem(DRAFT_STORAGE_KEY);
			if (storedDraftId) {
				try {
					const record = await api.getVoucher(storedDraftId);
					if (!active) return;
					if (record.status === 'draft') {
						await applyDraft(record);
						setSaveStatus('Draft restored from database.');
						setRestoringDraft(false);
						return;
					}
				} catch {
					// continue to latest draft fallback
				}
			}

			try {
				const records = await api.listVouchers();
				if (!active) return;
				const latestDraft = records.find((record) => record.status === 'draft');
				if (latestDraft) {
					const fullDraft = await api.getVoucher(latestDraft.id);
					if (!active) return;
					await applyDraft(fullDraft);
					window.localStorage.setItem(DRAFT_STORAGE_KEY, fullDraft.id);
					setSaveStatus('Draft restored from database.');
				}
			} catch {
				if (!active) return;
			}

			if (active) {
				setRestoringDraft(false);
			}
		}

		void restoreDraft();

		return () => {
			active = false;
		};
	}, []);

	useEffect(() => {
		if (restoringDraft) return;
		// If a draft exists we should not change the reserved number.
		if (draftVoucherId) return;

		if (!voucherDate) {
			setVoucherNumber('');
			setVoucherNumberAuto(false);
			return;
		}

		// Update number when it's empty or was auto-generated previously.
		if (voucherNumber.trim() === '' || voucherNumberAuto) {
			const nextVoucherNumber = buildVoucherNumberForDate(voucherDate, voucherIndex);
			if (nextVoucherNumber && voucherNumber !== nextVoucherNumber) {
				setVoucherNumber(nextVoucherNumber);
				setVoucherNumberAuto(true);
			}
		}
	}, [voucherDate, voucherIndex, restoringDraft, draftVoucherId, voucherNumber, voucherNumberAuto]);

	const filteredSnacks = useMemo(() => {
		const query = itemForm.name.trim().toLowerCase();
		if (!query) return [];
		return snacks.filter((snack) => snack.name.toLowerCase().includes(query)).slice(0, 6);
	}, [itemForm.name, snacks]);

	const hasPreview = itemForm.name.trim() !== '' || itemForm.price !== '' || itemForm.snackId !== null;

	const subtotal = useMemo(() => {
		const itemsTotal = items.reduce((total, item) => total + Number(item.qty || 0) * Number(item.unit || 1) * Number(item.unit2 || 1) * Number(item.price || 0), 0);
		const previewTotal = hasPreview ? Number(itemForm.qty || 0) * Number(itemForm.unit || 1) * Number(itemForm.unit2 || 1) * Number(itemForm.price || 0) : 0;
		return itemsTotal + previewTotal;
	}, [items, itemForm]);
	const discountAmount = Number(discount || 0);
	const total = Math.max(0, subtotal - discountAmount);
	const summaryDate = voucherDate
		? voucherDate
			.split('-')
			.reverse()
			.join('/')
		: '-';

	function displayUnit(value: number) {
		return value === 1 ? '' : String(value);
	}

	function buildVoucherItemInputs(sourceItems: VoucherLineItem[]) {
		return sourceItems.map((item) => ({
			snackId: item.snackId,
			name: item.name,
			qty: Number(item.qty || 0),
			unit: Number(item.unit || 1),
			unit2: Number(item.unit2 || 1),
			price: Number(item.price || 0),
		}));
	}

	function handlePrintPreview() {
		const previewWindow = window.open('', '_blank', 'width=1200,height=900');
		if (!previewWindow) {
			setSaveStatus('Popup blocked. Please allow popups to use print preview.');
			return;
		}

		const previewItemsHtml = items.length
			? items
				.map((item, index) => {
					const quantity = Math.max(1, Number(item.qty || 1));
					const unit = Number(item.unit || 1);
					const unit2 = Number(item.unit2 || 1);
					const unitPrice = Number(item.price || 0);
					const lineTotal = quantity * unit * unit2 * unitPrice;
					return `
						<tr>
							<td>${index + 1}</td>
							<td>${escapeHtml(item.name)}</td>
							<td class="num">${quantity}</td>
							<td class="num">${displayUnit(unit)}</td>
							<td class="num">${displayUnit(unit2)}</td>
							<td class="num">${formatAmountWithoutCurrency(unitPrice)}</td>
							<td class="num strong">${formatAmountWithoutCurrency(lineTotal)}</td>
						</tr>`;
					})
					.join('')
			: `
				<tr>
					<td colspan="7" class="empty">No line items added yet.</td>
				</tr>`;

		const printHtml = `
			<!doctype html>
			<html>
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>Print Preview</title>
				<style>
					@page { size: A4 portrait; margin: 12mm; }
					* { box-sizing: border-box; }
					body {
						margin: 0;
						font-family: Arial, sans-serif;
						color: #111827;
						background: #fff;
					}
					.sheet {
						width: 210mm;
						min-height: 297mm;
						padding: 0;
						margin: 0 auto;
					}
					.header {
						display: flex;
						justify-content: space-between;
						gap: 12px;
						margin-bottom: 14px;
						font-size: 12px;
					}
					.title {
						font-size: 18px;
						font-weight: 700;
						margin-bottom: 4px;
					}
					.meta {
						font-size: 12px;
						line-height: 1.5;
					}
					table {
						width: 100%;
						border-collapse: collapse;
						font-size: 11px;
					}
					thead th {
						background: #f8fafc;
						font-size: 10px;
						text-transform: uppercase;
						letter-spacing: 0.12em;
						color: #6b7280;
					}
					th, td {
						border: 1px solid #d1d5db;
						padding: 7px 8px;
						vertical-align: top;
					}
					.num { text-align: right; white-space: nowrap; }
					.strong { font-weight: 700; }
					.empty { text-align: center; color: #6b7280; padding: 18px 8px; }
					.summary {
						margin-top: 14px;
						display: grid;
						grid-template-columns: 1fr auto;
						gap: 8px 24px;
						font-size: 12px;
					}
					.footer {
						margin-top: 18px;
						font-size: 11px;
						color: #6b7280;
					}
					@media print {
						body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
					}
				</style>
			</head>
			<body>
				<div class="sheet">
					<div class="header">
						<div>
							<div class="title">Voucher Print Preview</div>
							<div class="meta">Buyer: ${escapeHtml(buyerName.trim() || '-')}</div>
							<div class="meta">Voucher No: ${escapeHtml(voucherNumber || '-')}</div>
						</div>
						<div class="meta" style="text-align:right;">
							<div>Date: ${escapeHtml(summaryDate)}</div>
							<div>Status: ${infoSubmitted ? 'Submitted info' : 'Draft'}</div>
						</div>
					</div>

					<table>
						<thead>
							<tr>
								<th style="width:42px;">No.</th>
								<th>Name</th>
								<th style="width:56px;" class="num">Qty</th>
								<th style="width:54px;" class="num">Unit</th>
								<th style="width:54px;" class="num">Unit 2</th>
								<th style="width:88px;" class="num">Unit Price</th>
								<th style="width:92px;" class="num">Total</th>
							</tr>
						</thead>
						<tbody>
							${previewItemsHtml}
						</tbody>
					</table>

					<div class="summary">
						<div>Subtotal</div><div class="num strong">${formatAmountWithoutCurrency(subtotal)}</div>
						<div>Discount</div><div class="num strong">${formatAmountWithoutCurrency(Number(discount || 0))}</div>
						<div>Total</div><div class="num strong">${formatAmountWithoutCurrency(total)}</div>
					</div>

					<div class="footer">Use this preview to check paper size and spacing before printing.</div>
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

		previewWindow.document.open();
		previewWindow.document.write(printHtml);
		previewWindow.document.close();
	}

	function selectSnack(snack: SnackLookupRecord) {
		setItemForm({
			...createLineItem(),
snackId: snack.id,
name: snack.name,
});
		setNameFocused(false);
	}

	function handleItemSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!infoSubmitted) return;
		if (!itemForm.qty || !itemForm.unit || !itemForm.unit2 || !itemForm.price) return;

		// Allow manual items (snackId may be null) but require a name
		if (!itemForm.name.trim()) return;

		// Prepare new item and update UI immediately
		const newItem = { ...itemForm };
		setItems((current) => [...current, newItem]);
		setItemForm(createLineItem());

		// Persist this single line as a draft (create or update)
		if (itemSaveInFlightRef.current) return;
		itemSaveInFlightRef.current = true;

		void (async () => {
			try {
				const newItems = [...items, newItem];
				const payload = {
					voucherNumber: voucherNumber,
					voucherDate,
					buyerName,
					status: 'draft' as const,
					discount: Number(discount || 0),
					items: buildVoucherItemInputs(newItems),
				};

				if (draftVoucherId) {
					const updated = await api.updateVoucher(draftVoucherId, payload);
					setDraftVoucherId(updated.id);
					window.localStorage.setItem(DRAFT_STORAGE_KEY, updated.id);
					setVoucherIndex((current) => [{ id: updated.id, voucher_number: updated.voucher_number, voucher_date: updated.voucher_date, status: updated.status }, ...current.filter((record) => record.id !== updated.id)]);
				} else {
					const created = await api.createVoucher(payload);
					setDraftVoucherId(created.id);
					window.localStorage.setItem(DRAFT_STORAGE_KEY, created.id);
					setVoucherIndex((current) => [{ id: created.id, voucher_number: created.voucher_number, voucher_date: created.voucher_date, status: created.status }, ...current.filter((record) => record.id !== created.id)]);
				}

				setSaveStatus('Draft saved.');
			} catch (error) {
				setSaveStatus(error instanceof Error ? error.message : 'Failed to save draft.');
			} finally {
				itemSaveInFlightRef.current = false;
			}
		})();
	}

	function handleSubmitInfo() {
		if (!buyerName.trim() || !voucherDate) {
			setSaveStatus('Fill Buyer name and Voucher date first.');
			return;
		}

		const nextVoucherNumber = voucherNumber || buildVoucherNumberForDate(voucherDate, voucherIndex);
		if (!nextVoucherNumber) {
			setSaveStatus('Select a valid voucher date first.');
			return;
		}

		setVoucherNumber(nextVoucherNumber);
		setVoucherNumberAuto(true);

		void (async () => {
			try {
				const payloadBase = {
					voucherDate,
					buyerName,
					status: 'draft' as const,
					discount: Number(discount || 0),
					items: buildVoucherItemInputs(items),
				};

				if (draftVoucherId) {
					const payload = { ...payloadBase, voucherNumber: nextVoucherNumber };
					const savedDraft = await api.updateVoucher(draftVoucherId, payload);
					setDraftVoucherId(savedDraft.id);
					window.localStorage.setItem(DRAFT_STORAGE_KEY, savedDraft.id);
					setVoucherIndex((current) => [{ id: savedDraft.id, voucher_number: savedDraft.voucher_number, voucher_date: savedDraft.voucher_date, status: savedDraft.status }, ...current.filter((record) => record.id !== savedDraft.id)]);
					setInfoSubmitted(true);
					setSaveStatus('Voucher info submitted and draft saved. You can now add line items.');
					return;
				}

				// Create draft with a retry if the voucher_number collides.
				let attempts = 0;
				let created: any = null;
				let desiredNumber = nextVoucherNumber;
				while (attempts < 2) {
					try {
						const payload = { ...payloadBase, voucherNumber: desiredNumber };
						created = await api.createVoucher(payload);
						break;
					} catch (err: any) {
						const msg = String(err?.message || err);
						// If duplicate voucher number, refresh index and recompute
						if (msg.includes('vouchers_voucher_number_key') || msg.toLowerCase().includes('duplicate key')) {
							const records = await api.listVouchers();
							setVoucherIndex(records.map((r) => ({ id: r.id, voucher_number: r.voucher_number, voucher_date: r.voucher_date, status: r.status })));
							desiredNumber = buildVoucherNumberForDate(voucherDate, records.map((r) => ({ id: r.id, voucher_number: r.voucher_number, voucher_date: r.voucher_date, status: r.status })));
							setVoucherNumber(desiredNumber);
							setVoucherNumberAuto(true);
							attempts += 1;
							continue;
						}
						throw err;
					}
				}

				if (!created) {
					throw new Error('Failed to create draft after retry.');
				}

				setDraftVoucherId(created.id);
				window.localStorage.setItem(DRAFT_STORAGE_KEY, created.id);
				setVoucherIndex((current) => [{ id: created.id, voucher_number: created.voucher_number, voucher_date: created.voucher_date, status: created.status }, ...current.filter((record) => record.id !== created.id)]);
				setInfoSubmitted(true);
				setSaveStatus('Voucher info submitted and draft saved. You can now add line items.');
			} catch (error) {
				setSaveStatus(error instanceof Error ? error.message : 'Failed to save draft.');
			}
		})();
	}

	async function handleDeleteDraft() {
		if (!draftVoucherId) return;
		setSaveStatus('Deleting draft...');
		try {
			await api.deleteVoucher(draftVoucherId);
			// Clear local state and index
			setDraftVoucherId(null);
			window.localStorage.removeItem(DRAFT_STORAGE_KEY);
			setBuyerName('');
			setVoucherDate('');
			setVoucherNumber('');
			setVoucherNumberAuto(false);
			setDiscount('0');
			setItems([]);
			setItemForm(createLineItem());
			setInfoSubmitted(false);
			setVoucherIndex((current) => current.filter((r) => r.id !== draftVoucherId));
			setSaveStatus('Draft deleted.');
		} catch (error) {
			setSaveStatus(error instanceof Error ? error.message : 'Failed to delete draft.');
		}
	}

	async function handleDeleteLineItem(itemId: string) {
		const nextItems = items.filter((item) => item.id !== itemId);
		setItems(nextItems);
		setSaveStatus('Line item deleted.');

		if (!draftVoucherId) return;

		try {
			const payload = {
				voucherNumber,
				voucherDate,
				buyerName,
				status: 'draft' as const,
				discount: Number(discount || 0),
				items: buildVoucherItemInputs(nextItems),
			};

			const updatedDraft = await api.updateVoucher(draftVoucherId, payload);
			setDraftVoucherId(updatedDraft.id);
			window.localStorage.setItem(DRAFT_STORAGE_KEY, updatedDraft.id);
			setVoucherIndex((current) => [{ id: updatedDraft.id, voucher_number: updatedDraft.voucher_number, voucher_date: updatedDraft.voucher_date, status: updatedDraft.status }, ...current.filter((record) => record.id !== updatedDraft.id)]);
			setSaveStatus('Line item deleted and draft updated.');
		} catch (error) {
			setSaveStatus(error instanceof Error ? error.message : 'Failed to update draft after deleting line item.');
		}
	}

	async function handleSaveVoucher() {
		if (!canSaveVoucher) {
			setSaveStatus('Submit Buyer name and Voucher date first.');
			return;
		}

		try {
			setSaveStatus(null);
			const finalVoucherDate = voucherDate;
			const finalVoucherNumber = voucherNumber || buildVoucherNumberForDate(finalVoucherDate, voucherIndex);
			const payload = {
				voucherNumber: finalVoucherNumber,
				voucherDate: finalVoucherDate,
				buyerName,
				status: 'pending' as const,
				discount: Number(discount || 0),
				items: buildVoucherItemInputs(items),
			};

			let savedRecord: VoucherApiRecord & { items: VoucherLineItemRecord[] };
			if (draftVoucherId) {
				savedRecord = await api.updateVoucher(draftVoucherId, payload);
			} else {
				savedRecord = await api.createVoucher(payload);
			}

			setDraftVoucherId(savedRecord.id);
			window.localStorage.setItem(DRAFT_STORAGE_KEY, savedRecord.id);
			setVoucherIndex((current) => [{ id: savedRecord.id, voucher_number: savedRecord.voucher_number, voucher_date: savedRecord.voucher_date, status: savedRecord.status }, ...current.filter((record) => record.id !== savedRecord.id)]);
			setSaveStatus('Voucher saved.');
			setBuyerName('');
			setVoucherDate('');
			setVoucherNumber('');
			setDiscount('0');
			setItems([]);
			setItemForm(createLineItem());
			setInfoSubmitted(false);
			setDraftVoucherId(null);
			window.localStorage.removeItem(DRAFT_STORAGE_KEY);
		} catch (error) {
			setSaveStatus(error instanceof Error ? error.message : 'Failed to save voucher.');
		}
	}

	return (
		<div className="space-y-6">
			<Header
				eyebrow="Sales"
				title="New Voucher"
				actions={
					<Button type="button">
						<ReceiptText className="h-4 w-4" />
						Create Voucher
					</Button>
				}
			/>

			<div className="grid gap-6 xl:grid-cols-[0.6fr_1.4fr]">
				<Card>
					<CardHeader>
						<CardTitle>Voucher editor</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-3">
						<Input label={t('voucher.fields.buyer_name')} placeholder={t('voucher.fields.buyer_name')} value={buyerName} onChange={(event) => setBuyerName(event.target.value)} disabled={infoSubmitted} />
						<Input label={t('voucher.fields.voucher_date')} type="date" value={voucherDate} onChange={(event) => setVoucherDate(event.target.value)} disabled={infoSubmitted} />
						<Input label={t('voucher.fields.voucher_number')} value={voucherNumber} disabled />
						<div className="flex gap-3">
							<Button type="button" onClick={handleSubmitInfo} disabled={infoSubmitted}>Submit info</Button>
							{infoSubmitted ? (
								<>
									<Button type="button" variant="secondary" onClick={() => setInfoSubmitted(false)}>Edit info</Button>
									{draftVoucherId ? (
										<Button type="button" variant="secondary" onClick={handleDeleteDraft}>Delete draft</Button>
									) : null}
								</>
							) : null}
						</div>

						<form className="flex flex-col gap-4" onSubmit={handleItemSubmit}>
							<div className="relative">
								<Input
									label={t('voucher.fields.item_name')}
									value={itemForm.name}
									disabled={!infoSubmitted}
									onFocus={() => setNameFocused(true)}
									onBlur={() => {
										window.setTimeout(() => setNameFocused(false), 120);
									}}
									onChange={(event) =>
										setItemForm((current) => ({
											...current,
											name: event.target.value,
											snackId: null,
										}))
									}
									placeholder={t('voucher.fields.item_search_placeholder')}
								/>
								{nameFocused && filteredSnacks.length ? (
									<div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-lg">
										{filteredSnacks.map((snack) => (
											<button
												key={snack.id}
												type="button"
												onMouseDown={(event) => {
													event.preventDefault();
													selectSnack(snack);
												}}
												className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-orange-50"
											>
												<div>
													<div className="font-medium text-slate-900">{snack.name}</div>
												</div>
											</button>
										))}
									</div>
								) : null}
							</div>
							<div className="grid gap-3 md:grid-cols-3">
								<Input
									label={t('voucher.summary.table.qty')}
									type="number"
									min="1"
									step="1"
									max="999"
									className="w-24"
									value={itemForm.qty}
									disabled={!infoSubmitted}
									onChange={(event) => setItemForm((current) => ({ ...current, qty: event.target.value }))}
								/>
								<Input
									label={t('voucher.summary.table.unit')}
									type="number"
									min="0"
									step="0.01"
									max="999"
									className="w-24"
									value={itemForm.unit}
									disabled={!infoSubmitted}
									onChange={(event) => setItemForm((current) => ({ ...current, unit: event.target.value }))}
									placeholder="1"
								/>
								<Input
									label={t('voucher.summary.table.unit2')}
									type="number"
									min="0"
									step="0.01"
									max="999"
									className="w-24"
									value={itemForm.unit2}
									disabled={!infoSubmitted}
									onChange={(event) => setItemForm((current) => ({ ...current, unit2: event.target.value }))}
									placeholder="1"
								/>
							</div>
							<Input
								label={t('voucher.summary.table.unit_price')}
								type="number"
								min="0"
								step="0.01"
								value={itemForm.price}
								disabled={!infoSubmitted}
								onChange={(event) => setItemForm((current) => ({ ...current, price: event.target.value }))}
							/>
							<div className="flex flex-wrap gap-3">
								<Button type="submit" disabled={!infoSubmitted}>Add line item</Button>
							</div>
						</form>
					</CardContent>
				</Card>

				<Card className="flex flex-col">
					<CardHeader>
						<CardTitle>Voucher summary</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-1 flex-col gap-4">
						<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
							<div className="border-b border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
								<div className="flex items-center justify-between gap-3">
									<span>{t('voucher.summary.buyer_name')} - {buyerName.trim() || '-'}</span>
									<span>{t('voucher.summary.voucher_number')} {voucherNumber || '-'}</span>
									<span className="text-right">{t('voucher.summary.date')} {summaryDate}</span>
								</div>
							</div>
							<div className="max-h-[320px] overflow-auto">
								<div className={`grid grid-cols-[36px_64px_minmax(0,1.5fr)_54px_66px_66px_minmax(0,1fr)_minmax(0,1fr)] border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 ${isMyanmarLanguage ? 'text-[11px] font-bold tracking-[0.08em] text-slate-500' : ''}`}>
									<div className="border-r border-slate-200 px-2 py-3 text-center" />
									<div className={`border-r border-slate-200 px-4 py-3 text-center ${isMyanmarLanguage ? 'whitespace-normal leading-tight font-bold' : ''}`}>{t('voucher.summary.table.no')}</div>
									<div className={`border-r border-slate-200 px-4 py-3 ${isMyanmarLanguage ? 'whitespace-normal leading-tight font-bold' : ''}`}>{t('voucher.summary.table.name')}</div>
									<div className={`border-r border-slate-200 px-4 py-3 text-right ${isMyanmarLanguage ? 'whitespace-normal leading-tight font-bold' : ''}`}>{t('voucher.summary.table.qty')}</div>
									<div className={`border-r border-slate-200 px-4 py-3 ${isMyanmarLanguage ? 'whitespace-normal leading-tight font-bold' : ''}`}>{t('voucher.summary.table.unit')}</div>
									<div className={`border-r border-slate-200 px-4 py-3 ${isMyanmarLanguage ? 'whitespace-normal leading-tight font-bold' : ''}`}>{t('voucher.summary.table.unit2')}</div>
									<div className={`border-r border-slate-200 px-4 py-3 text-right ${isMyanmarLanguage ? 'whitespace-normal leading-tight font-bold' : ''}`}>{t('voucher.summary.table.unit_price')}</div>
									<div className={`px-4 py-3 text-right ${isMyanmarLanguage ? 'whitespace-normal leading-tight font-bold' : ''}`}>{t('voucher.summary.table.total')}</div>
								</div>
								<div className="divide-y divide-slate-200">
									{items.length === 0 && !hasPreview ? (
										<div className="px-4 py-5 text-xs text-slate-500">No line items added yet.</div>
									) : (
										<>
											{/* Render submitted items first so they remain No.1..N */}
											{items.map((item, index) => {
												const displayIndex = index + 1;
												const quantity = Math.max(1, Number(item.qty || 1));
												const unit = Number(item.unit || 1);
												const unit2 = Number(item.unit2 || 1);
												const unitPrice = Number(item.price || 0);
												const lineTotal = quantity * unit * unit2 * unitPrice;
												return (
													<div key={item.id} className="grid grid-cols-[36px_64px_minmax(0,1.5fr)_54px_66px_66px_minmax(0,1fr)_minmax(0,1fr)] text-xs">
														<div className="border-r border-slate-200 px-2 py-3 text-center">
															<button
																type="button"
																onClick={() => handleDeleteLineItem(item.id)}
																className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-[11px] font-bold text-rose-600 transition hover:bg-rose-200"
																aria-label={`Delete line item ${displayIndex}`}
																title="Delete line item"
															>
																×
															</button>
														</div>
														<div className="border-r border-slate-200 px-4 py-3 text-center font-medium text-slate-900">{displayIndex}</div>
														<div className="border-r border-slate-200 px-4 py-3 font-medium text-slate-900">{item.name}</div>
														<div className="border-r border-slate-200 px-4 py-3 text-right text-slate-600">{quantity}</div>
														<div className="border-r border-slate-200 px-4 py-3 text-slate-600">{displayUnit(unit)}</div>
														<div className="border-r border-slate-200 px-4 py-3 text-slate-600">{displayUnit(unit2)}</div>
														<div className="border-r border-slate-200 px-4 py-3 text-right text-slate-600">{formatAmountWithoutCurrency(unitPrice)}</div>
														<div className="px-4 py-3 text-right font-medium text-slate-900">{formatAmountWithoutCurrency(lineTotal)}</div>
													</div>
												);
											})}
											{/* Preview appears after submitted items so first submitted item stays No.1 */}
											{hasPreview && (
												<div key="preview" className="grid grid-cols-[36px_64px_minmax(0,1.5fr)_54px_66px_66px_minmax(0,1fr)_minmax(0,1fr)] text-xs">
													<div className="border-r border-slate-200 px-2 py-3 text-center" />
													<div className="border-r border-slate-200 px-4 py-3 text-center font-medium text-slate-900">{items.length + 1}</div>
													<div className="border-r border-slate-200 px-4 py-3 font-medium text-slate-900">{itemForm.name || ''}</div>
													<div className="border-r border-slate-200 px-4 py-3 text-right text-slate-600">{itemForm.qty ? Math.max(1, Number(itemForm.qty || 1)) : ''}</div>
													<div className="border-r border-slate-200 px-4 py-3 text-slate-600">{itemForm.unit ? displayUnit(Number(itemForm.unit || 1)) : ''}</div>
													<div className="border-r border-slate-200 px-4 py-3 text-slate-600">{itemForm.unit2 ? displayUnit(Number(itemForm.unit2 || 1)) : ''}</div>
													<div className="border-r border-slate-200 px-4 py-3 text-right text-slate-600">{itemForm.price ? formatAmountWithoutCurrency(Number(itemForm.price || 0)) : ''}</div>
													<div className="px-4 py-3 text-right font-medium text-slate-900">{formatAmountWithoutCurrency(Math.max(1, Number(itemForm.qty || 1)) * Number(itemForm.unit || 1) * Number(itemForm.unit2 || 1) * Number(itemForm.price || 0))}</div>
												</div>
											)}
										</>
									)}
								</div>
							</div>
						</div>
						<div className="mt-auto grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
							<div className="flex items-center justify-between">
								<span>Subtotal</span>
								<span className="font-medium text-slate-900">{formatAmountWithoutCurrency(subtotal)}</span>
							</div>
							<div className="flex items-center justify-between">
								<span>Discount</span>
								<div className="w-32">
									<Input value={discount} onChange={(event) => setDiscount(event.target.value)} />
								</div>
							</div>
							<div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
								<span>Total</span>
								<span className="font-semibold text-slate-900">{formatAmountWithoutCurrency(total)}</span>
							</div>
						</div>
						<div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
							Voucher controls, payment capture, and print preview can live here once the form is connected.
						</div>
						{snackStatus ? <div className="text-sm text-rose-600">{snackStatus}</div> : null}
						<div className="flex gap-3">
							<Button type="button" onClick={handleSaveVoucher}>Save voucher</Button>
							<Button type="button" variant="secondary" onClick={handlePrintPreview}>
								Print preview
							</Button>
						</div>
						{saveStatus ? <div className="text-sm text-slate-600">{saveStatus}</div> : null}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
