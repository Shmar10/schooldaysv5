import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolYearApi } from '../api/schoolYears';
import { schedulesApi } from '../api/schedules';
import { breaksApi } from '../api/breaks';
import { daysApi } from '../api/days';
import { uploadsApi } from '../api/uploads';
import { useSchoolYearStore } from '../store/useSchoolYearStore';
import { format } from 'date-fns';
import { Schedule, Period } from '../api/client';

export default function Settings() {
  const { currentSchoolYear, setCurrentSchoolYear } = useSchoolYearStore();
  const [activeTab, setActiveTab] = useState<'school-year' | 'schedules' | 'uploads' | 'manage'>('school-year');

  const queryClient = useQueryClient();

  const { data: allSchoolYears } = useQuery({
    queryKey: ['schoolYears'],
    queryFn: () => schoolYearApi.getAll(),
  });

  const { data: schedules } = useQuery({
    queryKey: ['schedules', currentSchoolYear?.id],
    queryFn: () => schedulesApi.getAll(currentSchoolYear!.id),
    enabled: !!currentSchoolYear,
  });

  const { data: uploads } = useQuery({
    queryKey: ['uploads', currentSchoolYear?.id],
    queryFn: () => uploadsApi.getAll(currentSchoolYear?.id),
    enabled: !!currentSchoolYear,
  });

  const updateSchoolYearMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => schoolYearApi.update(id, data),
    onSuccess: (data) => {
      setCurrentSchoolYear(data);
      queryClient.invalidateQueries({ queryKey: ['schoolYears'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', data.id] });
    },
  });

  const createSchoolYearMutation = useMutation({
    mutationFn: (data: any) => schoolYearApi.create(data),
    onSuccess: (data) => {
      setCurrentSchoolYear(data);
      queryClient.invalidateQueries({ queryKey: ['schoolYears'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', data.id] });
    },
    onError: (error: any) => {
      console.error('Error creating school year:', error);
      alert(error.response?.data?.error || error.message || 'Failed to create school year. Please check your input.');
    },
  });

  const deleteSchoolYearMutation = useMutation({
    mutationFn: (id: string) => schoolYearApi.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['schoolYears'] });
      // If we deleted the current school year, switch to another one or clear
      if (currentSchoolYear?.id === deletedId) {
        const remaining = allSchoolYears?.filter(sy => sy.id !== deletedId) || [];
        if (remaining.length > 0) {
          setCurrentSchoolYear(remaining[0]);
        } else {
          setCurrentSchoolYear(null);
        }
      }
    },
    onError: (error: any) => {
      console.error('Error deleting school year:', error);
      alert(error.response?.data?.error || error.message || 'Failed to delete school year.');
    },
  });

  return (
    <div className="px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>

      {!currentSchoolYear && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 mb-2">No school year selected. Select one from "Manage Calendars" or create a new one below.</p>
        </div>
      )}

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('school-year')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'school-year'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            School Year
          </button>
          <button
            onClick={() => setActiveTab('schedules')}
            disabled={!currentSchoolYear}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'schedules'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } ${!currentSchoolYear ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Schedules
          </button>
          <button
            onClick={() => setActiveTab('uploads')}
            disabled={!currentSchoolYear}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'uploads'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } ${!currentSchoolYear ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Uploads
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'manage'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Manage Calendars
          </button>
        </nav>
      </div>

      {activeTab === 'school-year' && (
        <div className="space-y-6">
          {currentSchoolYear ? (
            <>
              <SchoolYearSettings
                schoolYear={currentSchoolYear}
                onUpdate={(data) => updateSchoolYearMutation.mutate({ id: currentSchoolYear.id, data })}
                onCreate={(data) => createSchoolYearMutation.mutate(data)}
              />
              <UpdateCalendarFromJson schoolYearId={currentSchoolYear.id} />
            </>
          ) : (
            <CreateSchoolYearForm 
              onCreate={(data) => createSchoolYearMutation.mutate(data)} 
              isSubmitting={createSchoolYearMutation.isPending}
            />
          )}
        </div>
      )}

      {activeTab === 'schedules' && currentSchoolYear && (
        <SchedulesSettings schoolYearId={currentSchoolYear.id} schedules={schedules || []} />
      )}

      {activeTab === 'uploads' && currentSchoolYear && (
        <UploadsSettings schoolYearId={currentSchoolYear.id} uploads={uploads || []} />
      )}

      {activeTab === 'manage' && (
        <ManageSchoolYears
          schoolYears={allSchoolYears || []}
          currentSchoolYear={currentSchoolYear}
          onSelect={(schoolYear) => setCurrentSchoolYear(schoolYear)}
          onDelete={(id) => {
            if (confirm('Are you sure you want to delete this calendar? This action cannot be undone and will delete all associated days, schedules, and breaks.')) {
              deleteSchoolYearMutation.mutate(id);
            }
          }}
          isDeleting={deleteSchoolYearMutation.isPending}
        />
      )}
    </div>
  );
}

