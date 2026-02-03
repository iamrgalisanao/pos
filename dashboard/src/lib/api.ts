import axios from 'axios';

const api = axios.create({
    baseURL: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api',
});

// Interceptor to add auth token to requests
api.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('pos_token') : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    const userData = typeof window !== 'undefined' ? localStorage.getItem('pos_user') : null;
    if (userData) {
        try {
            const user = JSON.parse(userData);
            if (user.tenant_id) {
                config.headers['X-Tenant-ID'] = user.tenant_id;
            }
        } catch (e) {
            console.error('Failed to parse user data from localStorage', e);
        }
    }

    // If we're offline and this is a POST/PUT/PATCH (mutation), 
    // we might want to fail fast so the calling code handles the local queue
    if (typeof window !== 'undefined' && !navigator.onLine && ['post', 'put', 'patch', 'delete'].includes(config.method || '')) {
        // You could also throw a specific OfflineError here
    }

    return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            if (typeof window !== 'undefined') {
                localStorage.removeItem('pos_token');
                localStorage.removeItem('pos_user');
                // Redirect to login if not already there
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login?expired=true';
                }
            }
        }
        return Promise.reject(error);
    }
);

// Helper to check connectivity
export const isOnline = () => typeof window !== 'undefined' ? navigator.onLine : true;

export default api;
