import api from './api';

const TERMINAL_ID_KEY = 'pos_terminal_id';
const HEARTBEAT_INTERVAL = 60000; // 1 minute

export const TerminalService = {
    getTerminalId(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(TERMINAL_ID_KEY);
    },

    setTerminalId(id: string) {
        if (typeof window === 'undefined') return;
        localStorage.setItem(TERMINAL_ID_KEY, id);
    },

    async register(tenantId: string, storeId: string, name?: string): Promise<string> {
        const existingId = this.getTerminalId();
        if (existingId) return existingId;

        try {
            const fingerprint = typeof window !== 'undefined' ? navigator.userAgent : 'server';
            const response = await api.post('/terminals/register', {
                tenant_id: tenantId,
                store_id: storeId,
                name: name || `Terminal-${Math.random().toString(36).substr(2, 5)}`,
                browser_fingerprint: fingerprint
            });

            const newId = response.data.id;
            this.setTerminalId(newId);
            return newId;
        } catch (error) {
            console.error('Failed to register terminal:', error);
            throw error;
        }
    },

    startHeartbeat(tenantId: string) {
        const terminalId = this.getTerminalId();
        if (!terminalId) return () => { };

        const interval = setInterval(async () => {
            try {
                if (navigator.onLine) {
                    await api.post(`/terminals/${terminalId}/heartbeat`, { tenant_id: tenantId });
                }
            } catch (error) {
                console.warn('Heartbeat failed', error);
            }
        }, HEARTBEAT_INTERVAL);

        return () => clearInterval(interval);
    }
};