interface SchoolYearSettingsProps {
  schoolYear: any;
  onUpdate: (data: any) => void;
  onCreate: (data: any) => void;
}

function CreateSchoolYearForm({ onCreate, isSubmitting }: { onCreate: (data: any) => void; isSubmitting: boolean }) {
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    timeZone: 'America/New_York',
    primaryColor: '#3B82F6',
    secondaryColor: '#F59E0B',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Create School Year</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., 2025-2026 School Year"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Time Zone</label>
          <select
            value={formData.timeZone}
            onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="America/New_York">Eastern Time (America/New_York)</option>
            <option value="America/Chicago">Central Time (America/Chicago)</option>
            <option value="America/Denver">Mountain Time (America/Denver)</option>
            <option value="America/Phoenix">Mountain Time - Arizona (America/Phoenix)</option>
            <option value="America/Los_Angeles">Pacific Time (America/Los_Angeles)</option>
            <option value="America/Anchorage">Alaska Time (America/Anchorage)</option>
            <option value="Pacific/Honolulu">Hawaii Time (Pacific/Honolulu)</option>
            <option value="America/Detroit">Eastern Time - Michigan (America/Detroit)</option>
            <option value="America/Indianapolis">Eastern Time - Indiana (America/Indianapolis)</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Primary Color</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="h-10 w-20 rounded-md border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                placeholder="#3B82F6"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={formData.secondaryColor}
                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                className="h-10 w-20 rounded-md border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={formData.secondaryColor}
                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                placeholder="#F59E0B"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating...' : 'Create School Year'}
        </button>
      </form>
    </div>
  );
}

