import { Employee, Roster, RosterEntry, SHIFTS } from '../types/roster';
import { validateRoster } from './rosterValidation';

// Helper function to get day of week (0 = Sunday, 1 = Monday, etc.)
function getDayOfWeek(date: Date): number {
  return date.getDay();
}

// Helper function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Check if a shift is a night shift
function isNightShift(shiftType: string): boolean {
  return shiftType === 'night' || shiftType === 'overnight';
}

// Check if a shift is a day shift
function isDayShift(shiftType: string): boolean {
  return shiftType === 'day' || shiftType === 'mid' || shiftType === 'regular';
}

// Get previous day's shift for an employee
function getPreviousDayShift(entries: RosterEntry[], employeeId: string, currentDate: Date): string | null {
  const previousDate = new Date(currentDate);
  previousDate.setDate(previousDate.getDate() - 1);
  const previousDateStr = previousDate.toISOString().split('T')[0];
  
  const previousEntry = entries.find(entry => 
    entry.employeeId === employeeId && entry.date === previousDateStr
  );
  
  return previousEntry ? previousEntry.shift.type : null;
}

// Check if an employee can work a day shift (not after night shift)
function canWorkDayShift(entries: RosterEntry[], employeeId: string, currentDate: Date): boolean {
  const previousShiftType = getPreviousDayShift(entries, employeeId, currentDate);
  return !previousShiftType || !isNightShift(previousShiftType);
}

// Count consecutive working days for an employee before a date
function getConsecutiveWorkDays(entries: RosterEntry[], employeeId: string, beforeDate: Date): number {
  const employeeEntries = entries
    .filter(e => e.employeeId === employeeId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  let consecutiveWorkDays = 0;
  const beforeDateStr = beforeDate.toISOString().split('T')[0];
  
  // Look backwards from before date
  for (let i = employeeEntries.length - 1; i >= 0; i--) {
    const entry = employeeEntries[i];
    if (entry.date >= beforeDateStr) continue; // Skip future dates
    
    if (entry.shift.type === 'off' || entry.shift.type === 'al') {
      break; // Stop at last day off
    } else {
      consecutiveWorkDays++;
    }
  }
  
  return consecutiveWorkDays;
}

// Count days off in the current week for an employee
function getDaysOffInWeek(entries: RosterEntry[], employeeId: string, currentDate: Date): number {
  const currentWeekStart = new Date(currentDate);
  currentWeekStart.setDate(currentDate.getDate() - currentDate.getDay()); // Go to Sunday
  
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6); // Go to Saturday
  
  const employeeEntries = entries.filter(e => e.employeeId === employeeId);
  let daysOff = 0;
  
  employeeEntries.forEach(entry => {
    const entryDate = new Date(entry.date);
    if (entryDate >= currentWeekStart && entryDate <= currentWeekEnd) {
      if (entry.shift.type === 'off' || entry.shift.type === 'al') {
        daysOff++;
      }
    }
  });
  
  return daysOff;
}

// Count Sundays worked for an employee in the month
function getSundaysWorked(entries: RosterEntry[], employeeId: string): number {
  const employeeEntries = entries.filter(e => e.employeeId === employeeId);
  let sundaysWorked = 0;
  
  employeeEntries.forEach(entry => {
    const entryDate = new Date(entry.date);
    if (entryDate.getDay() === 0 && entry.shift.type !== 'off' && entry.shift.type !== 'al') {
      sundaysWorked++;
    }
  });
  
  return sundaysWorked;
}

// Required shifts that must be covered each day
const REQUIRED_SHIFTS = [
  { startTime: '07:00', endTime: '16:00', type: 'day' as const, minPeople: 1 },
  { startTime: '10:00', endTime: '19:00', type: 'mid' as const, minPeople: 1 },
  { startTime: '19:00', endTime: '04:00', type: 'night' as const, minPeople: 1 },
  { startTime: '22:00', endTime: '07:00', type: 'overnight' as const, minPeople: 1 }
];

