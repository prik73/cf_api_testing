// src/components/Profile/SubmissionHeatmap.js
import React from 'react';
import { format, subDays, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';

const SubmissionHeatmap = ({ data }) => {
  // Generate last 12 weeks of data
  const endDate = new Date();
  const startDate = subDays(endDate, 84); // 12 weeks
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Group days by weeks
  const weeks = [];
  let currentWeek = [];
  
  days.forEach((day, index) => {
    if (index === 0) {
      // Fill empty days at start of first week
      const startOfFirstWeek = startOfWeek(day);
      const emptyDays = days[0].getDay();
      for (let i = 0; i < emptyDays; i++) {
        currentWeek.push(null);
      }
    }
    
    currentWeek.push(day);
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  
  // Add remaining days to last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  const getIntensity = (date) => {
    if (!date) return 0;
    const dateStr = format(date, 'yyyy-MM-dd');
    const count = data[dateStr] || 0;
    
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 5) return 2;
    if (count <= 10) return 3;
    return 4;
  };

  const getColor = (intensity) => {
    const colors = [
      'bg-gray-100 dark:bg-gray-800', // No activity
      'bg-green-200 dark:bg-green-900/40', // Low
      'bg-green-300 dark:bg-green-800/60', // Medium low
      'bg-green-400 dark:bg-green-700/80', // Medium high
      'bg-green-500 dark:bg-green-600', // High
    ];
    return colors[intensity] || colors[0];
  };

  const monthLabels = [];
  const today = new Date();
  for (let i = 2; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    monthLabels.push(format(date, 'MMM'));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3, 4].map(intensity => (
            <div
              key={intensity}
              className={`w-3 h-3 rounded-sm ${getColor(intensity)}`}
              title={`${intensity === 0 ? 'No' : intensity === 1 ? '1-2' : intensity === 2 ? '3-5' : intensity === 3 ? '6-10' : '10+'} submissions`}
            />
          ))}
        </div>
        <span>More</span>
      </div>
      
      <div className="flex gap-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day, dayIndex) => {
              const intensity = getIntensity(day);
              const count = day ? (data[format(day, 'yyyy-MM-dd')] || 0) : 0;
              
              return (
                <div
                  key={dayIndex}
                  className={`w-3 h-3 rounded-sm ${getColor(intensity)} border border-gray-200 dark:border-gray-700`}
                  title={day ? `${format(day, 'MMM dd, yyyy')}: ${count} submissions` : ''}
                />
              );
            })}
          </div>
        ))}
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground">
        {monthLabels.map((month, index) => (
          <span key={index}>{month}</span>
        ))}
      </div>
    </div>
  );
};

export default SubmissionHeatmap;   