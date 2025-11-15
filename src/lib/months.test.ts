import { describe, expect, it } from 'vitest';
import { config, LABELS } from '../config';
import type { Layout } from './layout';
import { clampIndex, getMonthIndex, indexToX, xToIndex, addMonths, diffInMonths, ageAtMonth, yearsOfServiceAtMonth, recomputeScheme, monthNameYearToMonthId } from './months';

const baseLayout: Layout = {
	viewportWidth: 1200,
	monthWidth: 100,
	offsetX: 0,
	scrollX: 0,
	monthCount: 12,
	minMonthWidth: config.ui.minMonthColWidth,
};

describe('months helpers', () => {
	it('getMonthIndex maps labels case-insensitively', () => {
		expect(getMonthIndex(LABELS[0])).toBe(0);
		expect(getMonthIndex(LABELS[5].toLowerCase())).toBe(5);
	});

	it('MonthId math works', () => {
		const start = '2025-11';
		expect(addMonths(start, 1)).toBe('2025-12');
		expect(addMonths(start, 2)).toBe('2026-01');
		expect(diffInMonths('2025-11', '2025-11')).toBe(0);
		expect(diffInMonths('2025-11', '2026-11')).toBe(12);
	});

	it('Age/service at month compute correctly', () => {
		// Birthday: 06 / 11 / 1992 → at Nov 2025 age 33
		expect(ageAtMonth('06 / 11 / 1992', '2025-11')).toBe(33);
		// Start: 06 / 2020 → at Nov 2025, 5 years
		expect(yearsOfServiceAtMonth('06 / 2020', '2025-11')).toBe(5);
	});

	it('Scheme derivation returns correct endpoints', () => {
		const role = monthNameYearToMonthId('Jul', '2026')!;
		const scheme = recomputeScheme({
			birthday: '06 / 11 / 1992',
			startEmployment: '06 / 2020',
			roleLapse: role,
		});
		expect(scheme.outplacementStart).toBe('2026-07');
		expect(scheme.outplacementEnd).toBe('2026-10'); // 4 months
		expect(scheme.lastLeaveMonth).toBe('2026-11');
	});

	it('clampIndex clamps correctly', () => {
		expect(clampIndex(-5)).toBe(0);
		expect(clampIndex(0)).toBe(0);
		expect(clampIndex(11)).toBe(11);
		expect(clampIndex(99)).toBe(11);
	});

	it('indexToX/xToIndex are inverses (no scroll)', () => {
		for (let i = 0; i < 12; i++) {
			const x = indexToX(i, baseLayout);
			expect(xToIndex(x, baseLayout)).toBe(i);
		}
	});

	it('xToIndex snaps to nearest', () => {
		// halfway between 2 and 3 -> 2 should round to 2
		expect(xToIndex(249, baseLayout)).toBe(2);
		// at 250 -> 2.5 -> rounds to 3
		expect(xToIndex(250, baseLayout)).toBe(3);
	});

	it('supports scrollX', () => {
		const scrolled: Layout = { ...baseLayout, scrollX: 150 };
		expect(indexToX(2, scrolled)).toBe(50);
		expect(xToIndex(50, scrolled)).toBe(2);
	});
});


