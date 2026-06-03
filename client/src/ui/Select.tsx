import { forwardRef, useId } from 'react';
import type { SelectHTMLAttributes } from 'react';

type Option = { label: string; value: string };

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
	label?: string;
	hint?: string;
	error?: string;
	options?: Option[];
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
	{ label, hint, error, id, className = '', options = [], children, ...props },
	ref,
) {
	const generatedId = useId();
	const selectId = id ?? generatedId;
	const helpId = hint || error ? `${selectId}-help` : undefined;

	return (
		<label className="block">
			{label ? <span className="mb-1 block text-sm font-medium text-slate-900">{label}</span> : null}
			<select
				ref={ref}
				id={selectId}
				aria-invalid={Boolean(error) || undefined}
				aria-describedby={helpId}
				className={[
					'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition',
					'focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20',
					error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : '',
					className,
				].join(' ')}
				{...props}
			>
				{options.length
					? options.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))
					: children}
			</select>
			{hint || error ? (
				<p
					id={helpId}
					className={`mt-1 text-xs ${error ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}
				>
					{error ?? hint}
				</p>
			) : null}
		</label>
	);
});