function SchoolYearSettings({ schoolYear, onUpdate, onCreate }: SchoolYearSettingsProps) {
  const queryClient = useQueryClient();
  const { setCurrentSchoolYear } = useSchoolYearStore();
  const [formData, setFormData] = useState({
    name: schoolYear.name,
    startDate: format(new Date(schoolYear.startDate), 'yyyy-MM-dd'),
    endDate: format(new Date(schoolYear.endDate), 'yyyy-MM-dd'),
    timeZone: schoolYear.timeZone,
  });
  const [fixMessage, setFixMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fixWeekendsMutation = useMutation({
    mutationFn: () => schoolYearApi.fixWeekends(schoolYear.id),
    onSuccess: (data) => {
      setCurrentSchoolYear(data);
      queryClient.invalidateQueries({ queryKey: ['schoolYears'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', schoolYear.id] });
      setFixMessage({
        type: 'success',
        text: `Successfully fixed ${data.fixedWeekendDays || 0} weekend days. The countdown should now be accurate!`,
      });
      setTimeout(() => setFixMessage(null), 5000);
    },
    onError: (error: any) => {
      setFixMessage({
        type: 'error',
        text: error.response?.data?.error || error.message || 'Failed to fix weekends',
      });
      setTimeout(() => setFixMessage(null), 5000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">School Year Configuration</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Time Zone</label>
            <input
              type="text"
              value={formData.timeZone}
              onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Changes
          </button>
        </form>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">Fix Countdown Issue</h3>
        <p className="text-sm text-yellow-800 mb-4">
          If your countdown shows incorrect numbers (e.g., counting weekends as school days), 
          click the button below to fix it. This will mark all Saturdays and Sundays as non-school days.
        </p>
        {fixMessage && (
          <div className={`mb-4 p-3 rounded-md ${
            fixMessage.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {fixMessage.text}
          </div>
        )}
        <button
          onClick={() => fixWeekendsMutation.mutate()}
          disabled={fixWeekendsMutation.isPending}
          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {fixWeekendsMutation.isPending ? 'Fixing...' : 'Fix Weekend Days'}
        </button>
      </div>
    </div>
  );
}

interface SchedulesSettingsProps {
  schoolYearId: string;
  schedules: Schedule[];
}

function SchedulesSettings({ schoolYearId, schedules }: SchedulesSettingsProps) {
  const queryClient = useQueryClient();
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const createScheduleMutation = useMutation({
    mutationFn: (data: any) => schedulesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules', schoolYearId] });
      setEditingSchedule(null);
    },
  });

  const defaultSchedule = schedules.find((s) => s.isDefault);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Schedules</h3>
        <button
          onClick={() => setEditingSchedule({ id: '', name: '', isDefault: false, schoolYearId, periods: [] } as any)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Schedule
        </button>
      </div>

      {defaultSchedule && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900">Default Schedule: {defaultSchedule.name}</h4>
          <div className="mt-2 space-y-1">
            {defaultSchedule.periods.map((period: Period, idx: number) => (
              <div key={idx} className="text-sm text-blue-800">
                {period.name}: {period.startTime} - {period.endTime}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {schedules.map((schedule) => (
          <div key={schedule.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-gray-900">{schedule.name}</h4>
                {schedule.isDefault && (
                  <span className="text-xs text-blue-600">Default</span>
                )}
              </div>
              <button
                onClick={() => setEditingSchedule(schedule)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingSchedule && (
        <ScheduleEditor
          schedule={editingSchedule}
          onSave={(data) => createScheduleMutation.mutate(data)}
          onCancel={() => setEditingSchedule(null)}
        />
      )}
    </div>
  );
}

interface ScheduleEditorProps {
  schedule: Schedule;
  onSave: (data: any) => void;
  onCancel: () => void;
}

function ScheduleEditor({ schedule, onSave, onCancel }: ScheduleEditorProps) {
  const [name, setName] = useState(schedule.name || '');
  const [periods, setPeriods] = useState<Period[]>(schedule.periods || []);

  const handleAddPeriod = () => {
    setPeriods([...periods, { name: '', startTime: '', endTime: '' }]);
  };

  const handlePeriodChange = (index: number, field: keyof Period, value: string) => {
    const updated = [...periods];
    updated[index] = { ...updated[index], [field]: value };
    setPeriods(updated);
  };

  const handleSave = () => {
    onSave({
      name,
      isDefault: schedule.isDefault,
      schoolYearId: schedule.schoolYearId,
      periods,
    });
  };

  return (
    <div className="mt-4 p-4 border border-gray-200 rounded-lg">
      <h4 className="font-medium text-gray-900 mb-4">Edit Schedule</h4>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Periods</label>
            <button
              type="button"
              onClick={handleAddPeriod}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Add Period
            </button>
          </div>
          {periods.map((period, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Period name"
                value={period.name}
                onChange={(e) => handlePeriodChange(idx, 'name', e.target.value)}
                className="flex-1 rounded-md border-gray-300 shadow-sm"
              />
              <input
                type="time"
                value={period.startTime}
                onChange={(e) => handlePeriodChange(idx, 'startTime', e.target.value)}
                className="rounded-md border-gray-300 shadow-sm"
              />
              <input
                type="time"
                value={period.endTime}
                onChange={(e) => handlePeriodChange(idx, 'endTime', e.target.value)}
                className="rounded-md border-gray-300 shadow-sm"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

interface UploadsSettingsProps {
  schoolYearId: string;
  uploads: any[];
}

function UploadsSettings({ schoolYearId, uploads }: UploadsSettingsProps) {
  const queryClient = useQueryClient();
  const [uploadType, setUploadType] = useState<'YEAR_CALENDAR' | 'DAILY_SCHEDULE'>('YEAR_CALENDAR');

  const uploadMutation = useMutation({
    mutationFn: ({ file, type }: { file: File; type: 'YEAR_CALENDAR' | 'DAILY_SCHEDULE' }) =>
      uploadsApi.upload(file, type, schoolYearId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploads', schoolYearId] });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate({ file, type: uploadType });
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploads</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Upload Type</label>
        <select
          value={uploadType}
          onChange={(e) => setUploadType(e.target.value as 'YEAR_CALENDAR' | 'DAILY_SCHEDULE')}
          className="block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="YEAR_CALENDAR">Year Calendar</option>
          <option value="DAILY_SCHEDULE">Daily Schedule</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files</h4>
        {uploads.length === 0 ? (
          <p className="text-sm text-gray-500">No uploads yet</p>
        ) : (
          <ul className="space-y-2">
            {uploads.map((upload) => (
              <li key={upload.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                <div>
                  <span className="text-sm font-medium text-gray-900">{upload.originalFilename}</span>
                  <span className="ml-2 text-xs text-gray-500">({upload.type})</span>
                </div>
                <a
                  href={uploadsApi.getFileUrl(upload.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface ManageSchoolYearsProps {
  schoolYears: any[];
  currentSchoolYear: any | null;
  onSelect: (schoolYear: any) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function ManageSchoolYears({ schoolYears, currentSchoolYear, onSelect, onDelete, isDeleting }: ManageSchoolYearsProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Calendars</h3>
        
        {schoolYears.length === 0 ? (
          <p className="text-gray-500">No school years created yet.</p>
        ) : (
          <div className="space-y-3">
            {schoolYears.map((schoolYear) => {
              const isCurrent = currentSchoolYear?.id === schoolYear.id;
              return (
                <div
                  key={schoolYear.id}
                  className={`border rounded-lg p-4 ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{schoolYear.name}</h4>
                        {isCurrent && (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {format(new Date(schoolYear.startDate), 'MMM d, yyyy')} - {format(new Date(schoolYear.endDate), 'MMM d, yyyy')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {schoolYear.totalSchoolDays} school days
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isCurrent && (
                        <button
                          onClick={() => onSelect(schoolYear)}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Select
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(schoolYear.id)}
                        disabled={isDeleting}
                        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface UpdateCalendarFromJsonProps {
  schoolYearId: string;
}

function UpdateCalendarFromJson({ schoolYearId }: UpdateCalendarFromJsonProps) {
  const queryClient = useQueryClient();
  const [jsonText, setJsonText] = useState('');
  const [updateMode, setUpdateMode] = useState<'add' | 'replace'>('add');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const processJson = async () => {
    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      // Parse the JSON
      let config;
      try {
        // Try to extract JSON from markdown code blocks if present
        const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1] : jsonText.trim();
        config = JSON.parse(jsonString);
      } catch (parseError) {
        throw new Error('Invalid JSON format. Please ensure the JSON is valid.');
      }

      const results = {
        schedules: 0,
        breaks: 0,
        nonAttendanceDays: 0,
        specialDays: 0,
        deleted: {
          schedules: 0,
          breaks: 0,
          days: 0,
        },
      };

      // If replace mode, delete existing data first
      if (updateMode === 'replace') {
        try {
          // Delete all breaks
          const allBreaks = await breaksApi.getAll(schoolYearId);
          for (const breakItem of allBreaks) {
            await breaksApi.delete(breakItem.id);
            results.deleted.breaks++;
          }

          // Delete all non-default schedules
          const allSchedules = await schedulesApi.getAll(schoolYearId);
          for (const schedule of allSchedules) {
            if (!schedule.isDefault) {
              await schedulesApi.delete(schedule.id);
              results.deleted.schedules++;
            }
          }

          // Delete all non-attendance and special days
          const allDays = await daysApi.getBySchoolYear(schoolYearId);
          const daysToDelete = allDays.filter(
            day => day.dayType === 'NON_ATTENDANCE' || 
                   day.dayType === 'BREAK' || 
                   day.dayType === 'SPECIAL_SCHEDULE'
          );
          for (const day of daysToDelete) {
            await daysApi.delete(day.id);
            results.deleted.days++;
          }
        } catch (err: any) {
          throw new Error(`Failed to clear existing data: ${err.response?.data?.error || err.message}`);
        }
      }

      // Step 1: Create/Update schedules
      if (config.schedules && Array.isArray(config.schedules)) {
        try {
          const allSchedules = await schedulesApi.getAll(schoolYearId);
          for (const schedule of config.schedules) {
            // Check if schedule with same name exists
            const existing = allSchedules.find(s => s.name === schedule.name);
            if (existing) {
              // Update existing schedule
              await schedulesApi.update(existing.id, {
                isDefault: schedule.isDefault || false,
                periods: schedule.periods || [],
              });
            } else {
              // Create new schedule
              await schedulesApi.create({
                name: schedule.name,
                isDefault: schedule.isDefault || false,
                schoolYearId,
                periods: schedule.periods || [],
              });
            }
            results.schedules++;
          }
        } catch (err: any) {
          throw new Error(`Failed to process schedules: ${err.response?.data?.error || err.message}`);
        }
      }

      // Step 2: Create/Update breaks (handle overlaps)
      if (config.breaks && Array.isArray(config.breaks)) {
        try {
          for (const breakItem of config.breaks) {
            // Get current breaks (refresh after deletions)
            const allBreaks = await breaksApi.getAll(schoolYearId);
            
            // Check for overlapping breaks
            const overlapping = allBreaks.find(b => {
              const newStart = new Date(breakItem.startDate);
              const newEnd = new Date(breakItem.endDate);
              const existingStart = new Date(b.startDate);
              const existingEnd = new Date(b.endDate);
              return (newStart <= existingEnd && newEnd >= existingStart);
            });

            // If overlapping, delete it first (in both modes, we replace on overlap)
            if (overlapping) {
              await breaksApi.delete(overlapping.id);
            }

            // Create the new break
            await breaksApi.create({
              startDate: breakItem.startDate,
              endDate: breakItem.endDate,
              label: breakItem.label,
              schoolYearId,
            });
            results.breaks++;
          }
        } catch (err: any) {
          throw new Error(`Failed to process breaks: ${err.response?.data?.error || err.message}`);
        }
      }

      // Step 3: Create/Update non-attendance days
      if (config.nonAttendanceDays && Array.isArray(config.nonAttendanceDays)) {
        try {
          for (const day of config.nonAttendanceDays) {
            await daysApi.create({
              date: day.date,
              dayType: 'NON_ATTENDANCE',
              label: day.label || null,
              isSchoolDay: false,
              schoolYearId,
              scheduleId: null,
            });
            results.nonAttendanceDays++;
          }
        } catch (err: any) {
          throw new Error(`Failed to process non-attendance days: ${err.response?.data?.error || err.message || JSON.stringify(err.response?.data)}`);
        }
      }

      // Step 4: Create/Update special days
      if (config.specialDays && Array.isArray(config.specialDays)) {
        try {
          const allSchedules = await schedulesApi.getAll(schoolYearId);
          
          for (const specialDay of config.specialDays) {
            let scheduleId: string | null = null;
            if (specialDay.scheduleName) {
              const schedule = allSchedules.find(s => s.name === specialDay.scheduleName);
              if (schedule) scheduleId = schedule.id;
            }

            const validDayTypes = ['INSTRUCTIONAL', 'NON_ATTENDANCE', 'BREAK', 'SPECIAL_SCHEDULE'];
            const dayType = validDayTypes.includes(specialDay.dayType) 
              ? specialDay.dayType 
              : 'SPECIAL_SCHEDULE';

            await daysApi.create({
              date: specialDay.date,
              dayType: dayType as 'INSTRUCTIONAL' | 'NON_ATTENDANCE' | 'BREAK' | 'SPECIAL_SCHEDULE',
              label: specialDay.label || null,
              isSchoolDay: specialDay.isSchoolDay !== undefined ? specialDay.isSchoolDay : true,
              schoolYearId,
              scheduleId: scheduleId || null,
            });
            results.specialDays++;
          }
        } catch (err: any) {
          const errorDetails = err.response?.data?.details || err.response?.data?.error || err.message;
          const errorMsg = typeof errorDetails === 'string' 
            ? errorDetails 
            : JSON.stringify(errorDetails);
          throw new Error(`Failed to process special days: ${errorMsg}`);
        }
      }

      // Success!
      queryClient.invalidateQueries({ queryKey: ['schoolYears'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', schoolYearId] });
      queryClient.invalidateQueries({ queryKey: ['schedules', schoolYearId] });
      
      let successMsg = `Successfully ${updateMode === 'replace' ? 'replaced' : 'updated'} calendar: `;
      if (updateMode === 'replace' && (results.deleted.breaks > 0 || results.deleted.schedules > 0 || results.deleted.days > 0)) {
        successMsg += `Deleted ${results.deleted.breaks} breaks, ${results.deleted.schedules} schedules, ${results.deleted.days} days. `;
      }
      successMsg += `Added/Updated: ${results.schedules} schedules, ${results.breaks} breaks, ` +
        `${results.nonAttendanceDays} non-attendance days, ${results.specialDays} special days.`;
      setSuccess(successMsg);
      setJsonText('');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to process JSON. Please check the format.';
      setError(errorMessage);
      console.error('Error processing JSON:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Update Calendar from JSON</h3>
      <p className="text-sm text-gray-600 mb-4">
        Paste JSON configuration to update this calendar. Choose whether to add to existing data or replace it entirely.
      </p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Update Mode
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="updateMode"
              value="add"
              checked={updateMode === 'add'}
              onChange={(e) => setUpdateMode(e.target.value as 'add' | 'replace')}
              className="mr-2"
            />
            <span className="text-sm">
              <strong>Add/Update</strong> - Adds new items and updates existing ones. Overlaps will replace existing data.
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="updateMode"
              value="replace"
              checked={updateMode === 'replace'}
              onChange={(e) => setUpdateMode(e.target.value as 'add' | 'replace')}
              className="mr-2"
            />
            <span className="text-sm">
              <strong>Replace</strong> - Deletes all breaks, schedules (except default), and special days, then adds new data.
            </span>
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          JSON Configuration
        </label>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder='Paste JSON here...\n\nExample:\n{\n  "schedules": [...],\n  "breaks": [...],\n  "specialDays": [...],\n  "nonAttendanceDays": [...]\n}'
          className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm"
        />
      </div>

      <button
        onClick={processJson}
        disabled={isProcessing || !jsonText.trim()}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : 'Update Calendar'}
      </button>
    </div>
  );
}

