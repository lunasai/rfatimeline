import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { config } from '../config';
import { useTimelineLayout } from '../context/TimelineLayoutContext';
import MonthLabel from './MonthLabel';
import PeriodBubble from './PeriodBubble';
import Milestone from './Milestone';
import { monthRange, diffInMonths, monthIdLabelShort } from '../lib/months';
import type { MonthId } from '../lib/months';

export function MonthColumns() {
	const { layout, focusedIndex, setFocusedIndex } = useTimelineLayout();
	const liveRegionId = useId();
	const [_, setInputsVersion] = useState(0);
	
	// Visible window and scheme from localStorage
	const STORAGE_KEY = 'rfa-timeline-inputs';
	const VISIBLE_START: MonthId = '2025-11';
	const CAP_END: MonthId = '2027-06';
	const BASELINE_END: MonthId = '2026-10';

	let scheme: { outplacementStart?: MonthId; outplacementEnd?: MonthId; lastLeaveMonth?: MonthId } = {};
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const obj = JSON.parse(stored);
			scheme = obj?.scheme ?? {};
		}
	} catch {}

	// Re-render whenever inputs change (event broadcast from InputPanel)
	useEffect(() => {
		const handler = () => {
			setInputsVersion((v) => v + 1);
		};
		window.addEventListener('rfa-inputs-changed', handler);
		return () => window.removeEventListener('rfa-inputs-changed', handler);
	}, []);

	// Compute visible months range - show one extra column for the month after outplacement (lastLeaveMonth)
	const maxEnd = (a: MonthId, b: MonthId) => (diffInMonths(a, b) >= 0 ? b : a);
	const minEnd = (a: MonthId, b: MonthId) => (diffInMonths(a, b) <= 0 ? b : a);
	const baseEnd: MonthId = (scheme.lastLeaveMonth as MonthId) ?? (scheme.outplacementEnd as MonthId) ?? BASELINE_END;
	const unclampedEnd = maxEnd(BASELINE_END, baseEnd);
	const visibleEnd = minEnd(CAP_END, unclampedEnd);
	const months = monthRange(VISIBLE_START, visibleEnd);

	// Map important indices
	const outplacementStartIndex = scheme.outplacementStart ? months.indexOf(scheme.outplacementStart) : -1;
	const outplacementEndIndex = scheme.outplacementEnd ? months.indexOf(scheme.outplacementEnd) : -1;

	let lastLeaveIndex: number;
	if (scheme.lastLeaveMonth) {
		const clampedLast = minEnd(CAP_END, scheme.lastLeaveMonth);
		const idx = months.indexOf(clampedLast);
		lastLeaveIndex = idx === -1 ? months.length - 1 : idx;
	} else {
		lastLeaveIndex = months.length - 1;
	}

	// State for End of Contract position
	const [endContractIndex, setEndContractIndex] = useState(Math.min(months.length - 1, 12));
	const minEndContractIndex = 0; // Earliest allowed: Nov 2025 (index 0)
	const maxEndContractIndex = lastLeaveIndex; // Clamp at last leave (or cap)

	// Clamp handle if out of range after recompute
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => {
		setEndContractIndex((cur) => {
			if (cur < minEndContractIndex) return minEndContractIndex;
			if (cur > maxEndContractIndex) return maxEndContractIndex;
			return cur;
		});
	}, [minEndContractIndex, maxEndContractIndex, months.length]);

	const compactLabels = layout.monthWidth < (config.ui.labelMin ?? 44);

	const containerWidth = useMemo(() => {
		return '100%';
	}, []);

	const onKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (e.key === 'ArrowLeft') {
				e.preventDefault();
				setFocusedIndex(focusedIndex - 1);
			} else if (e.key === 'ArrowRight') {
				e.preventDefault();
				setFocusedIndex(focusedIndex + 1);
			}
		},
		[focusedIndex, setFocusedIndex]
	);

	return (
		<div className="relative" onKeyDown={onKeyDown} role="group" aria-label="Months">
			{/* Live region for announcing focused month */}
			<div id={liveRegionId} className="sr-only" aria-live="polite">
				{monthIdLabelShort(months[Math.max(0, Math.min(months.length - 1, focusedIndex))] ?? '2025-11')}
			</div>

			{/* Columns container - only the 12 interactive months */}
			<div
				className="relative"
				style={{
					width: typeof containerWidth === 'number' ? `${containerWidth}px` : containerWidth,
				}}
			>
				<div
					className="grid gap-0"
					data-timeline-grid
					style={{
						// Use shared CSS var for perfect alignment with background grid
						gridTemplateColumns: `repeat(${months.length}, var(--col-w, ${layout.monthWidth}px))`,
						width: `calc(var(--col-w, ${layout.monthWidth}px) * ${months.length})`,
					}}
				>
					{/* Bubble layer (non-interactive), above grid but below labels */}
					<div
						className="pointer-events-none"
						style={{
							position: 'absolute',
							inset: 0,
							zIndex: 5,
						}}
					>
						{/* Regular period until role lapse */}
						{outplacementStartIndex > 0 && (
							<PeriodBubble span={{ startIndex: 0, endIndexInclusive: outplacementStartIndex - 1 }} variant="regular" />
						)}
						{/* Outplacement bubble */}
						{outplacementStartIndex >= 0 && outplacementEndIndex >= outplacementStartIndex && (
							<PeriodBubble span={{ startIndex: outplacementStartIndex, endIndexInclusive: outplacementEndIndex }} variant="outplacement" label="Outplacement" />
						)}
					</div>

					{/* Milestone markers layer - above bubbles, below future handles */}
					<div
						className="pointer-events-none"
						style={{
							position: 'absolute',
							inset: 0,
							zIndex: 15,
						}}
					>
						<Milestone label="RFA Announcement" month="Nov" variant="soft" monthIndex={0} />
						{outplacementStartIndex >= 0 && <Milestone label="Role Lapse" month="Jul" variant="medium" monthIndex={outplacementStartIndex} />}
						<Milestone 
							label="End of contract" 
							month="Oct" 
							variant="accent" 
							draggable 
							monthIndex={endContractIndex}
							onMonthChange={setEndContractIndex}
							minMonthIndex={minEndContractIndex}
							maxMonthIndex={maxEndContractIndex}
						/>
					</div>

					{/* Month columns - interactive and labeled */}
					{months.map((id, idx) => {
						const label = monthIdLabelShort(id);
						const isLast = idx === months.length - 1;
						return (
							<div
								key={id}
								className={[
									'relative',
									'border-l',
									'border-grid-bg',
									// The last column gets an end line as well
									idx === months.length - 1 ? 'border-r' : '',
									// focus outline disabled per spec
								].join(' ')}
							>
								<div
									tabIndex={-1}
									aria-label={label}
									className="absolute inset-x-0 top-0 z-10"
								>
									{/* Hide the label for the last visible month, keep the column itself */}
									{!isLast && <MonthLabel label={label} compact={compactLabels} />}
								</div>
								{/* Column body - extends to fill available space */}
								<div className="min-h-[200px]" />
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

export default MonthColumns;