// Additional shifts for extra workers
const ADDITIONAL_SHIFTS = [
  { startTime: '08:00', endTime: '17:00', type: 'regular' as const, minPeople: 0 },
  { startTime: '07:00', endTime: '16:00', type: 'day' as const, minPeople: 1 },
  { startTime: '10:00', endTime: '19:00', type: 'mid' as const, minPeople: 1 }
];

export function generateRoster(employees: Employee[], month: number, year: number): Roster {
  const roster: Roster = {
    entries: [],
    validationErrors: [],
    month,
    year
  };

  try {
    const daysInMonth = new Date(year, month, 0).getDate();
    const entries: RosterEntry[] = [];
    const employeeOffDays: Record<string, Set<string>> = {};
    const fixedEmployees = employees.filter(e => e.isFixedSchedule);
    const nonFixedEmployees = employees.filter(e => !e.isFixedSchedule);

    // Step 1: Pre-assign 2 random off days per week for each non-fixed employee
    for (const employee of nonFixedEmployees) {
      employeeOffDays[employee.id] = new Set();
      let day = 1;
      while (day <= daysInMonth) {
        // Get week range
        const weekStart = day;
        const weekEnd = Math.min(day + 6, daysInMonth);
        const weekDays = [];
        for (let d = weekStart; d <= weekEnd; d++) weekDays.push(d);
        // For partial weeks, adjust off days proportionally
        let offCount = 2;
        if (weekDays.length < 7) {
          offCount = Math.round((weekDays.length / 7) * 2);
          if (offCount < 1) offCount = 1;
        }
        // Pick exactly offCount random days in this week
        const shuffled = shuffleArray(weekDays);
        for (let i = 0; i < offCount; i++) {
          employeeOffDays[employee.id].add(new Date(year, month - 1, shuffled[i]).toISOString().split('T')[0]);
        }
        day += 7;
      }
    }
    // Philani's fixed off days (Friday/Saturday)
    for (const employee of fixedEmployees) {
      employeeOffDays[employee.id] = new Set();
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        if (date.getDay() === 5 || date.getDay() === 6) {
          employeeOffDays[employee.id].add(date.toISOString().split('T')[0]);
        }
      }
    }

    // Step 2: For each day, assign off days and shifts
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = getDayOfWeek(date);
      // Who is off today?
      const offToday = employees.filter(e => employeeOffDays[e.id].has(dateStr));
      // If less than 1 or more than 3 off, adjust (shouldn't happen, but just in case)
      if (offToday.length < 1) {
        // Randomly pick someone to be off
        const notOff = employees.filter(e => !employeeOffDays[e.id].has(dateStr));
        const pick = shuffleArray(notOff)[0];
        employeeOffDays[pick.id].add(dateStr);
      } else if (offToday.length > 3) {
        // Remove extras
        const toRemove = shuffleArray(offToday).slice(3);
        for (const e of toRemove) employeeOffDays[e.id].delete(dateStr);
      }
      // Recompute offToday after adjustment
      const offTodayFinal = employees.filter(e => employeeOffDays[e.id].has(dateStr));
      const workingToday = employees.filter(e => !employeeOffDays[e.id].has(dateStr));
      // If more than 6 working, randomly assign extra off
      if (workingToday.length > 6) {
        const toOff = shuffleArray(workingToday).slice(6);
        for (const e of toOff) employeeOffDays[e.id].add(dateStr);
      }
      // If less than 4 working, reassign some off to work
      if (workingToday.length < 4) {
        const toWork = shuffleArray(offTodayFinal).slice(0, 4 - workingToday.length);
        for (const e of toWork) employeeOffDays[e.id].delete(dateStr);
      }
      // Final lists for today
      const offFinal = employees.filter(e => employeeOffDays[e.id].has(dateStr));
      const workFinal = employees.filter(e => !employeeOffDays[e.id].has(dateStr));
      // Assign OFF entries
      offFinal.forEach(employee => {
        entries.push({
          date: dateStr,
          employeeId: employee.id,
          shift: { startTime: '', endTime: '', type: 'off', minPeople: 0 }
        });
      });
      // Step 3: Assign shifts to working employees
      // Assign required shifts first
      const availableWorkers = [...workFinal];
      const assignedShifts: RosterEntry[] = [];
      // Helper to check if employee can work a shift (no day after night)
      function canAssignShift(employee: Employee, shiftType: string): boolean {
        if (isDayShift(shiftType)) {
          const prevEntry = entries.find(e => e.employeeId === employee.id && e.date === new Date(new Date(dateStr).getTime() - 86400000).toISOString().split('T')[0]);
          if (prevEntry && isNightShift(prevEntry.shift.type)) return false;
        }
        return true;
      }
      // Assign each required shift
      for (const requiredShift of REQUIRED_SHIFTS) {
        let assigned = false;
        // For day shift, prioritize Philani if available
        if (requiredShift.type === 'day') {
          const philani = availableWorkers.find(e => e.name === 'Philani' && canAssignShift(e, 'day'));
          if (philani) {
            assignedShifts.push({ date: dateStr, employeeId: philani.id, shift: requiredShift });
            availableWorkers.splice(availableWorkers.indexOf(philani), 1);
            assigned = true;
          }
        }
        if (!assigned) {
          // Assign to any available worker who can take this shift
          const worker = availableWorkers.find(e => canAssignShift(e, requiredShift.type));
          if (worker) {
            assignedShifts.push({ date: dateStr, employeeId: worker.id, shift: requiredShift });
            availableWorkers.splice(availableWorkers.indexOf(worker), 1);
          }
        }
      }
      // Assign additional shifts to remaining workers
      availableWorkers.forEach((employee, idx) => {
        // Prefer day/mid/regular if possible, else night
        let shift = ADDITIONAL_SHIFTS[idx % ADDITIONAL_SHIFTS.length];
        if (!canAssignShift(employee, shift.type)) {
          // Fallback to night/overnight
          shift = (REQUIRED_SHIFTS.find(s => isNightShift(s.type)) as typeof shift) || shift;
        }
        assignedShifts.push({ date: dateStr, employeeId: employee.id, shift });
      });
      entries.push(...assignedShifts);
    }
    roster.entries = entries;
    roster.validationErrors = validateRoster(roster, employees);
  } catch (error) {
    roster.validationErrors = [`Error generating roster: ${error}`];
  }
  return roster;
}

