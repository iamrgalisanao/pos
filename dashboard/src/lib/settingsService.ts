import api from './api';

export const SettingsService = {
    async getStores() {
        const response = await api.get('/stores');
        return response.data;
    },

    async updateStore(id: string, data: any) {
        const response = await api.put(`/stores/${id}`, data);
        return response.data;
    },

    async generateZReport(storeId: string, staffId: string) {
        const response = await api.post('/reports/z-reading', {
            store_id: storeId,
            staff_id: staffId
        });
        return response.data;
    },

    async getZReports(storeId: string) {
        const response = await api.get(`/reports/z-reports?store_id=${storeId}`);
        return response.data;
    },

    async exportBIRSalesCSV(storeId: string, startDate: string, endDate: string) {
        const response = await api.get(
            `/reports/bir-sales-export?store_id=${storeId}&startDate=${startDate}&endDate=${endDate}`,
            { responseType: 'blob' }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `BIR_Sales_Export_${storeId}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    async resetStoreTransactions(storeId: string) {
        const response = await api.post(`/stores/${storeId}/reset`);
        return response.data;
    }
};
