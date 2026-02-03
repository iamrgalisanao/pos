import React, { useState, useEffect } from 'react';
import { useTemplateBuilderStore, MenuItem } from '@/store/useTemplateBuilderStore';
import {
    Plus,
    Tag,
    Trash2,
    Library,
    Search,
    Filter,
    X,
    ArrowUpDown,
    Check,
    Edit2,
    ChevronRight,
    Package,
    AlertCircle,
    Info,
    MoreVertical,
    CheckSquare,
    Square
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { CatalogSearch, CategoryFilter } from '@/components/Catalog/CatalogLayout';
import MasterCatalogModal from '../modals/MasterCatalogModal';

export default function ItemManager() {
    const { config, updateConfig } = useTemplateBuilderStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
    const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [editingItem, setEditingItem] = useState<{ id: string; field: 'name' | 'price'; value: string | number } | null>(null);

    useEffect(() => {
        if (config.items.length === 0) {
            setIsMasterModalOpen(true);
        }
    }, []);

    const [isSkuModified, setIsSkuModified] = useState(false);
    const [newItem, setNewItem] = useState<Partial<MenuItem>>({
        name: '',
        price: 0,
        sku: '',
        categoryId: config.categories[0]?.id || ''
    });

    const [formErrors, setFormErrors] = useState<{ name?: boolean; price?: boolean; category?: boolean }>({});

    const generateSku = (name: string, categoryId: string) => {
        const category = config.categories.find(c => c.id === categoryId);
        const prefix = category ? category.name.toUpperCase().substring(0, 3) : 'SKU';
        const suffix = name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
        return `${prefix}-${suffix || Math.floor(Math.random() * 1000)}`;
    };

    const addItem = () => {
        const errors: { name?: boolean; price?: boolean; category?: boolean } = {};
        if (!newItem.name) errors.name = true;
        if ((newItem.price ?? 0) < 0) errors.price = true;
        if (!newItem.categoryId) errors.category = true;

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        const item: MenuItem = {
            id: uuidv4(),
            name: newItem.name ?? 'Untitled',
            description: '',
            price: newItem.price || 0,
            sku: newItem.sku || `SKU-${Math.floor(Math.random() * 10000)}`,
            categoryId: newItem.categoryId!,
            modifierGroupIds: []
        };

        updateConfig((prev) => ({
            ...prev,
            items: [...prev.items, item]
        }));

        setNewItem({
            name: '',
            price: 0,
            sku: '',
            categoryId: newItem.categoryId
        });
        setIsSkuModified(false);
        setFormErrors({});
        setIsQuickAddOpen(false);
    };

    const removeItem = (id: string) => {
        updateConfig((prev) => ({
            ...prev,
            items: prev.items.filter(i => i.id !== id)
        }));
    };

    const removeSelectedItems = () => {
        updateConfig((prev) => ({
            ...prev,
            items: prev.items.filter(i => !selectedItems.has(i.id))
        }));
        setSelectedItems(new Set());
    };

    const toggleItemSelection = (id: string) => {
        setSelectedItems(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedItems.size === filteredItems.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(filteredItems.map(i => i.id)));
        }
    };

    const updateItemInline = (id: string, updates: Partial<MenuItem>) => {
        updateConfig((prev) => ({
            ...prev,
            items: prev.items.map(i => i.id === id ? { ...i, ...updates } : i)
        }));
        setEditingItem(null);
    };

    const filteredItems = config.items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative min-h-[600px]">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h2 className="text-4xl font-black text-slate-800 tracking-tight uppercase">Menu Items</h2>
                    <p className="text-slate-500 font-medium mt-1">Design your menu catalog. Add items, prices, and link modifiers.</p>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setIsMasterModalOpen(true)}
                        className="flex items-center space-x-3 px-8 py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-[2rem] font-black uppercase tracking-widest hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm group"
                    >
                        <Library className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px]">Browse Library</span>
                    </button>
                    <button
                        onClick={() => setIsQuickAddOpen(true)}
                        className="flex items-center space-x-3 px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 group"
                    >
                        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                        <span className="text-[10px]">Add New Item</span>
                    </button>
                </div>
            </div>

            <div className="space-y-8">
                {/* Search & Filter Card */}
                <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex-1 max-w-2xl relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name or SKU..."
                                className="w-full pl-16 pr-8 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-200"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-2xl border-2 border-slate-50">
                                <Filter className="w-4 h-4 text-slate-400 ml-2" />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none cursor-pointer pr-4"
                                >
                                    <option value="all">All Categories</option>
                                    {config.categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="h-8 w-[1px] bg-slate-100 mx-2 hidden lg:block" />
                            <div className="px-6 py-4 bg-indigo-50 rounded-2xl">
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                    {filteredItems.length} Products Found
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Filter Chips */}
                    <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-slate-50">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedCategory === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                        >
                            All Items
                        </button>
                        {config.categories.slice(0, 5).map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat.id ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                {selectedItems.size > 0 && (
                    <div className="sticky top-0 z-20 bg-slate-900 rounded-[2rem] p-4 flex items-center justify-between shadow-2xl animate-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center space-x-6 pl-4">
                            <span className="text-white font-black text-xs uppercase tracking-widest">
                                {selectedItems.size} Selected
                            </span>
                            <div className="h-6 w-[1px] bg-slate-700" />
                            <button
                                onClick={removeSelectedItems}
                                className="flex items-center space-x-2 text-rose-400 hover:text-rose-300 text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete items</span>
                            </button>
                        </div>
                        <button
                            onClick={() => setSelectedItems(new Set())}
                            className="p-2 text-slate-400 hover:text-white transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Item List Table Card */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm relative group">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-10 py-6 w-16">
                                    <button onClick={toggleSelectAll} className="p-1 hover:bg-white rounded-md transition-all text-slate-300">
                                        {selectedItems.size === filteredItems.length && filteredItems.length > 0 ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5" />}
                                    </button>
                                </th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sticky top-0 bg-slate-50 z-10">Item Details</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sticky top-0 bg-slate-50 z-10">Category</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sticky top-0 bg-slate-50 z-10">Price</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sticky top-0 bg-slate-50 z-10">Status</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right sticky top-0 bg-slate-50 z-10">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-10 py-32 text-center relative group/empty">
                                        <div className="absolute inset-0 bg-slate-50/50 opacity-0 group-hover/empty:opacity-100 transition-opacity" />
                                        <div className="relative">
                                            <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-slate-300 shadow-inner">
                                                <Package className="w-10 h-10" />
                                            </div>
                                            <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Catalog is Empty</h3>
                                            <p className="text-slate-400 font-medium mb-8 max-w-xs mx-auto text-sm">Start building your menu by adding your first delicious item.</p>
                                            <button
                                                onClick={() => setIsQuickAddOpen(true)}
                                                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                                            >
                                                Add First Item
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map(item => {
                                    const category = config.categories.find(c => c.id === item.categoryId);
                                    const isSelected = selectedItems.has(item.id);
                                    const isActive = item.status !== 'INACTIVE';
                                    return (
                                        <tr
                                            key={item.id}
                                            className={`group/row transition-all hover:bg-slate-50/80 cursor-default ${isSelected ? 'bg-indigo-50/30' : ''}`}
                                        >
                                            <td className="px-10 py-6">
                                                <button onClick={() => toggleItemSelection(item.id)} className={`p-1 rounded-md transition-all ${isSelected ? 'text-indigo-600' : 'text-slate-200 group-hover/row:text-slate-300'}`}>
                                                    {isSelected ? <CheckSquare className="w-5 h-5 shadow-sm" /> : <Square className="w-5 h-5" />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-6 relative">
                                                {/* Hover Preview Popover */}
                                                <div className="absolute left-1/2 bottom-full mb-4 -translate-x-1/2 w-64 p-6 bg-slate-900 text-white rounded-[2rem] shadow-2xl opacity-0 group-hover/row:opacity-100 pointer-events-none transition-all duration-300 scale-90 group-hover/row:scale-100 z-30">
                                                    <div className="flex items-center space-x-3 mb-4">
                                                        <div className="w-8 h-8 bg-slate-800 rounded-xl flex items-center justify-center">
                                                            <Package className="w-4 h-4 text-indigo-400" />
                                                        </div>
                                                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Preview</div>
                                                    </div>
                                                    <h4 className="text-sm font-black uppercase mb-1">{item.name}</h4>
                                                    <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
                                                        {item.description || "No description provided for this item yet."}
                                                    </p>
                                                    <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                                                        <div className="text-[10px] font-bold text-slate-500">MODIFIERS</div>
                                                        <div className="text-[10px] font-black">{item.modifierGroupIds.length} Linked</div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-4">
                                                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover/row:bg-white group-hover/row:shadow-sm transition-all border border-transparent group-hover/row:border-slate-100 overflow-hidden">
                                                        {item.image ? (
                                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Tag className="w-5 h-5" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        {editingItem?.id === item.id && editingItem.field === 'name' ? (
                                                            <input
                                                                autoFocus
                                                                className="text-sm font-black text-slate-800 bg-white border-2 border-indigo-400 rounded-lg px-2 py-1 uppercase focus:outline-none"
                                                                value={editingItem.value}
                                                                onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                                                                onBlur={() => updateItemInline(item.id, { name: String(editingItem.value) })}
                                                                onKeyDown={(e) => e.key === 'Enter' && updateItemInline(item.id, { name: String(editingItem.value) })}
                                                            />
                                                        ) : (
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-sm font-black text-slate-800 uppercase tracking-tight group-hover/row:text-indigo-600 transition-colors">{item.name}</span>
                                                                <button onClick={() => setEditingItem({ id: item.id, field: 'name', value: item.name })} className="opacity-0 group-hover/row:opacity-100 p-1 text-slate-400 hover:text-indigo-600 transition-all">
                                                                    <Edit2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        )}
                                                        <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">{item.sku}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full group-hover/row:bg-white transition-all">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: category?.color || '#cbd5e1' }} />
                                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{category?.name || 'Uncategorized'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                {editingItem?.id === item.id && editingItem.field === 'price' ? (
                                                    <div className="flex items-center bg-white border-2 border-indigo-400 rounded-lg px-2 py-1">
                                                        <span className="text-xs font-black text-indigo-500 mr-1">$</span>
                                                        <input
                                                            autoFocus
                                                            type="number"
                                                            className="text-sm font-black text-slate-800 focus:outline-none w-20"
                                                            value={editingItem.value}
                                                            onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                                                            onBlur={() => updateItemInline(item.id, { price: parseFloat(String(editingItem.value)) || 0 })}
                                                            onKeyDown={(e) => e.key === 'Enter' && updateItemInline(item.id, { price: parseFloat(String(editingItem.value)) || 0 })}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-sm font-black text-slate-800">${item.price.toFixed(2)}</span>
                                                        <button onClick={() => setEditingItem({ id: item.id, field: 'price', value: item.price })} className="opacity-0 group-hover/row:opacity-100 p-1 text-slate-400 hover:text-indigo-600 transition-all">
                                                            <Edit2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-6">
                                                <button
                                                    onClick={() => updateItemInline(item.id, { status: isActive ? 'INACTIVE' : 'ACTIVE' })}
                                                    className="flex items-center space-x-2 group/status"
                                                >
                                                    <div className={`w-2 h-2 rounded-full transition-all duration-500 ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-300'}`} />
                                                    <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover/status:text-slate-600'}`}>
                                                        {isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </button>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <div className="flex items-center justify-end space-x-2 opacity-0 group-hover/row:opacity-100 transition-all">
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                    <button className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all">
                                                        <ChevronRight className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Add Slide-over Panel */}
            {isQuickAddOpen && (
                <>
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in duration-300" onClick={() => setIsQuickAddOpen(false)} />
                    <div className="fixed top-0 right-0 h-screen w-full max-w-lg bg-white shadow-[0_0_60px_rgba(0,0,0,0.2)] z-[60] p-12 overflow-y-auto animate-in slide-in-from-right duration-500 border-l border-slate-100">
                        <div className="flex items-center justify-between mb-12">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                    <Plus className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Quick Add Item</h3>
                            </div>
                            <button
                                onClick={() => setIsQuickAddOpen(false)}
                                className="p-3 text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-10">
                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block px-2">Item Identity</label>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between px-2">
                                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Product Name</span>
                                            {formErrors.name && <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">Required</span>}
                                        </div>
                                        <input
                                            type="text"
                                            value={newItem.name || ''}
                                            onChange={(e) => {
                                                const newName = e.target.value;
                                                setNewItem({
                                                    ...newItem,
                                                    name: newName,
                                                    sku: isSkuModified ? newItem.sku : generateSku(newName, newItem.categoryId || '')
                                                });
                                                if (formErrors.name) setFormErrors({ ...formErrors, name: false });
                                            }}
                                            placeholder="e.g. Double Espresso"
                                            className={`w-full px-8 py-5 bg-slate-50 border-2 rounded-[2rem] font-bold text-slate-800 focus:outline-none transition-all placeholder:text-slate-200 ${formErrors.name ? 'border-rose-500 animate-pulse' : 'border-slate-50 focus:border-indigo-500 focus:bg-white'}`}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest px-2">SKU / ID</span>
                                        <div className="relative group">
                                            <Tag className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                            <input
                                                type="text"
                                                value={newItem.sku || ''}
                                                onChange={(e) => {
                                                    setNewItem({ ...newItem, sku: e.target.value });
                                                    setIsSkuModified(true);
                                                }}
                                                placeholder="AUTOGEN-S1"
                                                className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-[2rem] font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block px-2">Store Config</label>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between px-2">
                                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Price</span>
                                            {formErrors.price && <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">Invalid</span>}
                                        </div>
                                        <div className="relative group">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-bold">$</span>
                                            <input
                                                type="number"
                                                value={newItem.price ?? 0}
                                                onChange={(e) => {
                                                    const p = parseFloat(e.target.value);
                                                    setNewItem({ ...newItem, price: isNaN(p) ? 0 : p });
                                                    if (formErrors.price) setFormErrors({ ...formErrors, price: false });
                                                }}
                                                className={`w-full pl-12 pr-8 py-5 bg-slate-50 border-2 rounded-[2rem] font-black text-slate-800 focus:outline-none transition-all ${formErrors.price ? 'border-rose-500' : 'border-slate-50 focus:border-indigo-500 focus:bg-white'}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4 pt-8">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between px-2">
                                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Category</span>
                                            {formErrors.category && <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">Missing</span>}
                                        </div>
                                        <div className="relative">
                                            <select
                                                value={newItem.categoryId}
                                                onChange={(e) => {
                                                    setNewItem({ ...newItem, categoryId: e.target.value });
                                                    if (formErrors.category) setFormErrors({ ...formErrors, category: false });
                                                }}
                                                className={`w-full px-6 py-5 bg-slate-50 border-2 rounded-[2rem] font-bold text-[10px] uppercase tracking-widest text-slate-600 focus:outline-none transition-all appearance-none cursor-pointer ${formErrors.category ? 'border-rose-500' : 'border-slate-50 focus:border-indigo-500 focus:bg-white'}`}
                                            >
                                                <option value="" disabled>Select...</option>
                                                {config.categories.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                            <ArrowUpDown className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-10 border-t border-slate-50">
                                <button
                                    onClick={addItem}
                                    className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-100 flex items-center justify-center space-x-3 group active:scale-95"
                                >
                                    <span>Create Product</span>
                                    <Check className="w-5 h-5 group-hover:scale-125 transition-transform" />
                                </button>
                                <button
                                    onClick={() => setIsQuickAddOpen(false)}
                                    className="w-full mt-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors"
                                >
                                    Cancel and exit
                                </button>
                            </div>

                            <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 flex items-start space-x-4">
                                <div className="mt-1 p-2 bg-amber-100 rounded-xl text-amber-600">
                                    <Info className="w-5 h-5" />
                                </div>
                                <p className="text-[11px] font-bold text-amber-700 uppercase leading-relaxed">
                                    Pro Tip: Advanced customizations like modifiers and ingredient tracking can be added in Step 4 after creation.
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <MasterCatalogModal
                isOpen={isMasterModalOpen}
                onClose={() => setIsMasterModalOpen(false)}
            />
        </div>
    );
}
