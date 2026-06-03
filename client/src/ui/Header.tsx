import type { ReactNode } from 'react';

type HeaderProps = {
	eyebrow?: string;
	title: string;
	description?: string;
	actions?: ReactNode;
	meta?: ReactNode;
};

export function Header({ eyebrow, title, description, actions, meta }: HeaderProps) {
	return (
		<div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/5 md:flex-row md:items-start md:justify-between">
			<div>
				{eyebrow ? (
					<div className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-500">
						{eyebrow}
					</div>
				) : null}
				<h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
				{description ? (
					<p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
				) : null}
				{meta ? <div className="mt-4">{meta}</div> : null}
			</div>

			{actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
		</div>
	);
}
