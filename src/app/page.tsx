'use client';

import { useState } from 'react';
import { Employee, INITIAL_EMPLOYEES, Roster, RosterEntry } from '../types/roster';
import { generateRoster } from '../utils/rosterGenerator';
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
                    <div className="text-sm font-semibold">{day}</div>
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
                            {employeeEntry.shift.type.toUpperCase()}
                          </div>
                          <div className="text-xs text-gray-600">
                            {employeeEntry.shift.startTime} - {employeeEntry.shift.endTime}
                          </div>
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
                            {employeeEntry.shift.type.toUpperCase()}
                          </div>
                          <div className="text-xs text-gray-600">
                            {employeeEntry.shift.startTime} - {employeeEntry.shift.endTime}
                          </div>
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
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">July 2025 Roster Generator</h1>
        
        <div className="mb-8 text-center">
          <button
            onClick={handleGenerateRoster}
            disabled={isGenerating}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isGenerating ? 'Generating...' : 'Generate Roster'}
          </button>
        </div>

        {roster && (
          <div className="space-y-8">
            {roster.validationErrors.length > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Validation Warnings</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <ul className="list-disc pl-5 space-y-1">
                        {roster.validationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
              <button
                onClick={handleExportToExcel}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Export to Excel
              </button>
            </div>

            {viewMode === 'week' ? renderWeekView() : renderEmployeeMonthView()}
          </div>
        )}
      </div>
    </main>
  );
} 