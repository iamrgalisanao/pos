'use client';

import React, { useState } from 'react';
import { useTemplateBuilderStore, MenuItem } from '@/store/useTemplateBuilderStore';
import {
    Laptop,
    Smartphone,
    Tablet,
    Search,
    ShoppingCart,
    User,
    Coffee,
    Plus,
    X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function POSSimulator() {
    const { currencySymbol } = useAuth();
    const { config } = useTemplateBuilderStore();
    const [device, setDevice] = useState<'tablet' | 'mobile'>('tablet');
    const [activeCategory, setActiveCategory] = useState<string | 'all'>('all');
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

    const filteredItems = config.items.filter(i =>
        activeCategory === 'all' || i.categoryId === activeCategory
    );

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-700">
            {/* Simulator Toolbar */}
            <div className="flex items-center justify-between mb-8 bg-slate-900 p-4 rounded-3xl shadow-xl">
                <div className="flex items-center space-x-6">
                    <div className="flex items-center text-white space-x-2 px-3">
                        <Laptop className="w-4 h-4 text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Live Simulator</span>
                    </div>
                    <div className="h-6 w-[1px] bg-slate-800" />
                    <div className="flex items-center bg-slate-800 rounded-xl p-1">
                        <button
                            onClick={() => setDevice('tablet')}
                            className={`p-2 rounded-lg transition-all ${device === 'tablet' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Tablet className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setDevice('mobile')}
                            className={`p-2 rounded-lg transition-all ${device === 'mobile' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Smartphone className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center space-x-3 text-emerald-400">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">WYSIWYG Enabled</span>
                </div>
            </div>

            {/* Simulator Canvas */}
            <div className="flex-1 flex justify-center items-start overflow-hidden py-10">
                <div className={`
            bg-slate-100 rounded-[3rem] border-[12px] border-slate-900 shadow-[0_0_100px_rgba(0,0,0,0.2)] overflow-hidden transition-all duration-500
            ${device === 'tablet' ? 'w-[1024px] h-[768px] scale-[0.65] origin-top' : 'w-[390px] h-[844px] scale-[0.7] origin-top'}
        `}>
                    {/* Mock POS Terminal Interface */}
                    <div className="flex flex-col h-full bg-white text-slate-900 font-sans relative">

                        {/* Mock Header */}
                        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-sm uppercase">
                                    {config.name ? config.name.charAt(0) : 'G'}
                                </div>
                                <div>
                                    <h5 className="text-[11px] font-black tracking-tight leading-none uppercase">{config.name || 'Green Grounds'}</h5>
                                    <p className="text-[9px] font-medium text-slate-400">Simulator Mode</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                                    <div className="w-48 h-9 bg-slate-50 rounded-full border border-slate-100" />
                                </div>
                                <User className="w-5 h-5 text-slate-300" />
                            </div>
                        </header>

                        {/* Mock Sub-header / Stats */}
                        <div className="h-14 bg-slate-50 border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
                            <div className="flex items-center space-x-6">
                                <div className="flex items-center space-x-2">
                                    <Coffee className="w-4 h-4 text-amber-600" />
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Active Orders</span>
                                </div>
                            </div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                            </div>
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            {/* Main Content: Catalog */}
                            <div className="flex-1 flex flex-col p-6 overflow-hidden">
                                {/* Category Tabs */}
                                <div className="flex items-center space-x-2 mb-6 overflow-x-auto pb-2 shrink-0 no-scrollbar">
                                    <button
                                        onClick={() => setActiveCategory('all')}
                                        className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'}`}
                                    >
                                        All
                                    </button>
                                    {config.categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategory(cat.id)}
                                            className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap 
                                                ${activeCategory === cat.id
                                                    ? 'bg-slate-900 text-white shadow-lg scale-105'
                                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>

                                {/* Item Grid */}
                                <div className="flex-1 overflow-y-auto pr-2">
                                    <div
                                        key={activeCategory} // Reset animation on category change
                                        className={`grid ${device === 'tablet' ? 'grid-cols-3' : 'grid-cols-2'} gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both`}
                                    >
                                        {filteredItems.map((item, idx) => {
                                            const category = config.categories.find(c => c.id === item.categoryId);
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => setSelectedItem(item)}
                                                    className="group bg-white border border-slate-100 rounded-3xl p-4 text-left hover:border-slate-300 hover:shadow-xl hover:-translate-y-1 transition-all animate-in fade-in zoom-in-95 duration-500"
                                                    style={{ animationDelay: `${idx * 30}ms` }}
                                                >
                                                    <div className="aspect-square bg-slate-50 rounded-2xl mb-4 overflow-hidden relative">
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                                            <Coffee className="w-12 h-12 text-slate-300" />
                                                        </div>
                                                        <div
                                                            className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[7px] font-black text-white uppercase tracking-widest"
                                                            style={{ backgroundColor: category?.color || '#cbd5e1' }}
                                                        >
                                                            {category?.name || 'Item'}
                                                        </div>
                                                    </div>
                                                    <h6 className="text-[13px] font-black text-slate-800 leading-tight mb-1">{item.name}</h6>
                                                    <div className="text-sm font-black text-slate-900">{currencySymbol}{item.price.toFixed(2)}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Mock Right Sidebar: Cart */}
                            <div className={`w-[320px] bg-slate-50 border-l border-slate-100 flex flex-col shrink-0 ${device === 'mobile' ? 'hidden' : ''}`}>
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <ShoppingCart className="w-5 h-5 text-indigo-600" />
                                        <h6 className="text-sm font-black uppercase tracking-widest text-slate-800">Current Cart</h6>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 font-mono">#0001</span>
                                </div>

                                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                                    <div className="w-16 h-16 bg-white border-2 border-dashed border-slate-200 rounded-full flex items-center justify-center mb-4">
                                        <Plus className="w-8 h-8 text-slate-100" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Simulator: Cart is empty</p>
                                </div>

                                <div className="p-6 border-t border-slate-100 bg-white space-y-4">
                                    <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>Subtotal</span>
                                        <span className="font-mono">{currencySymbol}0.00</span>
                                    </div>
                                    <div className="h-[1px] bg-slate-50" />
                                    <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl">
                                        Checkout
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Mock Modifier Modal */}
                        {selectedItem && (
                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-12 z-50">
                                <div className="bg-white rounded-[40px] w-full max-w-lg shadow-[0_30px_100px_rgba(0,0,0,0.3)] animate-in zoom-in duration-300 overflow-hidden">
                                    <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                                                <Coffee className="w-6 h-6 text-slate-300" />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-slate-800 tracking-tight">{selectedItem.name}</h4>
                                                <p className="text-sm font-bold text-indigo-600">{currencySymbol}{selectedItem.price.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-slate-50 rounded-full transition-all text-slate-300">
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>

                                    <div className="p-8 space-y-8">
                                        {selectedItem.modifierGroupIds.length === 0 ? (
                                            <div className="py-20 text-center border-2 border-dashed border-slate-50 rounded-[32px]">
                                                <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest leading-relaxed"> No modifiers assigned to this item. Customize in Step 4. </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                {selectedItem.modifierGroupIds.map(mgid => {
                                                    const group = config.modifier_groups.find(g => g.id === mgid);
                                                    if (!group) return null;
                                                    return (
                                                        <div key={mgid} className="space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <h6 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{group.name}</h6>
                                                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[8px] font-black uppercase">Required</span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                {group.options.map(opt => (
                                                                    <div key={opt.id} className="p-4 border-2 border-slate-50 rounded-2xl flex items-center justify-between">
                                                                        <span className="text-xs font-bold text-slate-700">{opt.name}</span>
                                                                        <span className="text-[10px] font-black text-slate-400 text-mono tracking-tighter">+{currencySymbol}0.00</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-8 bg-slate-50 border-t border-slate-100">
                                        <button className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100">
                                            Add to Cart
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
