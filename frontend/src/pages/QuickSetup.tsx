import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolYearApi } from '../api/schoolYears';
import { schedulesApi } from '../api/schedules';
import { breaksApi } from '../api/breaks';
import { daysApi } from '../api/days';
import { useSchoolYearStore } from '../store/useSchoolYearStore';
import { useNavigate } from 'react-router-dom';

export default function QuickSetup() {
  const [step, setStep] = useState<'info' | 'images' | 'prompt' | 'code'>('info');
  const [schoolInfo, setSchoolInfo] = useState({
    name: '',
    primaryColor: '#3B82F6', // Default blue
    secondaryColor: '#F59E0B', // Default amber
    mascot: '',
    startDate: '',
    endDate: '',
    timeZone: 'America/New_York',
  });
  const [scheduleImage, setScheduleImage] = useState<File | null>(null);
  const [calendarImage, setCalendarImage] = useState<File | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [llmCode, setLlmCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const queryClient = useQueryClient();
  const { setCurrentSchoolYear } = useSchoolYearStore();
  const navigate = useNavigate();

  const createSchoolYearMutation = useMutation({
    mutationFn: (data: any) => schoolYearApi.create(data),
    onSuccess: (data) => {
      setCurrentSchoolYear(data);
      queryClient.invalidateQueries({ queryKey: ['schoolYears'] });
      return data;
    },
  });

  const generatePrompt = () => {
    let prompt = `You are helping to set up a school year calendar system. Please analyze the provided images and information, then generate a JSON configuration that can be used to populate the calendar.

⚠️ CRITICAL: This data is used for countdown calculations. Missing even ONE non-attendance day will cause incorrect results. Be EXTREMELY thorough and accurate.

SCHOOL INFORMATION:
- School Name: ${schoolInfo.name || 'Not provided'}
- Primary Color: ${schoolInfo.primaryColor || 'Not provided'}
- Secondary Color: ${schoolInfo.secondaryColor || 'Not provided'}
- Mascot: ${schoolInfo.mascot || 'Not provided'}
- School Year: ${schoolInfo.startDate} to ${schoolInfo.endDate}
- Time Zone: ${schoolInfo.timeZone}

IMAGES PROVIDED:
${scheduleImage ? '- Schedule/Bell Schedule Image: [User will attach this image]' : '- No schedule image provided'}
${calendarImage ? '- School Year Calendar Image: [User will attach this image]' : '- No calendar image provided'}

TASK:
Please analyze the images and generate a complete JSON configuration with the following structure:

\`\`\`json
{
  "schedules": [
    {
      "name": "Default Schedule",
      "isDefault": true,
      "periods": [
        {
          "name": "Period 1",
          "startTime": "08:00",
          "endTime": "08:45"
        },
        {
          "name": "Period 2",
          "startTime": "08:50",
          "endTime": "09:35"
        }
        // ... more periods
      ]
    },
    {
      "name": "Late Start Schedule",
      "isDefault": false,
      "periods": [
        // ... periods for late start
      ]
    }
    // ... more schedules if applicable
  ],
  "breaks": [
    {
      "startDate": "2025-11-22",
      "endDate": "2025-11-28",
      "label": "Thanksgiving Break"
    }
    // ... more breaks
  ],
  "specialDays": [
    {
      "date": "2025-12-17",
      "dayType": "SPECIAL_SCHEDULE",
      "label": "Final Exams Day 1",
      "scheduleName": "Exam Schedule",
      "isSchoolDay": true
    },
    {
      "date": "2025-10-15",
      "dayType": "SPECIAL_SCHEDULE",
      "label": "Early Release Day",
      "isSchoolDay": true
    }
    // ... more special days (students still attend, just different schedule)
  ],
  "nonAttendanceDays": [
    {
      "date": "2025-09-01",
      "label": "Labor Day"
    },
    {
      "date": "2025-10-13",
      "label": "Indigenous Peoples Day"
    },
    {
      "date": "2025-10-31",
      "label": "Teacher Institute"
    }
    // ... more non-attendance days (students do NOT attend)
  ]
}
\`\`\`

CRITICAL INSTRUCTIONS FOR ACCURACY:

1. BE EXTREMELY THOROUGH WITH NON-ATTENDANCE DAYS:
   - Include EVERY single holiday, even minor ones (Labor Day, MLK Day, Presidents Day, etc.)
   - Include ALL teacher work days/institute days when students do NOT attend
   - Include ALL single-day holidays (not just multi-day breaks)
   - Include professional development days, parent-teacher conference days, etc.
   - DO NOT include weekends (Saturdays/Sundays) - these are automatically excluded
   - If a date appears on the calendar as "No School" or has a holiday name, it MUST be in nonAttendanceDays
   - When in doubt, include it - it's better to have extra non-attendance days than miss any

2. BREAKS vs NON-ATTENDANCE DAYS:
   - Use "breaks" array for MULTI-DAY periods (e.g., Thanksgiving Break, Winter Break, Spring Break)
   - Use "nonAttendanceDays" array for SINGLE-DAY holidays (e.g., Labor Day, MLK Day, Presidents Day)
   - For breaks, include the FULL date range (startDate to endDate, inclusive)
   - Example: If Thanksgiving Break is Nov 26-28, include all three dates in the break

3. EXTRACT ALL BELL SCHEDULE PERIODS:
   - Include period names/numbers exactly as shown
   - Include start and end times in 24-hour format HH:MM (e.g., "08:00", "14:30")
   - Include ALL special schedules: late start, early release, exam schedules, etc.
   - If there are different schedules for different days (e.g., Wednesday late start), create separate schedule entries

4. SPECIAL DAYS:
   - Early release days: dayType "SPECIAL_SCHEDULE", isSchoolDay: true (students still attend, just shorter day)
   - Late start days: dayType "SPECIAL_SCHEDULE", isSchoolDay: true, with appropriate scheduleName
   - Exam days: dayType "SPECIAL_SCHEDULE", isSchoolDay: true, with exam schedule name
   - Days with modified schedules but students still attend should be in specialDays, NOT nonAttendanceDays

5. DATE FORMATTING:
   - Use YYYY-MM-DD format (e.g., "2025-09-01" for September 1, 2025)
   - Double-check that dates are correct - verify month and day carefully
   - All dates MUST fall within the school year range: ${schoolInfo.startDate} to ${schoolInfo.endDate}

6. TIME FORMATTING:
   - Use 24-hour format HH:MM (e.g., "08:00" for 8:00 AM, "14:30" for 2:30 PM)
   - Be precise - extract times exactly as shown

7. COMPLETENESS CHECKLIST:
   Before submitting, verify you have included:
   ✓ All holidays visible on the calendar
   ✓ All breaks (Thanksgiving, Winter, Spring, etc.) with full date ranges
   ✓ All teacher institute/work days when students don't attend
   ✓ All special schedules (late start, early release, exam schedules)
   ✓ All periods from the bell schedule
   ✓ All dates are within the school year range
   ✓ All dates use YYYY-MM-DD format
   ✓ All times use HH:MM 24-hour format

8. ACCURACY IS CRITICAL:
   - Missing even one non-attendance day will cause incorrect countdown calculations
   - Double-check every date you extract
   - If you're unsure about a date, include it in nonAttendanceDays rather than omitting it
   - Count the total number of non-attendance days you've included and verify it matches what you see in the calendar

Please provide ONLY the JSON object, no additional explanation or markdown formatting. The JSON should be valid and ready to parse.`;

    setGeneratedPrompt(prompt);
    setStep('prompt');
  };

  const processLlmCode = async () => {
    setIsProcessing(true);
    setError('');

    try {
      // Parse the LLM-generated JSON
      let config;
      try {
        // Try to extract JSON from markdown code blocks if present
        const jsonMatch = llmCode.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1] : llmCode.trim();
        config = JSON.parse(jsonString);
      } catch (parseError) {
        throw new Error('Invalid JSON format. Please ensure the LLM returned valid JSON.');
      }

      // Step 1: Create school year
      const schoolYear = await createSchoolYearMutation.mutateAsync({
        name: schoolInfo.name || `${schoolInfo.startDate} - ${schoolInfo.endDate} School Year`,
        startDate: schoolInfo.startDate,
        endDate: schoolInfo.endDate,
        timeZone: schoolInfo.timeZone,
        primaryColor: schoolInfo.primaryColor,
        secondaryColor: schoolInfo.secondaryColor,
      });

      // Step 2: Create schedules
      if (config.schedules && Array.isArray(config.schedules)) {
        try {
          for (const schedule of config.schedules) {
            await schedulesApi.create({
              name: schedule.name,
              isDefault: schedule.isDefault || false,
              schoolYearId: schoolYear.id,
              periods: schedule.periods || [],
            });
          }
        } catch (err: any) {
          throw new Error(`Failed to create schedules: ${err.response?.data?.error || err.message}`);
        }
      }

      // Step 3: Create breaks
      if (config.breaks && Array.isArray(config.breaks)) {
        try {
          for (const breakItem of config.breaks) {
            await breaksApi.create({
              startDate: breakItem.startDate,
              endDate: breakItem.endDate,
              label: breakItem.label,
              schoolYearId: schoolYear.id,
            });
          }
        } catch (err: any) {
          throw new Error(`Failed to create breaks: ${err.response?.data?.error || err.message}`);
        }
      }

      // Step 4: Create non-attendance days
      if (config.nonAttendanceDays && Array.isArray(config.nonAttendanceDays)) {
        try {
          for (const day of config.nonAttendanceDays) {
            await daysApi.create({
              date: day.date,
              dayType: 'NON_ATTENDANCE',
              label: day.label || null,
              isSchoolDay: false,
              schoolYearId: schoolYear.id,
              scheduleId: null,
            });
          }
        } catch (err: any) {
          throw new Error(`Failed to create non-attendance days: ${err.response?.data?.error || err.message || JSON.stringify(err.response?.data)}`);
        }
      }

      // Step 5: Create special days
      if (config.specialDays && Array.isArray(config.specialDays)) {
        try {
          // Get schedules to match by name
          const allSchedules = await schedulesApi.getAll(schoolYear.id);
          
          for (const specialDay of config.specialDays) {
            let scheduleId: string | null = null;
            if (specialDay.scheduleName) {
              const schedule = allSchedules.find(s => s.name === specialDay.scheduleName);
              if (schedule) scheduleId = schedule.id;
            }

            // Ensure dayType is a valid enum value
            const validDayTypes = ['INSTRUCTIONAL', 'NON_ATTENDANCE', 'BREAK', 'SPECIAL_SCHEDULE'];
            const dayType = validDayTypes.includes(specialDay.dayType) 
              ? specialDay.dayType 
              : 'SPECIAL_SCHEDULE';

            await daysApi.create({
              date: specialDay.date,
              dayType: dayType as 'INSTRUCTIONAL' | 'NON_ATTENDANCE' | 'BREAK' | 'SPECIAL_SCHEDULE',
              label: specialDay.label || null,
              isSchoolDay: specialDay.isSchoolDay !== undefined ? specialDay.isSchoolDay : true,
              schoolYearId: schoolYear.id,
              scheduleId: scheduleId || null,
            });
          }
        } catch (err: any) {
          const errorDetails = err.response?.data?.details || err.response?.data?.error || err.message;
          const errorMsg = typeof errorDetails === 'string' 
            ? errorDetails 
            : JSON.stringify(errorDetails);
          throw new Error(`Failed to create special days: ${errorMsg}`);
        }
      }

      // Success! Navigate to dashboard
      queryClient.invalidateQueries({ queryKey: ['schoolYears'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', schoolYear.id] });
      navigate('/');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to process configuration. Please check the JSON format.';
      setError(errorMessage);
      console.error('Error processing LLM code:', err);
      console.error('Error details:', err.response?.data);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Setup with AI Assistance</h2>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['info', 'images', 'prompt', 'code'].map((s, idx) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === s
                    ? 'bg-blue-600 text-white'
                    : ['info', 'images', 'prompt', 'code'].indexOf(step) > idx
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {idx + 1}
              </div>
              {idx < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    ['info', 'images', 'prompt', 'code'].indexOf(step) > idx
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>School Info</span>
          <span>Upload Images</span>
          <span>Get Prompt</span>
          <span>Paste Code</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Step 1: School Information */}
      {step === 'info' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">School Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">School Name *</label>
              <input
                type="text"
                value={schoolInfo.name}
                onChange={(e) => setSchoolInfo({ ...schoolInfo, name: e.target.value })}
                placeholder="e.g., Lincoln High School"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mascot (optional)</label>
              <input
                type="text"
                value={schoolInfo.mascot}
                onChange={(e) => setSchoolInfo({ ...schoolInfo, mascot: e.target.value })}
                placeholder="e.g., Eagles"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Primary Color</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={schoolInfo.primaryColor}
                    onChange={(e) => setSchoolInfo({ ...schoolInfo, primaryColor: e.target.value })}
                    className="h-10 w-20 rounded-md border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={schoolInfo.primaryColor}
                    onChange={(e) => setSchoolInfo({ ...schoolInfo, primaryColor: e.target.value })}
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
                    value={schoolInfo.secondaryColor}
                    onChange={(e) => setSchoolInfo({ ...schoolInfo, secondaryColor: e.target.value })}
                    className="h-10 w-20 rounded-md border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={schoolInfo.secondaryColor}
                    onChange={(e) => setSchoolInfo({ ...schoolInfo, secondaryColor: e.target.value })}
                    placeholder="#F59E0B"
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date *</label>
              <input
                type="date"
                value={schoolInfo.startDate}
                onChange={(e) => setSchoolInfo({ ...schoolInfo, startDate: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date *</label>
              <input
                type="date"
                value={schoolInfo.endDate}
                onChange={(e) => setSchoolInfo({ ...schoolInfo, endDate: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Time Zone *</label>
              <select
                value={schoolInfo.timeZone}
                onChange={(e) => setSchoolInfo({ ...schoolInfo, timeZone: e.target.value })}
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
            <button
              onClick={() => {
                if (!schoolInfo.startDate || !schoolInfo.endDate || !schoolInfo.timeZone) {
                  setError('Please fill in all required fields (marked with *)');
                  return;
                }
                setStep('images');
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Next: Upload Images
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Upload Images */}
      {step === 'images' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Images</h3>
          <p className="text-sm text-gray-600 mb-6">
            Upload images of your school's bell schedule and calendar. These will be used to generate a prompt for AI assistance.
          </p>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bell Schedule Image (optional but recommended)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setScheduleImage(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {scheduleImage && (
                <p className="mt-2 text-sm text-green-600">✓ {scheduleImage.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Year Calendar Image (optional but recommended)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCalendarImage(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {calendarImage && (
                <p className="mt-2 text-sm text-green-600">✓ {calendarImage.name}</p>
              )}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setStep('info')}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Back
              </button>
              <button
                onClick={generatePrompt}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Generate AI Prompt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Generated Prompt */}
      {step === 'prompt' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Prompt Generated</h3>
          <p className="text-sm text-gray-600 mb-4">
            Copy this prompt and paste it into ChatGPT, Claude, or another AI assistant. Attach your images when prompted.
          </p>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Prompt to Copy:</label>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedPrompt);
                  alert('Prompt copied to clipboard!');
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Copy Prompt
              </button>
            </div>
            <textarea
              value={generatedPrompt}
              readOnly
              className="w-full h-96 p-3 border border-gray-300 rounded-md font-mono text-sm"
            />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Instructions:</strong> After copying the prompt, go to ChatGPT/Claude, paste it, and attach your images. 
              The AI will analyze the images and return a JSON configuration. Copy that JSON and paste it in the next step.
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setStep('images')}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Back
            </button>
            <button
              onClick={() => setStep('code')}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              I Have the JSON Code
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Paste LLM Code */}
      {step === 'code' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Paste AI-Generated Code</h3>
          <p className="text-sm text-gray-600 mb-4">
            Paste the JSON code that the AI generated. It should include schedules, breaks, and special days.
          </p>
          <div className="mb-4">
            <textarea
              value={llmCode}
              onChange={(e) => setLlmCode(e.target.value)}
              placeholder='Paste JSON here...\n\nExample:\n{\n  "schedules": [...],\n  "breaks": [...],\n  "specialDays": [...]\n}'
              className="w-full h-96 p-3 border border-gray-300 rounded-md font-mono text-sm"
            />
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setStep('prompt')}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Back
            </button>
            <button
              onClick={processLlmCode}
              disabled={isProcessing || !llmCode.trim()}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Create Calendar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

