'use client';

import React, { useState, useEffect } from 'react';
import { useTemplateBuilderStore, TemplateConfig } from '@/store/useTemplateBuilderStore';
import {
    Utensils,
    Coffee,
    Pizza,
    Store,
    ArrowLeft,
    Check,
    Search,
    Info,
    Zap,
    Briefcase
} from 'lucide-react';
import api from '@/lib/api';

interface GalleryTemplate {
    id: string;
    name: string;
    vertical: string;
    description: string;
    is_gallery: boolean;
}

export default function TemplateGallery({ onBack }: { onBack: () => void }) {
    const { setConfig } = useTemplateBuilderStore();
    const [templates, setTemplates] = useState<GalleryTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const response = await api.get('/platform/templates/gallery');
                setTemplates(response.data);
            } catch (error) {
                console.error('Failed to fetch gallery:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchGallery();
    }, []);

    const handleApply = async (templateId: string) => {
        try {
            // Get the template's config (from latest version)
            const response = await api.get(`/platform/templates/${templateId}/versions`);
            const latest = response.data.find((v: any) => v.status === 'published') || response.data[0];

            if (latest && latest.config) {
                const config = typeof latest.config === 'string' ? JSON.parse(latest.config) : latest.config;
                setConfig(config);
                onBack(); // Return to builder
            }
        } catch (error) {
            console.error('Failed to apply template:', error);
        }
    };

    const getIcon = (vertical: string) => {
        const v = vertical.toLowerCase();
        if (v.includes('cafe') || v.includes('coffee')) return <Coffee className="w-8 h-8" />;
        if (v.includes('pizza')) return <Pizza className="w-8 h-8" />;
        if (v.includes('retail') || v.includes('store')) return <Store className="w-8 h-8" />;
        if (v.includes('restaurant') || v.includes('food')) return <Utensils className="w-8 h-8" />;
        return <Briefcase className="w-8 h-8" />;
    };

    const getColor = (vertical: string) => {
        const v = vertical.toLowerCase();
        if (v.includes('cafe')) return 'bg-amber-100 text-amber-600';
        if (v.includes('pizza')) return 'bg-rose-100 text-rose-600';
        if (v.includes('retail')) return 'bg-indigo-100 text-indigo-600';
        if (v.includes('restaurant')) return 'bg-emerald-100 text-emerald-600';
        return 'bg-slate-100 text-slate-600';
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <header className="flex items-center justify-between mb-12">
                <div className="flex items-center space-x-6">
                    <button
                        onClick={onBack}
                        className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-800 hover:border-slate-300 transition-all shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Template Gallery</h2>
                        <p className="text-slate-500 font-medium">Jumpstart your menu with a pre-vetted industry blueprint.</p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search industries..."
                        className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 w-64 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"
                    />
                </div>
            </header>

            {loading ? (
                <div className="grid grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="aspect-[4/3] bg-white border border-slate-100 rounded-[40px] animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-8">
                    {templates.map(template => (
                        <div
                            key={template.id}
                            onClick={() => setSelectedId(template.id)}
                            className={`
                                cursor-pointer group relative bg-white border-2 rounded-[40px] p-8 transition-all duration-500
                                ${selectedId === template.id ? 'border-indigo-600 shadow-2xl shadow-indigo-100 scale-[1.02]' : 'border-slate-100 hover:border-slate-200 hover:shadow-xl'}
                            `}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className={`p-5 rounded-[24px] transition-transform duration-500 group-hover:scale-110 ${getColor(template.vertical)}`}>
                                    {getIcon(template.vertical)}
                                </div>
                                <div className={`
                                    px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest
                                    ${getColor(template.vertical)}
                                `}>
                                    {template.vertical}
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-slate-800 mb-3 tracking-tight group-hover:text-indigo-600 transition-colors">
                                {template.name}
                            </h3>
                            <p className="text-slate-500 text-sm font-medium line-clamp-3 leading-relaxed mb-8">
                                {template.description}
                            </p>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                <div className="flex items-center space-x-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                    <Info className="w-3 h-3" />
                                    <span>Vetted Blueprint</span>
                                </div>

                                {selectedId === template.id ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleApply(template.id);
                                        }}
                                        className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-200 animate-in zoom-in-95"
                                    >
                                        <Zap className="w-3 h-3 fill-white" />
                                        <span>APPLY NOW</span>
                                    </button>
                                ) : (
                                    <div className="text-slate-400 font-black text-[11px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                        View Details
                                    </div>
                                )}
                            </div>

                            {selectedId === template.id && (
                                <div className="absolute top-4 right-4 text-indigo-600">
                                    <div className="bg-indigo-600 text-white p-1 rounded-full">
                                        <Check className="w-4 h-4" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Placeholder for "Request Industry" */}
                    <div className="border-2 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center p-10 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                            <Plus className="w-6 h-6 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-black text-slate-400 uppercase tracking-tight mb-2">Missing your industry?</h3>
                        <p className="text-slate-400 text-xs font-bold px-8 leading-loose uppercase tracking-widest">Request a custom blueprint for your business model.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

function Plus(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
}
