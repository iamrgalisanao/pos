'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HelpCircle,
    ChevronRight,
    ChevronLeft,
    X,
    Info,
    Tag,
    DollarSign,
    Layers,
    Truck,
    MousePointer2,
    CheckCircle2,
    Sparkles,
    ArrowUpDown,
    Settings2,
    Zap,
    Trash2,
    Plus
} from 'lucide-react';

interface Category {
    id: string;
    name: string;
}

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    tenantId: string;
    product?: any;
    categories: Category[];
}

type TabType = 'core' | 'pricing' | 'modifiers' | 'logistics';

export default function ProductModal({ isOpen, onClose, onSave, tenantId, product, categories }: ProductModalProps) {
    const { user, currencySymbol } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('core');
    const [formData, setFormData] = useState({
        name: '',
        internal_name: '',
        product_type: 'food',
        description: '',
        sku: '',
        base_price: 0,
        tax_rate: 0,
        category_id: '',
        lifecycle_status: 'active'
    });
    const [loading, setLoading] = useState(false);
    const [isInternalNameModified, setIsInternalNameModified] = useState(false);
    const [linkedModifiers, setLinkedModifiers] = useState<any[]>([]);
    const [pricingRules, setPricingRules] = useState<any[]>([]);
    const [allModifierGroups, setAllModifierGroups] = useState<any[]>([]);
    const [addInitialStock, setAddInitialStock] = useState(false);
    const [initialStockQuantity, setInitialStockQuantity] = useState('0');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [createdProductId, setCreatedProductId] = useState<string | null>(null);

    // Guide State
    const [showGuide, setShowGuide] = useState(false);
    const [activeGuideStep, setActiveGuideStep] = useState(0);

    const generateInternalName = (name: string, categoryId: string) => {
        const category = categories.find(c => c.id === categoryId);
        const catPrefix = category ? category.name.toUpperCase().replace(/\s+/g, '').substring(0, 3) : '';
        const nameSlug = name.toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');

        if (!nameSlug) return '';
        return catPrefix ? `${catPrefix}_${nameSlug}` : nameSlug;
    };

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                internal_name: product.internal_name || product.name || '',
                product_type: product.product_type || 'food',
                description: product.description || '',
                sku: product.sku || '',
                base_price: Number(product.base_price) || 0,
                tax_rate: Number(product.tax_rate) || 0,
                category_id: product.category_id || '',
                lifecycle_status: product.lifecycle_status || (product.is_active ? 'active' : 'inactive')
            });
            setIsInternalNameModified(!!product.internal_name);
            fetchRelatedData();
        } else {
            setFormData({
                name: '',
                internal_name: '',
                product_type: 'food',
                description: '',
                sku: '',
                base_price: 0,
                tax_rate: 0,
                category_id: categories[0]?.id || '',
                lifecycle_status: 'active'
            });
            setIsInternalNameModified(false);
            setLinkedModifiers([]);
            setPricingRules([]);
        }
        setActiveTab('core');
        fetchAllModifierGroups();
    }, [product, categories, isOpen]);

    const fetchRelatedData = async () => {
        if (!product) return;
        try {
            const [modRes, ruleRes] = await Promise.all([
                api.get(`/modifiers/product/${product.id}`, { headers: { 'X-Tenant-ID': tenantId } }),
                api.get(`/catalog/products/${product.id}/pricing-rules`, { headers: { 'X-Tenant-ID': tenantId } })
            ]);
            setLinkedModifiers(modRes.data);
            setPricingRules(ruleRes.data);
        } catch (err) {
            console.error('Failed to fetch related product data', err);
        }
    };

    const fetchAllModifierGroups = async () => {
        try {
            const res = await api.get('/modifiers/groups', { headers: { 'X-Tenant-ID': tenantId } });
            setAllModifierGroups(res.data);
        } catch (err) {
            console.error('Failed to fetch all modifier groups', err);
        }
    };

    const handleLinkModifier = async (groupId: string) => {
        if (!product) {
            alert('Please save the product first before linking modifiers.');
            return;
        }
        try {
            await api.post('/modifiers/link', {
                tenant_id: tenantId,
                product_id: product.id,
                modifier_group_id: groupId
            });
            await fetchRelatedData();
        } catch (err) {
            console.error('Failed to link modifier group', err);
        }
    };

    const handleUnlinkModifier = async (groupId: string) => {
        if (!product) return;
        try {
            await api.post('/modifiers/unlink', {
                tenant_id: tenantId,
                product_id: product.id,
                modifier_group_id: groupId
            });
            await fetchRelatedData();
        } catch (err) {
            console.error('Failed to unlink modifier group', err);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (product) {
                await api.put(`/products/${product.id}`, { ...formData, tenant_id: tenantId });
                onSave();
                onClose();
            } else {
                const resp = await api.post('/products', { ...formData, tenant_id: tenantId });
                const newProduct = resp.data;

                if (addInitialStock && parseFloat(initialStockQuantity) > 0) {
                    await api.post('/inventory', {
                        tenant_id: tenantId,
                        store_id: user?.store_id,
                        product_id: newProduct.id,
                        quantity: parseFloat(initialStockQuantity),
                        type: 'initial',
                        reference_id: 'initial_setup'
                    });
                    onSave();
                    onClose();
                } else {
                    setCreatedProductId(newProduct.id);
                    setSaveSuccess(true);
                    onSave();
                }
            }
        } catch (err) {
            console.error('Failed to save product', err);
            alert('Failed to save product. Please check your data.');
        } finally {
            setLoading(false);
        }
    };

    const handleInitialStockSuccess = async () => {
        setLoading(true);
        try {
            if (!createdProductId || !user) return;
            // Create inventory entry
            await api.post('/inventory', {
                tenant_id: tenantId,
                store_id: user.store_id,
                product_id: createdProductId,
                quantity: parseFloat(initialStockQuantity),
                type: 'initial',
                reference_id: 'initial_setup'
            });
            onSave();
            onClose();
        } catch (err) {
            console.error('Failed to add initial stock', err);
            alert('Product created, but failed to set initial stock.');
        } finally {
            setLoading(false);
        }
    };

    const tabs: { id: TabType; label: string; icon: any }[] = [
        { id: 'core', label: 'Identity', icon: Tag },
        { id: 'pricing', label: 'Pricing', icon: DollarSign },
        { id: 'modifiers', label: 'Options', icon: Layers },
        { id: 'logistics', label: 'Logistics', icon: Truck }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 flex flex-col h-[85vh]">
                {/* Header */}
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                            {product ? 'Edit Product' : 'New Product Wizard'}
                        </h2>
                        <p className="text-sm text-slate-400 font-medium">Configure item properties and pricing</p>
                    </div>

                    <div className="flex items-center space-x-4">
                        {!product && (
                            <button
                                type="button"
                                onClick={() => {
                                    setShowGuide(true);
                                    setActiveGuideStep(0);
                                }}
                                className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-all border border-indigo-100"
                            >
                                <HelpCircle className="w-4 h-4" />
                                <span>How it Works</span>
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="px-8 py-2 bg-white border-b border-slate-50 flex space-x-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl transition-all font-bold text-sm ${activeTab === tab.id
                                ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100/50'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                    {activeTab === 'core' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                            {/* Card: Primary Identity */}
                            <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                                <div className="flex items-center space-x-4 mb-2">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                        <Tag className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-black text-slate-800 uppercase tracking-tight">Primary Identity</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Display Name</label>
                                        <input
                                            required
                                            value={formData.name}
                                            onChange={(e) => {
                                                const newName = e.target.value;
                                                setFormData({
                                                    ...formData,
                                                    name: newName,
                                                    internal_name: isInternalNameModified
                                                        ? formData.internal_name
                                                        : generateInternalName(newName, formData.category_id)
                                                });
                                            }}
                                            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-slate-700 text-lg"
                                            placeholder="e.g. Cappuccino"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Internal Name</label>
                                        <input
                                            value={formData.internal_name}
                                            onChange={(e) => {
                                                setFormData({ ...formData, internal_name: e.target.value });
                                                setIsInternalNameModified(true);
                                            }}
                                            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium text-slate-400"
                                            placeholder="e.g. COFFEE_ESPRESSO_CAP"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Card: Classification & Details */}
                            <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Product Type</label>
                                        <select
                                            value={formData.product_type}
                                            onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                                            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-slate-700 appearance-none cursor-pointer"
                                        >
                                            <option value="food">Food</option>
                                            <option value="beverage">Beverage</option>
                                            <option value="combo">Combo / Meal Set</option>
                                            <option value="modifier">Modifier Only</option>
                                            <option value="ingredient">Ingredient / Hidden</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Category</label>
                                        <select
                                            required
                                            value={formData.category_id}
                                            onChange={(e) => {
                                                const newCatId = e.target.value;
                                                setFormData({
                                                    ...formData,
                                                    category_id: newCatId,
                                                    internal_name: isInternalNameModified
                                                        ? formData.internal_name
                                                        : generateInternalName(formData.name, newCatId)
                                                });
                                            }}
                                            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-slate-700 appearance-none cursor-pointer"
                                        >
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Description (Menu & Receipt)</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium text-slate-700 min-h-[100px]"
                                        placeholder="Classic espresso with steamed milk..."
                                    />
                                </div>
                            </div>
                        </div>
                    )
                    }

                    {activeTab === 'pricing' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                            {/* Card: Basic Pricing */}
                            <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                                <div className="flex items-center space-x-4 mb-2">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                        <DollarSign className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-black text-slate-800 uppercase tracking-tight">Financial Configuration</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Base Price ({currencySymbol})</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.base_price || ''}
                                            onChange={(e) => setFormData({ ...formData, base_price: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                                            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-black text-slate-700 text-2xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tax Rate (%)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.1"
                                                required
                                                value={formData.tax_rate || ''}
                                                onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-slate-500"
                                            />
                                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 font-bold">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card: Channel Pricing Overrides */}
                            <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                                            <Zap className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-black text-slate-800 uppercase tracking-tight">Channel Pricing</h3>
                                    </div>
                                    <button type="button" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-all">
                                        + Add Override
                                    </button>
                                </div>

                                {pricingRules.length === 0 ? (
                                    <div className="py-10 text-center space-y-4 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-100">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto text-slate-200 shadow-sm">
                                            <Tag className="w-6 h-6" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-slate-900 font-bold">No channel overrides</p>
                                            <p className="text-slate-400 text-[10px] max-w-xs mx-auto uppercase tracking-wider">Use overrides for delivery apps (e.g. Grab, FoodPanda) or special event pricing.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {pricingRules.map(rule => (
                                            <div key={rule.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white transition-all">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm font-black text-[10px]">
                                                        {rule.channel?.substring(0, 2).toUpperCase() || 'AL'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-700 capitalize">{rule.channel || 'All Channels'}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{currencySymbol}{Number(rule.price_override).toFixed(2)} Override</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Active</span>
                                                    <button type="button" className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'modifiers' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                            <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                            <Layers className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-black text-slate-800 uppercase tracking-tight">Modifier Groups</h3>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <select
                                            className="px-4 py-2 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-black text-[10px] uppercase tracking-widest text-slate-500 appearance-none cursor-pointer"
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    handleLinkModifier(e.target.value);
                                                    e.target.value = '';
                                                }
                                            }}
                                        >
                                            <option value="">+ Link Group</option>
                                            {allModifierGroups
                                                .filter(ag => !linkedModifiers.some(lm => lm.id === ag.id))
                                                .map(ag => (
                                                    <option key={ag.id} value={ag.id}>{ag.name}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                </div>

                                {linkedModifiers.length === 0 ? (
                                    <div className="py-12 text-center space-y-6 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-100">
                                        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto text-slate-200 shadow-sm">
                                            <Settings2 className="w-8 h-8" />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-slate-900 font-black uppercase tracking-tight">No groups linked</h4>
                                            <p className="text-slate-400 text-xs max-w-xs mx-auto font-medium">Link groups for milk options, extras, or base modifications to enable customer choice.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {linkedModifiers.map(mod => (
                                            <div key={mod.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm font-black text-xs">
                                                        {mod.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm">{mod.name}</h4>
                                                        <div className="flex items-center space-x-2 mt-1">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Input: {mod.min_selections}-{mod.max_selections} selections</span>
                                                            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                                            <span className="text-[10px] font-bold text-indigo-500 uppercase">Station Sync Active</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleUnlinkModifier(mod.id)}
                                                    className="p-3 bg-white rounded-2xl border border-slate-100 text-slate-300 hover:text-rose-500 shadow-sm transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'logistics' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                            {/* Card: Global Logic & SKU */}
                            <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                                <div className="flex items-center space-x-4 mb-2">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                        <Truck className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-black text-slate-800 uppercase tracking-tight">Logistics & Tracking</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Lifecycle Status</label>
                                        <select
                                            value={formData.lifecycle_status}
                                            onChange={(e) => setFormData({ ...formData, lifecycle_status: e.target.value })}
                                            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-slate-700 appearance-none cursor-pointer"
                                        >
                                            <option value="active">Active & On Menu</option>
                                            <option value="inactive">Inactive / Hidden</option>
                                            <option value="archived">Archived (Soft Delete)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">SKU / Barcode</label>
                                        <input
                                            required
                                            value={formData.sku}
                                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium text-slate-700"
                                            placeholder="e.g. BEV-CAP-01"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Card: Availability Schedule */}
                            <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                                <div className="flex items-center space-x-4 mb-2">
                                    <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                                        <Settings2 className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-black text-slate-800 uppercase tracking-tight">Advanced Availability</h3>
                                </div>

                                <div className="p-10 text-center space-y-6 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-100">
                                    <div className="space-y-2">
                                        <p className="text-slate-900 font-bold uppercase tracking-tight">Real-time scheduling</p>
                                        <p className="text-slate-400 text-xs max-w-xs mx-auto font-medium leading-relaxed">Control visibility based on store operating hours or specific breakfast/lunch shifts.</p>
                                    </div>
                                    <button type="button" className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-indigo-600 font-bold text-xs hover:bg-indigo-50 transition-all shadow-sm">
                                        + Create Availability Rule
                                    </button>
                                </div>
                            </div>

                            {/* Inventory Initialization (Only for New Products) */}
                            {!product && (
                                <div className="p-8 bg-white rounded-[2.5rem] border border-emerald-100 shadow-sm space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                                <Plus className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-800 uppercase tracking-tight">Initial Inventory</h3>
                                                <p className="text-[10px] text-slate-400 font-bold">Add stock to inventory immediately</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setAddInitialStock(!addInitialStock)}
                                            className={`p-1.5 rounded-full transition-all ${addInitialStock ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-all transform ${addInitialStock ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                        </button>
                                    </div>

                                    {addInitialStock && (
                                        <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 ml-1">Initial Stock Level</label>
                                                <input
                                                    type="number"
                                                    value={initialStockQuantity}
                                                    onChange={(e) => setInitialStockQuantity(e.target.value)}
                                                    className="w-full px-5 py-4 rounded-2xl bg-white border-none ring-1 ring-emerald-100 focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-black text-lg text-emerald-700"
                                                    placeholder="0.00"
                                                />
                                                <p className="text-[10px] text-emerald-600/60 font-medium ml-1">Creating this product will automatically initialize an inventory record with this quantity.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </form >

                {/* Footer Footer */}
                <div className="p-8 border-t border-slate-50 flex justify-between items-center bg-white">
                    <div className="flex items-center space-x-3 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <p className="text-[10px] uppercase font-black tracking-widest leading-none">Settings Validated</p>
                    </div>
                    <div className="flex space-x-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-10 py-4 bg-white border border-slate-200 rounded-2xl text-slate-400 font-black text-xs hover:bg-slate-50 transition-all uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200/50 hover:bg-slate-800 disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mx-auto"></div>
                            ) : (
                                product ? 'Update Catalog' : 'Initialize Product'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Success & Redirect Prompt Overlay */}
            <AnimatePresence>
                {saveSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden relative p-10 text-center"
                        >
                            <div className="w-20 h-20 bg-emerald-50 rounded-[32px] flex items-center justify-center mx-auto mb-8">
                                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-4">Product Added Successfully!</h3>
                            <p className="text-slate-500 font-medium leading-relaxed mb-10 px-4">
                                Your new product is now in the catalog. Would you like to initialize its inventory level now?
                            </p>

                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-10">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">Initial Stock Quantity</label>
                                <input
                                    type="number"
                                    value={initialStockQuantity}
                                    onChange={(e) => setInitialStockQuantity(e.target.value)}
                                    className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 focus:border-indigo-500 outline-none font-black text-lg text-slate-900 text-center"
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleInitialStockSuccess}
                                    disabled={loading}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Initializing Stock...' : 'Set Initial Stock & Finish'}
                                    <Plus className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => {
                                        onClose();
                                        setSaveSuccess(false);
                                    }}
                                    className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-all"
                                >
                                    Skip for Now
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Interactive Guide Overlay */}
            <AnimatePresence>
                {showGuide && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[3rem] shadow-[0_32px_96px_-12px_rgba(0,0,0,0.3)] w-full max-w-5xl overflow-hidden flex h-[700px] border border-slate-100"
                        >
                            {/* Guide content... omitting for brevity but maintaining structure */}
                            {/* Sidebar Navigation */}
                            <div className="w-80 bg-slate-50 border-r border-slate-100 p-10 flex flex-col">
                                <div className="flex items-center space-x-3 mb-12">
                                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 uppercase tracking-tighter text-lg leading-none">Smart Guide</h3>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Product Wizard</p>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-2">
                                    {[
                                        { title: 'Identity & Naming', sub: 'Internal vs Display', icon: Tag },
                                        { title: 'Pricing Logic', sub: 'Base & Overrides', icon: DollarSign },
                                        { title: 'Customization', sub: 'Linking Modifiers', icon: Layers },
                                        { title: 'Logistics', sub: 'SKUs & Availability', icon: Truck },
                                    ].map((step, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setActiveGuideStep(i)}
                                            className={`w-full text-left p-5 rounded-[2rem] transition-all flex items-center space-x-4 border-2 ${activeGuideStep === i ? 'bg-white border-indigo-100 shadow-sm' : 'border-transparent hover:bg-slate-100 opacity-60'}`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${activeGuideStep === i ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                                <step.icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className={`text-[10px] uppercase font-black tracking-widest leading-none ${activeGuideStep === i ? 'text-indigo-600' : 'text-slate-400'}`}>Step 0{i + 1}</p>
                                                <p className="text-sm font-black text-slate-800 mt-1 uppercase tracking-tight">{step.title}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-auto">
                                    <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 flex items-start space-x-4">
                                        <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                        <p className="text-[10px] font-black text-indigo-700 leading-relaxed uppercase tracking-wider">
                                            Follow these steps to create an optimized menu item for your store.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 flex flex-col relative bg-white">
                                <button
                                    onClick={() => setShowGuide(false)}
                                    className="absolute top-8 right-8 p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-300"
                                >
                                    <X className="w-6 h-6" />
                                </button>

                                <div className="flex-1 p-16 px-20 overflow-y-auto custom-scrollbar">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={activeGuideStep}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="min-h-full"
                                        >
                                            {activeGuideStep === 0 && (
                                                <div className="space-y-8">
                                                    <div className="space-y-4">
                                                        <h2 className="text-4xl font-black text-slate-900 leading-none">IDENTITY & ARCHITECTURE</h2>
                                                        <p className="text-slate-500 font-medium text-lg leading-relaxed">Properly separate how customers see your items versus how your kitchen and reports track them.</p>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-8 pt-4">
                                                        <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4 relative overflow-hidden group">
                                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-indigo-600 relative z-10">
                                                                <MousePointer2 className="w-5 h-5" />
                                                            </div>
                                                            <div className="relative z-10">
                                                                <h3 className="font-black text-slate-800 uppercase tracking-tight">Display Name</h3>
                                                                <p className="text-xs text-slate-400 font-medium leading-relaxed mt-2">What appears on the Menus, Receipts, and KDS monitors. Keep it descriptive and friendly (e.g., "Grand Flat White").</p>
                                                            </div>
                                                            <Sparkles className="absolute -right-4 -bottom-4 w-24 h-24 text-slate-200 opacity-20 group-hover:scale-110 transition-transform" />
                                                        </div>

                                                        <div className="p-8 bg-slate-900 rounded-[2.5rem] space-y-4 text-white relative overflow-hidden group">
                                                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400 relative z-10">
                                                                <Tag className="w-5 h-5" />
                                                            </div>
                                                            <div className="relative z-10">
                                                                <h3 className="font-black uppercase tracking-tight">Internal Name</h3>
                                                                <p className="text-xs text-slate-400 font-medium leading-relaxed mt-2">Your backend ID for accounting. We auto-generate this for you based on category (e.g., BEV_COF_FLW_GRD).</p>
                                                            </div>
                                                            <CheckCircle2 className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-5 group-hover:scale-110 transition-transform" />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center space-x-6 p-6 bg-indigo-50 border border-indigo-100 rounded-[2rem]">
                                                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl shrink-0 flex items-center justify-center text-white shadow-lg">
                                                            <Info className="w-6 h-6" />
                                                        </div>
                                                        <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide leading-relaxed">
                                                            Categorization automatically defines your reporting groups and terminal filtering.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {activeGuideStep === 1 && (
                                                <div className="space-y-8">
                                                    <div className="space-y-4">
                                                        <h2 className="text-4xl font-black text-slate-900 leading-none">PRICING STRATEGY</h2>
                                                        <p className="text-slate-500 font-medium text-lg leading-relaxed">Manage your baseline pricing and channel-specific overrides.</p>
                                                    </div>

                                                    <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 flex items-center space-x-10">
                                                        <div className="flex-1 space-y-6">
                                                            <div className="flex items-center space-x-4">
                                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md text-emerald-500">
                                                                    <DollarSign className="w-6 h-6" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-black text-slate-800 uppercase tracking-tight">Base Catalog Price</h3>
                                                                    <p className="text-xs text-slate-400 font-medium leading-relaxed">The global default price for all physical terminals.</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-4">
                                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md text-indigo-500">
                                                                    <ArrowUpDown className="w-6 h-6" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-black text-slate-800 uppercase tracking-tight">Channel Overrides</h3>
                                                                    <p className="text-xs text-slate-400 font-medium leading-relaxed">Different price for GrabFood or FoodPanda? Add a rule to handle it automatically.</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="w-64 h-64 bg-slate-200 rounded-[2.5rem] flex items-center justify-center shadow-inner relative overflow-hidden group">
                                                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            <div className="bg-white p-6 rounded-3xl shadow-2xl relative z-10 text-center scale-90 group-hover:scale-100 transition-transform">
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Preview</p>
                                                                <p className="text-3xl font-black text-emerald-600">$12.50</p>
                                                                <div className="mt-4 px-3 py-1 bg-indigo-50 rounded-lg text-indigo-600 font-black text-[8px] uppercase tracking-widest">Global Default</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeGuideStep === 2 && (
                                                <div className="space-y-8">
                                                    <div className="space-y-4">
                                                        <h2 className="text-4xl font-black text-slate-900 leading-none">CUSTOMIZATION & LOGIC</h2>
                                                        <p className="text-slate-500 font-medium text-lg leading-relaxed">Link Modifier Groups to allow customers to personalize their items.</p>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-6">
                                                        {[
                                                            { title: 'Milk Types', icon: '🥛', desc: 'Choice Modifier' },
                                                            { title: 'Add Toppings', icon: '🍫', desc: 'Add-on Modifier' },
                                                            { title: 'No Onions', icon: '🧅', desc: 'Exclusion' }
                                                        ].map((item, id) => (
                                                            <div key={id} className="p-6 bg-white border-2 border-slate-50 rounded-[2rem] hover:border-indigo-100 transition-all text-center space-y-3 group">
                                                                <div className="text-4xl group-hover:scale-125 transition-transform duration-500">{item.icon}</div>
                                                                <h4 className="font-black text-slate-800 uppercase text-xs tracking-tight">{item.title}</h4>
                                                                <div className="px-3 py-1 bg-slate-50 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.desc}</div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="p-8 bg-indigo-900 rounded-[2.5rem] text-white flex items-center justify-between">
                                                        <div className="space-y-2">
                                                            <h3 className="font-black uppercase tracking-tight leading-none">Linked Groups</h3>
                                                            <p className="text-indigo-300 text-xs font-medium">Link groups globally or for specific stores.</p>
                                                        </div>
                                                        <div className="flex -space-x-3">
                                                            {[1, 2, 3].map(i => (
                                                                <div key={i} className="w-12 h-12 rounded-2xl bg-indigo-700 border-4 border-indigo-900 flex items-center justify-center font-black text-xs">+{i}</div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeGuideStep === 3 && (
                                                <div className="space-y-8">
                                                    <div className="space-y-4">
                                                        <h2 className="text-4xl font-black text-slate-900 leading-none">LOGISTICS & STATUS</h2>
                                                        <p className="text-slate-500 font-medium text-lg leading-relaxed">Control how your item behaves in the real world.</p>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="flex items-center space-x-6 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                                                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                                                                <Truck className="w-8 h-8" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <h4 className="font-black text-slate-800 uppercase tracking-tight">SKU / Barcode Matching</h4>
                                                                <p className="text-xs text-slate-400 leading-relaxed mt-1">Used for handheld barcode scanners and external inventory integrations.</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center space-x-6 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                                                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm border border-slate-100">
                                                                <CheckCircle2 className="w-8 h-8" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <h4 className="font-black text-slate-800 uppercase tracking-tight">Availability Rules</h4>
                                                                <p className="text-xs text-slate-400 leading-relaxed mt-1">Schedule items to only appear during breakfast hours or seasonal events (e.g. Lunar New Year Item).</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="text-center pt-4">
                                                        <button
                                                            onClick={() => setShowGuide(false)}
                                                            className="px-12 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center space-x-3 mx-auto"
                                                        >
                                                            <Sparkles className="w-5 h-5" />
                                                            <span>Ready to build</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* Footer Navigation */}
                                <div className="p-8 px-12 md:px-16 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                                    <button
                                        type="button"
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
                                        type="button"
                                        onClick={() => activeGuideStep === 3 ? setShowGuide(false) : setActiveGuideStep(prev => Math.min(3, prev + 1))}
                                        className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition-all uppercase font-black text-[10px] tracking-widest"
                                    >
                                        <span>{activeGuideStep === 3 ? 'Finish' : 'Next Step'}</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
