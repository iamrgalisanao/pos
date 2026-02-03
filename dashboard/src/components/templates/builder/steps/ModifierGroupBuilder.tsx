'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTemplateBuilderStore, ModifierGroup, ModifierOption } from '@/store/useTemplateBuilderStore';
import {
    Plus, Trash2, Settings2, ListChecks, CheckSquare, XCircle, ChevronRight, ChevronLeft, Info,
    Sparkles, LayoutPanelTop, Layers, MoveUp, MoveDown, Copy, MoreVertical, GripVertical, Check, X, Star,
    CircleDot, PlusCircle, MinusCircle, Save, History as HistoryIcon, RotateCcw, LayoutGrid, Circle, Square, Ban,
    ChevronUp, ChevronDown, CheckCircle2, AlertCircle, HelpCircle, Compass, MousePointer2, Zap
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

export default function ModifierGroupBuilder() {
    const { currencySymbol } = useAuth();
    const { config, updateConfig, modifierTemplates, saveAsTemplate, deleteTemplate } = useTemplateBuilderStore();
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
    const [draft, setDraft] = useState<ModifierGroup | null>(null);
    const [previewSelections, setPreviewSelections] = useState<Record<string, boolean>>({});
    const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState<string | null>(null);
    const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [showGuide, setShowGuide] = useState(false);
    const [activeGuideStep, setActiveGuideStep] = useState(0);

    // Sync draft when editing group changes
    useEffect(() => {
        if (editingGroupId) {
            const group = config.modifier_groups.find(g => g.id === editingGroupId);
            if (group) {
                setDraft(JSON.parse(JSON.stringify(group)));
                setPreviewSelections({});
                setSavingStatus('idle');
            }
        } else {
            setDraft(null);
        }
    }, [editingGroupId, config.modifier_groups]);

    const addGroup = () => {
        const newGroup: ModifierGroup = {
            id: uuidv4(),
            name: 'New Customization Group',
            description: '',
            type: 'CHOICE',
            isRequired: false,
            minSelections: 1,
            maxSelections: 1,
            options: []
        };
        updateConfig((prev) => ({
            ...prev,
            modifier_groups: [...prev.modifier_groups, newGroup]
        }));
        setEditingGroupId(newGroup.id);
    };

    const removeGroup = (id: string) => {
        updateConfig((prev) => ({
            ...prev,
            modifier_groups: prev.modifier_groups.filter(g => g.id !== id),
            items: prev.items.map(i => ({
                ...i,
                modifierGroupIds: i.modifierGroupIds.filter(mgid => mgid !== id)
            }))
        }));
    };

    const moveGroup = (id: string, direction: 'up' | 'down') => {
        const index = config.modifier_groups.findIndex(g => g.id === id);
        if (index === -1) return;
        const newGroups = [...config.modifier_groups];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newGroups.length) return;
        [newGroups[index], newGroups[targetIndex]] = [newGroups[targetIndex], newGroups[index]];
        updateConfig(prev => ({ ...prev, modifier_groups: newGroups }));
    };

    const duplicateGroup = (groupId: string) => {
        const sourceGroup = config.modifier_groups.find(g => g.id === groupId);
        if (!sourceGroup) return;
        const newGroup: ModifierGroup = {
            ...sourceGroup,
            id: uuidv4(),
            name: `${sourceGroup.name} (Copy)`,
            options: sourceGroup.options.map(opt => ({ ...opt, id: uuidv4() }))
        };
        updateConfig(prev => ({ ...prev, modifier_groups: [...prev.modifier_groups, newGroup] }));
        setEditingGroupId(newGroup.id);
    };

    const updateDraft = (updates: Partial<ModifierGroup>) => {
        setDraft(prev => {
            if (!prev) return null;
            const next = { ...prev, ...updates };
            // Auto-sync Min if Required
            if (updates.isRequired === true && next.minSelections < 1) {
                next.minSelections = 1;
            }
            // Logic validation
            if (next.maxSelections > 0 && next.maxSelections < next.minSelections) {
                next.maxSelections = next.minSelections;
            }
            return next;
        });
    };

    const addOption = () => {
        const newOption: ModifierOption = {
            id: uuidv4(),
            name: '',
            priceAdjustment: 0,
            isDefault: false
        };
        setDraft(prev => prev ? { ...prev, options: [...prev.options, newOption] } : null);
    };

    const saveChanges = () => {
        if (!draft) return;
        setSavingStatus('saving');
        updateConfig(prev => ({
            ...prev,
            modifier_groups: prev.modifier_groups.map(g => g.id === draft.id ? draft : g)
        }));
        setTimeout(() => {
            setSavingStatus('saved');
            setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            setTimeout(() => setSavingStatus('idle'), 2000);
        }, 300);
    };

    const handleSaveAndAdd = () => {
        saveChanges();
        setTimeout(() => {
            setEditingGroupId(null);
            addGroup();
        }, 100);
    };

    const togglePreviewOption = (optionId: string) => {
        if (!draft) return;
        setPreviewSelections(prev => {
            const next = { ...prev };
            if (next[optionId]) {
                delete next[optionId];
            } else {
                const count = Object.keys(prev).length;
                if (draft.type === 'CHOICE' && (draft.maxSelections === 1 || draft.maxSelections === 0)) {
                    return { [optionId]: true };
                }
                if (draft.maxSelections === 0 || count < draft.maxSelections) {
                    next[optionId] = true;
                }
            }
            return next;
        });
    };

    const behaviorTypes = [
        { id: 'CHOICE', label: 'Choice', sub: 'Select one', icon: Circle, color: 'text-amber-500', bg: 'bg-amber-50' },
        { id: 'ADDON', label: 'Add-on', sub: 'Optional extras', icon: Square, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { id: 'EXCLUSION', label: 'Exclusion', sub: 'Remove items', icon: Ban, color: 'text-rose-500', bg: 'bg-rose-50' },
    ];

    if (!config) return null;

    return (
        <div className="min-h-[800px] flex flex-col animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-8 px-2">
                <div>
                    <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase mb-1">CUSTOMIZATIONS</h2>
                    <p className="text-slate-400 font-medium">Build premium modifier flows for your customers.</p>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setShowGuide(true)}
                        className="flex items-center space-x-3 px-6 py-4 bg-white border-2 border-slate-100 text-slate-500 rounded-[2rem] font-bold hover:bg-slate-50 transition-all group"
                    >
                        <HelpCircle className="w-5 h-5 text-indigo-400 group-hover:rotate-12 transition-transform" />
                        <span className="tracking-widest text-[10px] uppercase">How it works</span>
                    </button>
                    <button
                        onClick={addGroup}
                        className="flex items-center space-x-3 px-8 py-4 bg-slate-900 text-white rounded-[2rem] font-black hover:bg-black transition-all shadow-xl shadow-slate-200"
                    >
                        <Plus className="w-6 h-6" />
                        <span className="tracking-widest text-xs">CREATE GROUP</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8 flex-1">
                {/* Sidebar: Group List */}
                <div className="col-span-3 space-y-3 overflow-y-auto max-h-[750px] pr-2 no-scrollbar">
                    {config.modifier_groups.length === 0 ? (
                        <div className="py-20 text-center bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[3rem] px-8">
                            <LayoutPanelTop className="w-12 h-12 text-slate-200 mx-auto mb-6" />
                            <p className="text-slate-400 font-black uppercase tracking-widest text-[9px] leading-relaxed">No modifier groups yet.</p>
                        </div>
                    ) : (
                        config.modifier_groups.map((group, idx) => (
                            <motion.div
                                layout
                                key={group.id}
                                className={`
                                    group relative p-4 rounded-[2.5rem] border-2 cursor-pointer transition-all
                                    ${editingGroupId === group.id ? 'bg-white border-indigo-600 shadow-xl scale-[1.02] z-10' : 'bg-white border-slate-50 hover:border-slate-200'}
                                `}
                                onClick={() => setEditingGroupId(group.id)}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="flex flex-col text-slate-200 group-hover:text-slate-400 transition-colors">
                                        <button onClick={(e) => { e.stopPropagation(); moveGroup(group.id, 'up'); }} className={idx === 0 ? 'invisible' : ''}><ChevronUp className="w-3 h-3" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); moveGroup(group.id, 'down'); }} className={idx === config.modifier_groups.length - 1 ? 'invisible' : ''}><ChevronDown className="w-3 h-3" /></button>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-[7px] font-black text-slate-300 uppercase tracking-[0.2em]">{group.type}</span>
                                            <span className="text-[7px] font-black text-slate-300 uppercase">{group.options.length} OPTS</span>
                                        </div>
                                        <h4 className="text-xs font-black text-slate-800 truncate tracking-tight">{group.name}</h4>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); duplicateGroup(group.id); }}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Main Content Area */}
                <div className="col-span-9 flex flex-col bg-slate-50/50 rounded-[4rem] border border-slate-100 p-8 min-h-[750px]">
                    {!draft ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-6">
                                <LayoutGrid className="w-10 h-10 text-indigo-500" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">Editor Ready</h3>
                            <p className="text-slate-400 max-w-[280px] leading-relaxed font-medium">Select a modifier group from the list or create a new one to start customizing.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between mb-8 pb-8 border-b border-slate-200/60">
                                <div className="relative">
                                    <button
                                        onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)}
                                        className="flex items-center space-x-3 px-6 py-3 bg-white border border-slate-200 rounded-2xl hover:border-indigo-400 transition-all font-black text-[10px] uppercase tracking-widest text-slate-600 group"
                                    >
                                        <Sparkles className="w-4 h-4 text-indigo-500 group-hover:rotate-12 transition-transform" />
                                        <span>Apply Template</span>
                                        <ChevronDown className={`w-3 h-3 transition-transform ${isTemplateDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {isTemplateDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute top-full left-0 mt-3 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 p-3 overflow-hidden"
                                            >
                                                <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-1">
                                                    {modifierTemplates.map(tpl => (
                                                        <button
                                                            key={tpl.id}
                                                            onClick={() => {
                                                                setDraft({ ...tpl, id: draft.id });
                                                                setIsTemplateDropdownOpen(false);
                                                            }}
                                                            className="w-full text-left p-4 rounded-2xl hover:bg-slate-50 transition-all group"
                                                        >
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-wide">{tpl.name}</span>
                                                                <span className="text-[8px] font-black text-indigo-500 px-2 py-0.5 bg-indigo-50 rounded-md uppercase">{tpl.type}</span>
                                                            </div>
                                                            <p className="text-[9px] text-slate-400 font-medium truncate">
                                                                {tpl.options.map(o => o.name).join(', ')}
                                                            </p>
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="flex items-center space-x-4">
                                    {savingStatus === 'saved' && (
                                        <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl animate-in fade-in slide-in-from-top-2">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span className="text-[10px] font-black tracking-widest uppercase">Saved</span>
                                        </div>
                                    )}
                                    {lastSaved && (
                                        <div className="flex items-center space-x-2 text-slate-300">
                                            <HistoryIcon className="w-3 h-3" />
                                            <span className="text-[8px] font-black uppercase tracking-widest">Last saved {lastSaved}</span>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setIsConfirmingDelete(draft.id)}
                                        className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                                        title="Delete Group"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Triple Card Layout */}
                            <div className="grid grid-cols-12 gap-8 flex-1 overflow-y-auto pr-2 no-scrollbar">
                                {/* Left Side: Setup & Options */}
                                <div className="col-span-12 lg:col-span-7 space-y-8">
                                    {/* 🏷️ Card 1: Group Identity */}
                                    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative group/card">
                                        <div className="flex items-center space-x-3 mb-6">
                                            <div className="p-2 bg-indigo-50 rounded-xl">
                                                <Layers className="w-4 h-4 text-indigo-600" />
                                            </div>
                                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">Group Identity</h3>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Modifier Group Name</label>
                                                <input
                                                    type="text"
                                                    value={draft.name}
                                                    onChange={(e) => updateDraft({ name: e.target.value })}
                                                    className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 focus:border-indigo-500 focus:bg-white rounded-[2.5rem] font-black text-slate-800 transition-all transition-duration-300 outline-none placeholder:text-slate-200"
                                                    placeholder="e.g., Doneness"
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Behavior Type</label>
                                                <div className="flex space-x-3">
                                                    {behaviorTypes.map(t => (
                                                        <button
                                                            key={t.id}
                                                            onClick={() => updateDraft({ type: t.id as any })}
                                                            className={`
                                                                flex-1 p-4 rounded-3xl border-2 transition-all text-left relative overflow-hidden group/btn
                                                                ${draft.type === t.id ? 'bg-white border-indigo-600 border-opacity-100' : 'bg-slate-50/50 border-slate-50 border-opacity-0 hover:bg-slate-100'}
                                                            `}
                                                        >
                                                            <div className={`p-2 rounded-xl mb-3 inline-block transition-colors ${draft.type === t.id ? t.bg + ' ' + t.color : 'bg-white text-slate-300'}`}>
                                                                <t.icon className="w-4 h-4" />
                                                            </div>
                                                            <div className="block">
                                                                <div className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${draft.type === t.id ? 'text-slate-800' : 'text-slate-400'}`}>{t.label}</div>
                                                                <div className="text-[8px] font-medium text-slate-400 uppercase tracking-tight line-clamp-1">{t.sub}</div>
                                                            </div>
                                                            {draft.type === t.id && (
                                                                <div className="absolute top-3 right-3">
                                                                    <div className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center">
                                                                        <Check className="w-2.5 h-2.5 text-white" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 📋 Card 3: Options & Pricing */}
                                    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                                                    <ListChecks className="w-4 h-4" />
                                                </div>
                                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">Options & Pricing</h3>
                                            </div>
                                            <button
                                                onClick={addOption}
                                                className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-50"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                <span>ADD OPTION</span>
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {draft.options.length === 0 ? (
                                                <div className="py-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-[2rem] text-center">
                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No options added</p>
                                                </div>
                                            ) : (
                                                <AnimatePresence>
                                                    {draft.options.map((opt, oIdx) => (
                                                        <motion.div
                                                            key={opt.id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            className="flex items-center space-x-4 p-4 bg-slate-50/50 rounded-2xl hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 transition-all"
                                                        >
                                                            <div className="flex-1">
                                                                <input
                                                                    type="text"
                                                                    value={opt.name}
                                                                    onChange={(e) => {
                                                                        const opts = [...draft.options];
                                                                        opts[oIdx].name = e.target.value;
                                                                        updateDraft({ options: opts });
                                                                    }}
                                                                    className="w-full bg-transparent border-none font-black text-slate-800 text-xs focus:ring-0 uppercase placeholder:text-slate-200"
                                                                    placeholder="Option Name"
                                                                />
                                                            </div>
                                                            <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-slate-100 min-w-[120px]">
                                                                <span className="text-emerald-500 font-black text-[10px] ml-1">{currencySymbol}</span>
                                                                <input
                                                                    type="number"
                                                                    value={opt.priceAdjustment}
                                                                    onChange={(e) => {
                                                                        const opts = [...draft.options];
                                                                        opts[oIdx].priceAdjustment = parseFloat(e.target.value) || 0;
                                                                        updateDraft({ options: opts });
                                                                    }}
                                                                    className="w-full bg-transparent border-none text-slate-800 font-black text-xs text-right focus:ring-0 p-0 pr-1"
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    const opts = draft.options.filter(o => o.id !== opt.id);
                                                                    updateDraft({ options: opts });
                                                                }}
                                                                className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Selection Rules & Preview */}
                                <div className="col-span-12 lg:col-span-5 space-y-8">
                                    {/* ⚙️ Card 2: Selection Rules */}
                                    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                                        <div className="flex items-center space-x-3 mb-8">
                                            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                                                <Settings2 className="w-4 h-4" />
                                            </div>
                                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">Selection Rules</h3>
                                        </div>

                                        <div className="space-y-8">
                                            <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl">
                                                <div>
                                                    <div className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">Mandatory Selection?</div>
                                                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.1em]">Require at least 1 item</div>
                                                </div>
                                                <button
                                                    onClick={() => updateDraft({ isRequired: !draft.isRequired })}
                                                    className={`
                                                        w-14 h-8 rounded-full relative transition-all
                                                        ${draft.isRequired ? 'bg-emerald-500 shadow-inner' : 'bg-slate-200'}
                                                    `}
                                                >
                                                    <motion.div
                                                        animate={{ x: draft.isRequired ? 24 : 4 }}
                                                        className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                                                    />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Min Selections</label>
                                                    <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-2 border border-slate-100">
                                                        <button
                                                            disabled={draft.minSelections <= 0 || (draft.isRequired && draft.minSelections <= 1)}
                                                            onClick={() => updateDraft({ minSelections: draft.minSelections - 1 })}
                                                            className="p-2 text-indigo-600 hover:bg-white rounded-xl disabled:opacity-30 transition-all"
                                                        >
                                                            <MinusCircle className="w-4 h-4" />
                                                        </button>
                                                        <span className="text-lg font-black text-slate-800">{draft.minSelections}</span>
                                                        <button
                                                            onClick={() => updateDraft({ minSelections: draft.minSelections + 1 })}
                                                            className="p-2 text-indigo-600 hover:bg-white rounded-xl transition-all"
                                                        >
                                                            <PlusCircle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Max Selections</label>
                                                        <button
                                                            onClick={() => updateDraft({ maxSelections: draft.maxSelections === 0 ? 1 : 0 })}
                                                            className={`text-[8px] font-black tracking-widest uppercase transition-colors ${draft.maxSelections === 0 ? 'text-indigo-600' : 'text-slate-300'}`}
                                                        >
                                                            {draft.maxSelections === 0 ? '✓ Unlimited' : 'Unlimited'}
                                                        </button>
                                                    </div>
                                                    <div className={`flex items-center justify-between bg-slate-50 rounded-2xl p-2 border transition-all ${draft.maxSelections === 0 ? 'opacity-40 border-slate-100' : 'border-slate-100'}`}>
                                                        <button
                                                            disabled={draft.maxSelections <= draft.minSelections || draft.maxSelections === 0}
                                                            onClick={() => updateDraft({ maxSelections: draft.maxSelections - 1 })}
                                                            className="p-2 text-indigo-600 hover:bg-white rounded-xl disabled:opacity-30"
                                                        >
                                                            <MinusCircle className="w-4 h-4" />
                                                        </button>
                                                        <span className="text-lg font-black text-slate-800">{draft.maxSelections === 0 ? '∞' : draft.maxSelections}</span>
                                                        <button
                                                            disabled={draft.maxSelections === 0}
                                                            onClick={() => updateDraft({ maxSelections: draft.maxSelections + 1 })}
                                                            className="p-2 text-indigo-600 hover:bg-white rounded-xl disabled:opacity-30"
                                                        >
                                                            <PlusCircle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 👁️ Card: Live Preview (Sticky) */}
                                    <div className="bg-slate-900 overflow-hidden rounded-[3rem] sticky top-8 shadow-2xl border border-slate-800">
                                        <div className="p-8 border-b border-slate-800 bg-slate-800/40">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Customer POV</div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Interactive Preview</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-xl font-black text-white tracking-tight uppercase leading-none">{draft.name || 'Modifier Name'}</h3>
                                                <div className="flex items-center space-x-2">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {draft.type === 'CHOICE' ? 'Select 1 item' :
                                                            Object.keys(previewSelections).length > 0 ? `${Object.keys(previewSelections).length}/${draft.maxSelections === 0 ? 'Any' : draft.maxSelections} Selected` :
                                                                `Select up to ${draft.maxSelections === 0 ? 'unlimited' : draft.maxSelections} options`}
                                                    </p>
                                                    {draft.isRequired && <span className="text-[8px] font-black bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded uppercase">Required</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-8 space-y-3 bg-slate-900/50 min-h-[200px]">
                                            {draft.options.length === 0 ? (
                                                <div className="text-center py-10 opacity-20">
                                                    <Ban className="w-8 h-8 text-white mx-auto mb-3" />
                                                    <p className="text-[10px] uppercase font-black tracking-widest">No options to preview</p>
                                                </div>
                                            ) : (
                                                draft.options.map(opt => {
                                                    const isSelected = previewSelections[opt.id];
                                                    return (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => togglePreviewOption(opt.id)}
                                                            className={`
                                                                w-full p-4 rounded-2xl flex items-center justify-between transition-all border-2
                                                                ${isSelected ? 'bg-white/10 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-transparent border-slate-800/40 hover:border-slate-700'}
                                                            `}
                                                        >
                                                            <div className="flex items-center space-x-4">
                                                                <div className={`w-5 h-5 rounded-lg flex items-center justify-center border-2 transition-all ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-700 bg-white/5'}`}>
                                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                                </div>
                                                                <span className={`text-xs font-black transition-colors ${isSelected ? 'text-white' : 'text-slate-400'}`}>{opt.name || 'Untitled Option'}</span>
                                                            </div>
                                                            {opt.priceAdjustment !== 0 && (
                                                                <span className={`text-[10px] font-black ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`}>
                                                                    {opt.priceAdjustment > 0 ? `+ ${currencySymbol}${opt.priceAdjustment.toFixed(2)}` : `- ${currencySymbol}${Math.abs(opt.priceAdjustment).toFixed(2)}`}
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>

                                        {Object.keys(previewSelections).length > 0 && (
                                            <div className="p-6 bg-slate-800/30 border-t border-slate-800 flex items-center justify-between">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Running Total</span>
                                                <span className="text-sm font-black text-emerald-400">
                                                    + {currencySymbol}{Object.keys(previewSelections).reduce((sum, id) => sum + (draft.options.find(o => o.id === id)?.priceAdjustment || 0), 0).toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Global Sticky Buttons */}
                            <div className="mt-8 pt-8 border-t border-slate-200/60 flex items-center justify-between">
                                <button
                                    onClick={() => setEditingGroupId(null)}
                                    className="px-8 py-4 text-slate-400 hover:text-slate-600 font-black text-[10px] uppercase tracking-[0.2em] transition-all"
                                >
                                    Cancel Changes
                                </button>
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={handleSaveAndAdd}
                                        className="px-8 py-4 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                                    >
                                        Save & Add Another
                                    </button>
                                    <button
                                        onClick={saveChanges}
                                        disabled={savingStatus === 'saving'}
                                        className="flex items-center space-x-3 px-12 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                                    >
                                        <Save className={`w-5 h-5 ${savingStatus === 'saving' ? 'animate-pulse' : ''}`} />
                                        <span>{savingStatus === 'saving' ? 'Saving...' : 'Save Changes'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Modal Area */}
            <AnimatePresence>
                {isConfirmingDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4"
                        onClick={() => setIsConfirmingDelete(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl overflow-hidden relative"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                <Trash2 className="w-40 h-40 text-rose-600" />
                            </div>
                            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mb-8">
                                <AlertCircle className="w-10 h-10" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-tight mb-4">DELETE THIS GROUP?</h3>
                            <p className="text-slate-400 font-medium leading-relaxed mb-10 text-lg italic">
                                "{config.modifier_groups.find(g => g.id === isConfirmingDelete)?.name}"
                            </p>
                            <div className="flex flex-col space-y-4">
                                <button
                                    onClick={() => {
                                        removeGroup(isConfirmingDelete);
                                        setIsConfirmingDelete(null);
                                        setEditingGroupId(null);
                                    }}
                                    className="w-full py-5 bg-rose-500 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-rose-600 transition-all shadow-xl shadow-rose-100"
                                >
                                    Confirm Deletion
                                </button>
                                <button
                                    onClick={() => setIsConfirmingDelete(null)}
                                    className="w-full py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all underline underline-offset-8"
                                >
                                    Back to Safety
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Interactive Guide Modal */}
            <AnimatePresence>
                {showGuide && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[150] flex items-center justify-center p-6"
                        onClick={() => setShowGuide(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            className="bg-white rounded-[4rem] max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowGuide(false)}
                                className="absolute top-8 right-8 p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full transition-all z-20"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="grid grid-cols-12 flex-1">
                                {/* Left: Navigation/Steps */}
                                <div className="col-span-4 bg-slate-50 p-12 border-r border-slate-100 hidden md:flex flex-col">
                                    <div className="flex items-center space-x-3 mb-12">
                                        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                            <Compass className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Builder Guide</span>
                                    </div>
                                    <div className="space-y-6 flex-1">
                                        {[
                                            { title: 'The Architecture', sub: 'Triple-Card Layout', icon: LayoutGrid },
                                            { title: 'Behavior Types', sub: 'Logic & Flow', icon: Zap },
                                            { title: 'Customer POV', sub: 'Real-time Preview', icon: MousePointer2 },
                                            { title: 'Templates', sub: 'Save & Reuse', icon: Sparkles }
                                        ].map((step, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setActiveGuideStep(i)}
                                                className={`flex items-center space-x-4 w-full text-left p-3 rounded-2xl transition-all ${activeGuideStep === i ? 'bg-white shadow-sm border border-slate-100' : 'opacity-60 hover:opacity-100'}`}
                                            >
                                                <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-black transition-colors ${activeGuideStep === i ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{step.title}</div>
                                                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{step.sub}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-auto">
                                        <p className="text-[9px] font-medium text-slate-400 italic">Built for Antigravity Premium POS Ecosystem</p>
                                    </div>
                                </div>

                                {/* Right: Content Area */}
                                <div className="col-span-12 md:col-span-8 flex flex-col h-full bg-white">
                                    <div className="flex-1 p-12 md:p-16 overflow-y-auto no-scrollbar">
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={activeGuideStep}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.3 }}
                                                className="min-h-full"
                                            >
                                                {activeGuideStep === 0 && (
                                                    <section className="space-y-6">
                                                        <div className="inline-flex items-center space-x-3 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                                            <LayoutGrid className="w-4 h-4" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">01. The Architecture</span>
                                                        </div>
                                                        <h3 className="text-3xl font-black text-slate-800 tracking-tight">The Triple-Card Layout</h3>
                                                        <p className="text-slate-500 font-medium leading-relaxed">
                                                            We've replaced the slow "Next/Back" wizard with a flat, single-view workspace. Everything you need is organized into three logical zones:
                                                        </p>
                                                        <div className="grid grid-cols-1 gap-4">
                                                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-start space-x-4">
                                                                <div className="p-2 bg-white rounded-xl text-indigo-500"><Layers className="w-4 h-4" /></div>
                                                                <div>
                                                                    <div className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">Group Identity</div>
                                                                    <div className="text-[10px] font-medium text-slate-400 leading-relaxed">Set the name and basic behavior of your modifier group.</div>
                                                                </div>
                                                            </div>
                                                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-start space-x-4">
                                                                <div className="p-2 bg-white rounded-xl text-amber-500"><Settings2 className="w-4 h-4" /></div>
                                                                <div>
                                                                    <div className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">Selection Rules</div>
                                                                    <div className="text-[10px] font-medium text-slate-400 leading-relaxed">Define Min/Max limits and whether the choice is mandatory.</div>
                                                                </div>
                                                            </div>
                                                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-start space-x-4">
                                                                <div className="p-2 bg-white rounded-xl text-emerald-500"><ListChecks className="w-4 h-4" /></div>
                                                                <div>
                                                                    <div className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">Options & Pricing</div>
                                                                    <div className="text-[10px] font-medium text-slate-400 leading-relaxed">Add choices (e.g., Bacon, Cheese) with individual price adjustments.</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </section>
                                                )}

                                                {activeGuideStep === 1 && (
                                                    <section className="space-y-6">
                                                        <div className="inline-flex items-center space-x-3 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl">
                                                            <Zap className="w-4 h-4" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">02. Logic Control</span>
                                                        </div>
                                                        <h3 className="text-3xl font-black text-slate-800 tracking-tight">Understanding Behaviors</h3>
                                                        <p className="text-slate-500 font-medium leading-relaxed">
                                                            The "Behavior Type" completely changes how customers interact with the group on the POS.
                                                        </p>
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                            <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100">
                                                                <Circle className="w-5 h-5 text-amber-500 mb-3" />
                                                                <div className="text-[10px] font-black text-amber-900 uppercase mb-1">Choice</div>
                                                                <div className="text-[9px] font-medium text-amber-700/60 uppercase tracking-tight">Force selection of exactly one or a limited set.</div>
                                                            </div>
                                                            <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100">
                                                                <Square className="w-5 h-5 text-indigo-500 mb-3" />
                                                                <div className="text-[10px] font-black text-indigo-900 uppercase mb-1">Add-on</div>
                                                                <div className="text-[9px] font-medium text-indigo-700/60 uppercase tracking-tight">Optional extras like toppings or side sauces.</div>
                                                            </div>
                                                            <div className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100">
                                                                <Ban className="w-5 h-5 text-rose-500 mb-3" />
                                                                <div className="text-[10px] font-black text-rose-900 uppercase mb-1">Exclusion</div>
                                                                <div className="text-[9px] font-medium text-rose-700/60 uppercase tracking-tight">Remove standard items (e.g., No Onions).</div>
                                                            </div>
                                                        </div>
                                                    </section>
                                                )}

                                                {activeGuideStep === 2 && (
                                                    <section className="space-y-6">
                                                        <div className="inline-flex items-center space-x-3 px-4 py-2 bg-sky-50 text-sky-600 rounded-xl">
                                                            <MousePointer2 className="w-4 h-4" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">03. Real-time Feedback</span>
                                                        </div>
                                                        <h3 className="text-3xl font-black text-slate-800 tracking-tight">The Customer POV Preview</h3>
                                                        <p className="text-slate-500 font-medium leading-relaxed">
                                                            Don't guess how it looks—test it. Use the interactive preview on the right to:
                                                        </p>
                                                        <ul className="space-y-4">
                                                            <li className="flex items-center space-x-3 text-slate-600 font-medium">
                                                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                                <span>Switch between items to test Price Totals</span>
                                                            </li>
                                                            <li className="flex items-center space-x-3 text-slate-600 font-medium">
                                                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                                <span>Verify Min/Max rules (e.g., stopping at 2/2 selections)</span>
                                                            </li>
                                                            <li className="flex items-center space-x-3 text-slate-600 font-medium">
                                                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                                <span>Visual check of the final checkout design</span>
                                                            </li>
                                                        </ul>
                                                    </section>
                                                )}

                                                {activeGuideStep === 3 && (
                                                    <section className="space-y-8">
                                                        <div className="space-y-6">
                                                            <div className="inline-flex items-center space-x-3 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl">
                                                                <Sparkles className="w-4 h-4" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">04. Efficiency</span>
                                                            </div>
                                                            <h3 className="text-3xl font-black text-slate-800 tracking-tight">Leveraging Templates</h3>
                                                            <p className="text-slate-500 font-medium leading-relaxed">
                                                                Save hours of configuration by building reusable templates for your most common modifier patterns.
                                                            </p>
                                                            <div className="p-8 bg-slate-900 rounded-[3rem] text-center space-y-6">
                                                                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto text-indigo-400">
                                                                    <Sparkles className="w-8 h-8" />
                                                                </div>
                                                                <h4 className="text-2xl font-black text-white tracking-tight">Ready to build?</h4>
                                                                <p className="text-slate-400 text-sm font-medium">Start by creating your first group and see the magic in real-time.</p>
                                                                <button
                                                                    onClick={() => setShowGuide(false)}
                                                                    className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/10"
                                                                >
                                                                    Let's Go!
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </section>
                                                )}
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>

                                    {/* Navigation Footer */}
                                    <div className="p-8 px-12 md:px-16 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                                        <button
                                            onClick={() => setActiveGuideStep(prev => Math.max(0, prev - 1))}
                                            disabled={activeGuideStep === 0}
                                            className="flex items-center space-x-2 text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all uppercase font-black text-[10px] tracking-widest"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            <span>Back</span>
                                        </button>
                                        <div className="flex space-x-2">
                                            {[0, 1, 2, 3].map(i => (
                                                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${activeGuideStep === i ? 'bg-indigo-600 w-4' : 'bg-slate-200'}`} />
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => activeGuideStep === 3 ? setShowGuide(false) : setActiveGuideStep(prev => Math.min(3, prev + 1))}
                                            className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition-all uppercase font-black text-[10px] tracking-widest"
                                        >
                                            <span>{activeGuideStep === 3 ? 'Finish' : 'Next Step'}</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
