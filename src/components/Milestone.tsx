import { useCallback, useEffect, useRef, useState } from 'react';
import { LABELS } from '../config';
import BenefitBox from './BenefitBox';
import { getBenefitsForIndex } from '../lib/benefits';

type MilestoneProps = {
	label: string;
	month: string;
	variant: 'soft' | 'medium' | 'accent';
	draggable?: boolean;
	monthIndex?: number; // Optional override for positioning (e.g., for months outside the 12-month window)
	onMonthChange?: (newIndex: number) => void;
	minMonthIndex?: number;
	maxMonthIndex?: number;
};

export function Milestone({ 
	label, 
	month, 
	variant, 
	draggable = false, 
	monthIndex: overrideIndex,
	onMonthChange,
	minMonthIndex = 0,
	maxMonthIndex = 15,
}: MilestoneProps) {
	const monthIndex = overrideIndex !== undefined
		? overrideIndex
		: LABELS.findIndex((m) => m.toLowerCase() === month.toLowerCase());
	if (monthIndex === -1 && overrideIndex === undefined) return null;

	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState(0);
	const handleRef = useRef<HTMLDivElement>(null);
	const startXRef = useRef(0);
	const startIndexRef = useRef(monthIndex);
	const isDraggingRef = useRef(false);
	const dragOffsetRef = useRef(0);

	// Variant-based styling matching Figma design
	const variantStyles = {
		soft: {
			capsule: '#dedeff', // light lavender
			labelBg: '#dedeff',
			labelText: '#1d1d1d',
			line: '#dedeff',
			width: '18px',
			borderRadius: '12px',
		},
		medium: {
			capsule: '#dedeff', // medium lavender (same as soft per design)
			labelBg: '#dedeff',
			labelText: '#1d1d1d',
			line: '#dedeff',
			width: '18px',
			borderRadius: '12px',
		},
		accent: {
			capsule: '#0009FF', // bright accent blue
			labelBg: '#0009FF',
			labelText: '#ffffff',
			line: '#0009FF',
			width: '26px',
			borderRadius: '20px',
		},
	};

	const styles = variantStyles[variant];
	const bubbleHeight = 90; // Match bubble height exactly
	// New design: handle is a vertical pill above the label
	const handleWidthPx = 20; // Handle width (vertical pill)
	const handleHeightPx = 40; // Handle height (vertical pill)
	const handleToLabelGapPx = 10; // Gap between handle and label (8-12px)
	const labelTopPx = bubbleHeight + 8; // label's top from marker root
	const labelHeightPx = 26; // approximate label height (padding + text)
	const handleTopPx = labelTopPx - handleHeightPx - handleToLabelGapPx; // Handle positioned above label
	const lineGapPx = 10; // Gap between label and line start (8-12px)
	const lineToBenefitGapPx = 10; // Gap between line end and first benefit (8-12px)
	const benefitOriginTopPx = labelTopPx + labelHeightPx + lineGapPx + lineToBenefitGapPx; // benefit box top from marker root

	// Calculate current position (month index + drag offset in months)
	const currentMonthIndex = Math.round(monthIndex + dragOffset);
	const clampedIndex = Math.max(minMonthIndex, Math.min(maxMonthIndex, currentMonthIndex));

	// Get month label for display
	const getMonthLabel = (index: number): string => {
		if (index < LABELS.length) {
			// Map short labels to full English month names for display
			const fullNames = ['November', 'December', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October'];
			return fullNames[index] ?? '';
		}
		// For months beyond the visible range, calculate the next year
		const nextYearIndex = index - LABELS.length;
		const nextYearFull = ['November', 'December', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October'];
		return nextYearFull[nextYearIndex % 12] || 'October';
	};

	const activeBenefits = getBenefitsForIndex(clampedIndex).slice(0, 4);

	const displayLabel = draggable && variant === 'accent' 
		? `${label} – ${getMonthLabel(clampedIndex)}`
		: label;

	// Drag handlers - work without focus, allow free dragging, snap on release
	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		if (!draggable || !onMonthChange) return;
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
		isDraggingRef.current = true;
		startXRef.current = e.clientX;
		startIndexRef.current = monthIndex;
		setDragOffset(0);
		dragOffsetRef.current = 0;

		const handleMouseMove = (e: MouseEvent) => {
			if (!isDraggingRef.current) return;
			const deltaX = e.clientX - startXRef.current;
			const colWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--col-w')) || 62;
			if (colWidth > 0) {
				const deltaMonths = deltaX / colWidth;
				dragOffsetRef.current = deltaMonths;
				setDragOffset(deltaMonths);
			}
		};

		const handleMouseUp = () => {
			isDraggingRef.current = false;
			setIsDragging(false);
			// Snap to nearest month boundary, but clamp to valid range
			const targetIndex = startIndexRef.current + dragOffsetRef.current;
			const snappedIndex = Math.round(targetIndex);
			const finalIndex = Math.max(minMonthIndex, Math.min(maxMonthIndex, snappedIndex));
			onMonthChange(finalIndex);
			setDragOffset(0);
			dragOffsetRef.current = 0;
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};

		document.addEventListener('mousemove', handleMouseMove, { passive: true });
		document.addEventListener('mouseup', handleMouseUp, { passive: true });
	}, [draggable, onMonthChange, monthIndex, minMonthIndex, maxMonthIndex]);

	// Keyboard handlers
	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (!draggable || !onMonthChange) return;
		
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			const newIndex = Math.max(minMonthIndex, monthIndex - 1);
			onMonthChange(newIndex);
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			const newIndex = Math.min(maxMonthIndex, monthIndex + 1);
			onMonthChange(newIndex);
		}
	}, [draggable, onMonthChange, monthIndex, minMonthIndex, maxMonthIndex]);

	// Update startIndexRef when monthIndex changes externally
	useEffect(() => {
		startIndexRef.current = monthIndex;
	}, [monthIndex]);

	return (
		<div
			className="absolute"
			style={{
				left: `calc(var(--col-w) * ${isDragging ? monthIndex + dragOffset : clampedIndex})`,
				top: '48px', // Align with bubble top
				zIndex: 15, // Above bubbles, below future handles
				transition: isDragging ? 'none' : 'left 0.1s ease-out', // Smooth snap when not dragging
				pointerEvents: 'none', // Parent doesn't capture events, children do
			}}
		>
			{/* Tall vertical line for End of Contract (accent variant) - extends above bubble */}
			{draggable && variant === 'accent' && (
				<div
					style={{
						position: 'absolute',
						left: '50%',
						top: '-381px', // Extends above based on Figma positioning
						transform: 'translateX(-50%)',
						width: '4px',
						height: '381px',
						backgroundColor: styles.line,
						pointerEvents: 'none', // Line itself doesn't capture events, parent does
					}}
				/>
			)}

			{/* Vertical capsule - matches bubble height, aligned to month boundary */}
			<div
				style={{
					position: 'absolute',
					left: '50%',
					top: 0,
					transform: 'translateX(-50%)',
					width: styles.width,
					height: `${bubbleHeight}px`,
					backgroundColor: styles.capsule,
					borderRadius: styles.borderRadius,
					boxShadow: '0px 8px 8px 0px rgba(0, 0, 0, 0.04)',
					pointerEvents: 'none', // Capsule doesn't capture events, parent does
				}}
			/>

			{/* Removed long vertical line below bubble; connector appears only below label */}

			{/* Pill label - centered below marker, draggable for End of Contract */}
			<div
				style={{
					position: 'absolute',
					left: '50%',
					top: `${bubbleHeight + 8}px`, // Consistent spacing below bubble
					transform: 'translateX(-50%)',
					padding: '3px 8px',
					backgroundColor: styles.labelBg,
					borderRadius: '9px',
					fontSize: '12px',
					fontWeight: 400,
					fontFamily: 'IBM Plex Mono, ui-monospace, SFMono-Regular, monospace',
					color: styles.labelText,
					whiteSpace: 'nowrap',
					pointerEvents: draggable ? 'auto' : 'none', // Label is draggable for End of Contract
					cursor: draggable ? (isDragging ? 'grabbing' : 'grab') : 'default',
					userSelect: 'none',
				}}
				onMouseDown={draggable ? handleMouseDown : undefined}
				onKeyDown={draggable ? handleKeyDown : undefined}
				onFocus={draggable ? (e) => {
					e.currentTarget.style.outline = '2px solid rgba(0, 9, 255, 0.5)';
					e.currentTarget.style.outlineOffset = '2px';
				} : undefined}
				onBlur={draggable ? (e) => {
					e.currentTarget.style.outline = 'none';
				} : undefined}
				tabIndex={draggable ? 0 : undefined}
				role={draggable ? 'button' : undefined}
				aria-label={draggable ? `Drag to adjust ${label}. Currently at ${getMonthLabel(clampedIndex)}` : undefined}
			>
				{displayLabel}
			</div>

			{/* Draggable handle for End of Contract - vertical pill above label */}
			{draggable && variant === 'accent' && (
				<div
					ref={handleRef}
					style={{
						position: 'absolute',
						left: '50%',
						top: `${handleTopPx}px`,
						transform: 'translateX(-50%)',
						width: `${handleWidthPx}px`,
						height: `${handleHeightPx}px`,
						backgroundColor: '#0000FF', // Solid blue
						borderRadius: '10px', // Rounded vertical pill
						cursor: isDragging ? 'grabbing' : 'grab',
						outline: 'none',
						transition: isDragging ? 'none' : 'box-shadow 0.15s ease-out',
						pointerEvents: 'auto',
						userSelect: 'none',
						boxShadow: isDragging
							? '0 8px 24px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)'
							: 'none',
					}}
					onMouseDown={handleMouseDown}
					aria-label={`Drag handle for ${label}. Currently at ${getMonthLabel(clampedIndex)}`}
					role="button"
					tabIndex={-1}
				/>
			)}

			{/* Benefits box - single combined box below the label */}
			{draggable && variant === 'accent' && activeBenefits.length > 0 && (
				<BenefitBox
					labels={activeBenefits.slice(0, 2)}
					endMonthIndex={clampedIndex}
					style={{
						top: `${benefitOriginTopPx}px`,
					}}
				/>
			)}
		</div>
	);
}

export default Milestone;

