import * as XLSX from 'xlsx-js-style';
import { Employee, Roster } from '../types/roster';

export function exportToExcel(roster: Roster, employees: Employee[]) {
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  
  // Create headers array - Employee + all 31 days of July 2025
  const headers = ['Employee'];
  for (let day = 1; day <= 31; day++) {
    const date = new Date(2025, 6, day); // July 2025
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    headers.push(`${dayName} ${dayDate}`);
  }
  
  // Create data array starting with headers
  const data = [headers];
  
  // Add employee rows
  employees.forEach(employee => {
    const row = [employee.name];
    
    // Add data for each day of the month
    for (let day = 1; day <= 31; day++) {
      const date = new Date(2025, 6, day);
      const dateStr = date.toISOString().split('T')[0];
      const entry = roster.entries.find(e => e.date === dateStr && e.employeeId === employee.id);
      
      if (entry) {
        if (entry.shift.type === 'off') {
          row.push('OFF');
        } else {
          row.push(`${entry.shift.startTime} - ${entry.shift.endTime}`);
        }
      } else {
        row.push('');
      }
    }
    data.push(row);
  });
  
  // Create worksheet from data
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 20 }, // Employee name column
    ...Array(31).fill({ wch: 12 }) // Day columns (slightly smaller for 31 columns)
  ];

  // Apply styles to header row (row 1) - Light Blue
  for (let col = 0; col < 32; col++) { // 32 columns total (employee + 31 days)
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellRef]) {
      ws[cellRef] = { v: headers[col] || '', t: 's' };
    }
    ws[cellRef].s = {
      fill: {
        fgColor: { rgb: "87CEEB" } // Light blue
      },
      font: {
        bold: true,
        name: "Arial",
        sz: 10
      },
      alignment: {
        horizontal: "center",
        vertical: "center"
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };
  }

  // Apply styles to third row (row 3) - Yellow
  for (let col = 0; col < 32; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 2, c: col });
    if (!ws[cellRef]) {
      ws[cellRef] = { v: '', t: 's' };
    }
    ws[cellRef].s = {
      fill: {
        fgColor: { rgb: "FFFF00" } // Yellow
      },
      font: {
        name: "Arial",
        sz: 10
      },
      alignment: {
        horizontal: "center",
        vertical: "center"
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };
  }

  // Apply orange color to "OFF" cells and style all cells
  employees.forEach((employee, empIndex) => {
    const rowIndex = empIndex + 1; // +1 because of header row
    
    // Style employee name cell
    const nameCell = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
    if (ws[nameCell]) {
      ws[nameCell].s = {
        font: {
          name: "Arial",
          sz: 10,
          bold: true
        },
        alignment: {
          horizontal: "left",
          vertical: "center"
        },
        fill: {
          fgColor: { rgb: "F0F0F0" } // Light gray background for employee names
        },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }
    
    // Style day cells
    for (let day = 1; day <= 31; day++) {
      const colIndex = day; // day 1 = column 1, etc.
      const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
      
      const date = new Date(2025, 6, day);
      const dateStr = date.toISOString().split('T')[0];
      const entry = roster.entries.find(e => e.date === dateStr && e.employeeId === employee.id);
      
      if (entry && entry.shift.type === 'off') {
        if (!ws[cellRef]) {
          ws[cellRef] = { v: 'OFF', t: 's' };
        }
        ws[cellRef].s = {
          fill: {
            fgColor: { rgb: "FFA500" } // Orange for OFF days
          },
          font: {
            name: "Arial",
            sz: 10,
            bold: true
          },
          alignment: {
            horizontal: "center",
            vertical: "center"
          },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      } else if (ws[cellRef]) {
        // Apply default styling to working days
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
        
        ws[cellRef].s = {
          font: {
            name: "Arial",
            sz: 9
          },
          alignment: {
            horizontal: "center",
            vertical: "center"
          },
          fill: {
            fgColor: { rgb: isWeekend ? "F0F8FF" : "FFFFFF" } // Light blue for weekends, white for weekdays
          },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }
    }
  });

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, 'July 2025 Roster');

  // Write file using xlsx-js-style
  XLSX.writeFile(wb, 'july_2025_roster.xlsx');
}

// Helper function to convert string to ArrayBuffer
function s2ab(s: string): ArrayBuffer {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < s.length; i++) {
    view[i] = s.charCodeAt(i) & 0xFF;
  }
  return buf;
}

export const exportToExcelOld = (roster: Roster, employees: Employee[]) => {
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