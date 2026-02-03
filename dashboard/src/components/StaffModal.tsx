'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { User, Shield, Store, Mail, Lock, AlertCircle, Save, X } from 'lucide-react';

interface StaffMember {
    id?: string;
    name: string;
    email: string;
    role: string;
    store_id: string;
    password?: string;
    is_active?: boolean;
}

interface StaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    tenantId: string;
    staffMember?: StaffMember | null;
}

export default function StaffModal({ isOpen, onClose, onSave, tenantId, staffMember }: StaffModalProps) {
    const [formData, setFormData] = useState<StaffMember>({
        name: '',
        email: '',
        role: 'cashier',
        store_id: '',
        password: ''
    });
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchStores();
            if (staffMember) {
                setFormData({
                    ...staffMember,
                    password: '' // Don't show hashed password
                });
            } else {
                setFormData({
                    name: '',
                    email: '',
                    role: 'cashier',
                    store_id: '',
                    password: ''
                });
            }
        }
    }, [isOpen, staffMember]);

    const fetchStores = async () => {
        try {
            const res = await api.get('/stores');
            setStores(res.data);
            if (!formData.store_id && res.data.length > 0) {
                setFormData(prev => ({ ...prev, store_id: res.data[0].id }));
            }
        } catch (err) {
            console.error('Failed to fetch stores');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (staffMember?.id) {
                await api.put(`/staff/${staffMember.id}`, {
                    ...formData,
                    tenant_id: tenantId
                });
            } else {
                await api.post('/staff', {
                    ...formData,
                    tenant_id: tenantId
                });
            }
            onSave();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to save staff member');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm shadow-xl" onClick={onClose} />

            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">{staffMember ? 'Edit Staff Member' : 'Add New Staff'}</h2>
                            <p className="text-slate-500 text-sm mt-1">Configure account access and permissions.</p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                            {staffMember ? <User className="w-6 h-6" /> : <Save className="w-6 h-6" />}
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 rounded-2xl flex items-center gap-3 text-red-600 text-sm animate-shake">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                    <User className="w-4 h-4 text-slate-400" />
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-slate-400" />
                                    Role
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none bg-white font-medium text-slate-700"
                                >
                                    <option value="cashier">Cashier</option>
                                    <option value="manager">Manager</option>
                                    <option value="owner">Owner</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                    <Store className="w-4 h-4 text-slate-400" />
                                    Assigned Store
                                </label>
                                <select
                                    value={formData.store_id}
                                    onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none bg-white font-medium text-slate-700"
                                >
                                    {stores.map(store => (
                                        <option key={store.id} value={store.id}>{store.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                <Lock className="w-4 h-4 text-slate-400" />
                                {staffMember ? 'Update Password (Optional)' : 'Set Password'}
                            </label>
                            <input
                                type="password"
                                required={!staffMember}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                placeholder="••••••••"
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
                                {loading ? 'Saving...' : 'Save Staff Member'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
