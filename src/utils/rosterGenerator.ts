import { Employee, Roster, RosterEntry, SHIFTS } from '../types/roster';
import { validateRoster } from './rosterValidation';

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

  // Calculate number of days in the month
  const daysInMonth = new Date(year, month, 0).getDate();
  
  // Track employee statistics
  const employeeWorkDays = new Map<string, number>();
  const employeeNightShifts = new Map<string, number>();
  const employeeSundays = new Map<string, number>();
  const employeeShiftTypes = new Map<string, Set<string>>();
  const employeeLastShifts = new Map<string, string>();

  // Initialize employee stats
  employees.forEach(emp => {
    employeeWorkDays.set(emp.id, 0);
    employeeNightShifts.set(emp.id, 0);
    employeeSundays.set(emp.id, 0);
    employeeShiftTypes.set(emp.id, new Set());
    employeeLastShifts.set(emp.id, '');
  });

  // Generate roster for each day
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const isSunday = date.getDay() === 0;
    const currentEntries: RosterEntry[] = [];

    // Get available employees for this day
    let availableEmployees = employees.filter(emp => {
      // Check if employee has fixed schedule
      if (emp.isFixedSchedule && emp.fixedShift) {
        return true; // Always include employees with fixed schedules
      }

      // Check if employee had a night shift yesterday
      const yesterday = new Date(date);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayEntry = roster.entries.find(
        e => e.date === yesterday.toISOString().split('T')[0] && e.employeeId === emp.id
      );
      if (yesterdayEntry && (yesterdayEntry.shift.type === 'night' || yesterdayEntry.shift.type === 'overnight')) {
        return false;
      }

      // Check if employee has worked 5 days this week
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - date.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const daysWorkedThisWeek = roster.entries.filter(
        e => {
          const entryDate = new Date(e.date);
          return e.employeeId === emp.id && 
                 entryDate >= weekStart && 
                 entryDate <= weekEnd;
        }
      ).length;

      return daysWorkedThisWeek < 5;
    });

    // Shuffle available employees for randomization
    availableEmployees = shuffleArray(availableEmployees);

    // Define required shifts for the day
    const requiredShifts = [
      { type: 'day', minPeople: 2 },    // 07:00 - 16:00
      { type: 'mid', minPeople: 1 },    // 10:00 - 19:00
      { type: 'night', minPeople: 1 }   // 19:00 - 04:00
    ];

    // Assign shifts for this day
    for (const requiredShift of requiredShifts) {
      let remainingPeople = requiredShift.minPeople;
      let eligibleEmployees = availableEmployees.filter(emp => {
        // Check if employee hasn't worked this shift type recently
        const lastShift = employeeLastShifts.get(emp.id);
        return lastShift !== requiredShift.type;
      });

      // If not enough eligible employees, use all available
      if (eligibleEmployees.length < remainingPeople) {
        eligibleEmployees = [...availableEmployees];
      }

      // Shuffle eligible employees for randomization
      eligibleEmployees = shuffleArray(eligibleEmployees);

      while (remainingPeople > 0 && eligibleEmployees.length > 0) {
        // Select employee with least night shifts
        const selectedEmployee = eligibleEmployees.reduce((a, b) =>
          employeeNightShifts.get(a.id)! < employeeNightShifts.get(b.id)! ? a : b
        );

        // Find the actual shift object
        const shift = SHIFTS.find(s => s.type === requiredShift.type)!;

        currentEntries.push({
          date: date.toISOString().split('T')[0],
          employeeId: selectedEmployee.id,
          shift
        });

        // Update employee stats
        employeeWorkDays.set(selectedEmployee.id, employeeWorkDays.get(selectedEmployee.id)! + 1);
        if (shift.type === 'night' || shift.type === 'overnight') {
          employeeNightShifts.set(selectedEmployee.id, employeeNightShifts.get(selectedEmployee.id)! + 1);
        }
        if (isSunday) {
          employeeSundays.set(selectedEmployee.id, employeeSundays.get(selectedEmployee.id)! + 1);
        }
        employeeShiftTypes.get(selectedEmployee.id)!.add(shift.type);
        employeeLastShifts.set(selectedEmployee.id, shift.type);

        // Remove assigned employee from available pools
        const index = availableEmployees.indexOf(selectedEmployee);
        availableEmployees.splice(index, 1);
        const eligibleIndex = eligibleEmployees.indexOf(selectedEmployee);
        eligibleEmployees.splice(eligibleIndex, 1);

        remainingPeople--;
      }
    }

    roster.entries.push(...currentEntries);
  }

  // Validate the roster
  const validationErrors = validateRoster(roster, employees);
  roster.validationErrors = validationErrors;

  return roster;
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
    default:
      return 'bg-gray-100';
  }
} 