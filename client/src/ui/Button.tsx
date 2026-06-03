import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: 'primary' | 'secondary';
};

export function Button({ children, className = '', variant = 'primary', ...rest }: ButtonProps) {
	const base =
		'inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-orange-500/25 disabled:pointer-events-none disabled:opacity-50';
	const variantClass =
		variant === 'secondary'
			? 'border border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50'
			: 'bg-orange-500 text-white shadow-sm hover:bg-orange-600';
	return (
		<button {...rest} className={`${base} ${variantClass} ${className}`}>
			{children}
		</button>
	);
}
