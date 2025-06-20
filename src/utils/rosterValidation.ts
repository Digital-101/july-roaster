import { Employee, Roster, RosterEntry, ShiftType } from '../types/roster';

// Helper function to get week number for a date (1-based, starting from July 1st)
function getWeekNumber(date: string): number {
  const entryDate = new Date(date);
  const firstOfMonth = new Date(2025, 6, 1); // July 1st, 2025
  const daysDiff = Math.floor((entryDate.getTime() - firstOfMonth.getTime()) / (1000 * 60 * 60 * 24));
  return Math.floor(daysDiff / 7) + 1;
}

// Helper function to check if a shift is a night shift
function isNightShift(shiftType: ShiftType): boolean {
  return shiftType === 'night' || shiftType === 'overnight';
}

// Helper function to check if a shift is a day shift
function isDayShift(shiftType: ShiftType): boolean {
  return shiftType === 'day' || shiftType === 'mid' || shiftType === 'regular';
}

// Helper function to get shift times from shift type
function getShiftTimes(shiftType: ShiftType): { start: string; end: string } | null {
  const shiftMap: Record<ShiftType, { start: string; end: string }> = {
    'day': { start: '07:00', end: '16:00' },
    'mid': { start: '10:00', end: '19:00' },
    'night': { start: '19:00', end: '04:00' },
    'overnight': { start: '22:00', end: '07:00' },
    'regular': { start: '08:00', end: '17:00' },
    'off': { start: '', end: '' },
    'al': { start: '', end: '' }
  };
  return shiftMap[shiftType] || null;
}

// Helper function to check if time is within shift coverage
function isTimeInShift(time: string, startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return false;
  
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(startTime);
  let endMinutes = timeToMinutes(endTime);
  
  // Handle overnight shifts (end time is next day)
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60; // Add 24 hours
    if (timeMinutes < 12 * 60) { // If time is in early morning, it's part of overnight shift
      return timeMinutes + 24 * 60 >= startMinutes && timeMinutes + 24 * 60 <= endMinutes;
    }
  }
  
  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
}

// Helper function to convert time string to minutes
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Validate minimum daily coverage requirements
function validateDailyCoverage(roster: Roster): string[] {
  const errors: string[] = [];
  const entriesByDate = new Map<string, RosterEntry[]>();
  
  // Group entries by date
  roster.entries.forEach(entry => {
    if (!entriesByDate.has(entry.date)) {
      entriesByDate.set(entry.date, []);
    }
    entriesByDate.get(entry.date)!.push(entry);
  });
  
  // Check coverage for each day
  entriesByDate.forEach((entries, date) => {
    const workingEntries = entries.filter(entry => 
      entry.shift.type !== 'off' && entry.shift.type !== 'al'
    );
    
    // Check if we have at least 1 person for 07:00-16:00
    const dayShiftCoverage = workingEntries.some(entry => 
      isTimeInShift('07:00', entry.shift.startTime, entry.shift.endTime) &&
      isTimeInShift('16:00', entry.shift.startTime, entry.shift.endTime)
    );
    
    if (!dayShiftCoverage) {
      errors.push(`No coverage for 07:00-16:00 shift on ${date}`);
    }
    
    // Check if we have at least 1 person for 10:00-19:00
    const midShiftCoverage = workingEntries.some(entry => 
      isTimeInShift('10:00', entry.shift.startTime, entry.shift.endTime) &&
      isTimeInShift('19:00', entry.shift.startTime, entry.shift.endTime)
    );
    
    if (!midShiftCoverage) {
      errors.push(`No coverage for 10:00-19:00 shift on ${date}`);
    }
    
    // Check if we have at least 1 person for 19:00-04:00 (night)
    const nightShiftCoverage = workingEntries.some(entry => 
      (entry.shift.startTime === '19:00' && entry.shift.endTime === '04:00') ||
      isTimeInShift('19:00', entry.shift.startTime, entry.shift.endTime)
    );
    
    if (!nightShiftCoverage) {
      errors.push(`No coverage for 19:00-04:00 night shift on ${date}`);
    }
    
    // Check if we have at least 1 person for 22:00-07:00 (overnight)
    const overnightShiftCoverage = workingEntries.some(entry => 
      (entry.shift.startTime === '22:00' && entry.shift.endTime === '07:00') ||
      isTimeInShift('22:00', entry.shift.startTime, entry.shift.endTime)
    );
    
    if (!overnightShiftCoverage) {
      errors.push(`No coverage for 22:00-07:00 overnight shift on ${date}`);
    }
    
    // Check if we have 4-6 people working per day (1-3 people off)
    if (workingEntries.length < 4) {
      errors.push(`Insufficient staffing on ${date}: only ${workingEntries.length} people working, minimum 4 required`);
    } else if (workingEntries.length > 6) {
      errors.push(`Overstaffing on ${date}: ${workingEntries.length} people working, maximum 6 allowed`);
    }
    
    // Check if we have 1-3 people off per day
    const offEntries = entries.filter(entry => 
      entry.shift.type === 'off' || entry.shift.type === 'al'
    );
    
    if (offEntries.length < 1) {
      errors.push(`No one is off on ${date}, at least 1 person must be off each day`);
    } else if (offEntries.length > 3) {
      errors.push(`Too many people off on ${date}: ${offEntries.length} people off, maximum 3 allowed`);
    }
  });
  
  return errors;
}

