'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface StoreMetric {
    id: string;
    name: string;
    revenue: string;
    orders: number;
    status: 'online' | 'offline';
    topItem: string;
}

export default function EnterpriseCentral() {
    const { currencySymbol } = useAuth();
    const [stores] = useState<StoreMetric[]>([
        { id: '1', name: 'Downtown Cafe', revenue: '12,450.00', orders: 452, status: 'online', topItem: 'Iced Latte' },
        { id: '2', name: 'Westside Bakery', revenue: '8,200.50', orders: 310, status: 'online', topItem: 'Croissant' },
        { id: '3', name: 'Uptown Bistro', revenue: '15,600.00', orders: 520, status: 'offline', topItem: 'Steak Frites' },
    ]);

    return (
        <>
            <header className="mb-10 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Owner Central</h1>
                    <p className="text-muted">Multi-store performance aggregation and management.</p>
                </div>
                <div className="flex space-x-3">
                    <button className="bg-white border text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">Manage Regions</button>
                    <button className="btn-primary">Add Store</button>
                </div>
            </header>

            {/* Global Aggregation */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <GlobalMetric label="Total Network Revenue" value={`${currencySymbol}36,250.50`} trend="↑ 12%" />
                <GlobalMetric label="Active Stores" value="2 / 3" trend="1 offline alert" trendColor="text-rose-500" />
                <GlobalMetric label="Network-wide Orders" value="1,282" trend="stable" />
                <GlobalMetric label="Loyal Customers" value="4,520" trend="↑ 85 new" />
            </div>

            <div className="premium-card bg-white overflow-hidden p-0">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="font-bold text-slate-800">Store Network Status</h2>
                    <span className="text-xs text-muted font-mono uppercase tracking-widest">Live Updates</span>
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Store Name</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Today's Revenue</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Orders</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Top Performing Item</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {stores.map((store) => (
                            <tr key={store.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <span className="font-semibold text-slate-900">{store.name}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="font-mono font-bold text-slate-900">{currencySymbol}{store.revenue}</span>
                                </td>
                                <td className="px-6 py-4 text-right text-slate-600 font-mono italic">
                                    {store.orders}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg font-medium">{store.topItem}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${store.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                        <span className={`text-xs font-bold uppercase tracking-widest ${store.status === 'online' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            {store.status}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );

}

function GlobalMetric({ label, value, trend, trendColor = "text-emerald-500" }: { label: string, value: string, trend: string, trendColor?: string }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-indigo-100">
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">{label}</h3>
            <div className="text-2xl font-black text-slate-900 mb-2">{value}</div>
            <div className={`text-[10px] font-bold ${trendColor}`}>{trend}</div>
        </div>
    )
}
