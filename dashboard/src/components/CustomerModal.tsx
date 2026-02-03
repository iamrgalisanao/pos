'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface CustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    tenantId: string;
    customer?: any; // If provided, we are editing
}

export default function CustomerModal({ isOpen, onClose, onSave, tenantId, customer }: CustomerModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        loyalty_tier: 'bronze'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name || '',
                email: customer.email || '',
                phone: customer.phone || '',
                loyalty_tier: customer.loyalty_tier || 'bronze'
            });
        } else {
            setFormData({
                name: '',
                email: '',
                phone: '',
                loyalty_tier: 'bronze'
            });
        }
    }, [customer, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (customer) {
                await api.put(`/customers/${customer.id}`, { ...formData, tenant_id: tenantId });
            } else {
                await api.post('/customers', { ...formData, tenant_id: tenantId });
            }
            onSave();
            onClose();
        } catch (err) {
            console.error('Failed to save customer', err);
            alert('Failed to save customer details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                            {customer ? 'Edit Customer' : 'New Customer'}
                        </h2>
                        <p className="text-slate-400 font-medium text-sm">Update profile and loyalty level</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                        <input
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium text-slate-700"
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium text-slate-700"
                            placeholder="john@example.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium text-slate-700"
                            placeholder="+1 234 567 890"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Loyalty Tier</label>
                        <select
                            value={formData.loyalty_tier}
                            onChange={(e) => setFormData({ ...formData, loyalty_tier: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-slate-700 appearance-none cursor-pointer"
                        >
                            <option value="bronze">Bronze (Default)</option>
                            <option value="silver">Silver (1.2x Points)</option>
                            <option value="gold">Gold (1.5x Points)</option>
                        </select>
                    </div>

                    <div className="pt-4 flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary px-10 py-3 disabled:opacity-50 min-w-[140px]"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mx-auto"></div>
                            ) : (
                                customer ? 'Update Profile' : 'Create Customer'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
