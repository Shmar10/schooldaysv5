import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolYearApi } from '../api/schoolYears';
import { schedulesApi } from '../api/schedules';
import { uploadsApi } from '../api/uploads';
import { useSchoolYearStore } from '../store/useSchoolYearStore';
import { format } from 'date-fns';
import { Schedule, Period } from '../api/client';

export default function Settings() {
  const { currentSchoolYear, setCurrentSchoolYear } = useSchoolYearStore();
  const [activeTab, setActiveTab] = useState<'school-year' | 'schedules' | 'uploads'>('school-year');

  const queryClient = useQueryClient();

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

  return (
    <div className="px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>

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
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'schedules'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Schedules
          </button>
          <button
            onClick={() => setActiveTab('uploads')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'uploads'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Uploads
          </button>
        </nav>
      </div>

      {activeTab === 'school-year' && (
        <SchoolYearSettings
          schoolYear={currentSchoolYear}
          onUpdate={(data) => updateSchoolYearMutation.mutate({ id: currentSchoolYear.id, data })}
          onCreate={(data) => createSchoolYearMutation.mutate(data)}
        />
      )}

      {activeTab === 'schedules' && (
        <SchedulesSettings schoolYearId={currentSchoolYear.id} schedules={schedules || []} />
      )}

      {activeTab === 'uploads' && (
        <UploadsSettings schoolYearId={currentSchoolYear.id} uploads={uploads || []} />
      )}
    </div>
  );
}

interface SchoolYearSettingsProps {
  schoolYear: any;
  onUpdate: (data: any) => void;
  onCreate: (data: any) => void;
}

function SchoolYearSettings({ schoolYear, onUpdate, onCreate }: SchoolYearSettingsProps) {
  const [formData, setFormData] = useState({
    name: schoolYear.name,
    startDate: format(new Date(schoolYear.startDate), 'yyyy-MM-dd'),
    endDate: format(new Date(schoolYear.endDate), 'yyyy-MM-dd'),
    timeZone: schoolYear.timeZone,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
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

