'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

import GlobalStats from '@/components/GlobalStats';

interface ComparisonData {
    store_id: string;
    store_name: string;
    revenue: string;
    order_count: string;
}

export default function AdminGlobalOverview() {
    const { user, isLoading: authLoading } = useAuth();
    const [metrics, setMetrics] = useState<any>(null);
    const [comparison, setComparison] = useState<ComparisonData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user && (user.role === 'cashier')) {
            router.push('/terminal');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && (user.role === 'owner' || user.role === 'manager')) {
            fetchGlobalData();
        }
    }, [user]);

    const fetchGlobalData = async () => {
        try {
            setLoading(true);
            const [metricsResp, comparisonResp] = await Promise.all([
                api.get('/admin/global-metrics', { headers: { 'X-Tenant-ID': user?.tenant_id } }),
                api.get('/admin/store-comparison', { headers: { 'X-Tenant-ID': user?.tenant_id } })
            ]);

            setMetrics(metricsResp.data);
            setComparison(comparisonResp.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch admin data', err);
            setError('Failed to load global metrics. Please try again later.');
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <>
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 font-display tracking-tight mb-2">Global Overview</h1>
                    <p className="text-muted font-medium">Consolidated performance analytics across all locations</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl shadow-sm border text-sm font-bold text-slate-500">
                    Tenant ID: {user.tenant_id?.slice(0, 8) || 'N/A'}...
                </div>
            </header>

            {error ? (
                <div className="premium-card bg-rose-50 border-rose-100 p-8 text-center">
                    <p className="text-rose-600 font-bold">{error}</p>
                    <button onClick={fetchGlobalData} className="btn-primary mt-4 px-6">Retry</button>
                </div>
            ) : (
                <div className="space-y-10">
                    {/* Summary Section */}
                    {metrics && (
                        <GlobalStats
                            summary={metrics.summary}
                            topProducts={metrics.top_products}
                        />
                    )}

                    {/* Store Comparison Section */}
                    <div className="premium-card bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-slate-900 font-display">Store Performance Comparison</h3>
                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">Real-time Data</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {comparison.map((store) => (
                                <div
                                    key={store.store_id}
                                    className="p-6 rounded-2xl border-2 border-slate-50 hover:border-indigo-100 hover:bg-slate-50/30 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{store.store_name}</h4>
                                        <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded uppercase">Store</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Revenue</p>
                                            <p className="text-2xl font-black text-slate-900">${parseFloat(store.revenue).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Orders</p>
                                            <p className="text-lg font-bold text-slate-600">{store.order_count}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-400">ID: {store.store_id?.slice(0, 8) || 'N/A'}</span>
                                        <button
                                            onClick={() => router.push(`/?store_id=${store.store_id}`)}
                                            className="text-xs font-black text-indigo-600 hover:translate-x-1 transition-transform"
                                        >
                                            View Details →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
