export type CalcInputs = {
	startOfEmployment: string; // "MM / YYYY"
	birthday: string; // "DD / MM / YYYY"
	monthlySalary: number; // yearly salary with holiday allowance included (stored as monthlySalary for backward compatibility)
	endMonthIndex: number; // 0 = Nov 2025
};

const AGE_SEGMENTS = [
	{ startAge: 0, endAge: 35, weight: 0.5 },
	{ startAge: 35, endAge: 45, weight: 1 },
	{ startAge: 45, endAge: 55, weight: 1.5 },
	{ startAge: 55, endAge: null as number | null, weight: 2 },
] as const;

export type BenefitDetails = {
	rawServiceMonths: number;
	rawServiceFullYears: number;
	rawServiceRemainderMonths: number;
	weightedYearsA: number;
	baseSeverance: number;
	isSeveranceCapped: boolean;
	outplacementEntitlementMonths: number;
	outplacementStartDate: Date;
	remainingFullOutplacementMonths: number;
	additionalComp: number;
	totalPayout: number;
};

function clampDay(date: Date) {
	return new Date(date.getFullYear(), date.getMonth(), Math.min(date.getDate(), 28));
}

function addYears(date: Date, years: number) {
	return clampDay(new Date(date.getFullYear() + years, date.getMonth(), date.getDate()));
}

function monthsBetween(start: Date, end: Date) {
	const startMonthIndex = start.getFullYear() * 12 + start.getMonth();
	const endMonthIndex = end.getFullYear() * 12 + end.getMonth();
	let months = endMonthIndex - startMonthIndex;
	if (end.getDate() < start.getDate()) {
		months -= 1;
	}
	return Math.max(0, months);
}

function parseStart(s: string): Date | null {
	const m = s.match(/^\s*(\d{2})\s*\/\s*(\d{4})\s*$/);
	if (!m) return null;
	const month = parseInt(m[1], 10);
	const year = parseInt(m[2], 10);
	if (month < 1 || month > 12) return null;
	return new Date(year, month - 1, 1);
}

function parseBirthday(s: string): Date | null {
	const m = s.match(/^\s*(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})\s*$/);
	if (!m) return null;
	const day = parseInt(m[1], 10);
	const month = parseInt(m[2], 10);
	const year = parseInt(m[3], 10);
	if (month < 1 || month > 12) return null;
	return new Date(year, month - 1, Math.min(day, 28));
}

function toExitDate(idx: number): Date {
	const baseYear = 2025;
	const baseMonth = 10; // Nov (0-based)
	const m = baseMonth + idx;
	const y = baseYear + Math.floor(m / 12);
	const mm = ((m % 12) + 12) % 12;
	return new Date(y, mm, 1);
}

function yearsAt(date: Date, birthDate: Date): number {
	let years = date.getFullYear() - birthDate.getFullYear();
	const m = date.getMonth() - birthDate.getMonth();
	if (m < 0 || (m === 0 && date.getDate() < birthDate.getDate())) years -= 1;
	return years;
}

function computeOutplacementEntitlementMonthsByDates(startDate: Date, birthDate: Date | null, referenceDate: Date): number {
	// Evaluate age and service at the role lapse/reference month, not at exit
	const totalServiceMonths = monthsBetween(startDate, referenceDate);
	const fullServiceYears = Math.floor(totalServiceMonths / 12);
	const ageAtReference = birthDate ? yearsAt(referenceDate, birthDate) : 0;
	return ageAtReference >= 50 || fullServiceYears >= 20 ? 6 : 4;
}

function julyFirstOfYear(year: number): Date {
	return new Date(year, 6, 1); // July = 6
}

