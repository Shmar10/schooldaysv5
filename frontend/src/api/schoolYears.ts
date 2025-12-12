import { apiClient, SchoolYear } from './client';

export const schoolYearApi = {
  getAll: async (): Promise<SchoolYear[]> => {
    const response = await apiClient.get<SchoolYear[]>('/school-years');
    return response.data;
  },

  getById: async (id: string): Promise<SchoolYear> => {
    const response = await apiClient.get<SchoolYear>(`/school-years/${id}`);
    return response.data;
  },

  create: async (data: {
    name: string;
    startDate: string;
    endDate: string;
    timeZone?: string;
    primaryColor?: string | null;
    secondaryColor?: string | null;
  }): Promise<SchoolYear> => {
    const response = await apiClient.post<SchoolYear>('/school-years', data);
    return response.data;
  },

  update: async (id: string, data: Partial<{
    name: string;
    startDate: string;
    endDate: string;
    timeZone: string;
    primaryColor?: string | null;
    secondaryColor?: string | null;
  }>): Promise<SchoolYear> => {
    const response = await apiClient.put<SchoolYear>(`/school-years/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/school-years/${id}`);
  },

  fixWeekends: async (id: string): Promise<SchoolYear & { fixedWeekendDays?: number }> => {
    const response = await apiClient.post<SchoolYear & { fixedWeekendDays?: number }>(`/school-years/${id}/fix-weekends`);
    return response.data;
  },
};

