import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Package2, Pencil, Trash2 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Header, Input } from '../../../ui';
import { api, type SnackApiRecord } from '../../../lib/api';

type SnackEntry = {
	id: string;
	name: string;
};

const defaultSnackEntry: SnackEntry = {
	id: '',
	name: '',
};

export function SnacksPage() {
	const { t } = useTranslation();
	const [snacks, setSnacks] = useState<SnackEntry[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [form, setForm] = useState<SnackEntry>(defaultSnackEntry);
	const [isSaving, setIsSaving] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const duplicateNameSet = useMemo(() => {
		const counts = new Map<string, number>();
		for (const snack of snacks) {
			counts.set(snack.name, (counts.get(snack.name) ?? 0) + 1);
		}

		const duplicates = new Set<string>();
		for (const [name, count] of counts) {
			if (count > 1) {
				duplicates.add(name);
			}
		}

		return duplicates;
	}, [snacks]);

	const filteredSnacks = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		if (!query) return snacks;
		return snacks.filter((snack) => snack.name.toLowerCase().includes(query));
	}, [snacks, searchQuery]);

	useEffect(() => {
		void api
			.listSnacks()
			.then((records) => {
				setSnacks(records.map(mapSnackRecordToEntry));
			})
			.catch((error: unknown) => {
				setErrorMessage(error instanceof Error ? error.message : 'Failed to load snacks');
			});
	}, []);

	function mapSnackRecordToEntry(record: SnackApiRecord): SnackEntry {
		return {
			id: record.id,
			name: record.name,
		};
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!form.name) return;

		setIsSaving(true);
		setErrorMessage(null);
		try {
			if (form.id) {
				const updated = await api.updateSnack(form.id, { name: form.name });
				setSnacks((current) =>
					current.map((snack) => (snack.id === updated.id ? mapSnackRecordToEntry(updated) : snack)),
				);
			} else {
				const created = await api.createSnack({ name: form.name });
				setSnacks((current) => [mapSnackRecordToEntry(created), ...current]);
			}
			setForm(defaultSnackEntry);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : 'Failed to save snack');
		} finally {
			setIsSaving(false);
		}
	}

	async function handleDelete(snack: SnackEntry) {
		const confirmed = window.confirm(t('snacks.confirm_delete', { name: snack.name, defaultValue: `Delete "${snack.name}"?` }));
		if (!confirmed) return;

		setErrorMessage(null);
		try {
			await api.deleteSnack(snack.id);
			setSnacks((current) => current.filter((entry) => entry.id !== snack.id));
			setForm((current) => (current.id === snack.id ? defaultSnackEntry : current));
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : 'Failed to delete snack');
		}
	}

	function handleEdit(snack: SnackEntry) {
		setForm(snack);
		setErrorMessage(null);
	}

	return (
		<div className="space-y-6">
			<Header
				eyebrow={t('snacks.title')}
				title={t('snacks.title')}
				actions={
					<Button type="button" onClick={() => setForm(defaultSnackEntry)}>
						<Package2 className="h-4 w-4" />
						{t('actions.add')}
					</Button>
				}
			/>

			<div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
				<Card>
						<CardHeader>
							<CardTitle>{t('snacks.details_title', 'Snack details')}</CardTitle>
						</CardHeader>
					<CardContent>
						<form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
								<Input label={t('snacks.fields.name', 'Snack name')} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
							<div className="md:col-span-2 flex gap-3">
								<Button type="submit" disabled={isSaving}>{isSaving ? t('actions.saving', 'Saving...') : form.id ? t('actions.update', 'Update snack') : t('actions.save')}</Button>
									<Button type="button" variant="secondary" onClick={() => setForm(defaultSnackEntry)}>
									{form.id ? t('actions.cancel', 'Cancel') : t('actions.clear')}
								</Button>
							</div>
							{errorMessage ? <div className="md:col-span-2 text-sm text-rose-600">{errorMessage}</div> : null}
						</form>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
							<CardTitle>{t('snacks.list_title', 'Snack list')}</CardTitle>
					</CardHeader>
						<CardContent>
							<div className="mb-3">
								<Input
									label={t('snacks.search_label', 'Search')}
									placeholder={t('snacks.search_placeholder', 'Search snacks')}
									value={searchQuery}
									onChange={(event) => setSearchQuery(event.target.value)}
								/>
							</div>
							<div className="space-y-2">
								{filteredSnacks.length ? filteredSnacks.map((snack, index) => (
									<div key={snack.id || snack.name} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
										<div className="w-7 text-left text-sm font-semibold text-slate-500">{index + 1}.</div>
										<div className={`flex-1 text-sm font-medium ${duplicateNameSet.has(snack.name) ? 'text-rose-600' : 'text-slate-900'}`}>{snack.name}</div>
										<div className="flex items-center gap-2">
											<Button type="button" variant="secondary" className="h-8 px-3" onClick={() => handleEdit(snack)}>
												<Pencil className="h-4 w-4" />
												{t('actions.edit', 'Edit')}
											</Button>
											<Button type="button" variant="secondary" className="h-8 px-3 border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => void handleDelete(snack)}>
												<Trash2 className="h-4 w-4" />
												{t('actions.delete', 'Delete')}
											</Button>
										</div>
									</div>
								)) : (
									<div className="text-sm text-slate-500">{t('snacks.empty', 'No snacks saved yet.')}</div>
								)}
							</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
