'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

import api from '@/lib/api';

interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    loyalty_tier: string;
    points_balance: number;
    total_spent: number;
    created_at: string;
}

interface Order {
    id: string;
    total_amount: number;
    status: string;
    created_at: string;
}

interface LoyaltyLog {
    id: string;
    points: number;
    type: string;
    description: string;
    created_at: string;
}

export default function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loyaltyLogs, setLoyaltyLogs] = useState<LoyaltyLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && (!user || (user.role !== 'owner' && user.role !== 'manager'))) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user) return;
        fetchData();
    }, [user, id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const headers = { 'X-Tenant-ID': user?.tenant_id };
            const [custRes, orderRes, loyaltyRes] = await Promise.all([
                api.get(`/customers/${id}`, { headers }),
                api.get(`/customers/${id}/history`, { headers }),
                api.get(`/customers/${id}/loyalty`, { headers })
            ]);
            setCustomer(custRes.data);
            setOrders(orderRes.data);
            setLoyaltyLogs(loyaltyRes.data);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) return (
        <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!user || !customer) return null;

    return (
        <>
            <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-slate-400 hover:text-indigo-600 transition-colors font-bold mb-6 group"
            >
                <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center group-hover:bg-indigo-50 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                    </svg>
                </div>
                <span>Back to Directory</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Profile Summary */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 p-8 flex flex-col items-center text-center">
                        <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-black mb-6 shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                            {customer.name[0]}
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">{customer.name}</h1>
                        <p className="text-slate-400 font-medium mb-6">{customer.email || 'No email provided'}</p>

                        <div className={`px-4 py-2 rounded-2xl text-sm font-black uppercase tracking-widest ${customer.loyalty_tier === 'gold' ? 'bg-amber-100 text-amber-700 shadow-[0_0_12px_rgba(180,83,9,0.2)]' :
                            customer.loyalty_tier === 'silver' ? 'bg-slate-100 text-slate-700' :
                                'bg-indigo-50 text-indigo-700'
                            }`}>
                            {customer.loyalty_tier} Member
                        </div>

                        <div className="w-full h-px bg-slate-100 my-8"></div>

                        <div className="grid grid-cols-2 gap-4 w-full">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Spent</span>
                                <span className="text-lg font-black text-slate-800">${Number(customer.total_spent || 0).toLocaleString()}</span>
                            </div>
                            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex flex-col">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Current Points</span>
                                <span className="text-lg font-black text-indigo-700">{Number(customer.points_balance || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 p-8">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Contact Information</h3>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3 p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer">
                                <div className="text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-bold text-slate-600">{customer.phone || 'Not available'}</span>
                            </div>
                            <div className="flex items-center space-x-3 p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer">
                                <div className="text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-bold text-slate-600">Member since {new Date(customer.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: History & Logs */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Order History */}
                    <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Recent Purchase History</h3>
                            <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">{orders.length} total orders</span>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Order ID</th>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {orders.length === 0 ? (
                                        <tr><td colSpan={4} className="px-8 py-12 text-center text-slate-400 italic font-medium">No order history found.</td></tr>
                                    ) : (
                                        orders.map(order => (
                                            <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-5">
                                                    <span className="font-mono text-xs text-indigo-600 font-bold tracking-tighter">#{order.id.split('-')[0].toUpperCase()}</span>
                                                </td>
                                                <td className="px-8 py-5 text-sm text-slate-500 font-medium">{new Date(order.created_at).toLocaleString()}</td>
                                                <td className="px-8 py-5">
                                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right font-black text-slate-800">${Number(order.total_amount).toFixed(2)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Loyalty Ledger */}
                    <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Points Ledger</h3>
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                <span className="text-[10px] font-black text-indigo-500 uppercase">Live Log</span>
                            </div>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            <div className="divide-y divide-slate-50">
                                {loyaltyLogs.length === 0 ? (
                                    <div className="p-12 text-center text-slate-400 italic font-medium">No point transactions found.</div>
                                ) : (
                                    loyaltyLogs.map(log => (
                                        <div key={log.id} className="px-8 py-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                            <div className="flex items-center space-x-4">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${Number(log.points) > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                    }`}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        {Number(log.points) > 0 ? (
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                        ) : (
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                        )}
                                                    </svg>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 text-sm tracking-tight">{log.description}</span>
                                                    <span className="text-xs text-slate-400 font-medium">{new Date(log.created_at).toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className={`text-lg font-black ${Number(log.points) > 0 ? 'text-emerald-500' : 'text-rose-500'
                                                }`}>
                                                {Number(log.points) > 0 ? '+' : ''}{log.points}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
