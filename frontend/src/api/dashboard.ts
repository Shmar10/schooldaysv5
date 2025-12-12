import { apiClient, DashboardData } from './client';

export const dashboardApi = {
  getDashboard: async (schoolYearId: string): Promise<DashboardData> => {
    const response = await apiClient.get<DashboardData>(`/dashboard/${schoolYearId}`);
    return response.data;
  },
};

