import * as XLSX from 'xlsx';
import { Employee, Roster } from '../types/roster';

export const exportToExcel = (roster: Roster, employees: Employee[]) => {
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  
  // Create the main roster sheet
  const rosterData: any[] = [];
  
  // Add headers
  const headers = ['Employee'];
  for (let i = 1; i <= 31; i++) {
    const date = new Date(2025, 6, i);
    headers.push(date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
  }
  rosterData.push(headers);

  // Add employee rows
  employees.forEach(employee => {
    const row: any[] = [employee.name];
    
    // Fill in shifts for each day
    for (let i = 1; i <= 31; i++) {
      const date = new Date(2025, 6, i);
      const dateStr = date.toISOString().split('T')[0];
      const entry = roster.entries.find(e => e.date === dateStr && e.employeeId === employee.id);
      
      if (entry) {
        row.push(`${entry.shift.type.toUpperCase()}\n${entry.shift.startTime} - ${entry.shift.endTime}`);
      } else {
        row.push('');
      }
    }
    
    rosterData.push(row);
  });

  // Create the worksheet
  const ws = XLSX.utils.aoa_to_sheet(rosterData);

  // Set column widths
  const colWidths = [
    { wch: 20 }, // Employee name column
    ...Array(31).fill({ wch: 15 }) // Day columns
  ];
  ws['!cols'] = colWidths;

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, 'July 2025 Roster');

  // Create statistics sheet
  const statsData = [
    ['Employee Statistics'],
    ['Employee', 'Total Shifts', 'Night Shifts', 'Sundays Worked', 'Last Shift Date'],
    ...employees.map(emp => {
      const employeeEntries = roster.entries.filter(e => e.employeeId === emp.id);
      const nightShifts = employeeEntries.filter(e => e.shift.type === 'night' || e.shift.type === 'overnight').length;
      const sundays = employeeEntries.filter(e => {
        const date = new Date(e.date);
        return date.getDay() === 0;
      }).length;
      const lastShift = employeeEntries.length > 0 
        ? new Date(Math.max(...employeeEntries.map(e => new Date(e.date).getTime())))
        : null;

      return [
        emp.name,
        employeeEntries.length,
        nightShifts,
        sundays,
        lastShift ? lastShift.toLocaleDateString() : 'N/A'
      ];
    })
  ];

  const statsWs = XLSX.utils.aoa_to_sheet(statsData);
  statsWs['!cols'] = [
    { wch: 20 }, // Employee name
    { wch: 15 }, // Total shifts
    { wch: 15 }, // Night shifts
    { wch: 15 }, // Sundays
    { wch: 15 }  // Last shift
  ];

  // Add the statistics worksheet
  XLSX.utils.book_append_sheet(wb, statsWs, 'Statistics');

  // Save the file
  XLSX.writeFile(wb, 'july_2025_roster.xlsx');
}; 