import { Employee, Roster, RosterEntry, ShiftType } from '../types/roster';

export function validateRoster(roster: Roster, employees: Employee[]): string[] {
  const errors: string[] = [];
  const entriesByDate = new Map<string, RosterEntry[]>();
  const employeeStats = new Map<string, {
    daysOffThisWeek: number,
    lastShiftType: ShiftType | null,
    sundaysWorked: number,
    nightShiftsWorked: number,
    totalDaysWorked: number,
    shiftTypesWorked: Record<ShiftType, number>
  }>();

  // Initialize employee stats
  employees.forEach(emp => {
    employeeStats.set(emp.id, {
      daysOffThisWeek: 0,
      lastShiftType: null,
      sundaysWorked: 0,
      nightShiftsWorked: 0,
      totalDaysWorked: 0,
      shiftTypesWorked: {
        day: 0, mid: 0, night: 0, overnight: 0, regular: 0, off: 0, al: 0
      }
    });
  });

  // Group entries by date
  roster.entries.forEach(entry => {
    if (!entriesByDate.has(entry.date)) {
      entriesByDate.set(entry.date, []);
    }
    entriesByDate.get(entry.date)!.push(entry);
  });

  // Validate each day
  entriesByDate.forEach((entries, date) => {
    const currentDate = new Date(date);
    const dayOfWeek = currentDate.getDay();
    const isSunday = dayOfWeek === 0;

    // Check shift coverage
    const shiftCounts = new Map<string, number>();
    entries.forEach(entry => {
      const shiftKey = `${entry.shift.startTime}-${entry.shift.endTime}`;
      shiftCounts.set(shiftKey, (shiftCounts.get(shiftKey) || 0) + 1);
    });

    // Validate minimum coverage
    entries.forEach(entry => {
      const shiftKey = `${entry.shift.startTime}-${entry.shift.endTime}`;
      const count = shiftCounts.get(shiftKey) || 0;
      if (count < entry.shift.minPeople) {
        errors.push(`Insufficient coverage for ${shiftKey} shift on ${date}`);
      }
    });

    // Update employee stats and validate constraints
    entries.forEach(entry => {
      const stats = employeeStats.get(entry.employeeId)!;
      const employee = employees.find(emp => emp.id === entry.employeeId)!;

      // Check post-night shift rest
      if (stats.lastShiftType === 'night' || stats.lastShiftType === 'overnight') {
        if (entry.shift.type !== 'off' && entry.shift.type !== 'al') {
          errors.push(`${employee.name} needs rest day after night shift on ${date}`);
        }
      }

      // Update stats
      if (entry.shift.type === 'off' || entry.shift.type === 'al') {
        stats.daysOffThisWeek++;
      } else {
        stats.totalDaysWorked++;
        stats.shiftTypesWorked[entry.shift.type]++;
        if (entry.shift.type === 'night' || entry.shift.type === 'overnight') {
          stats.nightShiftsWorked++;
        }
        if (isSunday) {
          stats.sundaysWorked++;
        }
      }

      stats.lastShiftType = entry.shift.type;
    });

    // Check weekly time off requirement
    if (dayOfWeek === 6) { // End of week
      employeeStats.forEach((stats, empId) => {
        const employee = employees.find(emp => emp.id === empId)!;
        if (stats.daysOffThisWeek < 2) {
          errors.push(`${employee.name} has less than 2 days off in week ending ${date}`);
        }
        stats.daysOffThisWeek = 0; // Reset for next week
      });
    }
  });

  // Check Sunday work requirements
  employeeStats.forEach((stats, empId) => {
    const employee = employees.find(emp => emp.id === empId)!;
    if (!employee.isFixedSchedule && stats.sundaysWorked < 2) {
      errors.push(`${employee.name} has worked less than 2 Sundays this month`);
    }
  });

  return errors;
} 