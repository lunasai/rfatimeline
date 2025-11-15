import { describe, it, expect } from 'vitest';
import { computeBenefitDetailsByDates } from './calc';

describe('SBR payout with outplacement (opted in) — validation cases', () => {
	const employmentStartDate = new Date(2022, 5, 1); // 2022-06-01
	const birthDate = new Date(1992, 0, 1); // 1992-01-01 (age 33 in 2025)
	const monthlySalary = 5000; // already includes holiday allowance

	it('Case 1 – Exit in August, 4-month outplacement → total = €15,000', () => {
		const exitDate = new Date(2025, 7, 1); // 2025-08-01
		// Outplacement starts Jul 1 of exit year
		const details = computeBenefitDetailsByDates({
			employmentStartDate,
			birthDate,
			exitDate,
			monthlySalary,
			outplacementStartDate: new Date(2025, 6, 1),
		});

		// intermediate expectations
		expect(details.rawServiceMonths).toBe(38); // 3y 2m
		expect(details.rawServiceFullYears).toBe(3);
		expect(details.rawServiceRemainderMonths).toBe(2);
		expect(details.weightedYearsA).toBe(1.5); // all under 35 → 3 * 0.5
		expect(details.baseSeverance).toBe(7500); // 1.5 * 5000
		expect(details.outplacementEntitlementMonths).toBe(4);
		expect(details.remainingFullOutplacementMonths).toBe(3); // Aug exit with Jul–Oct entitlement
		expect(details.additionalComp).toBe(7500); // 0.5 * 5000 * 3
		expect(details.totalPayout).toBe(15000);
	});

	it('Case 2 – Exit in July, 4-month outplacement → total = €17,500', () => {
		const exitDate = new Date(2025, 6, 1); // 2025-07-01
		const details = computeBenefitDetailsByDates({
			employmentStartDate,
			birthDate,
			exitDate,
			monthlySalary,
			outplacementStartDate: new Date(2025, 6, 1),
		});

		expect(details.rawServiceMonths).toBe(37); // 3y 1m
		expect(details.rawServiceFullYears).toBe(3);
		expect(details.rawServiceRemainderMonths).toBe(1);
		expect(details.weightedYearsA).toBe(1.5);
		expect(details.baseSeverance).toBe(7500);
		expect(details.outplacementEntitlementMonths).toBe(4);
		expect(details.remainingFullOutplacementMonths).toBe(4); // Jul exit at start → all 4 unused
		expect(details.additionalComp).toBe(10000); // 0.5 * 5000 * 4
		expect(details.totalPayout).toBe(17500);
	});
});

describe('Outplacement rule flips evaluated at role lapse', () => {
	it('Age 49 → 50 at role lapse flips 4 → 6 months', () => {
		const employmentStartDate = new Date(2010, 0, 1);
		const birthDate = new Date(1976, 10, 6); // 06 Nov 1976
		const exitDate = new Date(2026, 9, 1); // Oct 2026
		const roleLapse = new Date(2026, 6, 1); // Jul 2026 (turns 50 in Nov 2026 => still 49)
		const details49 = computeBenefitDetailsByDates({
			employmentStartDate,
			birthDate,
			exitDate,
			monthlySalary: 3000,
			outplacementStartDate: roleLapse,
		});
		expect(details49.outplacementEntitlementMonths).toBe(4);

		const roleLapse2 = new Date(2026, 10, 1); // Nov 2026 (age 50)
		const details50 = computeBenefitDetailsByDates({
			employmentStartDate,
			birthDate,
			exitDate,
			monthlySalary: 3000,
			outplacementStartDate: roleLapse2,
		});
		expect(details50.outplacementEntitlementMonths).toBe(6);
	});

	it('Service 19y11m → 20y at role lapse flips 4 → 6 months', () => {
		const start = new Date(2006, 7, 1); // Aug 2006
		const birthDate = new Date(1995, 0, 1);
		const exitDate = new Date(2026, 9, 1); // Oct 2026
		const rl1 = new Date(2026, 6, 1); // Jul 2026 -> 19y11m
		const d1 = computeBenefitDetailsByDates({
			employmentStartDate: start,
			birthDate,
			exitDate,
			monthlySalary: 3000,
			outplacementStartDate: rl1,
		});
		expect(d1.outplacementEntitlementMonths).toBe(4);

		const rl2 = new Date(2026, 7, 1); // Aug 2026 -> 20y
		const d2 = computeBenefitDetailsByDates({
			employmentStartDate: start,
			birthDate,
			exitDate,
			monthlySalary: 3000,
			outplacementStartDate: rl2,
		});
		expect(d2.outplacementEntitlementMonths).toBe(6);
	});
});

