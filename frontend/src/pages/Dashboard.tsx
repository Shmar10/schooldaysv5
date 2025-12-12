import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard';
import { useSchoolYearStore } from '../store/useSchoolYearStore';
import { format, parseISO, getDay } from 'date-fns';

export default function Dashboard() {
  const { currentSchoolYear } = useSchoolYearStore();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard', currentSchoolYear?.id],
    queryFn: () => dashboardApi.getDashboard(currentSchoolYear!.id),
    enabled: !!currentSchoolYear,
  });

  if (!currentSchoolYear) {
    return (
      <div className="px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 mb-2">
            No school year selected. Create your first school year to get started.
          </p>
          <div className="flex gap-4 mt-4">
            <Link
              to="/quick-setup"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              🚀 Quick Setup (AI-Assisted)
            </Link>
            <Link
              to="/settings"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
            >
              Manual Setup
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="px-4 py-8">
        <div className="animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load dashboard data.</p>
        </div>
      </div>
    );
  }

  const { metrics, nextNonAttendanceDay, isTodayNonAttendance, todayDay, todaySchedule, currentPeriodIndex, remainingPeriods } = dashboardData;
  
  // Check if today is a weekend
  const today = new Date();
  const dayOfWeek = getDay(today);
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
  const dayName = format(today, 'EEEE'); // Full day name (e.g., "Saturday")

  return (
    <div className="px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="School Days Remaining"
          value={metrics.schoolDaysRemaining}
          subtitle={`of ${metrics.totalSchoolDays} total`}
        />
        <MetricCard
          title="Calendar Days Remaining"
          value={metrics.calendarDaysRemaining}
        />
        <MetricCard
          title="Percent Remaining"
          value={`${metrics.percentSchoolDaysRemaining}%`}
          progress={metrics.percentSchoolDaysRemaining}
        />
        <MetricCard
          title="Total School Days"
          value={metrics.totalSchoolDays}
        />
      </div>

      {/* Weekend Message - only show if it's a weekend and NOT a holiday/break */}
      {isWeekend && !isTodayNonAttendance && (
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg shadow p-6 mb-6 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <div className="text-xl font-bold text-purple-800 mb-2">No School - Enjoy Your Weekend!</div>
          <div className="text-sm text-purple-600">{dayName} is a day to relax and recharge ☀️</div>
        </div>
      )}

      {/* Holiday/Break Message - show if it's a holiday/break (even if it's also a weekend) */}
      {isTodayNonAttendance && (
        <div className="bg-green-100 rounded-lg shadow p-6 mb-6 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <div className="text-xl font-bold text-green-800 mb-2">
            {todayDay?.label || (todayDay?.dayType === 'BREAK' ? 'Break' : 'Holiday')}
          </div>
          <div className="text-sm text-green-700">No school - Enjoy your time off!</div>
        </div>
      )}

      {/* Today's Schedule (only show if it's a school day and not a weekend) */}
      {!isWeekend && !isTodayNonAttendance && todaySchedule && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h3>
          {todaySchedule.periods && Array.isArray(todaySchedule.periods) && todaySchedule.periods.length > 0 ? (
            <div className="space-y-2">
              {todaySchedule.periods.map((period: any, index: number) => {
                const isCurrent = currentPeriodIndex === index;
                const isPast = currentPeriodIndex !== null && index < currentPeriodIndex;
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 ${
                      isCurrent
                        ? 'bg-blue-50 border-blue-500 font-semibold'
                        : isPast
                        ? 'bg-gray-50 border-gray-200 opacity-60'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{period.name}</span>
                      <span className="text-sm text-gray-600">
                        {period.startTime} - {period.endTime}
                      </span>
                    </div>
                    {isCurrent && (
                      <div className="mt-1 text-xs text-blue-600">Current Period</div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">No schedule available for today</p>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Non-Attendance Day</h3>
        {nextNonAttendanceDay ? (
          <div>
            <p className="text-gray-700">
              <span className="font-semibold">Date:</span>{' '}
              {nextNonAttendanceDay.endDate
                ? `${format(parseISO(nextNonAttendanceDay.date), 'MMM d')} - ${format(parseISO(nextNonAttendanceDay.endDate), 'MMM d, yyyy')}`
                : format(parseISO(nextNonAttendanceDay.date), 'MMMM d, yyyy')}
            </p>
            <p className="text-gray-700 mt-2">
              <span className="font-semibold">Label:</span> {nextNonAttendanceDay.label}
            </p>
            {nextNonAttendanceDay.isToday && (
              <p className="text-blue-600 mt-2 font-medium">(Today)</p>
            )}
          </div>
        ) : (
          <p className="text-gray-500">No upcoming non-attendance days</p>
        )}
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  progress?: number;
}

function MetricCard({ title, value, subtitle, progress }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      {progress !== undefined && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

