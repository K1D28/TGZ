import { Card, CardContent, CardDescription, CardHeader, CardTitle, Header } from '../ui';

type PlaceholderPageProps = {
	title: string;
	description: string;
	features?: string[];
};

export function PlaceholderPage({
	title,
	description,
	features = ['Responsive layout', 'Clean forms', 'Modern cards', 'Modal flows'],
}: PlaceholderPageProps) {
	return (
		<div className="space-y-6">
			<Header eyebrow="Coming next" title={title} description={description} />
			<Card>
				<CardHeader>
					<CardTitle>Planned experience</CardTitle>
					<CardDescription>
						These routes are structured as real app screens, ready for live data and actions.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ul className="grid gap-3 sm:grid-cols-2">
						{features.map((feature) => (
							<li
								key={feature}
								className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
							>
								{feature}
							</li>
						))}
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}
