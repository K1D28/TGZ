import { ArrowRight, ReceiptText, Settings2 } from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Header } from '../../ui';

const setupSteps = [
	'Connect your database and load vouchers from live records.',
	'Add products using the forms in the sidebar routes.',
	'Generate vouchers from the New Voucher screen and print them when ready.',
	'Use Sales History for review, filtering, and audit-ready records.',
];

export function DashboardPage() {
	return (
		<div className="space-y-6">
			<Header
				eyebrow="Dashboard"
				title="Workspace"
				description="A clean admin surface for snacks, vouchers, and history without demo clutter."
				actions={
					<>
						<Button type="button" variant="secondary">
							<Settings2 className="h-4 w-4" />
							Configure app
						</Button>
						<Button type="button">
							<ArrowRight className="h-4 w-4" />
							New voucher
						</Button>
					</>
				}
			/>

			<div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
				<Card>
					<CardHeader>
						<CardTitle>Start here</CardTitle>
						<CardDescription>Replace this starter surface with live voucher and snack records.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
							<div className="space-y-3">
								<p className="font-medium text-slate-900 dark:text-slate-50">Suggested setup flow</p>
								<ul className="space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
									{setupSteps.map((step) => (
										<li key={step} className="flex items-start gap-3">
											<span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-500" />
											<span>{step}</span>
										</li>
									))}
								</ul>
							</div>
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							<Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
								<CardContent className="space-y-2 p-5">
									<p className="text-sm font-medium text-slate-900 dark:text-slate-50">Admin workflow</p>
									<p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
										Use the left rail to move between records, imports, and voucher creation.
									</p>
								</CardContent>
							</Card>

							<Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
								<CardContent className="space-y-2 p-5">
									<p className="text-sm font-medium text-slate-900 dark:text-slate-50">Printing ready</p>
									<p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
										Voucher and receipt screens are structured for browser print and thermal export.
									</p>
								</CardContent>
							</Card>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Live status</CardTitle>
						<CardDescription>No fake metrics; connect records to populate this panel.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="rounded-2xl border border-dashed border-slate-300 p-5 dark:border-slate-700">
							<div className="flex items-start gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
									<ReceiptText className="h-5 w-5" />
								</div>
								<div className="space-y-2">
									<p className="font-medium text-slate-900 dark:text-slate-50">No live voucher feed yet</p>
									<p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
										Once the database is connected, recent records can appear here instead of demo rows.
									</p>
								</div>
							</div>
						</div>

						<div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
							<p className="text-sm font-medium text-slate-900 dark:text-slate-50">Next actions</p>
							<div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
								<div className="flex items-start gap-3">
									<span className="mt-1.5 h-2 w-2 rounded-full bg-cyan-500" />
									<span>Wire the dashboard to Supabase queries.</span>
								</div>
								<div className="flex items-start gap-3">
									<span className="mt-1.5 h-2 w-2 rounded-full bg-cyan-500" />
									<span>Add real CRUD forms for products and inventory.</span>
								</div>
								<div className="flex items-start gap-3">
									<span className="mt-1.5 h-2 w-2 rounded-full bg-cyan-500" />
									<span>Connect voucher creation and printable output.</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
