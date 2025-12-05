import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { daysApi } from '../api/days';
import { useSchoolYearStore } from '../store/useSchoolYearStore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { Day, DayType } from '../api/client';

export default function Calendar() {
  const { currentSchoolYear } = useSchoolYearStore();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Day | null>(null);

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const { data: days, isLoading } = useQuery({
    queryKey: ['days', currentSchoolYear?.id, format(monthStart, 'yyyy-MM-dd'), format(monthEnd, 'yyyy-MM-dd')],
    queryFn: () => daysApi.getBySchoolYear(
      currentSchoolYear!.id,
      format(monthStart, 'yyyy-MM-dd'),
      format(monthEnd, 'yyyy-MM-dd')
    ),
    enabled: !!currentSchoolYear,
  });

  if (!currentSchoolYear) {
    return (
      <div className="px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Please select a school year.</p>
        </div>
      </div>
    );
  }

  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = monthStart.getDay();
  const daysInMonth = monthDays.length;

  // Get school colors with defaults
  const primaryColor = currentSchoolYear?.primaryColor || '#3B82F6';
  const secondaryColor = currentSchoolYear?.secondaryColor || '#F59E0B';
  
  // Helper to convert hex to RGB for opacity
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 59, g: 130, b: 246 };
  };
  
  // Helper to convert RGB to hex
  const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };
  
  // Calculate complementary color (opposite on color wheel)
  const getComplementaryColor = (hex: string): string => {
    const rgb = hexToRgb(hex);
    // Complementary color is 180 degrees opposite on the color wheel
    // Formula: (255 - r, 255 - g, 255 - b) gives a simple complement
    // But for better visual contrast, we can use HSL rotation
    // For simplicity, using the subtractive complement
    const compR = 255 - rgb.r;
    const compG = 255 - rgb.g;
    const compB = 255 - rgb.b;
    return rgbToHex(compR, compG, compB);
  };
  
  const primaryRgb = hexToRgb(primaryColor);
  const secondaryRgb = hexToRgb(secondaryColor);
  const complementaryColor = getComplementaryColor(primaryColor);
  const complementaryRgb = hexToRgb(complementaryColor);

  const getDayTypeColor = (day: Day | undefined, date: Date): { className: string; style?: React.CSSProperties } => {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Weekends
    if (isWeekend && !day) {
      return { className: 'bg-gray-200 text-gray-500' };
    }
    
    if (!day) {
      return { className: 'bg-white text-black font-bold' };
    }
    
    // Non-attendance days or breaks
    if (!day.isSchoolDay || day.dayType === 'NON_ATTENDANCE' || day.dayType === 'BREAK') {
      // Weekends that are also breaks/non-attendance
      if (isWeekend) {
        return { className: 'bg-gray-200 text-gray-500' };
      }
      // Weekday non-attendance (holidays) - use complementary color (opposite on color wheel)
      return {
        className: 'border border-gray-200 font-bold',
        style: {
          backgroundColor: `rgba(${complementaryRgb.r}, ${complementaryRgb.g}, ${complementaryRgb.b}, 0.2)`,
          color: '#000000',
        }
      };
    }
    
    // Final exam days (check label) - use light shade of primary with dark border
    // Check for "final exam" in label (case insensitive, partial match)
    if (day.label && (day.label.toLowerCase().includes('final exam') || day.label.toLowerCase().includes('final exams'))) {
      return {
        className: 'border-2 font-bold',
        style: {
          backgroundColor: `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.15)`,
          color: '#000000',
          borderColor: '#000000',
        }
      };
    }
    
    // Late start days (check label and day of week)
    if (day.dayType === 'SPECIAL_SCHEDULE' && day.label && day.label.toLowerCase().includes('late start')) {
      // Late start Wednesdays get light shade of primary color with dark border
      if (dayOfWeek === 3) { // Wednesday
        return {
          className: 'border-2 font-bold',
          style: {
            backgroundColor: `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.15)`,
            color: '#000000',
            borderColor: '#000000',
          }
        };
      }
      // Other late start days - use light shade of primary color
      return {
        className: 'border border-gray-200 font-bold',
        style: {
          backgroundColor: `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.15)`,
          color: '#000000',
        }
      };
    }
    
    // Other special schedule days - use light shade of primary color (but not final exams, already handled above)
    if (day.dayType === 'SPECIAL_SCHEDULE') {
      return {
        className: 'border border-gray-200 font-bold',
        style: {
          backgroundColor: `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.15)`,
          color: '#000000',
        }
      };
    }
    
    // Regular school days - light shade of primary color
    return {
      className: 'border border-gray-200 font-bold',
      style: {
        backgroundColor: `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.15)`,
        color: '#000000',
      }
    };
  };

  const getDayForDate = (date: Date): Day | undefined => {
    if (!days) return undefined;
    // Normalize both dates to compare just the date part
    // Create a normalized date string from the calendar date (local time)
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return days.find((d) => {
      // Parse the date from the database - it comes as ISO string
      // parseISO might interpret it as UTC, so we need to extract the date components
      // directly from the ISO string to avoid timezone issues
      const isoDate = d.date; // Format: "2025-12-02T00:00:00.000Z" or "2025-12-02"
      let dbDateStr: string;
      
      if (isoDate.includes('T')) {
        // ISO format with time - extract just the date part
        dbDateStr = isoDate.split('T')[0];
      } else {
        // Already just a date string
        dbDateStr = isoDate;
      }
      
      return dbDateStr === dateStr;
    });
  };

  const handleDayClick = (date: Date) => {
    const day = getDayForDate(date);
    setSelectedDay(day || null);
  };

  return (
    <div className="px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold" style={{ color: primaryColor }}>Calendar</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-lg font-semibold text-gray-900">
            {format(selectedMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse">Loading calendar...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
                {day}
              </div>
            ))}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white p-2 min-h-[80px]" />
            ))}
            {monthDays.map((date) => {
              const day = getDayForDate(date);
              const isToday = isSameDay(date, new Date());
              const dayOfWeek = date.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const dayColor = getDayTypeColor(day, date);
              
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => handleDayClick(date)}
                  className={`p-2 min-h-[80px] text-left hover:bg-gray-50 transition-colors ${dayColor.className} ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                  style={dayColor.style}
                >
                  <div className="text-sm font-medium">{format(date, 'd')}</div>
                  {day && (
                    <div className="mt-1 text-xs">
                      {day.label && <div className="truncate font-medium">{day.label}</div>}
                      {day.dayType === 'SPECIAL_SCHEDULE' && !day.label?.toLowerCase().includes('late start') && (
                        <div className="text-yellow-700">Special</div>
                      )}
                    </div>
                  )}
                  {!day && isWeekend && (
                    <div className="mt-1 text-xs text-gray-500">Weekend</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color Legend */}
      <div className="mt-6 bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Color Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 border border-gray-300 rounded"
              style={{ backgroundColor: `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.05)` }}
            ></div>
            <span>Regular School Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 border-2 rounded"
              style={{ 
                backgroundColor: `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.15)`,
                borderColor: '#000000'
              }}
            ></div>
            <span>Late Start Wednesday</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 border border-gray-200 rounded"
              style={{ 
                backgroundColor: `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.2)`
              }}
            ></div>
            <span>Special Schedule</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 border-2 rounded"
              style={{ 
                backgroundColor: `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.15)`,
                borderColor: '#000000'
              }}
            ></div>
            <span>Final Exam Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 border border-gray-200 rounded"
              style={{ 
                backgroundColor: `rgba(${complementaryRgb.r}, ${complementaryRgb.g}, ${complementaryRgb.b}, 0.2)`
              }}
            ></div>
            <span>Holiday/Non-Attendance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <span>Weekend/Break</span>
          </div>
        </div>
      </div>

      {selectedDay && (
        <DayDetailModal day={selectedDay} onClose={() => setSelectedDay(null)} />
      )}
    </div>
  );
}

interface DayDetailModalProps {
  day: Day;
  onClose: () => void;
}

function DayDetailModal({ day, onClose }: DayDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {format(parseISO(day.date), 'MMMM d, yyyy')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <div className="space-y-2">
          <div>
            <span className="font-medium">Type:</span> {day.dayType}
          </div>
          {day.label && (
            <div>
              <span className="font-medium">Label:</span> {day.label}
            </div>
          )}
          {day.notes && (
            <div>
              <span className="font-medium">Notes:</span> {day.notes}
            </div>
          )}
          <div>
            <span className="font-medium">School Day:</span> {day.isSchoolDay ? 'Yes' : 'No'}
          </div>
          {day.schedule && (
            <div>
              <span className="font-medium">Schedule:</span> {day.schedule.name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

