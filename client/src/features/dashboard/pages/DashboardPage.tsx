import { useTranslation } from 'react-i18next';

export function DashboardPage() {
	const { t } = useTranslation();

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/5 md:flex-row md:items-center md:justify-between">
				<div>
					<div className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-500">{t('dashboard.overview_label', 'Overview')}</div>
					<h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{t('dashboard.title')}</h1>
					<p className="mt-2 max-w-2xl text-sm text-slate-600">{t('dashboard.overview')}</p>
				</div>

				<div className="flex gap-3">
					<div className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600">
						{t('dashboard.today', 'Today')}
					</div>
					<div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
						{t('dashboard.all_time', 'All Time')}
					</div>
				</div>
			</div>

			{/* Top items manual UI removed — will implement DB-driven version later */}
		</div>
	);
}
