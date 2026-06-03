import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { SnacksPage } from '../features/snacks/pages/SnacksPage';
import { VoucherPage } from '../features/vouchers/pages/VoucherPage';
import { SalesHistoryPage } from '../features/history/pages/SalesHistoryPage';

function NotFoundPage() {
	return (
		<div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-950/5">
			<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">404</p>
			<h1 className="mt-2 text-2xl font-semibold text-slate-900">Page not found</h1>
			<p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
				The route you requested does not exist. Use the navigation to go back to a valid screen.
			</p>
		</div>
	);
}

export function AppRouter() {
	return (
		<Routes>
			<Route element={<AppShell />}>
				<Route index element={<Navigate to="/dashboard" replace />} />
				<Route path="/dashboard" element={<DashboardPage />} />
				<Route path="/snacks" element={<SnacksPage />} />
				<Route path="/vouchers/new" element={<VoucherPage />} />
				<Route path="/sales" element={<SalesHistoryPage />} />
				<Route path="*" element={<NotFoundPage />} />
			</Route>
		</Routes>
	);
}
