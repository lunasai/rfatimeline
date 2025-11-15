import { useState, useEffect, useCallback } from 'react';
import type { UserMilestoneData } from '../components/UserMilestone';
import { getColorForIndex } from '../components/UserMilestone';
import type { MonthId } from '../lib/months';

const STORAGE_KEY = 'rfa-user-milestones';

export function useUserMilestones() {
	const [milestones, setMilestones] = useState<UserMilestoneData[]>(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				return JSON.parse(stored);
			}
		} catch {
			// Ignore parse errors
		}
		return [];
	});

	// Persist to localStorage whenever milestones change
	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(milestones));
		} catch {
			// Ignore storage errors
		}
	}, [milestones]);

	const addMilestone = useCallback((monthIndex: number, monthId: MonthId) => {
		const id = `milestone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const colorIndex = milestones.length;
		
		// Find the next available lane (0, 1, 2...)
		// Get all existing lane indices and find the first gap, or use the highest + 1
		setMilestones((prev) => {
			const existingLanes = prev.map(m => m.laneIndex ?? 0).sort((a, b) => a - b);
			let nextLane = 0;
			for (let i = 0; i < existingLanes.length; i++) {
				if (existingLanes[i] === nextLane) {
					nextLane++;
				} else {
					break;
				}
			}
			
			const newMilestone: UserMilestoneData = {
				id,
				startMonthIndex: monthIndex,
				endMonthIndex: monthIndex, // Start as 1-month span
				startMonthId: monthId,
				endMonthId: monthId,
				label: '',
				color: getColorForIndex(colorIndex),
				laneIndex: nextLane,
			};
			return [...prev, newMilestone];
		});
		return id; // Return the ID so we can start editing immediately
	}, [milestones.length]);

	const updateMilestoneLabel = useCallback((id: string, label: string) => {
		setMilestones((prev) =>
			prev.map((m) => (m.id === id ? { ...m, label } : m))
		);
	}, []);

	const updateMilestoneEndMonth = useCallback((id: string, endMonthIndex: number, endMonthId: MonthId) => {
		setMilestones((prev) =>
			prev.map((m) => {
				if (m.id === id) {
					// Ensure endMonthIndex >= startMonthIndex
					const finalEndIndex = Math.max(m.startMonthIndex, endMonthIndex);
					return { ...m, endMonthIndex: finalEndIndex, endMonthId };
				}
				return m;
			})
		);
	}, []);

	const deleteMilestone = useCallback((id: string) => {
		setMilestones((prev) => prev.filter((m) => m.id !== id));
	}, []);

	// Update month indices when the timeline changes (e.g., role lapse changes)
	// Also ensure all milestones have laneIndex (migration for old data)
	const syncMilestonesWithMonths = useCallback((months: MonthId[]) => {
		setMilestones((prev) => {
			// First, ensure all milestones have laneIndex (migration)
			let milestonesWithLanes = prev.map((m, index) => {
				if (m.laneIndex === undefined) {
					return { ...m, laneIndex: index };
				}
				return m;
			});
			
			// Then sync with months
			return milestonesWithLanes
				.map((m) => {
					const newStartIndex = months.indexOf(m.startMonthId);
					const newEndIndex = months.indexOf(m.endMonthId);
					// If either month is outside visible range, remove the milestone
					if (newStartIndex === -1 || newEndIndex === -1) {
						return null;
					}
					return {
						...m,
						startMonthIndex: newStartIndex,
						endMonthIndex: Math.max(newStartIndex, newEndIndex), // Ensure valid range
					};
				})
				.filter((m): m is UserMilestoneData => m !== null);
		});
	}, []);

	return {
		milestones,
		addMilestone,
		updateMilestoneLabel,
		updateMilestoneEndMonth,
		deleteMilestone,
		syncMilestonesWithMonths,
	};
}