// Calculate employee statistics
export function calculateEmployeeStats(roster: Roster, employee: Employee) {
  const employeeEntries = roster.entries.filter(e => e.employeeId === employee.id);
  
  // Count total working days
  const workingDays = employeeEntries.filter(e => e.shift.type !== 'off' && e.shift.type !== 'al').length;
  
  // Count Sundays worked
  const sundaysWorked = employeeEntries.filter(e => {
    if (e.shift.type === 'off' || e.shift.type === 'al') return false;
    const date = new Date(e.date);
    return date.getDay() === 0; // Sunday
  }).length;
  
  // Count night shifts
  const nightShifts = employeeEntries.filter(e => 
    e.shift.type === 'night' || e.shift.type === 'overnight'
  ).length;
  
  // Count days off
  const daysOff = employeeEntries.filter(e => e.shift.type === 'off' || e.shift.type === 'al').length;

  // Count consecutive off pairs
  let consecutiveOffPairs = 0;
  let prevWasOff = false;
  for (const entry of employeeEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())) {
    const isOff = entry.shift.type === 'off' || entry.shift.type === 'al';
    if (isOff && prevWasOff) {
      consecutiveOffPairs++;
    }
    prevWasOff = isOff;
  }

  return {
    workingDays,
    daysOff,
    sundaysWorked,
    nightShifts,
    consecutiveOffPairs
  };
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

export function getShiftColor(shiftType: string): string {
  switch (shiftType) {
    case 'day':
      return 'bg-blue-100 text-blue-800';
    case 'mid':
      return 'bg-green-100 text-green-800';
    case 'regular':
      return 'bg-cyan-100 text-cyan-800';
    case 'night':
      return 'bg-purple-100 text-purple-800';
    case 'overnight':
      return 'bg-indigo-100 text-indigo-800';
    case 'off':
      return 'bg-orange-100 text-orange-800';
    case 'al':
      return 'bg-red-200 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}