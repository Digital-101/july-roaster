'use client';

import { useState } from 'react';
import { Employee, INITIAL_EMPLOYEES, Roster, RosterEntry } from '../types/roster';
import { generateRoster, calculateEmployeeStats } from '../utils/rosterGenerator';
import { formatDate, getShiftColor } from '../utils/rosterGenerator';
import { exportToExcel } from '../utils/excelExport';

export default function Home() {
  const [employees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [roster, setRoster] = useState<Roster | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentWeek, setCurrentWeek] = useState(0);

  const handleGenerateRoster = () => {
    setIsGenerating(true);
    try {
      const newRoster = generateRoster(employees, 7, 2025); // July 2025
      setRoster(newRoster);
      setCurrentWeek(0);
    } catch (error) {
      console.error('Failed to generate roster:', error);
      alert('Failed to generate roster. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportToExcel = () => {
    if (roster) {
      exportToExcel(roster, employees);
    }
  };

  const getWeekEntries = () => {
    if (!roster) return [];
    const startDate = new Date(2025, 6, 1 + currentWeek * 7); // July 1st + week offset
    const endDate = new Date(2025, 6, 7 + currentWeek * 7); // July 7th + week offset
    return roster.entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });
  };

  const getEntriesByDay = () => {
    const weekEntries = getWeekEntries();
    const entriesByDay = new Map<string, RosterEntry[]>();
    
    // Initialize all days of the week
    for (let i = 0; i < 7; i++) {
      const date = new Date(2025, 6, 1 + currentWeek * 7 + i);
      entriesByDay.set(date.toISOString().split('T')[0], []);
    }

    // Group entries by day
    weekEntries.forEach(entry => {
      const dayEntries = entriesByDay.get(entry.date) || [];
      dayEntries.push(entry);
      entriesByDay.set(entry.date, dayEntries);
    });

    return entriesByDay;
  };

  const getMonthEntries = () => {
    if (!roster) return new Map<string, RosterEntry[]>();
    const entriesByDay = new Map<string, RosterEntry[]>();
    
    // Initialize all days of the month
    for (let i = 1; i <= 31; i++) {
      const date = new Date(2025, 6, i);
      entriesByDay.set(date.toISOString().split('T')[0], []);
    }

    // Group entries by day
    roster.entries.forEach(entry => {
      const dayEntries = entriesByDay.get(entry.date) || [];
      dayEntries.push(entry);
      entriesByDay.set(entry.date, dayEntries);
    });

    return entriesByDay;
  };

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const renderEmployeeStats = () => {
    if (!roster) return null;

    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Employee Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {employees.map(employee => {
            const stats = calculateEmployeeStats(roster, employee);
            const employeeEntries = roster.entries.filter(e => e.employeeId === employee.id);
            const offDays = employeeEntries.filter(e => e.shift.type === 'off');
            
            // Calculate days off per week
            const weeklyOff = [0, 0, 0, 0, 0]; // 5 weeks in July 2025
            offDays.forEach(entry => {
              const date = new Date(entry.date);
              const firstOfMonth = new Date(2025, 6, 1);
              const daysDiff = Math.floor((date.getTime() - firstOfMonth.getTime()) / (1000 * 60 * 60 * 24));
              const week = Math.floor(daysDiff / 7);
              if (week >= 0 && week < 5) {
                weeklyOff[week]++;
              }
            });
            
            return (
              <div key={employee.id} className="stat-card bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-lg text-gray-800 mb-2">{employee.name}</h4>
                <div className="value text-2xl font-bold text-blue-600 mb-2">{stats.workingDays} days</div>
                <small className="text-gray-600 text-sm mb-2 block">
                  {stats.sundaysWorked} Sundays, {stats.nightShifts} night shifts, {stats.consecutiveOffPairs} consecutive off pairs
                </small>
                <div className="text-xs text-gray-500">
                  <div className="font-medium mb-1">Days off per week:</div>
                  <div className="grid grid-cols-5 gap-1">
                    {weeklyOff.map((count, week) => (
                      <div key={week} className={`text-center p-1 rounded ${count === 2 ? 'bg-green-100' : count > 2 ? 'bg-red-100' : 'bg-yellow-100'}`}>
                        W{week + 1}: {count}
                      </div>
                    ))}
                  </div>
                  <div className="mt-1">
                    Total off days: {offDays.length}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const entriesByDay = getEntriesByDay();
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 bg-gray-50 sticky left-0 z-10">Employee</th>
              {weekDays.map((day, index) => {
                const date = new Date(2025, 6, 1 + currentWeek * 7 + index);
                return (
                  <th key={day} className="border p-2 bg-gray-50">
                    <div className="text-sm font-semibold">
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {employees.map(employee => (
              <tr key={employee.id}>
                <td className="border p-2 bg-gray-50 sticky left-0 z-10 font-medium">
                  {employee.name}
                </td>
                {weekDays.map((_, index) => {
                  const date = new Date(2025, 6, 1 + currentWeek * 7 + index);
                  const dateStr = date.toISOString().split('T')[0];
                  const entries = entriesByDay.get(dateStr) || [];
                  const employeeEntry = entries.find(entry => entry.employeeId === employee.id);
                  
                  return (
                    <td key={index} className="border p-2">
                      {employeeEntry && (
                        <div className={`p-2 rounded ${getShiftColor(employeeEntry.shift.type)}`}>
                          <div className="text-sm font-medium">
                            {employeeEntry.shift.type === 'off' ? 'OFF' : employeeEntry.shift.type.toUpperCase()}
                          </div>
                          {employeeEntry.shift.type !== 'off' && (
                            <div className="text-xs text-gray-600">
                              {employeeEntry.shift.startTime} - {employeeEntry.shift.endTime}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderEmployeeMonthView = () => {
    const entriesByDay = getMonthEntries();
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 bg-gray-50 sticky left-0 z-10">Employee</th>
              {Array.from({ length: 31 }, (_, i) => (
                <th key={i} className="border p-2 bg-gray-50">
                  <div className="text-sm font-semibold">
                    {new Date(2025, 6, i + 1).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(2025, 6, i + 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map(employee => (
              <tr key={employee.id}>
                <td className="border p-2 bg-gray-50 sticky left-0 z-10 font-medium">
                  {employee.name}
                </td>
                {Array.from({ length: 31 }, (_, i) => {
                  const date = new Date(2025, 6, i + 1);
                  const dateStr = date.toISOString().split('T')[0];
                  const entries = entriesByDay.get(dateStr) || [];
                  const employeeEntry = entries.find(entry => entry.employeeId === employee.id);
                  
                  return (
                    <td key={i} className="border p-2">
                      {employeeEntry && (
                        <div className={`p-2 rounded ${getShiftColor(employeeEntry.shift.type)}`}>
                          <div className="text-sm font-medium">
                            {employeeEntry.shift.type === 'off' ? 'OFF' : employeeEntry.shift.type.toUpperCase()}
                          </div>
                          {employeeEntry.shift.type !== 'off' && (
                            <div className="text-xs text-gray-600">
                              {employeeEntry.shift.startTime} - {employeeEntry.shift.endTime}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">July 2025 Roster</h1>
          <div className="space-x-4">
            <button
              onClick={handleGenerateRoster}
              disabled={isGenerating}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate Roster'}
            </button>
            {roster && (
              <button
                onClick={handleExportToExcel}
                className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
              >
                Export to Excel
              </button>
            )}
          </div>
        </div>

        {roster && roster.validationErrors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Validation Errors:</h3>
            <ul className="list-disc list-inside text-red-700 text-sm">
              {roster.validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {roster && renderEmployeeStats()}

        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4">
            {viewMode === 'week' && (
              <>
                <button
                  onClick={() => setCurrentWeek(prev => Math.max(0, prev - 1))}
                  disabled={currentWeek === 0}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:bg-gray-300"
                >
                  Previous Week
                </button>
                <button
                  onClick={() => setCurrentWeek(prev => Math.min(3, prev + 1))}
                  disabled={currentWeek === 3}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:bg-gray-300"
                >
                  Next Week
                </button>
              </>
            )}
            <button
              onClick={() => setViewMode(viewMode === 'week' ? 'month' : 'week')}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              {viewMode === 'week' ? 'Show Month View' : 'Show Week View'}
            </button>
          </div>
        </div>

        {viewMode === 'week' ? renderWeekView() : renderEmployeeMonthView()}
      </div>
    </main>
  );
} 