'use client';

import React from 'react';
import { useTemplateBuilderStore } from '@/store/useTemplateBuilderStore';
import { Coffee, FastForward, ShoppingBag, UtensilsCrossed, Store, Table } from 'lucide-react';

const VERTICALS = [
    { id: 'cafe', title: 'Premium Café', icon: Coffee, color: 'bg-amber-100 text-amber-700' },
    { id: 'fast-food', title: 'Fast Food', icon: FastForward, color: 'bg-rose-100 text-rose-700' },
    { id: 'retail', title: 'Retail Shop', icon: ShoppingBag, color: 'bg-blue-100 text-blue-700' },
    { id: 'restaurant', title: 'Full Restaurant', icon: UtensilsCrossed, color: 'bg-emerald-100 text-emerald-700' },
];

interface CoreInfoFormProps {
    onOpenGallery: () => void;
    onOpenImport: () => void;
}

export default function CoreInfoForm({ onOpenGallery, onOpenImport }: CoreInfoFormProps) {
    const { config, updateConfig } = useTemplateBuilderStore();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        updateConfig((prev) => ({ ...prev, [name]: value }));
    };

    const selectVertical = (id: string) => {
        if (config.vertical === id) return;

        const hasData = config.categories.length > 0 || config.items.length > 0;

        if (hasData) {
            const shouldReset = window.confirm(
                `Switching to ${id.replace('-', ' ')}? \n\nChanging industries won't delete your existing items by default. Would you like to CLEAR the current blueprint and start fresh?`
            );

            if (shouldReset) {
                updateConfig((prev) => ({
                    ...prev,
                    vertical: id,
                    categories: [],
                    items: [],
                    modifier_groups: []
                }));
                return;
            }
        }

        updateConfig((prev) => ({ ...prev, vertical: id }));
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight uppercase">BRAND FOUNDATION</h2>
            <p className="text-slate-500 mb-10 font-medium">Define the core identity for this POS blueprint.</p>

            <div className="flex items-center space-x-6 mb-12 animate-in slide-in-from-left-4 duration-700">
                <button
                    onClick={onOpenGallery}
                    className="flex-1 flex items-center space-x-4 p-6 bg-white border-2 border-slate-100 rounded-[32px] text-left hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-50 transition-all group"
                >
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Store className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Jumpstart</div>
                        <div className="text-sm font-black text-slate-800 uppercase tracking-tight">Browse Industry Gallery</div>
                    </div>
                </button>

                <button
                    onClick={onOpenImport}
                    className="flex-1 flex items-center space-x-4 p-6 bg-white border-2 border-slate-100 rounded-[32px] text-left hover:border-emerald-600 hover:shadow-xl hover:shadow-emerald-50 transition-all group"
                >
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <Table className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Bulk Setup</div>
                        <div className="text-sm font-black text-slate-800 uppercase tracking-tight">Import from Spreadsheet</div>
                    </div>
                </button>
            </div>

            <div className="grid grid-cols-2 gap-16">
                <div className="space-y-10">
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Blueprint Name</label>
                        <input
                            type="text"
                            name="name"
                            value={config.name}
                            onChange={handleChange}
                            placeholder="e.g. Summer Specials 2026"
                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-300"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Description</label>
                        <textarea
                            name="description"
                            value={config.description}
                            onChange={handleChange}
                            rows={4}
                            placeholder="What is the purpose of this template?"
                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-300 resize-none"
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Industry Vertical</label>
                    <div className="grid grid-cols-2 gap-4">
                        {VERTICALS.map((v) => {
                            const isSelected = config.vertical === v.id;
                            return (
                                <button
                                    key={v.id}
                                    onClick={() => selectVertical(v.id)}
                                    className={`
                    flex flex-col items-center justify-center p-6 rounded-[32px] border-2 transition-all
                    ${isSelected
                                            ? 'border-indigo-600 bg-indigo-50/30 scale-[1.02] shadow-xl shadow-indigo-100'
                                            : 'border-slate-100 bg-white hover:border-slate-200'}
                  `}
                                >
                                    <div className={`p-4 rounded-2xl mb-4 ${isSelected ? 'bg-indigo-600 text-white' : v.color}`}>
                                        <v.icon className={`w-6 h-6 ${isSelected ? 'animate-pulse' : ''}`} />
                                    </div>
                                    <span className={`text-sm font-black ${isSelected ? 'text-indigo-900' : 'text-slate-600'}`}>
                                        {v.title}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase">
                            Note: Changing vertical may reset industry-specific defaults and tax configurations.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
