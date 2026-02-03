'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

import api from '@/lib/api';
import Link from 'next/link';
import CustomerModal from '@/components/CustomerModal';

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

export default function CustomersPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (!authLoading && (!user || (user.role !== 'owner' && user.role !== 'manager'))) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user) return;
        fetchCustomers();
    }, [user]);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/customers', { headers: { 'X-Tenant-ID': user?.tenant_id } });
            setCustomers(res.data);
        } catch (err) {
            console.error('Failed to fetch customers', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
    );

    if (authLoading || loading) return (
        <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!user) return null;

    return (
        <>
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 space-y-4 md:space-y-0 text-slate-800">
                <div>
                    <h1 className="text-3xl font-black font-display tracking-tight">Customer Directory</h1>
                    <p className="text-slate-500 font-medium">Manage customer relationships and loyalty points</p>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary flex items-center space-x-2 px-6 py-3"
                    >
                        <span className="text-xl leading-none font-black">+</span>
                        <span>New Customer</span>
                    </button>
                </div>
            </header>

            <div className="mb-8 relative">
                <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm transition-all outline-none text-slate-700 placeholder:text-slate-400 font-medium"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Customer</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Tier</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Points</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">LTV</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Joined</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredCustomers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                                    No customers found.
                                </td>
                            </tr>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-slate-50/50 transition-all group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black">
                                                {customer.name[0]}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 tracking-tight">{customer.name}</span>
                                                <span className="text-xs text-slate-400 font-medium">{customer.email || customer.phone || 'No contact info'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${customer.loyalty_tier === 'gold' ? 'bg-amber-100 text-amber-700' :
                                            customer.loyalty_tier === 'silver' ? 'bg-slate-100 text-slate-700' :
                                                'bg-indigo-50 text-indigo-700'
                                            }`}>
                                            {customer.loyalty_tier}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center space-x-1.5">
                                            <span className="font-black text-slate-800">{Number(customer.points_balance || 0).toLocaleString()}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">pts</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 font-black text-slate-800">
                                        ${Number(customer.total_spent || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-5 text-sm text-slate-500 font-medium">
                                        {new Date(customer.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <Link
                                            href={`/customers/${customer.id}`}
                                            className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 font-bold text-xs hover:bg-white hover:shadow-sm transition-all"
                                        >
                                            <span>View Profile</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <CustomerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={fetchCustomers}
                tenantId={user.tenant_id}
            />
        </>
    );
}
