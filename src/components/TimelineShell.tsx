import { useEffect, useMemo, useRef, type PropsWithChildren } from 'react';
import { config } from '../config';
import { useTimelineLayout } from '../context/TimelineLayoutContext';
import InputPanel from './InputPanel';
import { ReadMeButton } from './ReadMeButton';

export function TimelineShell({ children }: PropsWithChildren) {
	const { containerRef, isOverflowing, layout } = useTimelineLayout();
	const wrapperRef = useRef<HTMLDivElement>(null);

	// Calculate grid offset and expose shared CSS vars for column rhythm
	useEffect(() => {
		const updateGridOffset = () => {
			if (!containerRef.current) return;
			
			// Find the inner grid container inside the scrollable container
			const gridEl = containerRef.current.querySelector('[data-timeline-grid]') as HTMLElement | null;
			if (!gridEl) return;
			
			const columnsRect = gridEl.getBoundingClientRect();
			const gridStep = layout.monthWidth > 0 ? layout.monthWidth : config.ui.minCol;
			
			if (gridStep > 0) {
				// Expose shared variables for all layers to consume
				const root = document.documentElement;
				root.style.setProperty('--col-w', `${gridStep}px`);
				root.style.setProperty('--offset-x', `${columnsRect.left}px`);
			}
		};

		updateGridOffset();
		
		const resizeObserver = new ResizeObserver(() => {
			requestAnimationFrame(updateGridOffset);
		});
		if (containerRef.current) resizeObserver.observe(containerRef.current);
		if (wrapperRef.current) resizeObserver.observe(wrapperRef.current);
		
		window.addEventListener('resize', updateGridOffset);
		window.addEventListener('scroll', updateGridOffset, { passive: true });

		return () => {
			resizeObserver.disconnect();
			window.removeEventListener('resize', updateGridOffset);
			window.removeEventListener('scroll', updateGridOffset);
		};
	}, [containerRef, layout.monthWidth]);

	// Background grid: subtle vertical lines spanning full viewport
	// Grid step matches month width exactly, offset to align with columns
	const gridStep = layout.monthWidth > 0 ? layout.monthWidth : config.ui.minCol;
	const backgroundStyle = useMemo<React.CSSProperties>(
		() => ({
			backgroundImage: `repeating-linear-gradient(
				to right,
				var(--grid-bg) 0 1px,
				transparent 1px var(--col-w)
			)`,
			// Align gradient to the same left offset as the central grid
			backgroundPosition: `var(--offset-x, 0px) 0`,
			'--grid-bg': config.ui.colors.gridBg,
		} as React.CSSProperties),
		[gridStep]
	);

	// Subtle elevation panel - very light, barely noticeable
	const panelStyle = useMemo<React.CSSProperties>(
		() => ({
			backgroundColor: 'rgba(255, 255, 255, 0.4)',
			backdropFilter: 'blur(2px)',
			WebkitBackdropFilter: 'blur(2px)',
			boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
		}),
		[]
	);

	return (
		<div className="relative min-h-screen w-full font-mono text-ink overflow-hidden">
			{/* Input Panel - fixed top-left */}
			<InputPanel />

			{/* Read Me button - fixed bottom-right */}
			<ReadMeButton />

			{/* Endless grid layer - spans entire viewport */}
			<div
				className="fixed inset-0 pointer-events-none"
				style={backgroundStyle}
				aria-hidden="true"
			/>

			{/* Central window with soft focus panel */}
			<div className="relative z-10 flex items-center justify-center min-h-screen" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
				{/* Max width constraint: widened timeline area, centered */}
				<div ref={wrapperRef} className="relative w-full" style={{ maxWidth: '944px', overflow: 'visible' }}>
					{/* Soft elevation panel - very subtle */}
					<div
						className="absolute inset-0 rounded-sm"
						style={panelStyle}
						aria-hidden="true"
					/>

					{/* Interactive content container */}
					<div
						ref={containerRef}
						className={[
							'relative rounded-sm',
							// No separate horizontal scroll panel; page scrolls as one
						].join(' ')}
						style={{
							scrollBehavior: 'smooth',
							overflow: 'visible', // Allow labels to extend beyond edges
							overscrollBehavior: 'none',
						}}
						data-overflowing={isOverflowing}
						data-month-width={layout.monthWidth}
					>
						{children}
					</div>
				</div>
			</div>
		</div>
	);
}

export default TimelineShell;


