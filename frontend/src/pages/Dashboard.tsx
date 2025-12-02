import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard';
import { useSchoolYearStore } from '../store/useSchoolYearStore';
import { format, parseISO } from 'date-fns';

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
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Please select a school year from the dropdown in the navigation bar.
          </p>
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

  const { metrics, nextNonAttendanceDay, isTodayNonAttendance } = dashboardData;

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

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Non-Attendance Day</h3>
        {isTodayNonAttendance && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 font-medium">Today is a non-attendance day</p>
          </div>
        )}
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

