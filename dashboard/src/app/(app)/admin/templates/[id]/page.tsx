'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

import {
    ChevronLeft, Package, Clock, Shield,
    Zap, Code, AlertTriangle, Rocket,
    Edit3, Trash2, Copy, Download,
    Store, List, Settings2, BarChart3,
    CheckCircle2, Info, Eye, Plus,
    FileText, Layout, Activity, Share2,
    ArrowRight, Check, AlertCircle, Bookmark
} from 'lucide-react';

interface TemplateVersion {
    id: string;
    version_code: string;
    status: string;
    config: any;
    created_at: string;
    published_at: string | null;
}

interface BusinessTemplate {
    id: string;
    name: string;
    vertical: string;
    description: string;
}

export default function TemplateDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { currencySymbol } = useAuth();
    const [template, setTemplate] = useState<BusinessTemplate | null>(null);
    const [versions, setVersions] = useState<TemplateVersion[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<TemplateVersion | null>(null);
    const [loading, setLoading] = useState(true);
    const [showJson, setShowJson] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (id) {
            fetchTemplateData();
        }
    }, [id]);

    const fetchTemplateData = async () => {
        try {
            setLoading(true);
            const tRes = await api.get('/platform/templates');
            const found = tRes.data.find((t: any) => t.id === id);
            setTemplate(found);

            const vRes = await api.get(`/platform/templates/${id}/versions`);
            setVersions(vRes.data);
            if (vRes.data.length > 0) {
                setSelectedVersion(vRes.data[0]); // Default to latest
            }
        } catch (err) {
            console.error('Failed to fetch template detail', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you absolutely sure you want to delete this entire blueprint? This will delete all versions and cannot be undone.')) return;

        setIsDeleting(true);
        try {
            await api.delete(`/platform/templates/${id}`);
            router.push('/admin/templates');
        } catch (err) {
            console.error('Failed to delete template', err);
            alert('Failed to delete template');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClone = async () => {
        try {
            const res = await api.post('/platform/templates/clone', {
                fromId: id
            });
            alert('Template cloned successfully!');
            router.push(`/admin/templates/${res.data.template.id}`);
        } catch (err) {
            console.error('Failed to clone template', err);
            alert('Failed to clone template');
        }
    };

    if (loading) return (
        <div className="h-full flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Blueprint...</p>
        </div>
    );

    if (!template) return (
        <div className="h-full flex flex-col items-center justify-center bg-slate-50 p-8 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-[32px] flex items-center justify-center mb-6">
                <AlertTriangle className="w-10 h-10 text-rose-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">Blueprint Missing</h2>
            <p className="text-slate-500 font-medium mb-8">This template might have been moved or deleted.</p>
            <button
                onClick={() => router.push('/admin/templates')}
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all"
            >
                Back to Library
            </button>
        </div>
    );

    const config = selectedVersion?.config || {};
    const stats = {
        categories: config.categories?.length || 0,
        items: config.items?.length || 0,
        modifiers: config.modifier_groups?.length || 0
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-10">
            {/* Premium Header */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start space-x-6">
                    <button
                        onClick={() => router.push('/admin/templates')}
                        className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm hover:shadow-md"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase">{template.name}</h1>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedVersion?.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                {selectedVersion?.status || 'Draft'}
                            </span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-lg text-xs uppercase tracking-widest border border-indigo-100">
                                <Store className="w-3.5 h-3.5" />
                                <span>{template.vertical.replace('-', ' ')}</span>
                            </div>
                            <span className="hidden md:block text-xs text-slate-400 font-bold font-mono tracking-tighter">REF: {template.id.slice(0, 8)}</span>
                        </div>
                        <div className="pt-2 flex items-center space-x-3 group cursor-pointer" onClick={() => router.push(`/admin/templates/${template.id}/builder`)}>
                            <p className={`text-sm ${template.description ? 'text-slate-500 font-medium' : 'text-slate-300 italic font-black uppercase tracking-widest text-[10px]'}`}>
                                {template.description ? <span className="text-slate-400 uppercase text-[10px] font-black mr-2">DESC:</span> : null}
                                {template.description || 'No description added yet'}
                            </p>
                            {!template.description && (
                                <button className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 transition-colors">
                                    <Plus className="w-3 h-3" />
                                    <span className="text-[10px] font-black uppercase tracking-widest underline decoration-2 underline-offset-4">Add description</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleClone}
                        className="hidden md:flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm group font-black text-[10px] uppercase tracking-widest"
                    >
                        <Copy className="w-4 h-4" />
                        <span>Duplicate</span>
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"
                        title="Delete Blueprint"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                    <div className="w-[1px] h-10 bg-slate-200 mx-2 hidden md:block" />
                    <button
                        onClick={() => router.push(`/admin/templates/${template.id}/builder`)}
                        className="flex-1 md:flex-none bg-indigo-600 text-white px-8 py-4 rounded-[20px] font-black flex items-center justify-center space-x-3 hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest group"
                    >
                        <Edit3 className="w-5 h-5 transition-transform group-hover:rotate-12" />
                        <span>Edit Blueprint</span>
                    </button>
                </div>
            </header>

            {/* Action Bar (Main View) */}
            <div className="flex flex-wrap items-center gap-4 p-6 bg-slate-900 rounded-[32px] text-white shadow-2xl">
                <button className="flex-1 md:flex-none flex items-center justify-center space-x-3 bg-indigo-600 hover:bg-indigo-500 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.1em] transition-all">
                    <Rocket className="w-4 h-4" />
                    <span>Publish Version</span>
                </button>
                <button className="flex-1 md:flex-none flex items-center justify-center space-x-3 bg-white/10 hover:bg-white/20 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.1em] transition-all border border-white/5">
                    <Eye className="w-4 h-4" />
                    <span>Live Preview</span>
                </button>
                <div className="hidden lg:block h-8 w-[1px] bg-white/10 mx-2" />
                <div className="flex-1 md:flex-none flex items-center space-x-4 px-4">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-slate-900 flex items-center justify-center text-[8px] font-black">
                                JD
                            </div>
                        ))}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">3 contributors active</span>
                </div>
            </div>

            {/* Blueprint Health & Completeness */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-20 bg-emerald-50 opacity-10 -mr-10 -mt-10 rounded-full" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative">
                    <div className="flex-1 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Blueprint Completeness</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Health score based on recommended components</p>
                                </div>
                            </div>
                            <div className="text-3xl font-black text-emerald-600">85%</div>
                        </div>

                        <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
                            <div className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: '85%' }} />
                            <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                            {[
                                { label: 'Categories', ok: stats.categories >= 2, tip: 'At least 2 required' },
                                { label: 'Items', ok: stats.items >= 5, tip: '5+ items recommended' },
                                { label: 'Modifiers', ok: stats.modifiers > 0, tip: 'Add for customization' },
                                { label: 'Pricing', ok: config.items?.every((i: any) => i.price > 0), tip: 'All items must have price' }
                            ].map((check, i) => (
                                <div key={i} className={`flex items-center space-x-2 py-2 px-3 rounded-xl border ${check.ok ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                    {check.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-tight leading-none mb-0.5">{check.label}</span>
                                        <span className="text-[8px] font-medium opacity-60">{check.tip}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Template Stats */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 flex items-center">
                    <BarChart3 className="w-3 h-3 mr-2" />
                    Blueprint Stats
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {[
                        { label: 'Categories', val: stats.categories, icon: List, color: 'indigo' },
                        { label: 'Total Items', val: stats.items, icon: Package, color: 'emerald' },
                        { label: 'Modifiers', val: stats.modifiers, icon: Zap, color: 'amber' }
                    ].map((s, idx) => (
                        <div
                            key={idx}
                            className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all"
                        >
                            <div className="flex items-center space-x-6 relative">
                                <div className={`p-5 bg-${s.color}-50 text-${s.color}-600 rounded-3xl`}>
                                    <s.icon className="w-8 h-8" />
                                </div>
                                <div>
                                    <div className="text-4xl font-black text-slate-900 mb-1 leading-none">{s.val}</div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                {/* Sidebar: History & Meta */}
                <aside className="lg:col-span-1 space-y-8">
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 flex items-center">
                            <Clock className="w-3 h-3 mr-2" />
                            Revision History
                        </h3>
                        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-50">
                            {versions.map((v) => (
                                <div
                                    key={v.id}
                                    className={`group w-full p-6 transition-all relative ${selectedVersion?.id === v.id ? 'bg-indigo-50/40' : 'hover:bg-slate-50/50'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col">
                                            <span className={`text-base font-black tracking-tighter flex items-center ${selectedVersion?.id === v.id ? 'text-indigo-600' : 'text-slate-900'}`}>
                                                v{v.version_code}
                                                {selectedVersion?.id === v.id && <Bookmark className="w-3.5 h-3.5 ml-2 fill-indigo-600" />}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70">
                                                {new Date(v.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg border ${v.status === 'published' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                            {v.status}
                                        </span>
                                    </div>

                                    <p className="text-[9px] text-slate-400 font-medium leading-relaxed mb-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {v.status === 'published' ? 'Active in store production deployments.' : 'Work in progress draft version.'}
                                    </p>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setSelectedVersion(v)}
                                            className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedVersion?.id === v.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600'}`}
                                        >
                                            {selectedVersion?.id === v.id ? 'Currently Inspecting' : 'Inspect Version'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                <button className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">View full history</button>
                                <button className="flex items-center space-x-1 text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
                                    <Share2 className="w-3 h-3" />
                                    <span>Compare</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-900 rounded-[32px] p-6 text-white shadow-lg space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 bg-white opacity-5 -mr-4 -mt-4 rounded-full" />
                        <div className="flex items-center space-x-3 mb-2">
                            <div className="p-2 bg-indigo-800 rounded-lg">
                                <Activity className="w-4 h-4 text-indigo-300" />
                            </div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest">Deployment Stats</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-indigo-300/60 uppercase tracking-widest">Active Stores</span>
                                <span className="text-xl font-black">12</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-indigo-300/60 uppercase tracking-widest">Health</span>
                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[8px] font-black border border-emerald-500/20 uppercase">STABLE</span>
                            </div>
                            <p className="text-[10px] text-indigo-200 font-medium leading-relaxed opacity-80 pt-2 border-t border-white/10">
                                This blueprint is verified as a high-performance retail base.
                            </p>
                            <button className="w-full py-3 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-950/20">
                                View Usage Report
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Developer Toolkit</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <button className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl flex flex-col items-center justify-center space-y-2 group transition-all">
                                <Code className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                                <span className="text-[8px] font-black uppercase text-slate-500">API DOCS</span>
                            </button>
                            <button className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl flex flex-col items-center justify-center space-y-2 group transition-all">
                                <Settings2 className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                                <span className="text-[8px] font-black uppercase text-slate-500">WEBHOOKS</span>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Detail Content */}
                <div className="lg:col-span-3 space-y-10">
                    {selectedVersion ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-700 space-y-10">
                            {/* Detailed Content Sections */}
                            <section className="space-y-12">
                                {/* Categories Overview */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-4">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
                                            <List className="w-4 h-4 mr-2" />
                                            Category Map ({stats.categories})
                                        </h3>
                                        <div className="flex items-center space-x-2">
                                            <button onClick={() => router.push(`/admin/templates/${template.id}/builder?mode=styling`)} className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm font-black text-[9px] uppercase tracking-widest">
                                                <span>🎨 Edit Colors</span>
                                            </button>
                                            <button onClick={() => router.push(`/admin/templates/${template.id}/builder`)} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {config.categories?.map((cat: any, i: number) => {
                                            const name = cat.name || cat;
                                            const color = cat.color || '#6366f1';
                                            const itemCount = config.items?.filter((item: any) => item.categoryId === cat.id).length || 0;
                                            return (
                                                <div key={i} className="flex items-center justify-between p-6 bg-white rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                                                    <div className="flex items-center space-x-5">
                                                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black text-white shadow-lg" style={{ backgroundColor: color }}>
                                                            {name.charAt(0)}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{name}</span>
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest opacity-60">ID: {cat.id?.slice(0, 8) || 'SEC-' + (i + 1)}</span>
                                                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                                <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">{itemCount} items</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="w-1 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-all" style={{ backgroundColor: color }} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Nested Item Catalog Preview */}
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 flex items-center">
                                        <Package className="w-4 h-4 mr-2" />
                                        Live Content Preview ({stats.items} Items)
                                    </h3>

                                    <div className="space-y-10">
                                        {config.categories?.map((cat: any, i: number) => {
                                            const catItems = config.items?.filter((item: any) => item.categoryId === cat.id) || [];
                                            if (catItems.length === 0) return null;

                                            return (
                                                <div key={i} className="space-y-4">
                                                    <div className="flex items-center space-x-3 px-4">
                                                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: cat.color }} />
                                                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">{cat.name} ({catItems.length})</h4>
                                                        <div className="flex-1 h-[1px] bg-slate-100" />
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                                        {catItems.map((item: any, j: number) => (
                                                            <div key={j} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group relative overflow-hidden">
                                                                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50/50 rounded-bl-[60px] -mr-12 -mt-12 group-hover:bg-indigo-50 transition-colors" />

                                                                <div className="flex items-start justify-between mb-6 relative">
                                                                    <div className="w-12 h-12 bg-slate-100/50 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                                                        {item.name?.charAt(0)}
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="text-xl font-black text-slate-900 leading-none">{currencySymbol}{item.price.toFixed(2)}</div>
                                                                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em] mt-2">Base Price</div>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-3 relative">
                                                                    <div>
                                                                        <h4 className="text-base font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.name}</h4>
                                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1 inline-block">SKU: {item.sku || 'CLE-' + item.name?.slice(0, 6).toUpperCase()}</span>
                                                                    </div>
                                                                    <p className={`text-[11px] leading-relaxed line-clamp-2 h-8 ${item.description ? 'text-slate-500 font-medium italic' : 'text-slate-300 font-black uppercase tracking-widest text-[9px]'}`}>
                                                                        {item.description || 'No description added'}
                                                                    </p>
                                                                </div>

                                                                <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-50 relative">
                                                                    <div className="flex items-center space-x-2">
                                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pricing Strategy</span>
                                                                        <Check className="w-3 h-3 text-emerald-500" />
                                                                    </div>
                                                                    <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                                                                        <ArrowRight className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {stats.items === 0 && (
                                            <div className="bg-white border-2 border-dashed border-slate-100 rounded-[40px] py-16 text-center space-y-4">
                                                <div className="w-16 h-16 bg-slate-50 rounded-[20px] flex items-center justify-center mx-auto text-slate-200">
                                                    <Package className="w-8 h-8" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="font-black text-slate-800 uppercase tracking-tight">No Items Configured</h4>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Connect data source or add items manually</p>
                                                </div>
                                                <button onClick={() => router.push(`/admin/templates/${template.id}/builder`)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                                                    Launch Item Builder
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Dedicated Modifier Groups Section */}
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 flex items-center">
                                        <Zap className="w-4 h-4 mr-2" />
                                        Modifier Optimization
                                    </h3>
                                    <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-20 bg-amber-50 opacity-10 -mr-10 -mt-10 rounded-full" />
                                        <div className="relative">
                                            {config.modifier_groups?.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {config.modifier_groups.map((mg: any, i: number) => (
                                                        <div key={i} className="p-6 bg-slate-50/50 rounded-[32px] border border-slate-100 hover:bg-white hover:shadow-xl transition-all group">
                                                            <div className="flex justify-between items-start mb-4">
                                                                <div>
                                                                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight leading-none block mb-1">{mg.name}</span>
                                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest opacity-60">{mg.modifiers?.length || 0} Options</span>
                                                                </div>
                                                                {mg.is_required && (
                                                                    <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[7px] font-black uppercase tracking-widest border border-rose-100">Required</span>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] text-slate-500 font-medium italic line-clamp-2 h-8 leading-relaxed mb-4">
                                                                {mg.description || 'Customization for selected menu items.'}
                                                            </p>
                                                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                                                <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Active Links: 2 Items</span>
                                                                <Settings2 className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-center py-6 space-y-6">
                                                    <div className="w-20 h-20 bg-amber-50 rounded-[32px] flex items-center justify-center text-amber-500">
                                                        <Zap className="w-10 h-10" />
                                                    </div>
                                                    <div className="space-y-2 max-w-sm">
                                                        <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none mb-1">Advanced Modifiers (0 Active)</h4>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em] leading-relaxed">
                                                            Unlock item customization like sizes, flavors, or add-ons to improve customer average ticket value. Recommended for {template.vertical} concepts.
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3 pt-2">
                                                        <button onClick={() => router.push(`/admin/templates/${template.id}/builder`)} className="px-8 py-3 bg-amber-500 text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-100 hover:scale-105 transition-all">
                                                            Add Group
                                                        </button>
                                                        <button className="px-8 py-3 bg-slate-50 text-slate-600 border border-slate-200 rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all">
                                                            Import Default
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Action Footer & Technical View */}
                            <section className="pt-10 border-t border-slate-200 space-y-8">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                                    <div className="flex items-center space-x-5">
                                        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[20px]">
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-base font-black text-slate-900 uppercase tracking-tight mb-0.5">Vetted Blueprint Specs</div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em] max-w-[300px] leading-relaxed">Verified as BIR-compliant, tax-accurate, and terminal optimized.</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <button className="flex-1 md:flex-none flex items-center space-x-3 px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">
                                            <FileText className="w-4 h-4" />
                                            <span>CSV Export</span>
                                        </button>
                                        <button className="flex-1 md:flex-none flex items-center space-x-3 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">
                                            <Download className="w-4 h-4" />
                                            <span>PDF Report</span>
                                        </button>
                                        <button
                                            onClick={() => setShowJson(!showJson)}
                                            className={`flex-1 md:flex-none flex items-center space-x-3 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${showJson ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            <Code className="w-4 h-4" />
                                            <span>Technical JSON</span>
                                        </button>
                                    </div>
                                </div>

                                {showJson && (
                                    <div className="bg-slate-900 rounded-[40px] p-10 overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center space-x-3">
                                                <div className="flex space-x-2">
                                                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                                                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                                                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-6">manifest.config.json</span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(JSON.stringify(config, null, 4));
                                                    alert('Config copied to clipboard!');
                                                }}
                                                className="p-2 text-slate-600 hover:text-white transition-colors"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <pre className="text-indigo-300 text-[11px] font-mono overflow-x-auto custom-scrollbar opacity-90 leading-relaxed max-h-[600px]">
                                            {JSON.stringify(config, null, 4)}
                                        </pre>
                                    </div>
                                )}
                            </section>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center bg-white rounded-[60px] border-2 border-dashed border-slate-100 py-40 text-center">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <AlertTriangle className="w-12 h-12 text-slate-200" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">No Version Selected</h3>
                            <p className="text-slate-400 font-medium max-w-xs">Select a revision from the history pane to inspect the configuration data.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

