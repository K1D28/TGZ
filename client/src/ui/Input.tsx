import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
	label?: string;
	hint?: string;
	error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
	{ label, hint, error, id, className = '', ...props },
	ref,
) {
	const generatedId = useId();
	const inputId = id ?? generatedId;
	const helpId = hint || error ? `${inputId}-help` : undefined;

	return (
		<label className="block">
			{label ? <span className="mb-1 block text-sm font-medium text-slate-900">{label}</span> : null}
			<input
				ref={ref}
				id={inputId}
				aria-invalid={Boolean(error) || undefined}
				aria-describedby={helpId}
				className={[
					'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition',
					'placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20',
					error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : '',
					className,
				].join(' ')}
				{...props}
			/>
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
