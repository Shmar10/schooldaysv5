import { apiClient, Break } from './client';

export const breaksApi = {
  getAll: async (schoolYearId?: string): Promise<Break[]> => {
    const params = schoolYearId ? `?schoolYearId=${schoolYearId}` : '';
    const response = await apiClient.get<Break[]>(`/breaks${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<Break> => {
    const response = await apiClient.get<Break>(`/breaks/${id}`);
    return response.data;
  },

  create: async (data: {
    startDate: string;
    endDate: string;
    label: string;
    schoolYearId: string;
  }): Promise<Break> => {
    const response = await apiClient.post<Break>('/breaks', data);
    return response.data;
  },

  update: async (id: string, data: Partial<{
    startDate: string;
    endDate: string;
    label: string;
  }>): Promise<Break> => {
    const response = await apiClient.put<Break>(`/breaks/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/breaks/${id}`);
  },
};

