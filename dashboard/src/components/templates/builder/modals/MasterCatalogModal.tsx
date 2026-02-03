'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Package, Plus, Check, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import { CatalogSearch, CategoryFilter } from '@/components/Catalog/CatalogLayout';
import { useTemplateBuilderStore, MenuItem } from '@/store/useTemplateBuilderStore';
import { v4 as uuidv4 } from 'uuid';

interface MasterItem extends MenuItem {
    source_template: string;
    vertical: string;
    category_name: string;
}

interface MasterCatalogModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MasterCatalogModal({ isOpen, onClose }: MasterCatalogModalProps) {
    const { config, updateConfig } = useTemplateBuilderStore();
    const [items, setItems] = useState<MasterItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVertical, setSelectedVertical] = useState('all');
    const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

    const fetchMaster = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/platform/products/master');
            setItems(response.data);
        } catch (error) {
            console.error('Failed to fetch master catalog:', error);
            setError('The platform master library is currently unavailable. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchMaster();
        }
    }, [isOpen]);

    const handleImport = (item: MasterItem) => {
        // 1. Ensure the category exists in the current draft
        let categoryId = config.categories.find(c => c.name.toLowerCase() === item.category_name.toLowerCase())?.id;

        if (!categoryId) {
            categoryId = uuidv4();
            updateConfig(prev => ({
                ...prev,
                categories: [...prev.categories, { id: categoryId!, name: item.category_name }]
            }));
        }

        // 2. Add the item
        const newItem: MenuItem = {
            ...item,
            id: uuidv4(),
            categoryId: categoryId,
            modifierGroupIds: [] // Modifiers are complex, leaving empty for now
        };

        updateConfig(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));

        setImportedIds(prev => new Set(prev).add(item.sku));
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesVertical = selectedVertical === 'all' || item.vertical.toLowerCase() === selectedVertical.toLowerCase();
        return matchesSearch && matchesVertical;
    });

    const verticals = Array.from(new Set(items.map(i => i.vertical)));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[48px] shadow-2xl flex flex-col overflow-hidden border border-slate-100">
                <header className="p-10 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Platform Master Library</h2>
                        <p className="text-slate-500 font-medium">Browse and import industry-vetted products into your blueprint.</p>
                    </div>
                    <button onClick={onClose} className="p-4 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-3xl transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </header>

                <div className="p-10 space-y-8 flex-1 overflow-hidden flex flex-col">
                    <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                        <CatalogSearch
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search library by name or SKU..."
                        />
                        <div className="w-64">
                            <select
                                value={selectedVertical}
                                onChange={(e) => setSelectedVertical(e.target.value)}
                                className="w-full px-4 py-4 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm transition-all outline-none text-slate-700 font-medium appearance-none cursor-pointer"
                            >
                                <option value="all">All Industries</option>
                                {verticals.map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 bg-slate-50 rounded-[40px] border border-slate-100 overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-md z-10 border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Product</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Industry</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        [1, 2, 3, 4, 5].map(i => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={4} className="px-8 py-6 h-16 bg-white/50" />
                                            </tr>
                                        ))
                                    ) : error ? (
                                        <tr>
                                            <td colSpan={4} className="py-32 text-center text-slate-400 font-bold uppercase tracking-widest text-[11px]">
                                                <div className="flex flex-col items-center space-y-4">
                                                    <AlertTriangle className="w-8 h-8 text-rose-400" />
                                                    <p>{error}</p>
                                                    <button
                                                        onClick={fetchMaster}
                                                        className="px-6 py-2 bg-slate-900 text-white rounded-xl"
                                                    >
                                                        Retry
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-32 text-center text-slate-400 font-bold uppercase tracking-widest text-[11px]">
                                                No products found in library
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map(item => (
                                            <tr key={item.sku} className="hover:bg-white transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800 uppercase tracking-tight">{item.name}</span>
                                                        <span className="text-[10px] font-bold text-slate-300 font-mono tracking-widest">{item.sku}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 uppercase text-[10px] font-black text-slate-400 tracking-widest">
                                                    {item.vertical}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                        {item.category_name}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    {importedIds.has(item.sku) ? (
                                                        <div className="flex items-center justify-end text-emerald-500 font-black text-[10px] uppercase tracking-widest space-x-2">
                                                            <Check className="w-4 h-4" />
                                                            <span>Imported</span>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleImport(item)}
                                                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:scale-105 transition-all flex items-center space-x-2 ml-auto"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                            <span>Import</span>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <footer className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
                    <button onClick={onClose} className="px-10 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-3xl font-black uppercase text-xs tracking-widest hover:border-slate-300 transition-all">
                        Done Browsing
                    </button>
                </footer>
            </div>
        </div>
    );
}
