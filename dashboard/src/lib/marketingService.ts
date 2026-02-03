import api from './api';

export interface Voucher {
    id: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    min_spend: number;
    expires_at?: string;
    is_active: boolean;
    created_at: string;
}

export const MarketingService = {
    getVouchers: async () => {
        const response = await api.get('/vouchers');
        return response.data as Voucher[];
    },

    createVoucher: async (data: Partial<Voucher>) => {
        const response = await api.post('/vouchers', data);
        return response.data as Voucher;
    },

    validateVoucher: async (code: string, subtotal: number) => {
        const response = await api.post('/vouchers/validate', { code, subtotal });
        return response.data as {
            valid: boolean;
            message?: string;
            voucher_id?: string;
            discount_amount?: number;
            type?: 'percentage' | 'fixed';
            value?: number;
        };
    },

    deleteVoucher: async (id: string) => {
        const response = await api.delete(`/vouchers/${id}`);
        return response.data;
    }
};
