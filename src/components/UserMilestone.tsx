import { useState, useRef, useEffect, useCallback } from 'react';
import type { MonthId } from '../lib/months';

export type UserMilestoneData = {
	id: string;
	startMonthIndex: number;
	endMonthIndex: number; // >= startMonthIndex
	startMonthId: MonthId;
	endMonthId: MonthId;
	label: string;
	color: string;
	laneIndex: number; // Vertical lane position (0, 1, 2...)
};

type UserMilestoneProps = {
	milestone: UserMilestoneData;
	isEditing: boolean;
	minMonthIndex: number;
	maxMonthIndex: number;
	months: MonthId[]; // Array of month IDs for calculating endMonthId
	onLabelChange: (id: string, label: string) => void;
	onEditStart: (id: string) => void;
	onEditEnd: () => void;
	onDelete: (id: string) => void;
	onEndMonthChange: (id: string, endMonthIndex: number, endMonthId: MonthId) => void;
};

const COLORS = ['#0009FF', '#00A8A8', '#9B59B6', '#FF6B35']; // blue, teal, purple, orange

export function UserMilestone({
	milestone,
	isEditing,
	maxMonthIndex,
	months,
	onLabelChange,
	onEditStart,
	onEditEnd,
	onDelete,
	onEndMonthChange,
}: UserMilestoneProps) {
	const [hovered, setHovered] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const handleRef = useRef<HTMLDivElement>(null);
	const [tempLabel, setTempLabel] = useState(milestone.label);
	const startXRef = useRef(0);
	const startEndIndexRef = useRef(milestone.endMonthIndex);
	const dragOffsetRef = useRef(0); // Track drag offset in ref for closure access

	// Reset tempLabel and focus input when editing starts
	useEffect(() => {
		if (isEditing) {
			setTempLabel(milestone.label);
			if (inputRef.current) {
				inputRef.current.focus();
				inputRef.current.select();
			}
		}
	}, [isEditing, milestone.label]);

	// Update startEndIndexRef when endMonthIndex changes externally
	useEffect(() => {
		startEndIndexRef.current = milestone.endMonthIndex;
	}, [milestone.endMonthIndex]);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (tempLabel.trim()) {
				onLabelChange(milestone.id, tempLabel.trim());
			} else {
				onDelete(milestone.id);
			}
			onEditEnd();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			setTempLabel(milestone.label);
			onEditEnd();
		}
	};

	const handleBlur = () => {
		if (tempLabel.trim()) {
			onLabelChange(milestone.id, tempLabel.trim());
		} else {
			onDelete(milestone.id);
		}
		onEditEnd();
	};

	// Drag handler for the right handle
	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
		startXRef.current = e.clientX;
		startEndIndexRef.current = milestone.endMonthIndex;
		dragOffsetRef.current = 0;
		setDragOffset(0);

		const handleMouseMove = (e: MouseEvent) => {
			const deltaX = e.clientX - startXRef.current;
			const colWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--col-w')) || 62;
			if (colWidth > 0) {
				const deltaMonths = deltaX / colWidth;
				dragOffsetRef.current = deltaMonths;
				setDragOffset(deltaMonths); // Update state for visual feedback
			}
		};

		const handleMouseUp = () => {
			setIsDragging(false);
			// Snap to nearest month boundary, but clamp to valid range
			// Use the ref value which always has the latest drag offset
			const currentOffset = dragOffsetRef.current;
			const targetIndex = startEndIndexRef.current + currentOffset;
			const snappedIndex = Math.round(targetIndex);
			// Ensure minimum length of 1 month and within bounds
			const minEnd = milestone.startMonthIndex; // Can't be shorter than 1 month
			const maxEnd = maxMonthIndex;
			const finalIndex = Math.max(minEnd, Math.min(maxEnd, snappedIndex));
			
			// Calculate endMonthId from the months array
			const endMonthId = months[finalIndex] || milestone.endMonthId;
			onEndMonthChange(milestone.id, finalIndex, endMonthId);
			dragOffsetRef.current = 0;
			setDragOffset(0);
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};

		document.addEventListener('mousemove', handleMouseMove, { passive: true });
		document.addEventListener('mouseup', handleMouseUp, { passive: true });
	}, [milestone, maxMonthIndex, months, onEndMonthChange]);

	// Calculate span width and position (update during drag)
	const currentEndIndex = isDragging 
		? Math.round(milestone.endMonthIndex + dragOffset)
		: milestone.endMonthIndex;
	const clampedEndIndex = Math.max(milestone.startMonthIndex, Math.min(maxMonthIndex, currentEndIndex));
	const displaySpanMonths = clampedEndIndex - milestone.startMonthIndex + 1;

	// Timeline bubble metrics for lane positioning
	const bubbleTop = 48;
	const bubbleHeight = 90;
	
	// Lane-based positioning: each lane is 16px tall with 4px spacing
	const laneHeight = 16; // Height per lane (includes spacing)
	const barHeight = 7; // Bar height (6-8px range)
	
	// Calculate Y position based on laneIndex
	// Center the lane vertically within the bubble, starting from the top
	const laneIndex = milestone.laneIndex ?? 0; // Fallback for migration
	const laneY = bubbleTop + (laneIndex * laneHeight) + (laneHeight - barHeight) / 2;
	
	// Ensure lanes don't go outside the bubble
	const clampedLaneY = Math.min(laneY, bubbleTop + bubbleHeight - barHeight - 4);

	// Format date range for display
	const startDate = new Date(milestone.startMonthId + '-01');
	const endDate = new Date(milestone.endMonthId + '-01');
	const startMonthName = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	const endMonthName = endDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	const dateRange = milestone.startMonthId === milestone.endMonthId
		? startMonthName
		: `${startMonthName}–${endMonthName}`;

	return (
		<div
			className="absolute"
			style={{
				left: `calc(var(--col-w) * ${milestone.startMonthIndex})`,
				top: `${clampedLaneY}px`, // Lane-based Y position
				width: `calc(var(--col-w) * ${displaySpanMonths})`,
				height: `${barHeight}px`, // Thin bar (7px)
				zIndex: 20,
				pointerEvents: 'auto',
			}}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => {
				if (!isDragging) {
					setHovered(false);
				}
			}}
		>
			{/* Horizontal bar background */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 0,
					width: '100%',
					height: '100%',
					backgroundColor: milestone.color,
					opacity: 0.3,
					borderRadius: '4px',
					pointerEvents: 'none',
				}}
			/>

			{/* Dot at the start - centered on top of bar */}
			<div
				style={{
					position: 'absolute',
					left: '0px',
					top: '50%',
					transform: 'translate(-50%, -50%)',
					width: '10px',
					height: '10px',
					borderRadius: '50%',
					backgroundColor: milestone.color,
					cursor: 'pointer',
					boxShadow: hovered ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
					transition: isDragging ? 'none' : 'box-shadow 0.15s ease-out',
					zIndex: 2,
				}}
				onClick={(e) => {
					e.stopPropagation();
					if (!isEditing && !isDragging) {
						onEditStart(milestone.id);
					}
				}}
				aria-label={`${milestone.label} — ${dateRange}`}
			/>

			{/* Draggable right handle */}
			{(hovered || isDragging) && (
				<div
					ref={handleRef}
					style={{
						position: 'absolute',
						right: '-4px',
						top: '50%',
						transform: 'translateY(-50%)',
						width: '8px',
						height: `${Math.max(barHeight, 16)}px`, // At least as tall as bar, or 16px
						backgroundColor: milestone.color,
						borderRadius: '2px',
						cursor: isDragging ? 'grabbing' : 'ew-resize',
						boxShadow: isDragging
							? '0 4px 8px rgba(0,0,0,0.2)'
							: '0 2px 4px rgba(0,0,0,0.15)',
						transition: isDragging ? 'none' : 'box-shadow 0.15s ease-out',
						zIndex: 3,
					}}
					onMouseDown={handleMouseDown}
					aria-label="Drag to extend or shrink plan duration"
					role="button"
					tabIndex={-1}
				/>
			)}

			{/* Tooltip on hover */}
			{hovered && !isEditing && !isDragging && (
				<div
					style={{
						position: 'absolute',
						left: '50%',
						top: 'calc(100% + 8px)',
						transform: 'translateX(-50%)',
						padding: '4px 8px',
						backgroundColor: '#1d1d1d',
						color: '#ffffff',
						fontSize: '11px',
						fontFamily: 'IBM Plex Mono, ui-monospace, SFMono-Regular, monospace',
						borderRadius: '4px',
						whiteSpace: 'nowrap',
						pointerEvents: 'none',
						zIndex: 21,
					}}
				>
					{dateRange} — {milestone.label}
				</div>
			)}

			{/* Inline input when editing */}
			{isEditing && (
				<div
					style={{
						position: 'absolute',
						left: '50%',
						top: 'calc(100% + 8px)',
						transform: 'translateX(-50%)',
						zIndex: 22,
					}}
				>
					<input
						ref={inputRef}
						type="text"
						value={tempLabel}
						onChange={(e) => setTempLabel(e.target.value)}
						onKeyDown={handleKeyDown}
						onBlur={handleBlur}
						placeholder="Add a note…"
						style={{
							padding: '4px 8px',
							fontSize: '11px',
							fontFamily: 'IBM Plex Mono, ui-monospace, SFMono-Regular, monospace',
							border: '1px solid #0009FF',
							borderRadius: '4px',
							backgroundColor: '#ffffff',
							color: '#1d1d1d',
							outline: 'none',
							minWidth: '120px',
						}}
					/>
				</div>
			)}
		</div>
	);
}

export function getColorForIndex(index: number): string {
	return COLORS[index % COLORS.length];
}
