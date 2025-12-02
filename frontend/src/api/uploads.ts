import { apiClient, Upload, UploadType } from './client';

export const uploadsApi = {
  getAll: async (schoolYearId?: string): Promise<Upload[]> => {
    const params = schoolYearId ? `?schoolYearId=${schoolYearId}` : '';
    const response = await apiClient.get<Upload[]>(`/uploads${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<Upload> => {
    const response = await apiClient.get<Upload>(`/uploads/${id}`);
    return response.data;
  },

  upload: async (
    file: File,
    type: UploadType,
    schoolYearId?: string
  ): Promise<Upload> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (schoolYearId) {
      formData.append('schoolYearId', schoolYearId);
    }

    const response = await apiClient.post<Upload>('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (id: string, data: Partial<{
    parsed: boolean;
    parsedSummary: any;
    schoolYearId: string | null;
  }>): Promise<Upload> => {
    const response = await apiClient.put<Upload>(`/uploads/${id}`, data);
    return response.data;
  },

  getFileUrl: (id: string): string => {
    return `${apiClient.defaults.baseURL}/uploads/${id}/file`;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/uploads/${id}`);
  },
};