// Validate that each employee gets exactly 2 days off per week
function validateTwoDaysOffPerWeek(roster: Roster, employees: Employee[]): string[] {
  const errors: string[] = [];
  const totalWeeks = 5; // July 2025 has 5 weeks (31 days)
  
  employees.forEach(employee => {
    const employeeEntries = roster.entries.filter(e => e.employeeId === employee.id);
    
    // Group entries by week
    const entriesByWeek = new Map<number, RosterEntry[]>();
    for (let week = 1; week <= totalWeeks; week++) {
      entriesByWeek.set(week, []);
    }
    
    employeeEntries.forEach(entry => {
      const week = getWeekNumber(entry.date);
      if (week >= 1 && week <= totalWeeks) {
        const weekEntries = entriesByWeek.get(week) || [];
        weekEntries.push(entry);
        entriesByWeek.set(week, weekEntries);
      }
    });
    
    // Check each week has exactly 2 days off
    entriesByWeek.forEach((weekEntries, weekNum) => {
      const offDays = weekEntries.filter(entry => 
        entry.shift.type === 'off' || entry.shift.type === 'al'
      );
      
      // For incomplete weeks (like week 5), adjust expectations
      if (weekNum === 5) {
        // Week 5 only has 3 days (July 29-31), so expect 1 day off
        if (offDays.length > 1) {
          errors.push(`${employee.name}: Week ${weekNum} has ${offDays.length} days off, expected at most 1 for partial week`);
        }
      } else if (weekNum === 1) {
        // Week 1 starts from July 1st (Tuesday), so expect proportional days off
        const totalDaysInWeek = weekEntries.length;
        const expectedOffDays = Math.round((totalDaysInWeek / 7) * 2);
        if (offDays.length !== expectedOffDays) {
          errors.push(`${employee.name}: Week ${weekNum} has ${offDays.length} days off, expected ${expectedOffDays} for ${totalDaysInWeek}-day week`);
        }
      } else {
        // Full weeks should have exactly 2 days off
        if (offDays.length !== 2) {
          errors.push(`${employee.name}: Week ${weekNum} has ${offDays.length} days off, expected exactly 2`);
        }
      }
    });
  });
  
  return errors;
}

