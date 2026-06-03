import React, { useEffect, useRef, useState } from 'react';

type MenuItem = {
	label: string;
	icon?: React.ComponentType<any>;
	onClick?: () => void;
	destructive?: boolean;
};

type DropdownMenuProps = {
	label: string;
	align?: 'left' | 'right';
	items: MenuItem[];
};

export function DropdownMenu({ label, align = 'left', items }: DropdownMenuProps) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		function onDoc(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener('mousedown', onDoc);
		return () => document.removeEventListener('mousedown', onDoc);
	}, []);

	return (
		<div ref={ref} className="relative inline-block text-left">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800"
			>
				{label}
			</button>

			{open && (
				<div
					className={`absolute z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-950/10 backdrop-blur dark:border-slate-800 dark:bg-slate-900 ${
						align === 'right' ? 'right-0' : 'left-0'
					}`}
				>
					{items.map((it, idx) => {
						const Icon = it.icon;
						return (
							<button
								key={idx}
								onClick={() => {
									it.onClick?.();
									setOpen(false);
								}}
								className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800 ${
									it.destructive ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'
								}`}
							>
								{Icon ? <Icon className="h-4 w-4" /> : null}
								{it.label}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
