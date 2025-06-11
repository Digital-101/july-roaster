import { Employee, Roster, RosterEntry, SHIFTS } from '../types/roster';
import { validateRoster } from './rosterValidation';
import { FIXED_TEMPLATE } from './fixedTemplate';

function getDefaultShiftForDay(dayIdx: number) {
  // Default to 07:00 - 16:00 for Sundays, else use day or mid
  const date = new Date(2025, 6, dayIdx + 1);
  if (date.getDay() === 0) return SHIFTS.find(s => s.type === 'day');
  return SHIFTS.find(s => s.type === 'mid') || SHIFTS[0];
}

function getWorkingShift(dayInPattern: number): typeof SHIFTS[0] {
  // Rotate through different shift types for working days
  const shiftTypes = ['day', 'mid', 'night', 'overnight'];
  const shiftType = shiftTypes[dayInPattern % shiftTypes.length];
  return SHIFTS.find(s => s.type === shiftType) || SHIFTS[0];
}

export function generateRoster(employees: Employee[], month: number, year: number): Roster {
  const roster: Roster = {
    entries: [],
    validationErrors: [],
    month,
    year
  };

  // Only apply the fixed template for July 2025
  if (month === 7 && year === 2025) {
    for (let empIdx = 0; empIdx < employees.length; empIdx++) {
      const employee = employees[empIdx];
      
      // Special handling for Philani - consistent day shifts
      if (employee.name === 'Philani') {
        const dayShift = SHIFTS.find(s => s.type === 'day');
        if (dayShift) {
          for (let day = 1; day <= 31; day++) {
            roster.entries.push({
              date: new Date(2025, 6, day).toISOString().split('T')[0],
              employeeId: employee.id,
              shift: dayShift
            });
          }
        }
        continue;
      }

      // Remove AL and repeat pattern to fill 31 days
      let pattern = FIXED_TEMPLATE[empIdx].filter(shift => shift !== 'AL');
      while (pattern.length < 31) {
        pattern = pattern.concat(pattern).slice(0, 31);
      }

      let dayInPattern = 0; // Track position in 5-2 pattern
      let isWorkingDay = true; // Start with working day

      for (let day = 1; day <= 31; day++) {
        const date = new Date(2025, 6, day);
        let shiftStr = pattern[day - 1];
        
        // Ignore blue
        if (!shiftStr || shiftStr === '08:00 - 17:00') {
          // If empty, fill with 5-2 pattern
          if (isWorkingDay) {
            const shift = getWorkingShift(dayInPattern);
            roster.entries.push({
              date: date.toISOString().split('T')[0],
              employeeId: employee.id,
              shift
            });
            dayInPattern++;
            if (dayInPattern >= 5) {
              isWorkingDay = false;
              dayInPattern = 0;
            }
          } else {
            // Add off day
            roster.entries.push({
              date: date.toISOString().split('T')[0],
              employeeId: employee.id,
              shift: {
                startTime: '',
                endTime: '',
                type: 'off',
                minPeople: 0
              }
            });
            dayInPattern++;
            if (dayInPattern >= 2) {
              isWorkingDay = true;
              dayInPattern = 0;
            }
          }
          continue;
        }

        // Handle existing shifts from template
        const shift = SHIFTS.find(s => `${s.startTime} - ${s.endTime}` === shiftStr);
        if (!shift) {
          if (shiftStr === 'OFF') {
            roster.entries.push({
              date: date.toISOString().split('T')[0],
              employeeId: employee.id,
              shift: {
                startTime: '',
                endTime: '',
                type: 'off',
                minPeople: 0
              }
            });
          }
          continue;
        }
        roster.entries.push({
          date: date.toISOString().split('T')[0],
          employeeId: employee.id,
          shift
        });
      }
    }
    roster.validationErrors = validateRoster(roster, employees);
    return roster;
  }

  // fallback: original logic (not used for July 2025)
  return {
    entries: [],
    validationErrors: [],
    month,
    year
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
      return 'bg-blue-100';
    case 'mid':
      return 'bg-green-100';
    case 'night':
      return 'bg-purple-100';
    case 'overnight':
      return 'bg-indigo-100';
    case 'off':
      return 'bg-orange-100';
    case 'al':
      return 'bg-red-200';
    default:
      return 'bg-gray-100';
  }
} 