export function computeBenefitDetailsByDates(params: {
	employmentStartDate: Date;
	birthDate: Date | null;
	exitDate: Date;
	monthlySalary: number; // yearly salary with 8% holiday allowance included (converted to monthly internally)
	// Optional: override outplacement start; defaults to Jul 1 of exit year
	outplacementStartDate?: Date;
}): BenefitDetails {
	const { employmentStartDate, birthDate, exitDate, monthlySalary: yearlySalary } = params;
	const outplacementStartDate = params.outplacementStartDate ?? julyFirstOfYear(exitDate.getFullYear());
	
	// Convert yearly salary to monthly salary (yearly includes holiday allowance)
	const monthlySalary = yearlySalary / 12;

	// 1) Raw service months and rounding applied AFTER summing segments
	const segments: { weight: number; months: number }[] = [];
	if (birthDate) {
		const maxDate = (a: Date, b: Date) => (a > b ? a : b);
		const minDate = (a: Date, b: Date) => (a < b ? a : b);
		for (const seg of AGE_SEGMENTS) {
			const segStart = maxDate(employmentStartDate, addYears(birthDate, seg.startAge));
			const segEnd = seg.endAge === null ? exitDate : minDate(exitDate, addYears(birthDate, seg.endAge));
			if (segEnd <= segStart) continue;
			const segMonths = monthsBetween(segStart, segEnd);
			if (segMonths > 0) segments.push({ weight: seg.weight, months: segMonths });
			if (seg.endAge === null || segEnd === exitDate) break;
		}
	} else {
		const totalMonths = monthsBetween(employmentStartDate, exitDate);
		if (totalMonths > 0) segments.push({ weight: 0.5, months: totalMonths });
	}

	const rawServiceMonths = segments.reduce((sum, s) => sum + s.months, 0);
	const rawServiceFullYears = Math.floor(rawServiceMonths / 12);
	const rawServiceRemainderMonths = rawServiceMonths % 12;

	// 2) Apply rounding once across all segments: if remainder > 6 months, add 1 year
	let perSegmentFullYears = segments.map((s) => Math.floor(s.months / 12));
	if (rawServiceRemainderMonths > 6) {
		// Find the last segment with any remainder to assign the extra year there
		let lastIdxWithRemainder = -1;
		for (let i = segments.length - 1; i >= 0; i--) {
			if (segments[i].months % 12 !== 0) {
				lastIdxWithRemainder = i;
				break;
			}
		}
		const targetIdx = lastIdxWithRemainder !== -1 ? lastIdxWithRemainder : segments.length - 1;
		if (targetIdx >= 0) {
			perSegmentFullYears[targetIdx] += 1;
		}
	}

	// 3) Weighted years A = sum(full years per segment × weight)
	const weightedYearsA = segments.reduce((sum, seg, idx) => {
		return sum + perSegmentFullYears[idx] * seg.weight;
	}, 0);

	// 4) Base severance (B is monthlySalary as-is; C = 1)
	// monthlySalary already includes 8% holiday allowance, so B = monthlySalary (correct)
	let baseSeverance = Math.round(weightedYearsA * monthlySalary);
	
	// Apply €300,000 cap on severance (excluding additional compensation)
	const SEVERANCE_CAP = 300000;
	const isSeveranceCapped = baseSeverance > SEVERANCE_CAP;
	if (isSeveranceCapped) {
		baseSeverance = SEVERANCE_CAP;
	}

	// 5) Outplacement entitlement and remaining months (evaluate at role lapse start)
	const outplacementEntitlementMonths = computeOutplacementEntitlementMonthsByDates(employmentStartDate, birthDate, outplacementStartDate);
	const monthsElapsedFromOutplacementStart = monthsBetween(outplacementStartDate, exitDate);
	
	// Calculate remaining months: if exit is at or after end of outplacement period, all months are used
	const outplacementEndDate = new Date(outplacementStartDate);
	outplacementEndDate.setMonth(outplacementEndDate.getMonth() + outplacementEntitlementMonths);
	
	// Check if exit is in the last month of outplacement or after
	// If exit month/year matches the last month of outplacement, all months are used
	const lastOutplacementMonth = new Date(outplacementStartDate);
	lastOutplacementMonth.setMonth(lastOutplacementMonth.getMonth() + outplacementEntitlementMonths - 1);
	const isExitInLastMonth = exitDate.getFullYear() === lastOutplacementMonth.getFullYear() && 
	                           exitDate.getMonth() === lastOutplacementMonth.getMonth();
	
	let remainingFullOutplacementMonths: number;
	if (exitDate >= outplacementEndDate || isExitInLastMonth) {
		remainingFullOutplacementMonths = 0;
	} else {
		remainingFullOutplacementMonths = Math.max(0, outplacementEntitlementMonths - monthsElapsedFromOutplacementStart);
	}
	
	// SBR rule: AdditionalComp = 0.5 × baseSalary × remainingMonths
	// Input includes holiday, so: baseSalary = monthlySalary / 1.08
	const baseSalary = monthlySalary / 1.08;
	const additionalComp = Math.round(0.5 * baseSalary * remainingFullOutplacementMonths);

	// 6) Total payout
	const totalPayout = baseSeverance + additionalComp;

	return {
		rawServiceMonths,
		rawServiceFullYears,
		rawServiceRemainderMonths,
		weightedYearsA,
		baseSeverance,
		isSeveranceCapped,
		outplacementEntitlementMonths,
		outplacementStartDate,
		remainingFullOutplacementMonths,
		additionalComp,
		totalPayout,
	};
}

export function computeBenefitEstimate({
	startOfEmployment,
	birthday,
	monthlySalary, // This is actually yearly salary (stored as monthlySalary for backward compatibility)
	endMonthIndex,
}: CalcInputs): number | null {
	if (!monthlySalary || monthlySalary <= 0) return null;
	const exitDate = toExitDate(endMonthIndex);
	// Early leave before Jul 2026
	if (endMonthIndex < 8) return null;
	const startDate = parseStart(startOfEmployment);
	if (!startDate || exitDate <= startDate) return null;
	const birthDate = parseBirthday(birthday);
	// Use July 1 of exit year as outplacement start (matches current timeline)
	const outplacementStartDate = julyFirstOfYear(exitDate.getFullYear());
	const details = computeBenefitDetailsByDates({
		employmentStartDate: startDate,
		birthDate,
		exitDate,
		monthlySalary, // Pass yearly salary, will be converted to monthly inside
		outplacementStartDate,
	});
	return details.totalPayout;
}

