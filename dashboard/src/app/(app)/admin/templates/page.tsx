'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

import { Plus, Package, Layout } from 'lucide-react';

interface BusinessTemplate {
    id: string;
    name: string;
    vertical: string;
    description: string;
    current_version: string;
    created_at: string;
}

export default function TemplatesPage() {
    const { user } = useAuth();
    const [templates, setTemplates] = useState<BusinessTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const res = await api.get('/platform/templates');
            setTemplates(res.data);
        } catch (err) {
            console.error('Failed to fetch templates', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Template Blueprints</h1>
                    <p className="text-slate-400 font-medium">Manage onboarding configurations for all industry verticals.</p>
                </div>
                <button
                    onClick={() => window.location.href = '/admin/templates/new/builder'}
                    className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 hover:bg-black transition-all shadow-lg shadow-slate-200"
                >
                    <Plus className="w-5 h-5" />
                    <span>Create Template</span>
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {templates.map(template => (
                    <div key={template.id} className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${template.vertical === 'cafe' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                <Package className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                                v{template.current_version || '0.0'}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-slate-800 mb-2 truncate">{template.name}</h3>
                        <p className="text-sm text-slate-400 line-clamp-2 mb-6 h-10">{template.description}</p>

                        <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                            <div className="flex items-center space-x-2">
                                <span className={`w-2 h-2 rounded-full ${template.current_version ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`} />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {template.current_version ? 'Published' : 'Draft'}
                                </span>
                            </div>
                            <div className="flex flex-col space-y-2 text-right">
                                <a
                                    href={`/admin/templates/${template.id}`}
                                    className="text-xs font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
                                >
                                    View Details
                                </a>
                                <a
                                    href={`/admin/templates/${template.id}/builder`}
                                    className="text-sm font-black text-indigo-600 hover:text-indigo-400 transition-colors uppercase tracking-widest"
                                >
                                    Launch Designer →
                                </a>
                            </div>
                        </div>
                    </div>
                ))}

                {loading && [1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-[32px] p-6 border border-slate-100 animate-pulse">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl mb-4" />
                        <div className="h-6 bg-slate-50 rounded-lg w-2/3 mb-2" />
                        <div className="h-10 bg-slate-50 rounded-lg w-full mb-6" />
                        <div className="h-10 bg-slate-50 rounded-lg w-full" />
                    </div>
                ))}
            </div>

            {!loading && templates.length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <Layout className="w-10 h-10" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">No Templates Found</h3>
                    <p className="text-slate-400">Start by creating your first vertical blueprint.</p>
                </div>
            )}
        </div>
    );
}
