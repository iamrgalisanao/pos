'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { X, Tag, Settings2, Trash2, Edit3, CheckCircle2, LayoutGrid, Monitor, Sparkles } from 'lucide-react';

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    tenantId: string;
    categories: any[];
}

export default function CategoryModal({ isOpen, onClose, onSave, tenantId, categories }: CategoryModalProps) {
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        send_to_kds: true,
        kds_station: 'General'
    });

    const stations = ['General', 'Kitchen', 'Bar', 'Grill', 'Coffee'];

    const handleEdit = (cat: any) => {
        setEditingId(cat.id);
        setFormData({
            name: cat.name,
            send_to_kds: cat.send_to_kds,
            kds_station: cat.kds_station || 'General'
        });
    };

    const handleReset = () => {
        setEditingId(null);
        setFormData({ name: '', send_to_kds: true, kds_station: 'General' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingId) {
                await api.put(`/categories/${editingId}`, { ...formData, tenant_id: tenantId });
            } else {
                await api.post('/categories', { ...formData, tenant_id: tenantId });
            }
            handleReset();
            onSave();
        } catch (err) {
            console.error('Failed to save category', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? Products in this category will remain, but the category will be hidden.')) return;
        try {
            await api.delete(`/categories/${id}`, { headers: { 'X-Tenant-ID': tenantId } });
            onSave();
        } catch (err) {
            console.error('Failed to delete category', err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white relative z-10">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                            <LayoutGrid className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Catalog Architecture</h2>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Categories & KDS Routing</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-300">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30 p-8 space-y-8">
                    {/* Integrated Form Card */}
                    <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                        <div className="flex items-center space-x-4 mb-2">
                            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <Tag className="w-5 h-5" />
                            </div>
                            <h3 className="font-black text-slate-800 uppercase tracking-tight">
                                {editingId ? 'Edit Construction' : 'Define New Group'}
                            </h3>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Identity Label</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Signature Beverages"
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-slate-700"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">KDS Terminal</label>
                                    <div className="relative">
                                        <select
                                            value={formData.kds_station}
                                            onChange={(e) => setFormData({ ...formData, kds_station: e.target.value })}
                                            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-slate-700 appearance-none cursor-pointer"
                                        >
                                            {stations.map(s => <option key={s} value={s}>{s} Station</option>)}
                                        </select>
                                        <Monitor className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="flex items-center pt-6 px-1">
                                    <label className="flex items-center space-x-3 cursor-pointer select-none group">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={formData.send_to_kds}
                                                onChange={(e) => setFormData({ ...formData, send_to_kds: e.target.checked })}
                                                className="peer sr-only"
                                            />
                                            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-indigo-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full shadow-inner"></div>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-800 transition-colors">Broadcast to KDS</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex space-x-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : editingId ? 'Initialize Update' : 'Initialize Category'}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="px-8 py-4 bg-white border border-slate-200 rounded-2xl text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Hierarchy List Card */}
                    <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                                    <Settings2 className="w-5 h-5" />
                                </div>
                                <h3 className="font-black text-slate-800 uppercase tracking-tight">Active Registry</h3>
                            </div>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{categories.length} Entries</span>
                        </div>

                        <div className="space-y-3">
                            {categories.length === 0 ? (
                                <div className="py-12 text-center space-y-4 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-100">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">No categories established</p>
                                </div>
                            ) : (
                                categories.map((cat) => (
                                    <div key={cat.id} className="group p-5 bg-slate-50/50 rounded-2xl border border-transparent hover:border-indigo-100 hover:bg-white transition-all flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-800 uppercase tracking-tight text-sm">{cat.name}</span>
                                            <div className="flex items-center space-x-3 mt-1">
                                                <div className="flex items-center space-x-1">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${cat.send_to_kds ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${cat.send_to_kds ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                        {cat.send_to_kds ? `${cat.kds_station || 'General'} KDS` : 'Local only'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 opacity-10 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(cat)}
                                                className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all hover:bg-indigo-50"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cat.id)}
                                                className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400 hover:text-rose-600 transition-all hover:bg-rose-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-slate-50 bg-white flex justify-center">
                    <div className="flex items-center space-x-2 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <p className="text-[10px] uppercase font-black tracking-widest">Routing Schema Validated</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