// Validate minimum 2 shifts before day off rule
function validateMinimumShiftsBeforeDayOff(roster: Roster, employees: Employee[]): string[] {
  const errors: string[] = [];
  
  employees.forEach(employee => {
    const employeeEntries = roster.entries
      .filter(e => e.employeeId === employee.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let consecutiveWorkDays = 0;
    let previousWasOff = false;
    
    employeeEntries.forEach((entry, index) => {
      const isOff = entry.shift.type === 'off' || entry.shift.type === 'al';
      
      if (isOff) {
        // Check if this is a day off after less than 2 working days
        if (consecutiveWorkDays > 0 && consecutiveWorkDays < 2) {
          errors.push(`${employee.name}: Day off on ${entry.date} after only ${consecutiveWorkDays} working day(s). Minimum 2 shifts required before day off.`);
        }
        
        // Check for alternating pattern: shift -> off -> shift -> off
        if (previousWasOff && index > 0 && index < employeeEntries.length - 1) {
          const nextEntry = employeeEntries[index + 1];
          const nextIsWork = nextEntry && nextEntry.shift.type !== 'off' && nextEntry.shift.type !== 'al';
          if (nextIsWork && index + 2 < employeeEntries.length) {
            const afterNextEntry = employeeEntries[index + 2];
            const afterNextIsOff = afterNextEntry.shift.type === 'off' || afterNextEntry.shift.type === 'al';
            if (afterNextIsOff) {
              errors.push(`${employee.name}: Invalid alternating pattern (shift->off->shift->off) detected around ${entry.date}`);
            }
          }
        }
        
        consecutiveWorkDays = 0;
        previousWasOff = true;
      } else {
        consecutiveWorkDays++;
        previousWasOff = false;
      }
    });
  });
  
  return errors;
}

// Validate no day shift after night shift rule
function validateNoDayShiftAfterNight(roster: Roster, employees: Employee[]): string[] {
  const errors: string[] = [];
  
  employees.forEach(employee => {
    const employeeEntries = roster.entries
      .filter(e => e.employeeId === employee.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    for (let i = 1; i < employeeEntries.length; i++) {
      const previousEntry = employeeEntries[i - 1];
      const currentEntry = employeeEntries[i];
      
      if (isNightShift(previousEntry.shift.type) && isDayShift(currentEntry.shift.type)) {
        errors.push(`${employee.name}: Day shift (${currentEntry.shift.type}) on ${currentEntry.date} after night shift (${previousEntry.shift.type}) on ${previousEntry.date}. Day shift not allowed after night shift.`);
      }
    }
  });
  
  return errors;
}

// Validate minimum 2 Sundays per month
function validateMinimumSundays(roster: Roster, employees: Employee[]): string[] {
  const errors: string[] = [];
  
  employees.forEach(employee => {
    // Skip fixed schedule employees (like Philani who works every Sunday)
    if (employee.isFixedSchedule) return;
    
    const employeeEntries = roster.entries.filter(e => e.employeeId === employee.id);
    let sundaysWorked = 0;
    
    employeeEntries.forEach(entry => {
      const date = new Date(entry.date);
      const isSunday = date.getDay() === 0;
      const isWorking = entry.shift.type !== 'off' && entry.shift.type !== 'al';
      
      if (isSunday && isWorking) {
        sundaysWorked++;
      }
    });
    
    if (sundaysWorked < 2) {
      errors.push(`${employee.name}: Only worked ${sundaysWorked} Sunday(s), minimum 2 required per month`);
    }
  });
  
  return errors;
}

// Validate Philani's fixed schedule
function validatePhilaniSchedule(roster: Roster, employees: Employee[]): string[] {
  const errors: string[] = [];
  const philani = employees.find(emp => emp.name === 'Philani');
  
  if (!philani) return errors;
  
  const philaniEntries = roster.entries.filter(e => e.employeeId === philani.id);
  
  philaniEntries.forEach(entry => {
    const date = new Date(entry.date);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday or Saturday
      if (entry.shift.type !== 'off') {
        errors.push(`Philani: Should be off on ${entry.date} (Friday/Saturday), but scheduled for ${entry.shift.type} shift`);
      }
    } else { // Sunday to Thursday
      if (entry.shift.type === 'off' || entry.shift.type === 'al') {
        errors.push(`Philani: Should be working on ${entry.date} (Sunday-Thursday), but scheduled as off`);
      } else if (entry.shift.startTime !== '07:00' || entry.shift.endTime !== '16:00') {
        errors.push(`Philani: Should work 07:00-16:00 on ${entry.date}, but scheduled for ${entry.shift.startTime}-${entry.shift.endTime}`);
      }
    }
  });
  
  return errors;
}

// Validate no blank entries (everyone must have an assignment)
function validateNoBlanks(roster: Roster, employees: Employee[]): string[] {
  const errors: string[] = [];
  const daysInMonth = 31; // July has 31 days
  
  employees.forEach(employee => {
    const employeeEntries = roster.entries.filter(e => e.employeeId === employee.id);
    
    if (employeeEntries.length < daysInMonth) {
      errors.push(`${employee.name}: Missing entries, has ${employeeEntries.length} days scheduled out of ${daysInMonth} required`);
    }
    
    // Check for any undefined or invalid shift assignments
    employeeEntries.forEach(entry => {
      if (!entry.shift || !entry.shift.type) {
        errors.push(`${employee.name}: Invalid or missing shift assignment on ${entry.date}`);
      }
    });
  });
  
  return errors;
}

export function validateRoster(roster: Roster, employees: Employee[]): string[] {
  const errors: string[] = [];
  
  // Run all validation checks
  errors.push(...validateDailyCoverage(roster));
  errors.push(...validateTwoDaysOffPerWeek(roster, employees));
  errors.push(...validateMinimumShiftsBeforeDayOff(roster, employees));
  errors.push(...validateNoDayShiftAfterNight(roster, employees));
  errors.push(...validateMinimumSundays(roster, employees));
  errors.push(...validatePhilaniSchedule(roster, employees));
  errors.push(...validateNoBlanks(roster, employees));
  
  return errors;
} 