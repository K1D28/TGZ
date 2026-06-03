import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

type ModalProps = {
	open: boolean;
	title: string;
	description?: string;
	onClose: () => void;
	children: React.ReactNode;
	footer?: React.ReactNode;
	className?: string;
};

export function Modal({ open, title, description, onClose, children, footer, className = '' }: ModalProps) {
	const dialogRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) {
			return;
		}

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		dialogRef.current?.focus();

		function onKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				onClose();
			}
		}

		document.addEventListener('keydown', onKeyDown);

		return () => {
			document.body.style.overflow = previousOverflow;
			document.removeEventListener('keydown', onKeyDown);
		};
	}, [open, onClose]);

	if (!open) {
		return null;
	}

	return createPortal(
		<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
			<button
				type="button"
				aria-label="Close modal overlay"
				className="absolute inset-0 bg-slate-950/60"
				onClick={onClose}
			/>
			<div
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby="modal-title"
				aria-describedby={description ? 'modal-description' : undefined}
				tabIndex={-1}
				className={`relative z-10 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl outline-none dark:border-slate-800 dark:bg-slate-900 ${className}`}
			>
				<div className="flex items-start justify-between gap-4">
					<div>
						<h3 id="modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-50">
							{title}
						</h3>
						{description ? (
							<p id="modal-description" className="mt-1 text-sm text-slate-500 dark:text-slate-400">
								{description}
							</p>
						) : null}
					</div>

					<button
						type="button"
						onClick={onClose}
						className="rounded-lg px-2 py-1 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50"
					>
						Close
					</button>
				</div>

				<div className="mt-6">{children}</div>

				{footer ? <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">{footer}</div> : null}
			</div>
		</div>,
		document.body,
	);
}
