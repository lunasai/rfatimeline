## SBR Severance + Unused Outplacement Calculation

This document explains how the exit package estimate is calculated in the timeline UI.

### Inputs

- `employmentStartDate` (Date): contract start date
- `birthDate` (Date): date of birth (optional; if unknown, all service is treated in the <35 band)
- `exitDate` (Date): termination date selected by the slider
- `monthlySalary` (number): yearly salary with 8% holiday allowance included (stored as `monthlySalary` for backward compatibility; converted to monthly internally)

### Overview

Total payout is the sum of base severance and additional compensation for unused outplacement months when the employee exits before the outplacement period ends.

- Base severance = A × monthlySalary (monthlySalary already includes holiday allowance)
- Additional compensation = 0.5 × baseSalary × remainingFullOutplacementMonths (where baseSalary = monthlySalary / 1.08)
- Total payout = base severance + additional compensation

### A. Weighted Service Years (A)

1) Service window

- Service is measured from `employmentStartDate` up to the chosen `exitDate`.

2) Age bands and weights (applied as time passes)

- Up to age 35 → weight 0.5 per year
- 35–45 → weight 1.0 per year
- 45–55 → weight 1.5 per year
- 55+ → weight 2.0 per year

We split the service period into contiguous segments at the age thresholds above. For each segment we determine the months worked in that band.

3) SBR rounding rule (applied once after summing segments)

- Let `rawServiceMonths` be the total months from all segments.
- Compute full years and a single global remainder:
  - `rawServiceFullYears = floor(rawServiceMonths / 12)`
  - `rawServiceRemainderMonths = rawServiceMonths % 12`
- Apply rounding strictly: if `rawServiceRemainderMonths > 6`, add 1 full year; otherwise, round down.
- The implementation assigns the “rounded up” year (if any) to the last segment that has a non-zero remainder, so weighting reflects the employee’s latest band.

4) Weighted sum

- For each segment, take its full years (after the single global rounding step above) and multiply by the segment’s weight.
- `A = Σ(segmentFullYears × segmentWeight)`

5) Base severance

- Yearly salary (with holiday) is converted to monthly: `monthlySalary = yearlySalary / 12`
- `baseSeverance = round(A × monthlySalary)`
- Note: `monthlySalary` already includes 8% holiday allowance, so it's used directly for severance calculation (B = monthlySalary per SBR formula).
- Severance is capped at €300,000 (excluding additional compensation).

### B. Outplacement (opted-in only in this UI)

1) Entitlement (4 or 6 months)

- 4 months if age at exit < 50 AND service at exit < 20 years
- 6 months if age at exit ≥ 50 OR service at exit ≥ 20 years

2) Outplacement start

- In this UI flow, the outplacement period starts on July 1 of the exit year.

3) Unused months and additional compensation

- `monthsElapsedFromOutplacementStart = monthsBetween(outplacementStartDate, exitDate)`
- Calculate `outplacementEndDate = outplacementStartDate + entitlementMonths`
- If `exitDate >= outplacementEndDate` or exit is in the last month of outplacement, then `remainingFullOutplacementMonths = 0` (all months used)
- Otherwise: `remainingFullOutplacementMonths = max(0, entitlementMonths - monthsElapsedFromOutplacementStart)`
- Extract base monthly salary: `baseMonthlySalary = (yearlySalary / 1.08) / 12` (extract base from yearly which includes holiday, then convert to monthly)
- `additionalComp = 0.5 × baseMonthlySalary × remainingFullOutplacementMonths`

If the employee uses the full outplacement period or exits after it ends, `additionalComp = 0`.

### C. Total

`totalPayout = baseSeverance + additionalComp`

Statutory caps or offsets (e.g., max €300k, statutory transition allowance, AOW loss-of-income comparisons, benefit offsets) are not included in this implementation due to lack of inputs; the UI copy notes this simplification.

### Reference functions

- `computeBenefitDetailsByDates({ employmentStartDate, birthDate, exitDate, monthlySalary, outplacementStartDate? })`
  - Returns a breakdown including `rawServiceMonths`, `rawServiceFullYears`, `rawServiceRemainderMonths`, `weightedYearsA`, `baseSeverance`, `outplacementEntitlementMonths`, `remainingFullOutplacementMonths`, `additionalComp`, and `totalPayout`.
- `computeBenefitEstimate({ startOfEmployment, birthday, monthlySalary, endMonthIndex })`
  - Wraps the core function and uses July 1 of the exit year as the outplacement start for the timeline.

### Validation examples

Inputs for both examples:

- `birthDate`: 1992-xx-xx (age 33 in 2025; all service under 35)
- `employmentStartDate`: 2022-06-01
- `monthlySalary`: € 5,000 (holiday included)
- Outplacement entitlement: 4 months (July–October)

Case 1 — Exit in August (2025-08-01)

- Service ≈ 3 years + 2 months → rounds down to 3 years
- All service under 35 → A = 3 × 0.5 = 1.5
- Base severance = 1.5 × 5,000 = 7,500
- Remaining full outplacement months after August = 3 (Sep–Oct plus unused in Aug as modeled)
- Base salary = 5,000 / 1.08 = 4,629.63
- Additional compensation = 0.5 × 4,629.63 × 3 = 6,944.45 ≈ 6,944
- Total payout = 7,500 + 7,500 = € 15,000

Case 2 — Exit in July (2025-07-01)

- Service ≈ 3 years + 1 month → rounds down to 3 years
- A = 1.5; Base severance = 7,500
- Remaining full outplacement months after July = 4
- Base salary = 5,000 / 1.08 = 4,629.63
- Additional compensation = 0.5 × 4,629.63 × 4 = 9,259.26 ≈ 9,259
- Total payout = 7,500 + 9,259 = 16,759

### Notes

- Service duration always anchors from `employmentStartDate` to `exitDate` (slider handle), not the RFA/announcement date.
- Rounding rule is strict: remainder > 6 months rounds up; remainder ≤ 6 months rounds down.
- The UI assumes the employee opted into outplacement for this flow.


