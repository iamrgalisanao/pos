'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface User {
    id: string;
    name: string;
    role: string;
    tenant_id: string;
    store_id: string;
    store_name?: string;
}

interface Store {
    id: string;
    name: string;
    address: string;
    currency_code: string;
    settings: any;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    store: Store | null;
    currencySymbol: string;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    refreshStoreInfo: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [store, setStore] = useState<Store | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const currencySymbol = React.useMemo(() => {
        if (!store?.currency_code) return '$';
        const symbols: { [key: string]: string } = {
            'PHP': '₱',
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'JPY': '¥',
            'AUD': 'A$',
            'CAD': 'C$',
            'SGD': 'S$',
            'AED': 'DH',
            'SAR': 'SR'
        };
        return symbols[store.currency_code] || store.currency_code || '$';
    }, [store?.currency_code]);

    useEffect(() => {
        // Check for stored session on mount
        const storedToken = localStorage.getItem('pos_token');
        const storedUser = localStorage.getItem('pos_user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        if (user && !store) {
            refreshStoreInfo();
        }
        if (!user) {
            setStore(null);
            setIsLoading(false);
        }
    }, [user]);

    const refreshStoreInfo = async () => {
        if (!user) return;
        try {
            const resp = await api.get('/stores', {
                headers: { 'X-Tenant-ID': user.tenant_id }
            });
            const stores = resp.data;
            // Fallback: If user has no specific store_id (e.g. global owner), pick the first store
            const currentStore = stores.find((s: any) => s.id === user.store_id) || stores[0];
            if (currentStore) {
                setStore(currentStore);
            }
        } catch (err) {
            console.error('Failed to fetch store info', err);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, staff } = response.data;

            setToken(token);
            setUser(staff);

            localStorage.setItem('pos_token', token);
            localStorage.setItem('pos_user', JSON.stringify(staff));

            if (staff.role === 'cashier') {
                router.push('/terminal');
            } else {
                router.push('/');
            }
        } catch (error: any) {
            console.error('Login failed:', error.response?.data || error.message);
            throw error;
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('pos_token');
        localStorage.removeItem('pos_user');
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, token, store, currencySymbol, login, logout, refreshStoreInfo, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
