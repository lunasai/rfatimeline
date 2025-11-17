# SBR Calculator Validation Summary

## Test Results Table

| Scenario | Input Summary | Expected Total | Actual Total | Match? | Notes |
|----------|---------------|----------------|--------------|--------|-------|
| **1. Under 35, 3y service, exit at outplacement end** | Age 33, 3y 4m service, base €5k, exit Oct 2025 | €8,100 | €10,800 | ❌ | Additional comp: expected €0, got €2,700. Remaining months: expected 0, got 1. |
| **2. Under 35, 2y 7m service, exit during outplacement** | Age 33, 2y 6m service, base €5k, exit Aug 2025 | €13,100 | €10,800 | ❌ | Service calc differs. Additional comp uses monthlySalary (€5,400) instead of baseSalary (€5,000). |
| **3. Under 35, 2y 5m service, exit early** | Age 33, 2y 3m service, base €5k, exit Jul 2025 | €12,900 | €13,500 | ❌ | Additional comp: expected €7,500 (0.5 × €5k × 3), got €8,100 (0.5 × €5.4k × 3). 8% overpayment. |
| **4. Age 50+, 10y service, exit at end** | Age 50, 10y 11m service, base €6k, exit Dec 2025 | €71,280 | €93,960 | ❌ | Weighted years differ (expected 11.0, got 14.0). Remaining months: expected 0, got 1. |
| **5. Age 52, 15y service, exit during outplacement** | Age 52, 15y 7m service, base €7k, exit Aug 2025 | €165,200 | €170,100 | ❌ | Additional comp: expected €14k (0.5 × €7k × 4), got €18.9k (0.5 × €7.56k × 5). Remaining months differ. |
| **6. Age 45, 20y service, exit at end** | Age 45, 20y 11m service, base €5.5k, exit Dec 2025 | €89,100 | €100,980 | ❌ | Service calc differs. Remaining months: expected 0, got 1. Additional comp incorrectly calculated. |

## Key Mismatches Identified

### 1. Additional Compensation Calculation ❌

**Issue**: Implementation uses `monthlySalary` (with 8% holiday) instead of `baseSalary` for additional compensation.

**SBR Rule**: `AdditionalComp = 0.5 × baseSalary × remainingMonths`  
**Implementation**: `AdditionalComp = 0.5 × monthlySalary × remainingMonths`

**Impact**: Additional compensation is inflated by 8% (the holiday allowance percentage).

**Example**:
- Base salary: €5,000
- Monthly salary with holiday: €5,400 (€5,000 × 1.08)
- Remaining months: 3
- **SBR**: 0.5 × €5,000 × 3 = €7,500
- **Implementation**: 0.5 × €5,400 × 3 = €8,100
- **Difference**: €600 (8% overpayment)

**Location**: `src/lib/calc.ts:155`

---

### 2. Remaining Outplacement Months Calculation ⚠️

**Issue**: Remaining months calculation appears off by 1 month when exiting at the end of outplacement period.

**Examples**:
- Test Case 1: Expected 0 remaining months, got 1
- Test Case 4: Expected 0 remaining months, got 1  
- Test Case 6: Expected 0 remaining months, got 1

**Possible Cause**: The `monthsBetween` function counts month boundaries crossed, not months included. When exiting on the last day of the outplacement period, it may not count that final month.

**Location**: `src/lib/calc.ts:153-154`

---

### 3. Weighted Years Calculation (Needs Review) ⚠️

**Issue**: Test Case 4 shows weighted years difference (expected 11.0, got 14.0).

**Possible Causes**:
- Different interpretation of age band boundaries
- Different handling of service periods spanning multiple age bands
- Test case calculation error

**Location**: `src/lib/calc.ts:104-146`

---

## Summary Statistics

- **Total Test Cases**: 6
- **Cases Matching**: 0
- **Cases with Mismatches**: 6
- **Critical Issues**: 2 (Additional compensation, Remaining months)
- **Review Needed**: 1 (Weighted years calculation)

## Recommendations

1. **Fix Additional Compensation** (High Priority)
   - Change calculation to use `baseSalary` instead of `monthlySalary`
   - Requires either:
     - Adding `baseSalary` as a separate parameter, OR
     - Calculating `baseSalary = monthlySalary / 1.08`

2. **Fix Remaining Months Calculation** (High Priority)
   - Review `monthsBetween` logic for end-of-period cases
   - Consider if remaining months should use inclusive vs exclusive counting

3. **Review Weighted Years Logic** (Medium Priority)
   - Verify age band segmentation matches SBR rules exactly
   - Test edge cases for service spanning multiple age bands

4. **Add €300,000 Cap** (Low Priority)
   - SBR rules specify severance cap (excluding additional compensation)
   - Currently not implemented

---

**Generated**: 2025-01-XX  
**Test File**: `src/lib/calc.validation.test.ts`

