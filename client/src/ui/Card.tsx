import type { HTMLAttributes, ReactNode } from 'react';

type BaseProps = HTMLAttributes<HTMLDivElement> & {
	children: ReactNode;
};

export function Card({ className = '', children, ...props }: BaseProps) {
	return (
		<div
			className={[
				'overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5',
				className,
			].join(' ')}
			{...props}
		>
			{children}
		</div>
	);
}

export function CardHeader({ className = '', children, ...props }: BaseProps) {
	return (
		<div className={['border-b border-slate-200 p-6', className].join(' ')} {...props}>
			{children}
		</div>
	);
}

export function CardTitle({ className = '', children, ...props }: BaseProps) {
	return (
		<h3 className={['text-base font-semibold text-slate-900', className].join(' ')} {...props}>
			{children}
		</h3>
	);
}

export function CardDescription({ className = '', children, ...props }: BaseProps) {
	return (
		<p className={['mt-1 text-sm text-slate-500', className].join(' ')} {...props}>
			{children}
		</p>
	);
}

export function CardContent({ className = '', children, ...props }: BaseProps) {
	return (
		<div className={['p-6', className].join(' ')} {...props}>
			{children}
		</div>
	);
}

export function CardFooter({ className = '', children, ...props }: BaseProps) {
	return (
		<div className={['border-t border-slate-200 p-6', className].join(' ')} {...props}>
			{children}
		</div>
	);
}
