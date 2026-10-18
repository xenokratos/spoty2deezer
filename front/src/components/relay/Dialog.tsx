import { type ReactNode, useEffect, useId, useRef } from 'react';
import { useCopy } from './copy';
import { Icon } from './Icon';

export function Dialog({
	open,
	title,
	onClose,
	children,
}: {
	open: boolean;
	title: string;
	onClose: () => void;
	children: ReactNode;
}) {
	const ref = useRef<HTMLDialogElement>(null);
	const titleId = useId();
	const { copy } = useCopy();
	useEffect(() => {
		const dialog = ref.current;
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	}, [open]);
	return (
		<dialog
			ref={ref}
			className="relay-dialog"
			aria-labelledby={titleId}
			onCancel={onClose}
			onClose={onClose}
		>
			<div className="dialog-heading">
				<h2 id={titleId}>{title}</h2>
				<button
					className="icon-button"
					type="button"
					onClick={onClose}
					aria-label={copy.close}
				>
					<Icon name="x" />
				</button>
			</div>
			{children}
		</dialog>
	);
}
