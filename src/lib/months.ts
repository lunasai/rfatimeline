import { LABELS, MONTH_COUNT } from '../config';
import type { Layout } from './layout';

export function getMonthIndex(name: string): number {
	const idx = LABELS.findIndex((label) => label.toLowerCase() === name.toLowerCase());
	return clampIndex(idx === -1 ? 0 : idx);
}

export function clampIndex(i: number): number {
	if (i < 0) return 0;
	if (i > MONTH_COUNT - 1) return MONTH_COUNT - 1;
	return i;
}

export function indexToX(index: number, layout: Layout): number {
	const clamped = clampIndex(index);
	return layout.offsetX + clamped * layout.monthWidth - layout.scrollX;
}

export function xToIndex(x: number, layout: Layout): number {
	const relative = x + layout.scrollX - layout.offsetX;
	const rawIndex = Math.round(relative / layout.monthWidth);
	return clampIndex(rawIndex);
}

// ---------------------------
// MonthId utilities (YYYY-MM)
// ---------------------------
export type MonthId = string; // "YYYY-MM"

export function toMonthId(date: Date): MonthId {
	const y = date.getFullYear();
	const m = date.getMonth() + 1;
	const mm = m < 10 ? `0${m}` : `${m}`;
	return `${y}-${mm}`;
}

export function monthIdToDate(id: MonthId): Date {
	const m = id.match(/^(\d{4})-(\d{2})$/);
	if (!m) return new Date(NaN);
	const year = parseInt(m[1], 10);
	const monthIdx = parseInt(m[2], 10) - 1;
	return new Date(year, monthIdx, 1);
}

export function addMonths(id: MonthId, n: number): MonthId {
	const d = monthIdToDate(id);
	if (isNaN(d.getTime())) return id;
	return toMonthId(new Date(d.getFullYear(), d.getMonth() + n, 1));
}

export function diffInMonths(a: MonthId, b: MonthId): number {
	const da = monthIdToDate(a);
	const db = monthIdToDate(b);
	const ai = da.getFullYear() * 12 + da.getMonth();
	const bi = db.getFullYear() * 12 + db.getMonth();
	return bi - ai;
}

// Parse "MM / YYYY" or "MM YYYY" to MonthId
export function mmYYYYToMonthId(s: string): MonthId | null {
	const m = s.match(/^\s*(\d{2})\s*[\/\s]\s*(\d{4})\s*$/);
	if (!m) return null;
	const mm = parseInt(m[1], 10);
	const yyyy = parseInt(m[2], 10);
	if (mm < 1 || mm > 12) return null;
	const mmStr = mm < 10 ? `0${mm}` : `${mm}`;
	return `${yyyy}-${mmStr}`;
}

// Parse "Jan".."Dec" + "YYYY" to MonthId
export function monthNameYearToMonthId(monthName: string, year: string): MonthId | null {
	const map: Record<string, number> = {
		Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
		Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
		Dez: 11, Fev: 1, Mei: 4,
	};
	const idx = map[monthName];
	const y = parseInt(year, 10);
	if (idx === undefined || isNaN(y)) return null;
	return toMonthId(new Date(y, idx, 1));
}

export function monthIdLabelShort(id: MonthId): string {
	const d = monthIdToDate(id);
	// Map calendar months to our specific lower-case labels where Nov is first in the base window is not necessary here.
	// Use standard short English month names in lower-case.
	const shortStd = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'] as const;
	return shortStd[d.getMonth()];
}

// ---------------------------
// Age and service helpers
// ---------------------------
export function ageAtMonth(birthdayDDMMYYYY: string, at: MonthId): number {
	const m = birthdayDDMMYYYY.match(/^\s*(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})\s*$/);
	if (!m) return 0;
	const day = parseInt(m[1], 10);
	const mon = parseInt(m[2], 10);
	const yr = parseInt(m[3], 10);
	if (mon < 1 || mon > 12) return 0;
	const birth = new Date(yr, mon - 1, Math.min(day, 28));
	const atDate = monthIdToDate(at);
	let years = atDate.getFullYear() - birth.getFullYear();
	const mdiff = atDate.getMonth() - birth.getMonth();
	if (mdiff < 0 || (mdiff === 0 && atDate.getDate() < birth.getDate())) years -= 1;
	return Math.max(0, years);
}

export function yearsOfServiceAtMonth(startMMYYYY: string, at: MonthId): number {
	const m = mmYYYYToMonthId(startMMYYYY);
	if (!m) return 0;
	const months = diffInMonths(m, at);
	return Math.max(Math.floor(months / 12), 0);
}

export function deriveOutplacementMonths(roleLapse: MonthId, birthday: string, startMMYYYY: string): 4 | 6 {
	const age = ageAtMonth(birthday, roleLapse);
	const yos = yearsOfServiceAtMonth(startMMYYYY, roleLapse);
	return (age >= 50 || yos >= 20) ? 6 : 4;
}

export function recomputeScheme(inputs: {
	birthday: string;
	startEmployment: string; // "MM / YYYY"
	roleLapse: MonthId;
}): {
	outplacementMonths: 4 | 6;
	outplacementStart: MonthId;
	outplacementEnd: MonthId;
	lastLeaveMonth: MonthId;
} {
	const n = deriveOutplacementMonths(inputs.roleLapse, inputs.birthday, inputs.startEmployment);
	const start = inputs.roleLapse;
	const end = addMonths(start, n - 1);
	const last = addMonths(start, n);
	return { outplacementMonths: n, outplacementStart: start, outplacementEnd: end, lastLeaveMonth: last };
}

export function monthRange(start: MonthId, endInclusive: MonthId): MonthId[] {
	const out: MonthId[] = [];
	let cur = start;
	while (diffInMonths(cur, endInclusive) >= 0) {
		out.push(cur);
		cur = addMonths(cur, 1);
	}
	return out;
}


