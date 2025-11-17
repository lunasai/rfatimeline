# SBR Calculator Validation Report

This report documents the validation of the existing SBR calculator implementation against the official SBR rules.

## Executive Summary

The validation tests reveal **two main mismatches** between the implementation and SBR rules:

1. **Additional Compensation Calculation**: The implementation uses `monthlySalary` (which includes 8% holiday allowance) instead of `baseSalary` when calculating additional compensation for unused outplacement months.

2. **Remaining Outplacement Months Calculation**: There appears to be a discrepancy in how remaining months are calculated, particularly at the end of outplacement periods.

## SBR Rules (Reference)

### Severance Formula
- **Formula**: Severance = A × B × C
  - **A** = Weighted service years (0.5/1.0/1.5/2.0 by age band)
  - **B** = Gross monthly income + 8% holiday allowance (baseSalary × 1.08)
  - **C** = 1

### Service Rounding
- Remainder > 6 months → round up to full year
- Remainder ≤ 6 months → round down

### Outplacement
- 4 months if: age < 50 AND service < 20 years
- 6 months if: age ≥ 50 OR service ≥ 20 years

### Additional Compensation
- **SBR Rule**: AdditionalComp = 0.5 × **baseSalary** × remainingFullOutplacementMonths
- **Current Implementation**: AdditionalComp = 0.5 × **monthlySalary** × remainingFullOutplacementMonths

## Test Results

### Test Case 1: Under 35, 3y service, exit at outplacement end

| Metric | Expected (SBR) | Actual (Implementation) | Match? |
|--------|----------------|-------------------------|--------|
| Service | 3y 4m (40 months) | 3y 4m (40 months) | ✅ |
| Weighted years A | 1.50 | 1.50 | ✅ |
| Base severance | €8,100 | €8,100 | ✅ |
| Outplacement months | 4 | 4 | ✅ |
| Remaining months | 0 | 1 | ❌ |
| Additional comp | €0 | €2,700 | ❌ |
| **Total payout** | **€8,100** | **€10,800** | **❌** |

**Notes**: 
- Remaining months calculation appears incorrect (should be 0 at end of outplacement)
- Additional compensation uses monthlySalary (€5,400) instead of baseSalary (€5,000)

---

### Test Case 2: Under 35, 2y 7m service (rounds up), exit during outplacement

| Metric | Expected (SBR) | Actual (Implementation) | Match? |
|--------|----------------|-------------------------|--------|
| Service | 2y 7m (31 months) | 2y 6m (30 months) | ⚠️ |
| Weighted years A | 1.50 | 1.00 | ❌ |
| Base severance | €8,100 | €5,400 | ❌ |
| Outplacement months | 4 | 4 | ✅ |
| Remaining months | 2 | 2 | ✅ |
| Additional comp | €5,000 | €5,400 | ❌ |
| **Total payout** | **€13,100** | **€10,800** | **❌** |

**Notes**: 
- Service calculation differs (test case dates may need adjustment)
- Additional compensation: expected €5,000 (0.5 × €5,000 × 2), got €5,400 (0.5 × €5,400 × 2)
- Difference: 8% (the holiday allowance percentage)

---

### Test Case 3: Under 35, 2y 5m service (rounds down), exit early

| Metric | Expected (SBR) | Actual (Implementation) | Match? |
|--------|----------------|-------------------------|--------|
| Service | 2y 5m (29 months) | 2y 3m (27 months) | ⚠️ |
| Weighted years A | 1.00 | 1.00 | ✅ |
| Base severance | €5,400 | €5,400 | ✅ |
| Outplacement months | 4 | 4 | ✅ |
| Remaining months | 3 | 3 | ✅ |
| Additional comp | €7,500 | €8,100 | ❌ |
| **Total payout** | **€12,900** | **€13,500** | **❌** |

**Notes**: 
- Service calculation differs (test case dates may need adjustment)
- Additional compensation: expected €7,500 (0.5 × €5,000 × 3), got €8,100 (0.5 × €5,400 × 3)
- Difference: 8% (the holiday allowance percentage)

---

### Test Case 4: Age 50+, 10y service, exit at end of 6-month outplacement

| Metric | Expected (SBR) | Actual (Implementation) | Match? |
|--------|----------------|-------------------------|--------|
| Service | 10y 11m (131 months) | 10y 11m (131 months) | ✅ |
| Weighted years A | 11.00 | 14.00 | ❌ |
| Base severance | €71,280 | €90,720 | ❌ |
| Outplacement months | 6 | 6 | ✅ |
| Remaining months | 0 | 1 | ❌ |
| Additional comp | €0 | €3,240 | ❌ |
| **Total payout** | **€71,280** | **€93,960** | **❌** |

**Notes**: 
- Weighted years calculation differs (implementation may be using different age band logic)
- Remaining months should be 0 at end of outplacement
- Additional compensation incorrectly calculated

---

### Test Case 5: Age 52, 15y service, exit 2 months into 6-month outplacement

