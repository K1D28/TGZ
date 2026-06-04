import { useEffect, useState } from 'react';
import { useLocation, Link, NavLink, Outlet } from 'react-router-dom';
import {
	Candy,
	History,
	LayoutDashboard,
	Menu,
	ReceiptText,
	X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../LanguageSwitcher';

const navItems = [
	{ to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
	{ to: '/snacks', labelKey: 'nav.snacks', icon: Candy },
	{ to: '/vouchers/new', labelKey: 'nav.new_voucher', icon: ReceiptText },
	{ to: '/sales', labelKey: 'nav.sales_history', icon: History },
];

export function AppShell() {
	const location = useLocation();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const { t } = useTranslation();

	const activeItem = navItems.find(
		(item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`),
	) ?? navItems[0];

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				setMobileMenuOpen(false);
			}
		}

		if (mobileMenuOpen) {
			document.body.style.overflow = 'hidden';
			document.addEventListener('keydown', onKeyDown);
		} else {
			document.body.style.overflow = '';
		}

		return () => {
			document.body.style.overflow = '';
			document.removeEventListener('keydown', onKeyDown);
		};
	}, [mobileMenuOpen]);

	function closeMobileMenu() {
		setMobileMenuOpen(false);
	}

	return (
			<div className="min-h-screen bg-slate-50 text-slate-900">
			<div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
				<div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm shadow-slate-950/5 backdrop-blur lg:hidden">
					<Link to="/dashboard" className="flex items-center gap-3" onClick={closeMobileMenu}>
						<span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 ring-1 ring-orange-100">
							<LayoutDashboard className="h-5 w-5" />
						</span>
						<span className="leading-tight">
							<span className="block text-sm font-semibold text-slate-900">{t('app.brand', 'Voucher Generator')}</span>
						</span>
					</Link>

					<button
						type="button"
						onClick={() => setMobileMenuOpen((value) => !value)}
						className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm"
						aria-label="Toggle menu"
						aria-expanded={mobileMenuOpen}
					>
						{mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
					</button>
				</div>

				{mobileMenuOpen ? (
					<div
						className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-[1px] lg:hidden"
						onClick={closeMobileMenu}
						aria-hidden="true"
					/>
				) : null}

				<aside
					className={`fixed inset-y-0 left-0 z-40 w-[min(86vw,320px)] border-r border-slate-200 bg-white px-5 py-6 shadow-xl shadow-slate-950/10 transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-full lg:translate-x-0 lg:shadow-sm lg:shadow-slate-950/5 ${
						mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
					}`}
				>
					<Link to="/dashboard" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50">
						<span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 ring-1 ring-orange-100">
							<LayoutDashboard className="h-6 w-6" />
						</span>
						<span>
							<span className="block text-lg font-semibold text-slate-900">{t('app.brand', 'Voucher Generator')}</span>
						</span>
					</Link>

					<nav className="mt-6 space-y-2" aria-label="Main navigation">
						{navItems.map((item) => {
							const Icon = item.icon;

							return (
								<NavLink
									key={item.to}
									to={item.to}
									onClick={closeMobileMenu}
									className={({ isActive }) =>
										`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
											isActive
												? 'border-orange-500 bg-orange-500 text-white shadow-sm'
												: 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
										}`
								}
								>
									<span className="flex items-center gap-3">
										<span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
											<Icon className="h-4 w-4" />
										</span>
													<span>{t(item.labelKey)}</span>
									</span>
									<span
										className={`h-2.5 w-2.5 rounded-full transition ${
											location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
												? 'bg-white'
												: 'bg-transparent'
										}`}
									/>
								</NavLink>
							);
						})}
					</nav>

				</aside>

				<div className="flex min-h-screen min-w-0 flex-1 flex-col">
					<header className="border-b border-slate-200 bg-white px-4 py-4 pt-20 lg:px-6 lg:pt-4">
						<div className="flex flex-wrap items-center justify-end gap-4">
							<div className="flex flex-wrap items-center justify-end gap-3">
								<div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-600 shadow-sm">
									<span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
									<span>{t(activeItem.labelKey)}</span>
								</div>

								<LanguageSwitcher />
							</div>
						</div>
					</header>

					<main className="min-w-0 flex-1 bg-slate-50 p-4 pb-8 md:p-6 xl:p-8">
						<div className="mx-auto w-full max-w-6xl">
							<Outlet />
						</div>
					</main>
				</div>
			</div>
		</div>
	);
}
