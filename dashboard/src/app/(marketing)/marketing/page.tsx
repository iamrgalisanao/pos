'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import VoucherModal from '@/components/VoucherModal';
import { MarketingService, Voucher } from '@/lib/marketingService';
import { Tag, Ticket, Trash2, Calendar, DollarSign, Percent, Plus, Megaphone, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; // Assuming useAuth is in AuthContext

export default function MarketingPage() {
    const { user, currencySymbol, isLoading: authLoading } = useAuth();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchVouchers = async () => {
        setIsLoading(true);
        try {
            const data = await MarketingService.getVouchers();
            setVouchers(data);
        } catch (error) {
            console.error('Failed to fetch vouchers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVouchers();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to deactivate this voucher?')) return;
        try {
            await MarketingService.deleteVoucher(id);
            fetchVouchers();
        } catch (error) {
            console.error('Failed to delete voucher:', error);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                                <Megaphone className="w-8 h-8 text-indigo-600" />
                                Marketing & Promotions
                            </h1>
                            <p className="text-slate-500 mt-1">Manage discount codes, vouchers, and loyalty campaigns.</p>
                        </div>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="btn-primary flex items-center gap-2 px-6 py-3"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Create Voucher</span>
                        </button>
                    </div>

                    {/* Tabs / Voucher List */}
                    <div className="glass-morphism overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/50">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Ticket className="w-5 h-5 text-indigo-500" />
                                Active Vouchers
                            </h2>
                            <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                {vouchers.filter(v => v.is_active).length} Active
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-50 bg-slate-50/30">
                                        <th className="py-4 px-6 text-sm font-semibold text-slate-500">Voucher Code</th>
                                        <th className="py-4 px-6 text-sm font-semibold text-slate-500">Discount</th>
                                        <th className="py-4 px-6 text-sm font-semibold text-slate-500">Min. Spend</th>
                                        <th className="py-4 px-6 text-sm font-semibold text-slate-500">Expires</th>
                                        <th className="py-4 px-6 text-sm font-semibold text-slate-500">Status</th>
                                        <th className="py-4 px-6 text-sm font-semibold text-slate-500 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center">
                                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                                    <Plus className="w-8 h-8 animate-spin" />
                                                    <p>Loading vouchers...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : vouchers.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center">
                                                <div className="flex flex-col items-center gap-3 text-slate-400">
                                                    <Tag className="w-12 h-12 mb-2 opacity-20" />
                                                    <p className="text-lg font-medium">No vouchers created yet</p>
                                                    <p className="max-w-xs mx-auto text-sm">Launch your first promotional campaign by clicking "Create Voucher".</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : vouchers.map((voucher) => (
                                        <tr key={voucher.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-mono text-xs">
                                                        #
                                                    </div>
                                                    <span className="font-bold text-slate-900 tracking-wider uppercase">{voucher.code}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    {voucher.type === 'percentage' ? (
                                                        <Percent className="w-4 h-4 text-emerald-500" />
                                                    ) : (
                                                        <DollarSign className="w-4 h-4 text-emerald-500" />
                                                    )}
                                                    <span className="font-semibold text-slate-700">
                                                        {voucher.value}{voucher.type === 'percentage' ? '%' : ''} Off
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-slate-600">
                                                ${Number(voucher.min_spend).toLocaleString()}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                                    <Calendar className="w-4 h-4" />
                                                    {voucher.expires_at ? new Date(voucher.expires_at).toLocaleDateString() : 'Never'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${voucher.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                                                    {voucher.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => handleDelete(voucher.id)}
                                                    disabled={!voucher.is_active}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-0"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Promo Tips */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-indigo-600 rounded-3xl text-white flex flex-col justify-between relative overflow-hidden">
                            <Megaphone className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12" />
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-2">Growth Tip</h3>
                                <p className="text-indigo-100 text-sm leading-relaxed mb-6">
                                    Flash sales with 10-15% discount codes typically drive 3x more traffic. Combine this with your Loyalty program for maximum effect.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-200">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                AI Insight Active
                            </div>
                        </div>

                        <div className="p-6 bg-white border border-slate-200 rounded-3xl flex items-start gap-4 shadow-sm">
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex-shrink-0 flex items-center justify-center text-amber-600">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">Voucher Security</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    Codes are case-insensitive but restricted to one per order. Minimum spend requirements prevent "low-ticket" abuse of fixed-amount vouchers.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            <VoucherModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={fetchVouchers}
            />
        </div>
    );
}
