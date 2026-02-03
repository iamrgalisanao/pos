'use client';

import React, { useState } from 'react';
import { useTemplateBuilderStore, Category } from '@/store/useTemplateBuilderStore';
import { Plus, Trash2, LayoutGrid, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const PRESET_COLORS = [
    '#f43f5e', // Rose
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#3b82f6', // Blue
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#64748b', // Slate
];

export default function CategoryManager() {
    const { config, updateConfig } = useTemplateBuilderStore();
    const [newCatName, setNewCatName] = useState('');
    const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[4]); // Default to Indigo
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    const addCategory = () => {
        if (!newCatName.trim()) return;

        const newCat: Category = {
            id: uuidv4(),
            name: newCatName,
            color: selectedColor
        };

        updateConfig((prev) => ({
            ...prev,
            categories: [...prev.categories, newCat]
        }));
        setNewCatName('');
    };

    const removeCategory = (id: string) => {
        updateConfig((prev) => ({
            ...prev,
            categories: prev.categories.filter(c => c.id !== id),
            items: prev.items.filter(i => i.categoryId !== id)
        }));
    };

    const moveCategory = (index: number, direction: 'up' | 'down') => {
        const newCategories = [...config.categories];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newCategories.length) return;

        [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];

        updateConfig((prev) => ({
            ...prev,
            categories: newCategories
        }));
    };

    const updateCategoryColor = (id: string, color: string) => {
        updateConfig((prev) => ({
            ...prev,
            categories: prev.categories.map(c => c.id === id ? { ...c, color } : c)
        }));
    };

    const handleRename = (id: string) => {
        if (!editingName.trim()) {
            setEditingId(null);
            return;
        }
        updateConfig((prev) => ({
            ...prev,
            categories: prev.categories.map(c => c.id === id ? { ...c, name: editingName } : c)
        }));
        setEditingId(null);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight uppercase">CATEGORIZATION</h2>
                    <p className="text-slate-500 font-medium">Organize your menu into logical sections.</p>
                </div>

                <div className="bg-slate-100 px-4 py-2 rounded-xl text-[11px] font-black text-slate-500 uppercase tracking-widest">
                    {config.categories.length} CATEGORIES
                </div>
            </div>

            <div className="grid grid-cols-3 gap-8">
                {/* Left Column: List Support */}
                <div className="col-span-2 space-y-4">
                    {config.categories.length === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[40px] flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <LayoutGrid className="w-8 h-8 text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-bold">No categories added yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {config.categories.map((cat, idx) => (
                                <div
                                    key={cat.id}
                                    className="group flex items-center justify-between p-6 bg-white border-2 border-slate-100 rounded-3xl hover:border-indigo-100 transition-all cursor-default"
                                >
                                    <div className="flex items-center space-x-6">
                                        <div className="flex flex-col space-y-1">
                                            <button
                                                onClick={() => moveCategory(idx, 'up')}
                                                disabled={idx === 0}
                                                className="p-1 text-slate-400 hover:text-indigo-500 disabled:opacity-10 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <ChevronUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => moveCategory(idx, 'down')}
                                                disabled={idx === config.categories.length - 1}
                                                className="p-1 text-slate-400 hover:text-indigo-500 disabled:opacity-10 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <ChevronDown className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Color Palette & Custom Hex for existing items */}
                                        <div className="flex flex-col space-y-3">
                                            <div className="flex items-center space-x-3">
                                                <div
                                                    className="w-5 h-12 rounded-full shadow-inner border border-slate-100"
                                                    style={{ backgroundColor: cat.color }}
                                                />
                                                <div className="flex flex-col space-y-1">
                                                    <div className="flex space-x-1">
                                                        {PRESET_COLORS.slice(0, 5).map(c => (
                                                            <button
                                                                key={c}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    updateCategoryColor(cat.id, c);
                                                                }}
                                                                className={`w-3 h-3 rounded-full border border-white shadow-sm hover:scale-125 transition-transform ${cat.color === c ? 'ring-1 ring-indigo-500' : ''}`}
                                                                style={{ backgroundColor: c }}
                                                            />
                                                        ))}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={cat.color || ''}
                                                        onChange={(e) => updateCategoryColor(cat.id, e.target.value)}
                                                        placeholder="#000000"
                                                        className="text-[9px] font-mono font-bold w-16 bg-slate-50 border border-slate-100 rounded px-1 py-0.5 focus:outline-none focus:border-indigo-300"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {editingId === cat.id ? (
                                            <input
                                                autoFocus
                                                type="text"
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                onBlur={() => handleRename(cat.id)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleRename(cat.id)}
                                                className="text-lg font-black text-slate-800 tracking-tight bg-slate-50 border-b-2 border-indigo-500 outline-none px-2 rounded-md flex-1 mx-4"
                                            />
                                        ) : (
                                            <span
                                                className="text-lg font-black text-slate-800 tracking-tight cursor-text hover:text-indigo-600 transition-colors flex-1 mx-4"
                                                onClick={() => {
                                                    setEditingId(cat.id);
                                                    setEditingName(cat.name);
                                                }}
                                                title="Click to rename"
                                            >
                                                {cat.name}
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => removeCategory(cat.id)}
                                        className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all opacity-40 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column: Adder Form */}
                <div>
                    <div className="sticky top-0 bg-slate-50 p-8 rounded-[40px] border border-slate-100 space-y-8">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Add New Section</h3>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category Name</label>
                            <input
                                type="text"
                                value={newCatName}
                                onChange={(e) => setNewCatName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                                placeholder="e.g. Hot Coffee"
                                className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-800 focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-200"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Display Color</label>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {PRESET_COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setSelectedColor(color)}
                                        className={`w-8 h-8 rounded-full border-4 transition-all ${selectedColor === color ? 'border-white ring-2 ring-indigo-500 scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-mono text-xs font-bold">#</span>
                                <input
                                    type="text"
                                    maxLength={7}
                                    value={selectedColor.startsWith('#') ? selectedColor.slice(1) : selectedColor}
                                    onChange={(e) => {
                                        let val = e.target.value;
                                        if (!val.startsWith('#')) val = '#' + val;
                                        setSelectedColor(val);
                                    }}
                                    placeholder="FFFFFF"
                                    className="w-full pl-8 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl font-mono text-xs font-black text-slate-800 focus:outline-none focus:border-indigo-500 transition-all"
                                />
                                <div
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-slate-100 shadow-sm"
                                    style={{ backgroundColor: selectedColor }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={addCategory}
                            disabled={!newCatName.trim()}
                            className="w-full flex items-center justify-center space-x-3 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-xl disabled:opacity-30 disabled:hover:bg-slate-900"
                        >
                            <Plus className="w-5 h-5 border-2 border-white rounded-md" />
                            <span>ADD CATEGORY</span>
                        </button>

                        <div className="pt-4 border-t border-slate-200">
                            <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed italic">
                                Tip: Use broad categories like "Burgers" or "Drinks" for better terminal performance.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
