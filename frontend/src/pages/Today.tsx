import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard';
import { useSchoolYearStore } from '../store/useSchoolYearStore';
import { format, parseISO } from 'date-fns';

export default function Today() {
  const { currentSchoolYear } = useSchoolYearStore();

  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['dashboard', currentSchoolYear?.id],
    queryFn: () => dashboardApi.getDashboard(currentSchoolYear!.id),
    enabled: !!currentSchoolYear,
    refetchInterval: 60000, // Refresh every minute to update current period
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  if (!currentSchoolYear) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No School Year Selected</h2>
          <p className="text-gray-600 mb-6">
            Please select or create a school year to view today's schedule.
          </p>
          <div className="flex gap-4">
            <Link
              to="/quick-setup"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Quick Setup
            </Link>
            <Link
              to="/settings"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load dashboard data.</p>
        </div>
      </div>
    );
  }

  const {
    schoolYear,
    metrics,
    todayDay,
    todaySchedule,
    currentPeriodIndex,
    remainingPeriods,
    nextBreak,
    isTodayNonAttendance,
  } = dashboardData;

  const today = new Date();
  const todayFormatted = format(today, 'EEEE, MMM dd, yyyy');
  const isSchoolDay = todayDay?.isSchoolDay ?? true;
  const dayStatus = isTodayNonAttendance
    ? todayDay?.label || 'No school'
    : isSchoolDay
    ? 'School day'
    : 'No school';

  // Format time helper
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes || 0, 0, 0);
    return format(date, 'h:mm a');
  };

  // Copy details to clipboard
  const copyDetails = () => {
    const details = [
      `${metrics.schoolDaysRemaining} days and ${remainingPeriods || 0} periods left`,
      `${metrics.schoolDaysRemaining} School Days • ${metrics.calendarDaysRemaining} Calendar Days • ${metrics.percentComplete || 0}% Complete`,
      `Today: ${dayStatus} (${todayFormatted})`,
      nextBreak
        ? `Next break: ${nextBreak.label} (${format(parseISO(nextBreak.startDate), 'MMM d')}–${format(parseISO(nextBreak.endDate), 'MMM d')})`
        : '',
    ].filter(Boolean).join('\n');
    
    navigator.clipboard.writeText(details);
    // You could add a toast notification here
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-purple-50 flex flex-col">
      {/* School Name Banner */}
      <div className="bg-purple-700 text-white px-4 sm:px-6 py-3 -mx-6 sm:-mx-8 lg:-mx-8 sticky top-16 z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-lg sm:text-xl font-bold truncate">{schoolYear.name}</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-4xl mx-auto w-full flex-1">
        {/* Countdown Section */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2 leading-tight">
            {metrics.schoolDaysRemaining} days and {remainingPeriods || 0} periods left
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm break-words">
            {metrics.schoolDaysRemaining} School Days • {metrics.calendarDaysRemaining} Calendar Days • {metrics.percentComplete || 0}% Complete
          </p>
        </div>

        {/* Today and Next Break Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="text-gray-700 text-sm sm:text-base">
            <span className="font-semibold">Today:</span> {dayStatus} ({todayFormatted})
          </div>
          {nextBreak && (
            <div className="text-gray-700 text-sm sm:text-base">
              <span className="font-semibold">Next break:</span>{' '}
              {nextBreak.label} ({format(parseISO(nextBreak.startDate), 'MMM d')}–{format(parseISO(nextBreak.endDate), 'MMM d')})
            </div>
          )}
        </div>

        {/* Schedule Section */}
        {todaySchedule && todaySchedule.periods && Array.isArray(todaySchedule.periods) && isSchoolDay && !isTodayNonAttendance ? (
          <div className="mb-4 sm:mb-6">
            <div className="space-y-2">
              {todaySchedule.periods.map((period, index) => {
                const isCurrent = currentPeriodIndex === index;
                const isPast = currentPeriodIndex !== null && index < currentPeriodIndex;
                
                return (
                  <div
                    key={index}
                    className={`p-2.5 sm:p-3 rounded-lg ${
                      isCurrent
                        ? 'bg-yellow-400 text-gray-900 font-semibold'
                        : isPast
                        ? 'bg-gray-100 text-gray-500'
                        : 'bg-purple-100 text-gray-800'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-medium text-sm sm:text-base truncate">{period.name}</span>
                      <span className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">
                        {formatTime(period.startTime)}–{formatTime(period.endTime)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
          <button
            onClick={() => refetch()}
            className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 text-xs sm:text-sm font-medium touch-manipulation"
          >
            Refresh now
          </button>
          <button
            onClick={copyDetails}
            className="px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 active:bg-gray-400 text-xs sm:text-sm font-medium touch-manipulation"
          >
            Copy details
          </button>
          <Link
            to="/settings"
            className="px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 active:bg-gray-400 text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 sm:gap-2 touch-manipulation"
          >
            <span className="text-sm sm:text-base">⚙️</span> <span>Settings</span>
          </Link>
          <Link
            to="/calendar"
            className="px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 active:bg-gray-400 text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 sm:gap-2 touch-manipulation"
          >
            <span className="text-sm sm:text-base">📅</span> <span>Calendar</span>
          </Link>
          <Link
            to="/special-days"
            className="px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 active:bg-gray-400 text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 sm:gap-2 touch-manipulation"
          >
            <span className="text-sm sm:text-base">📅</span> <span className="hidden sm:inline">View important dates</span>
            <span className="sm:hidden">Important dates</span>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-purple-800 text-white px-3 sm:px-4 py-2 sm:py-3 -mx-6 sm:-mx-8 lg:-mx-8 mt-auto">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs sm:text-sm break-words">
            School year: {format(parseISO(schoolYear.startDate), 'EEEE, MMM d')} — {format(parseISO(schoolYear.endDate), 'MMM d, yyyy')}
          </p>
        </div>
      </footer>
    </div>
  );
}

