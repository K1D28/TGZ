import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Package2 } from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Header, Input } from '../../../ui';
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
	const [form, setForm] = useState<SnackEntry>(defaultSnackEntry);
	const [isSaving, setIsSaving] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
			const created = await api.createSnack({ name: form.name });

			setSnacks((current) => [mapSnackRecordToEntry(created), ...current]);
			setForm(defaultSnackEntry);
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : 'Failed to save snack');
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<div className="space-y-6">
			<Header
				eyebrow={t('snacks.title')}
				title={t('snacks.title')}
				description={t('snacks.description')}
				actions={
					<Button type="button">
						<Package2 className="h-4 w-4" />
						{t('actions.add')}
					</Button>
				}
			/>

			<div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
				<Card>
						<CardHeader>
							<CardTitle>{t('snacks.details_title', 'Snack details')}</CardTitle>
							<CardDescription>{t('snacks.details_description', 'Enter snack names by hand.')}</CardDescription>
						</CardHeader>
					<CardContent>
						<form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
								<Input label={t('snacks.fields.name', 'Snack name')} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
							<div className="md:col-span-2 flex gap-3">
								<Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : t('actions.save')}</Button>
									<Button type="button" variant="secondary" onClick={() => setForm(defaultSnackEntry)}>
									{t('actions.clear')}
								</Button>
							</div>
							{errorMessage ? <div className="md:col-span-2 text-sm text-rose-600">{errorMessage}</div> : null}
						</form>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
							<CardTitle>Snack list</CardTitle>
							<CardDescription>Saved snack names appear here after you add them.</CardDescription>
					</CardHeader>
						<CardContent>
							<div className="space-y-2">
								{snacks.length ? snacks.map((snack) => (
									<div key={snack.id || snack.name} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900">
										{snack.name}
									</div>
								)) : (
									<div className="text-sm text-slate-500">No snacks saved yet.</div>
								)}
							</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
