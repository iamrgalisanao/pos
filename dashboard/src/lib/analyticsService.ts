import api from './api';

export const AnalyticsService = {
    getRevenueTrend: async (startDate?: string, endDate?: string) => {
        const response = await api.get('/analytics/revenue', { params: { startDate, endDate } });
        return response.data;
    },

    getProductPerformance: async (startDate?: string, endDate?: string) => {
        const response = await api.get('/analytics/products', { params: { startDate, endDate } });
        return response.data;
    },

    getStaffPerformance: async (startDate?: string, endDate?: string) => {
        const response = await api.get('/analytics/staff', { params: { startDate, endDate } });
        return response.data;
    },

    getCategoryPerformance: async (startDate?: string, endDate?: string) => {
        const response = await api.get('/analytics/categories', { params: { startDate, endDate } });
        return response.data;
    },

    exportCSV: async () => {
        const response = await api.get('/analytics/export', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
    }
};
