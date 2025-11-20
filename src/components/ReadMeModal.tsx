import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

type ReadMeModalProps = {
	isOpen: boolean;
	onClose: () => void;
	children: ReactNode;
};

export function ReadMeModal({ isOpen, onClose, children }: ReadMeModalProps) {
	// Close on Escape key
	useEffect(() => {
		if (!isOpen) return;
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return createPortal(
		<>
			{/* Overlay */}
			<div
				style={{
					position: 'fixed',
					inset: 0,
					backgroundColor: 'rgba(0, 0, 0, 0.4)',
					backdropFilter: 'blur(4px)',
					WebkitBackdropFilter: 'blur(4px)',
					zIndex: 1000,
					cursor: 'pointer',
				}}
				onClick={onClose}
				aria-hidden="true"
			/>

			{/* Modal */}
			<div
				style={{
					position: 'fixed',
					left: '50%',
					top: '50%',
					transform: 'translate(-50%, -50%)',
					width: '90%',
					maxWidth: '600px',
					maxHeight: '90vh',
					backgroundColor: '#ffffff',
					borderRadius: '12px',
					boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
					zIndex: 1001,
					display: 'flex',
					flexDirection: 'column',
					overflow: 'hidden',
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header with close button */}
				<div
					style={{
						display: 'flex',
						justifyContent: 'flex-end',
						padding: '16px 20px 0',
					}}
				>
					<button
						onClick={onClose}
						style={{
							background: 'none',
							border: 'none',
							fontSize: '28px',
							lineHeight: 1,
							color: 'rgba(0, 0, 0, 0.5)',
							cursor: 'pointer',
							padding: '4px 8px',
							borderRadius: '4px',
							transition: 'color 0.2s, background-color 0.2s',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.color = '#1d1d1d';
							e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.color = 'rgba(0, 0, 0, 0.5)';
							e.currentTarget.style.backgroundColor = 'transparent';
						}}
						aria-label="Close modal"
					>
						×
					</button>
				</div>

				{/* Content */}
				<div
					style={{
						padding: '0 32px 32px',
						overflowY: 'auto',
						flex: 1,
						fontFamily: 'DM Sans, sans-serif',
						color: '#1d1d1d',
						lineHeight: 1.6,
						fontSize: '15px',
					}}
				>
					{children}
				</div>
			</div>
		</>,
		document.body
	);
}

