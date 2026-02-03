'use client';

import React, { useState, useEffect } from 'react';
import StaffModal from '@/components/StaffModal';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Users, UserPlus, Search, Edit3, Trash2, ShieldCheck, Mail, MapPin, MoreHorizontal, Shield, UserX } from 'lucide-react';

interface StaffMember {
    id: string;
    name: string;
    email: string;
    role: string;
    store_id: string;
    store_name?: string;
    is_active: boolean;
}

export default function StaffPage() {
    const { user } = useAuth();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const res = await api.get('/staff');
            setStaff(res.data);
        } catch (error) {
            console.error('Failed to fetch staff:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchStaff();
        }
    }, [user]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to deactivate this staff member? Ellos will no longer be able to log in.')) return;
        try {
            await api.delete(`/staff/${id}`);
            fetchStaff();
        } catch (error) {
            console.error('Failed to delete staff:', error);
        }
    };

    const filteredStaff = staff.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'owner':
                return <span className="bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">Owner</span>;
            case 'manager':
                return <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">Manager</span>;
            default:
                return <span className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">Cashier</span>;
        }
    };

    if (loading) return (
        <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <>
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                            <Users className="w-8 h-8 text-indigo-600" />
                            Staff Management
                        </h1>
                        <p className="text-slate-500 mt-1">Manage user accounts, roles, and store assignments.</p>
                    </div>

                    <button
                        onClick={() => {
                            setSelectedStaff(null);
                            setIsModalOpen(true);
                        }}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                    >
                        <UserPlus className="w-5 h-5" />
                        <span>Add Staff Member</span>
                    </button>
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                        <Shield className="w-4 h-4" />
                        <span>Role-Based Access Control Enabled</span>
                    </div>
                </div>

                {/* Staff List */}
                <div className="glass-morphism overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="py-4 px-6 text-sm font-semibold text-slate-500">Staff Member</th>
                                    <th className="py-4 px-6 text-sm font-semibold text-slate-500">Role</th>
                                    <th className="py-4 px-6 text-sm font-semibold text-slate-500">Assigned Store</th>
                                    <th className="py-4 px-6 text-sm font-semibold text-slate-500">Status</th>
                                    <th className="py-4 px-6 text-sm font-semibold text-slate-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    [1, 2, 3].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={5} className="py-6 px-6"><div className="h-10 bg-slate-100 rounded-xl w-full"></div></td>
                                        </tr>
                                    ))
                                ) : filteredStaff.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 text-slate-400">
                                                <Users className="w-16 h-16 opacity-10" />
                                                <p className="text-lg font-medium">No staff members found</p>
                                                <button onClick={() => setIsModalOpen(true)} className="text-indigo-600 font-bold text-sm hover:underline">Add your first employee</button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredStaff.map((s) => (
                                    <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center text-slate-700 font-bold uppercase ring-2 ring-white">
                                                    {s.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">{s.name}</span>
                                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {s.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            {getRoleBadge(s.role)}
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-2 text-slate-600 font-medium">
                                                <MapPin className="w-4 h-4 text-slate-400" />
                                                {s.store_name || s.store_id?.slice(0, 8) || 'Multi-Store'}
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <span className={`flex items-center gap-1.5 text-xs font-bold ${s.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${s.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                                {s.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="py-5 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedStaff(s);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                    title="Edit Permissions"
                                                >
                                                    <Edit3 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(s.id)}
                                                    disabled={s.id === user?.id}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-0"
                                                    title="Deactivate Account"
                                                >
                                                    <UserX className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* RBAC Info Card */}
                <div className="p-6 bg-slate-900 rounded-[32px] text-white relative overflow-hidden">
                    <ShieldCheck className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                                Security Governance
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                                Our Role-Based Access Control (RBAC) ensures data integrity. Owners have full system access, Managers can oversee operations and analytics, and Cashiers are restricted to terminal and customer service functions.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="text-center bg-slate-800 px-6 py-4 rounded-2xl border border-slate-700 min-w-[120px]">
                                <div className="text-2xl font-black text-indigo-400">{staff.length}</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total Users</div>
                            </div>
                            <div className="text-center bg-slate-800 px-6 py-4 rounded-2xl border border-slate-700 min-w-[120px]">
                                <div className="text-2xl font-black text-emerald-400">{staff.filter(s => s.is_active).length}</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Active Now</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <StaffModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={fetchStaff}
                tenantId={user?.tenant_id || ''}
                staffMember={selectedStaff}
            />
        </>
    );

}
