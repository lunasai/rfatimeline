import { useCallback, useEffect, useId, useMemo, useState, useRef } from 'react';
import { config } from '../config';
import { useTimelineLayout } from '../context/TimelineLayoutContext';
import MonthLabel from './MonthLabel';
import PeriodBubble from './PeriodBubble';
import Milestone from './Milestone';
import { UserMilestone } from './UserMilestone';
import { UserMilestonesLegend } from './UserMilestonesLegend';
import { useUserMilestones } from '../hooks/useUserMilestones';
import { monthRange, diffInMonths, monthIdLabelShort } from '../lib/months';
import type { MonthId } from '../lib/months';

export function MonthColumns() {
	const { layout, focusedIndex, setFocusedIndex } = useTimelineLayout();
	const liveRegionId = useId();
	const [_, setInputsVersion] = useState(0);
	const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
	const timelineClickAreaRef = useRef<HTMLDivElement>(null);
	
	// User milestones management
	const {
		milestones: userMilestones,
		addMilestone,
		updateMilestoneLabel,
		updateMilestoneEndMonth,
		deleteMilestone,
		syncMilestonesWithMonths,
	} = useUserMilestones();
	
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

	// Sync user milestones when months change
	useEffect(() => {
		syncMilestonesWithMonths(months);
	}, [months, syncMilestonesWithMonths]);

	// Handle clicks on the timeline band to add milestones
	const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		// Only handle clicks on the timeline band itself, not on existing milestones or official markers
		const target = e.target as HTMLElement;
		if (target.closest('[data-user-milestone]') || target.closest('[data-official-milestone]')) {
			return;
		}

		// Check if click is within the timeline band area (the white/soft block)
		const rect = e.currentTarget.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const clickY = e.clientY - rect.top;

		// Only handle clicks in the timeline bubble area (bubble top: 48px, height: 90px)
		const bubbleTop = 48;
		const bubbleHeight = 90;
		// Allow clicks within the bubble area with some tolerance
		if (clickY < bubbleTop - 10 || clickY > bubbleTop + bubbleHeight + 10) {
			return;
		}

		// Calculate which month column was clicked
		const colWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--col-w')) || layout.monthWidth;
		if (colWidth <= 0) return;

		const clickedIndex = Math.round(clickX / colWidth);
		if (clickedIndex >= 0 && clickedIndex < months.length) {
			const monthId = months[clickedIndex];
			// Check if there's already a milestone at this month - if so, allow multiple
			const newId = addMilestone(clickedIndex, monthId);
			setEditingMilestoneId(newId);
		}
		e.stopPropagation();
	}, [months, layout.monthWidth, addMilestone]);

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
						data-official-milestone
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

					{/* User milestones layer */}
					<div
						className="pointer-events-none"
						style={{
							position: 'absolute',
							inset: 0,
							zIndex: 20,
						}}
						data-user-milestone
					>
						{userMilestones.map((milestone) => (
							<UserMilestone
								key={milestone.id}
								milestone={milestone}
								isEditing={editingMilestoneId === milestone.id}
								minMonthIndex={0}
								maxMonthIndex={months.length - 1}
								months={months}
								onLabelChange={updateMilestoneLabel}
								onEditStart={setEditingMilestoneId}
								onEditEnd={() => setEditingMilestoneId(null)}
								onDelete={deleteMilestone}
								onEndMonthChange={updateMilestoneEndMonth}
							/>
						))}
					</div>

					{/* Clickable timeline band for adding milestones */}
					<div
						ref={timelineClickAreaRef}
						onClick={handleTimelineClick}
						onMouseEnter={(e) => {
							e.currentTarget.style.cursor = 'pointer';
						}}
						style={{
							position: 'absolute',
							left: 0,
							right: 0,
							top: '38px', // Start a bit above bubble (bubble starts at 48px)
							height: '110px', // Cover the bubble area (90px) plus some tolerance
							zIndex: 10,
							cursor: 'pointer',
							pointerEvents: 'auto',
						}}
						aria-label="Click to add a personal milestone"
					/>

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

			{/* User milestones legend */}
			<UserMilestonesLegend
				milestones={userMilestones}
				onDelete={deleteMilestone}
			/>
		</div>
	);
}

export default MonthColumns;


