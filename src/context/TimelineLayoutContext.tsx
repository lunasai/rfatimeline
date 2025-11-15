import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren, type RefObject } from 'react';
import { config, MONTH_COUNT } from '../config';
import type { Layout } from '../lib/layout';
import { indexToX as coreIndexToX, xToIndex as coreXToIndex, clampIndex } from '../lib/months';
import { diffInMonths } from '../lib/months';
import type { MonthId } from '../lib/months';

type TimelineLayoutContextValue = {
	layout: Layout;
	containerRef: RefObject<HTMLDivElement | null>;
	isOverflowing: boolean;
	focusedIndex: number;
	setFocusedIndex: (index: number) => void;
	indexToX: (index: number) => number;
	xToIndex: (x: number) => number;
};

const defaultLayout: Layout = {
	viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
	monthWidth: config.ui.minMonthColWidth,
	offsetX: 0,
	scrollX: 0,
	monthCount: MONTH_COUNT,
	minMonthWidth: config.ui.minMonthColWidth,
};

const TimelineLayoutContext = createContext<TimelineLayoutContextValue>({
	layout: defaultLayout,
	containerRef: { current: null },
	isOverflowing: false,
	focusedIndex: 0,
	setFocusedIndex: () => {},
	indexToX: () => 0,
	xToIndex: () => 0,
});

export function useTimelineLayout(): TimelineLayoutContextValue {
	return useContext(TimelineLayoutContext);
}

export function TimelineLayoutProvider({ children }: PropsWithChildren) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [layout, setLayout] = useState<Layout>(defaultLayout);
	const [isOverflowing, setIsOverflowing] = useState(false);
	const [focusedIndex, setFocusedIndex] = useState(0);

	// Recompute sizes when container size, viewport, or inputs change
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		let animationFrameId = 0;
		const compute = () => {
			const rect = container.getBoundingClientRect();
			const viewportWidth = window.innerWidth;
			// Determine months in range based on derived scheme (from localStorage)
			const STORAGE_KEY = 'rfa-timeline-inputs';
			const VISIBLE_START: MonthId = '2025-11';
			const CAP_END: MonthId = '2027-06';
			const BASELINE_END: MonthId = '2026-10'; // Oct 2026
			let lastLeave: MonthId = BASELINE_END;
			let outplacementEnd: MonthId | null = null;
			try {
				const stored = localStorage.getItem(STORAGE_KEY);
				if (stored) {
					const obj = JSON.parse(stored);
					if (obj?.scheme?.lastLeaveMonth) {
						lastLeave = obj.scheme.lastLeaveMonth as MonthId;
					}
					if (obj?.scheme?.outplacementEnd) {
						outplacementEnd = obj.scheme.outplacementEnd as MonthId;
					}
				}
			} catch {}
			// Visible range end: show one extra month after outplacement when available (lastLeaveMonth)
			const maxEnd = (a: MonthId, b: MonthId) => (diffInMonths(a, b) >= 0 ? b : a);
			const minEnd = (a: MonthId, b: MonthId) => (diffInMonths(a, b) <= 0 ? b : a);
			const baseEnd = lastLeave ?? outplacementEnd ?? BASELINE_END;
			const unclampedEnd = maxEnd(BASELINE_END, baseEnd);
			const visibleEnd = minEnd(CAP_END, unclampedEnd);
			const monthsInRange = diffInMonths(VISIBLE_START, visibleEnd) + 1;

			// Dynamic column width: fit all months in the fixed container width
			// Always ensure columns stay within the available width.
			const raw = Math.floor(rect.width / monthsInRange);
			const maxCol = config.ui.maxCol ?? 96;
			let chosen = Math.min(raw, maxCol);
			if (!Number.isFinite(chosen) || chosen <= 0) {
				chosen = config.ui.minCol ?? 56;
			}

			const monthWidth = chosen;
			const scrollX = container.scrollLeft;
			const offsetX = 0; // columns are laid out starting at the left edge of the scroll container
			setLayout({
				viewportWidth,
				monthWidth,
				offsetX,
				scrollX,
				monthCount: monthsInRange,
				minMonthWidth: config.ui.minMonthColWidth,
			});
			// No separate horizontal scroll panel in this mode
			setIsOverflowing(false);
		};

		const ro = new ResizeObserver(() => {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = requestAnimationFrame(compute);
		});
		ro.observe(container);

		const onScroll = () => {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = requestAnimationFrame(() => {
				setLayout((prev) => ({ ...prev, scrollX: container.scrollLeft }));
			});
		};
		container.addEventListener('scroll', onScroll, { passive: true });

		const onWindow = () => {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = requestAnimationFrame(compute);
		};
		window.addEventListener('resize', onWindow);

		// Recompute when inputs change (broadcast from InputPanel)
		const onInputsChanged = () => {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = requestAnimationFrame(compute);
		};
		window.addEventListener('rfa-inputs-changed', onInputsChanged);

		// initial compute
		compute();

		return () => {
			ro.disconnect();
			container.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onWindow);
			window.removeEventListener('rfa-inputs-changed', onInputsChanged);
			cancelAnimationFrame(animationFrameId);
		};
	}, []);

	const indexToX = useCallback((index: number) => coreIndexToX(index, layout), [layout]);
	const xToIndex = useCallback((x: number) => coreXToIndex(x, layout), [layout]);

	const value = useMemo<TimelineLayoutContextValue>(
		() => ({
			layout,
			containerRef,
			isOverflowing,
			focusedIndex,
			setFocusedIndex: (i: number) => setFocusedIndex(clampIndex(i)),
			indexToX,
			xToIndex,
		}),
		[layout, isOverflowing, focusedIndex, indexToX, xToIndex]
	);

	return <TimelineLayoutContext.Provider value={value}>{children}</TimelineLayoutContext.Provider>;
}


