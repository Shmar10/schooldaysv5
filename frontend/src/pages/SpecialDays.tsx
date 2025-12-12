import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { daysApi } from '../api/days';
import { breaksApi } from '../api/breaks';
import { useSchoolYearStore } from '../store/useSchoolYearStore';
import { format, parseISO } from 'date-fns';
import { DayType } from '../api/client';

export default function SpecialDays() {
  const { currentSchoolYear } = useSchoolYearStore();
  const [filter, setFilter] = useState<DayType | 'ALL'>('ALL');

  const { data: days, isLoading: daysLoading } = useQuery({
    queryKey: ['days', currentSchoolYear?.id],
    queryFn: () => daysApi.getBySchoolYear(currentSchoolYear!.id),
    enabled: !!currentSchoolYear,
  });

  const { data: breaks, isLoading: breaksLoading } = useQuery({
    queryKey: ['breaks', currentSchoolYear?.id],
    queryFn: () => breaksApi.getAll(currentSchoolYear!.id),
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

  const filteredDays = days?.filter((day) => {
    if (filter === 'ALL') return true;
    return day.dayType === filter;
  }) || [];

  const specialDayTypes: DayType[] = ['NON_ATTENDANCE', 'BREAK', 'SPECIAL_SCHEDULE'];

  return (
    <div className="px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Special Days</h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as DayType | 'ALL')}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="ALL">All Types</option>
            {specialDayTypes.map((type) => (
              <option key={type} value={type}>
                {type.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(daysLoading || breaksLoading) ? (
        <div className="animate-pulse">Loading special days...</div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredDays.length === 0 ? (
              <li className="px-6 py-4 text-center text-gray-500">
                No special days found
              </li>
            ) : (
              filteredDays
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((day) => (
                  <li key={day.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {format(parseISO(day.date), 'MMMM d, yyyy')}
                          </span>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {day.dayType.replace('_', ' ')}
                          </span>
                        </div>
                        {day.label && (
                          <p className="mt-1 text-sm text-gray-600">{day.label}</p>
                        )}
                        {day.notes && (
                          <p className="mt-1 text-sm text-gray-500">{day.notes}</p>
                        )}
                        {day.schedule && (
                          <p className="mt-1 text-xs text-gray-400">Schedule: {day.schedule.name}</p>
                        )}
                      </div>
                      <div className="ml-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          day.isSchoolDay
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {day.isSchoolDay ? 'School Day' : 'No School'}
                        </span>
                      </div>
                    </div>
                  </li>
                ))
            )}
          </ul>
        </div>
      )}

      {breaks && breaks.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Breaks</h3>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {breaks.map((breakRecord) => (
                <li key={breakRecord.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {format(parseISO(breakRecord.startDate), 'MMM d')} - {format(parseISO(breakRecord.endDate), 'MMM d, yyyy')}
                      </span>
                      <p className="mt-1 text-sm text-gray-600">{breakRecord.label}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

