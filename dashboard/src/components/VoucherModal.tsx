'use client';

import React, { useState } from 'react';
import { MarketingService, Voucher } from '@/lib/marketingService';
import { useAuth } from '@/context/AuthContext';
import { Tag, Calendar, Banknote, Percent, AlertCircle } from 'lucide-react';

interface VoucherModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

export default function VoucherModal({ isOpen, onClose, onSave }: VoucherModalProps) {
    const { currencySymbol } = useAuth();
    const [formData, setFormData] = useState({
        code: '',
        type: 'percentage' as 'percentage' | 'fixed',
        value: 0,
        min_spend: 0,
        expires_at: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await MarketingService.createVoucher(formData);
            onSave();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create voucher');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Create Voucher</h2>
                            <p className="text-slate-500 text-sm mt-1">Configure a new promotion code.</p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                            <Tag className="w-6 h-6" />
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 rounded-2xl flex items-center gap-3 text-red-600 text-sm animate-shake">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Voucher Code</label>
                            <input
                                type="text"
                                required
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder="E.G. SUMMER20"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all uppercase font-mono tracking-widest"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Discount Type</label>
                                <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'percentage' })}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${formData.type === 'percentage' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                                    >
                                        <Percent className="w-4 h-4" />
                                        Percent
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'fixed' })}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${formData.type === 'fixed' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                                    >
                                        <Banknote className="w-4 h-4" />
                                        Fixed
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Value</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.value}
                                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Minimum Spend ({currencySymbol})</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.min_spend}
                                onChange={(e) => setFormData({ ...formData, min_spend: Number(e.target.value) })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                Expiry Date (Optional)
                            </label>
                            <input
                                type="date"
                                value={formData.expires_at}
                                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Voucher'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