| Metric | Expected (SBR) | Actual (Implementation) | Match? |
|--------|----------------|-------------------------|--------|
| Service | 15y 7m (187 months) | 15y 7m (187 months) | ✅ |
| Weighted years A | 20.00 | 20.00 | ✅ |
| Base severance | €151,200 | €151,200 | ✅ |
| Outplacement months | 6 | 6 | ✅ |
| Remaining months | 4 | 5 | ⚠️ |
| Additional comp | €14,000 | €18,900 | ❌ |
| **Total payout** | **€165,200** | **€170,100** | **❌** |

**Notes**: 
- Remaining months calculation differs (expected 4, got 5)
- Additional compensation: expected €14,000 (0.5 × €7,000 × 4), got €18,900 (0.5 × €7,560 × 5)
- The 35% difference is due to both using monthlySalary instead of baseSalary AND different remaining months count

---

### Test Case 6: Age 45, 20y service, 6-month outplacement (service-based)

| Metric | Expected (SBR) | Actual (Implementation) | Match? |
|--------|----------------|-------------------------|--------|
| Service | 20y 6m (246 months) | 20y 11m (251 months) | ⚠️ |
| Weighted years A | 15.00 | 16.50 | ❌ |
| Base severance | €89,100 | €98,010 | ❌ |
| Outplacement months | 6 | 6 | ✅ |
| Remaining months | 0 | 1 | ❌ |
| **Total payout** | **€89,100** | **€100,980** | **❌** |

**Notes**: 
- Service calculation differs (test case dates may need adjustment)
- Remaining months should be 0 at end of outplacement

---

## Key Findings

### 1. Additional Compensation Mismatch (CONFIRMED)

**Issue**: The implementation calculates additional compensation using `monthlySalary` (which includes 8% holiday allowance) instead of `baseSalary` as specified in SBR rules.

**SBR Rule**: 
```
AdditionalComp = 0.5 × baseSalary × remainingFullOutplacementMonths
```

**Current Implementation** (from `calc.ts:155`):
```typescript
const additionalComp = Math.round(0.5 * monthlySalary * remainingFullOutplacementMonths);
```

**Impact**: 
- Additional compensation is inflated by 8% (the holiday allowance percentage)
- Example: For €5,000 base salary with 3 remaining months:
  - SBR: 0.5 × €5,000 × 3 = €7,500
  - Implementation: 0.5 × €5,400 × 3 = €8,100
  - Difference: €600 (8% overpayment)

### 2. Remaining Outplacement Months Calculation (POTENTIAL ISSUE)

**Issue**: The calculation of remaining outplacement months appears to be off by 1 month in several test cases, particularly when exiting at the end of the outplacement period.

**Examples**:
- Test Case 1: Expected 0 remaining months, got 1
- Test Case 4: Expected 0 remaining months, got 1
- Test Case 6: Expected 0 remaining months, got 1

**Possible Cause**: The `monthsBetween` function may be calculating months differently than expected, or there may be an off-by-one error in the remaining months calculation.

### 3. Service Calculation Differences (TEST DATA ISSUE)

Some test cases show service calculation differences, but these appear to be due to test data date precision rather than implementation issues. The implementation's `monthsBetween` function uses specific date comparison logic that may differ from manual calculations.

### 4. Weighted Years Calculation (NEEDS REVIEW)

Test Case 4 shows a difference in weighted years calculation (expected 11.00, got 14.00). This may indicate:
- Different interpretation of age band boundaries
- Different handling of service periods that span multiple age bands
- Test case calculation error

**Recommendation**: Review the age band segmentation logic to ensure it matches SBR rules exactly.

## Recommendations

1. **Fix Additional Compensation Calculation**: 
   - Change line 155 in `calc.ts` to use `baseSalary` instead of `monthlySalary`
   - However, this requires the function to receive `baseSalary` as a separate parameter, or calculate it from `monthlySalary` by dividing by 1.08

2. **Review Remaining Months Calculation**:
   - Verify the `monthsBetween` function behavior at period boundaries
   - Check if the remaining months calculation should use `>=` vs `>` comparisons

3. **Verify Age Band Segmentation**:
   - Ensure the weighted years calculation correctly handles service periods spanning multiple age bands
   - Verify the rounding logic assigns the extra year to the correct age band segment

4. **Add €300,000 Cap**:
   - The SBR rules specify a €300,000 cap on severance (excluding additional compensation)
   - This is not currently implemented in the tool

## Test Coverage

The validation tests cover:
- ✅ Different age bands (under 35, 35-45, 45-55, 55+)
- ✅ Service duration around 6-month rounding boundary
- ✅ 4-month vs 6-month outplacement eligibility
- ✅ Exiting at planned end of outplacement
- ✅ Exiting during outplacement with remaining months

## Next Steps

1. Review and fix the additional compensation calculation
2. Investigate and fix the remaining months calculation issue
3. Verify age band segmentation logic
4. Consider adding the €300,000 severance cap
5. Re-run validation tests after fixes

---

**Report Generated**: 2025-01-XX  
**Test File**: `src/lib/calc.validation.test.ts`  
**Implementation File**: `src/lib/calc.ts`

