import { apiClient, Schedule, Period } from './client';

export const schedulesApi = {
  getAll: async (schoolYearId?: string): Promise<Schedule[]> => {
    const params = schoolYearId ? `?schoolYearId=${schoolYearId}` : '';
    const response = await apiClient.get<Schedule[]>(`/schedules${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<Schedule> => {
    const response = await apiClient.get<Schedule>(`/schedules/${id}`);
    return response.data;
  },

  create: async (data: {
    name: string;
    isDefault?: boolean;
    schoolYearId: string;
    periods: Period[];
  }): Promise<Schedule> => {
    const response = await apiClient.post<Schedule>('/schedules', data);
    return response.data;
  },

  update: async (id: string, data: Partial<{
    name: string;
    isDefault: boolean;
    periods: Period[];
  }>): Promise<Schedule> => {
    const response = await apiClient.put<Schedule>(`/schedules/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/schedules/${id}`);
  },
};

