import { apiClient, Day } from './client';

export const daysApi = {
  getBySchoolYear: async (
    schoolYearId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Day[]> => {
    const params = new URLSearchParams({ schoolYearId });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await apiClient.get<Day[]>(`/days?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<Day> => {
    const response = await apiClient.get<Day>(`/days/${id}`);
    return response.data;
  },

  create: async (data: {
    schoolYearId: string;
    date: string;
    dayType: Day['dayType'];
    label?: string | null;
    notes?: string | null;
    isSchoolDay?: boolean;
    scheduleId?: string | null;
  }): Promise<Day> => {
    const response = await apiClient.post<Day>('/days', data);
    return response.data;
  },

  update: async (id: string, data: Partial<{
    date: string;
    dayType: Day['dayType'];
    label: string | null;
    notes: string | null;
    isSchoolDay: boolean;
    scheduleId: string | null;
  }>): Promise<Day> => {
    const response = await apiClient.put<Day>(`/days/${id}`, data);
    return response.data;
  },

  bulkUpdate: async (schoolYearId: string, updates: Array<{
    date: string;
    dayType?: Day['dayType'];
    label?: string | null;
    notes?: string | null;
    isSchoolDay?: boolean;
    scheduleId?: string | null;
  }>): Promise<{ updated: number; days: Day[] }> => {
    const response = await apiClient.post<{ updated: number; days: Day[] }>('/days/bulk', {
      schoolYearId,
      updates,
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/days/${id}`);
  },
};

