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

  const getDayTypeColor = (dayType: DayType, isSchoolDay: boolean) => {
    if (!isSchoolDay || dayType === 'NON_ATTENDANCE' || dayType === 'BREAK') {
      return 'bg-gray-200 text-gray-500';
    }
    if (dayType === 'SPECIAL_SCHEDULE') {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-white text-gray-900';
  };

  const getDayForDate = (date: Date): Day | undefined => {
    if (!days) return undefined;
    return days.find((d) => isSameDay(parseISO(d.date), date));
  };

  const handleDayClick = (date: Date) => {
    const day = getDayForDate(date);
    setSelectedDay(day || null);
  };

  return (
    <div className="px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Calendar</h2>
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
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => handleDayClick(date)}
                  className={`p-2 min-h-[80px] text-left border-b border-r border-gray-200 hover:bg-gray-50 transition-colors ${getDayTypeColor(
                    day?.dayType || 'INSTRUCTIONAL',
                    day?.isSchoolDay ?? true
                  )} ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className="text-sm font-medium">{format(date, 'd')}</div>
                  {day && (
                    <div className="mt-1 text-xs">
                      {day.label && <div className="truncate">{day.label}</div>}
                      {day.dayType === 'SPECIAL_SCHEDULE' && (
                        <div className="text-yellow-600">Special</div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

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

