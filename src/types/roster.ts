export type ShiftType = 'day' | 'mid' | 'night' | 'overnight' | 'regular' | 'off' | 'al';

export type Shift = {
  startTime: string;
  endTime: string;
  type: ShiftType;
  minPeople: number;
};

export type Employee = {
  id: string;
  name: string;
  daysOff: number[];
  isFixedSchedule?: boolean;
  fixedShift?: Shift;
  sundaysWorked: number;
  nightShiftsWorked: number;
  totalDaysWorked: number;
  shiftTypesWorked: Record<ShiftType, number>;
};

export type RosterEntry = {
  date: string;
  employeeId: string;
  shift: Shift;
};

export type Roster = {
  entries: RosterEntry[];
  month: number;
  year: number;
  validationErrors: string[];
};

export const SHIFTS: Shift[] = [
  { startTime: '07:00', endTime: '16:00', type: 'day', minPeople: 2 },
  { startTime: '10:00', endTime: '19:00', type: 'mid', minPeople: 1 },
  { startTime: '19:00', endTime: '04:00', type: 'night', minPeople: 1 },
  { startTime: '22:00', endTime: '07:00', type: 'overnight', minPeople: 1 },
  { startTime: '08:00', endTime: '17:00', type: 'regular', minPeople: 1 },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  { 
    id: '1', 
    name: 'Nonto', 
    daysOff: [0, 6],
    sundaysWorked: 0,
    nightShiftsWorked: 0,
    totalDaysWorked: 0,
    shiftTypesWorked: {
      day: 0, mid: 0, night: 0, overnight: 0, regular: 0, off: 0, al: 0
    }
  },
  { 
    id: '2', 
    name: 'Philani', 
    daysOff: [5, 6], // Friday and Saturday
    isFixedSchedule: true,
    fixedShift: SHIFTS[0], // 07:00 - 16:00
    sundaysWorked: 0,
    nightShiftsWorked: 0,
    totalDaysWorked: 0,
    shiftTypesWorked: {
      day: 0, mid: 0, night: 0, overnight: 0, regular: 0, off: 0, al: 0
    }
  },
  { 
    id: '3', 
    name: 'Yakeen', 
    daysOff: [3, 4],
    sundaysWorked: 0,
    nightShiftsWorked: 0,
    totalDaysWorked: 0,
    shiftTypesWorked: {
      day: 0, mid: 0, night: 0, overnight: 0, regular: 0, off: 0, al: 0
    }
  },
  { 
    id: '4', 
    name: 'Neli', 
    daysOff: [5, 6],
    sundaysWorked: 0,
    nightShiftsWorked: 0,
    totalDaysWorked: 0,
    shiftTypesWorked: {
      day: 0, mid: 0, night: 0, overnight: 0, regular: 0, off: 0, al: 0
    }
  },
  { 
    id: '5', 
    name: 'Andile', 
    daysOff: [0, 1],
    sundaysWorked: 0,
    nightShiftsWorked: 0,
    totalDaysWorked: 0,
    shiftTypesWorked: {
      day: 0, mid: 0, night: 0, overnight: 0, regular: 0, off: 0, al: 0
    }
  },
  { 
    id: '6', 
    name: 'Nduduzo', 
    daysOff: [2, 3],
    sundaysWorked: 0,
    nightShiftsWorked: 0,
    totalDaysWorked: 0,
    shiftTypesWorked: {
      day: 0, mid: 0, night: 0, overnight: 0, regular: 0, off: 0, al: 0
    }
  },
  { 
    id: '7', 
    name: 'Shemuel', 
    daysOff: [4, 5],
    sundaysWorked: 0,
    nightShiftsWorked: 0,
    totalDaysWorked: 0,
    shiftTypesWorked: {
      day: 0, mid: 0, night: 0, overnight: 0, regular: 0, off: 0, al: 0
    }
  },
]; 