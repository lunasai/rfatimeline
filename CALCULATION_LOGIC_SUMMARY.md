# SBR Calculator Logic Summary

## Input
- **Yearly Salary**: User enters yearly salary (with 8% holiday allowance already included)
- Example: If user enters €64,800, this represents a yearly salary that already includes 8% holiday allowance

## Step-by-Step Calculation Logic

### 1. Salary Conversion
```
Input: yearlySalary (with 8% holiday included)
→ monthlySalary = yearlySalary / 12
```
**Example**: €64,800 yearly → €5,400 monthly (this monthly amount already includes 8% holiday)

### 2. Service Years Calculation (A)

#### 2a. Calculate Service Months by Age Band
- Split employment period into age segments:
  - Age 0-35: weight 0.5
  - Age 35-45: weight 1.0
  - Age 45-55: weight 1.5
  - Age 55+: weight 2.0
- Calculate months worked in each age band segment

#### 2b. Apply Rounding Rule
- Sum all service months: `rawServiceMonths`
- Calculate: `rawServiceFullYears = floor(rawServiceMonths / 12)`
- Calculate: `rawServiceRemainderMonths = rawServiceMonths % 12`
- **If remainder > 6 months**: round up (add 1 year to the last segment with remainder)
- **If remainder ≤ 6 months**: round down (keep as is)

#### 2c. Calculate Weighted Years (A)
- For each age band segment: `segmentYears × segmentWeight`
- Sum all segments: `A = Σ(segmentYears × weight)`

**Example**: 
- 3 years all under age 35 → A = 3 × 0.5 = 1.5
- 8 years in 35-45 band + 7 years in 45-55 band → A = 8 × 1.0 + 7 × 1.5 = 8 + 10.5 = 18.5

### 3. Base Severance Calculation
```
baseSeverance = round(A × monthlySalary)
```
Where `monthlySalary` already includes 8% holiday allowance.

**Example**: A = 1.5, monthlySalary = €5,400 → baseSeverance = 1.5 × 5,400 = €8,100

**Cap**: If baseSeverance > €300,000, set to €300,000

### 4. Outplacement Entitlement
- **4 months** if: age < 50 AND service < 20 years (at role lapse date)
- **6 months** if: age ≥ 50 OR service ≥ 20 years (at role lapse date)

### 5. Remaining Outplacement Months
```
monthsElapsed = monthsBetween(outplacementStartDate, exitDate)
outplacementEndDate = outplacementStartDate + entitlementMonths
lastOutplacementMonth = outplacementStartDate + (entitlementMonths - 1)

If exitDate >= outplacementEndDate OR exitDate is in lastOutplacementMonth:
  remainingMonths = 0
Else:
  remainingMonths = max(0, entitlementMonths - monthsElapsed)
```

**Example**: 
- Outplacement: Jul-Oct (4 months)
- Exit: Oct 31 → exit is in last month → remainingMonths = 0
- Exit: Sep 1 → monthsElapsed = 2 → remainingMonths = 4 - 2 = 2

### 6. Additional Compensation
```
baseMonthlySalary = monthlySalary / 1.08
additionalComp = round(0.5 × baseMonthlySalary × remainingMonths)
```

**Example**:
- monthlySalary = €5,400 (includes 8% holiday)
- baseMonthlySalary = €5,400 / 1.08 = €5,000
- remainingMonths = 3
- additionalComp = 0.5 × €5,000 × 3 = €7,500

### 7. Total Payout
```
totalPayout = baseSeverance + additionalComp
```

## Complete Example

**Input**:
- Yearly salary: €64,800 (includes 8% holiday)
- Service: 3 years (all under age 35)
- Exit: 2 months into 4-month outplacement

**Calculation**:
1. monthlySalary = €64,800 / 12 = €5,400
2. A = 3 × 0.5 = 1.5
3. baseSeverance = 1.5 × €5,400 = €8,100
4. remainingMonths = 4 - 2 = 2
5. baseMonthlySalary = €5,400 / 1.08 = €5,000
6. additionalComp = 0.5 × €5,000 × 2 = €5,000
7. totalPayout = €8,100 + €5,000 = €13,100

## Key Points

1. **Input is yearly salary with holiday included** - converted to monthly internally
2. **Severance uses monthlySalary directly** (it already includes 8% holiday)
3. **Additional compensation extracts base salary** by dividing by 1.08, then uses that
4. **Service rounding**: > 6 months remainder → round up, ≤ 6 months → round down
5. **Severance cap**: €300,000 maximum (additional compensation is not capped)
6. **Remaining months**: If exit is in the last month of outplacement, remaining = 0

