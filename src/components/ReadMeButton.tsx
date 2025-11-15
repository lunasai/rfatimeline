import { useState } from 'react';
import { ReadMeModal } from './ReadMeModal';

export function ReadMeButton() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<button
				onClick={() => setIsOpen(true)}
				style={{
					position: 'fixed',
					bottom: '24px',
					right: '24px',
					padding: '6px 12px',
					backgroundColor: 'rgba(255, 255, 255, 0.9)',
					border: '1px solid rgba(0, 0, 0, 0.15)',
					borderRadius: '6px',
					fontSize: '12px',
					fontFamily: 'IBM Plex Mono, ui-monospace, SFMono-Regular, monospace',
					color: 'rgba(29, 29, 29, 0.7)',
					cursor: 'pointer',
					boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
					zIndex: 100,
					transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
					lineHeight: 1.4,
				}}
				onMouseEnter={(e) => {
					e.currentTarget.style.backgroundColor = '#ffffff';
					e.currentTarget.style.color = '#1d1d1d';
					e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.25)';
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
					e.currentTarget.style.color = 'rgba(29, 29, 29, 0.7)';
					e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.15)';
				}}
				aria-label="Read me"
			>
				* read me
			</button>

			<ReadMeModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
		</>
	);
}

