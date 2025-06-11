import { Employee, Roster, RosterEntry, SHIFTS } from '../types/roster';
import { validateRoster } from './rosterValidation';
import { FIXED_TEMPLATE } from './fixedTemplate';

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
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
      for (let day = 1; day <= 31; day++) {
        const shiftStr = FIXED_TEMPLATE[empIdx][day - 1];
        if (!shiftStr || shiftStr === '08:00 - 17:00') continue; // Ignore blue
        // Find the shift object
        const shift = SHIFTS.find(s => `${s.startTime} - ${s.endTime}` === shiftStr);
        // If not found, treat as OFF or AL
        if (!shift) {
          if (shiftStr === 'OFF' || shiftStr === 'AL') {
            roster.entries.push({
              date: new Date(2025, 6, day).toISOString().split('T')[0],
              employeeId: employee.id,
              shift: {
                startTime: '',
                endTime: '',
                type: shiftStr === 'OFF' ? 'off' : 'al',
                minPeople: 0
              }
            });
          }
          continue;
        }
        roster.entries.push({
          date: new Date(2025, 6, day).toISOString().split('T')[0],
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