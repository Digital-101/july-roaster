# Roster Scheduling Constraints

This document outlines all the business rules and constraints that the roster scheduling system must enforce.

## Employee Information

### Active Employees
- **Nonto**
- **Philani** (Special fixed schedule)
- **Yakeen**
- **Neli**
- **Andile**
- **Nduduzo**
- **Shemuel**

## Shift Types

### Available Shifts
- **07:00 - 16:00** (Day shift) - *Requires atleast 1 people per day*
- **10:00 - 19:00** (Mid shift) - *Requires atleast  1 person per day*
- **19:00 - 04:00** (Night shift) - *Requires 1 person per day*
- **22:00 - 07:00** (Overnight shift) - *Requires atleast  1 person per day*
- **08:00 - 17:00** (Regular hours) - *Backup/additional coverage*
- **OFF** (Day off)
- **AL** (Annual Leave)

### Deprecated Shifts
- ~~**15:00 - 00:00**~~ (No longer in use)

## Core Constraints

### 1. Weekly Time Off Requirements
- **Rule**: Each employee must have exactly **2 days off per week**
- **Applies to**: All employees
- **Validation**: Count OFF days in each 7-day period

### 2. Post-Night Shift Rest
- **Rule**: A person can work as many as consecutive night shifts but cannot jump to work to day shift after night shift without atleast 1 day off
- **Night shifts**: 19:00 - 04:00 and 22:00 - 07:00
- **Mandatory**: Cannot schedule any work shift the day immediately following a night shift
- **Exception**: None - this rule is absolute

### 3. Shift Coverage Requirements
- **Rule**: All shift time slots must have **at least one person** assigned
- **Day shift (07:00 - 16:00)**: Minimum 2 people (including Philani when scheduled)
- **Mid shift (10:00 - 19:00)**: Minimum 1 person
- **Night shift (19:00 - 04:00)**: Minimum 1 person
- **Overnight shift (22:00 - 07:00)**: Minimum 1 person

### 4. Philani's Fixed Schedule
- **Days**: Sunday to Thursday
- **Shift**: 07:00 - 16:00 (Day shift)
- **Days off**: Friday and Saturday (always OFF)
- **Exception**: None - this schedule cannot be changed

### 5. Sunday Work Requirements
- **Rule**: Everyone (except Philani) must work **at least 2 Sundays per month**
- **Applies to**: All employees except Philani
- **Counting**: Any shift on Sunday except OFF or AL counts as working
- **Minimum**: 2 Sundays per calendar month

## Fairness Guidelines

### 1. Workload Distribution
- **Goal**: Distribute total working days as evenly as possible
- **Method**: Track days worked per employee and balance assignments
- **Priority**: Assign work to employees with fewer total days worked

### 2. Night Shift Rotation
- **Goal**: Fairly distribute night shifts among all employees
- **Method**: Track night shifts per employee and rotate assignments
- **Avoid**: Giving consecutive night shifts to the same person when possible

### 3. Shift Type Balance
- **Goal**: Ensure no employee gets only one type of shift
- **Method**: Track different shift types per employee
- **Balance**: Day shifts, mid shifts, night shifts, and regular shifts

### 4. Consecutive Work Days
- **Goal**: Avoid excessive consecutive working days
- **Guideline**: Prefer to give days off after 5+ consecutive work days
- **Priority**: Consider consecutive days when making assignments

## Implementation Rules

### 1. Constraint Priority Order
1. **Post-night shift rest** (Highest priority - absolute rule)
2. **Shift coverage requirements** (Must be met every day)
3. **Philani's fixed schedule** (Cannot be changed)
4. **Weekly time off** (2 days per week)
5. **Sunday work requirements** (Minimum 2 per month)
6. **Fairness guidelines** (Optimize when possible)

### 2. Validation Process
- **Real-time**: Check constraints as shifts are assigned
- **Final validation**: Comprehensive check before allowing export
- **Error reporting**: Specific messages for each constraint violation
- **Visual feedback**: Highlight cells with constraint violations

### 3. Auto-Generation Rules
- **Phase 1**: Generate optimal schedule respecting basic constraints
- **Phase 2**: Enforce all mandatory constraints through adjustments
- **Phase 3**: Apply fairness optimizations where possible
- **Fallback**: Emergency assignment to ensure critical shift coverage

## Special Cases

### 1. Partial Weeks
- **Start/end of month**: May have fewer than 7 days
- **Time off requirement**: Adjust proportionally for partial weeks
- **Coverage**: Still require minimum coverage for all days

### 2. Holiday Periods
- **Annual Leave**: Treated same as OFF for constraint purposes
- **Coverage**: Must maintain minimum staffing during AL periods

### 3. Emergency Situations
- **Critical shifts**: May override fairness to ensure coverage
- **Safety net**: Always assign someone to uncovered critical shifts
- **Last resort**: Reassign from less critical shifts if needed

## Validation Messages

### Common Error Types
- `Employee: Less than 2 days off in week starting X`
- `Employee: No rest day after night shift on day X`
- `Day X: No coverage for [shift] shift`
- `Employee: Only X Sundays worked (minimum 2 required)`

### Success Indicators
- All shifts have required minimum coverage
- All employees have appropriate time off
- Post-night shift rest rules followed
- Sunday work requirements met
- Fair distribution achieved