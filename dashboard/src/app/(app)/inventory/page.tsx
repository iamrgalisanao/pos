'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    Plus,
    Package,
    AlertCircle,
    Info,
    HelpCircle,
    BookOpen,
    Download,
    History,
    MoreHorizontal,
    Box,
    ChevronRight as ChevronRightIcon,
    ArrowRight,
    Sparkles
} from 'lucide-react';
import InventoryGuide from '@/components/InventoryGuide';


interface InventoryItem {
    id: string;
    product_name: string;
    variant_name?: string;
    sku: string;
    variant_sku?: string;
    quantity: string;
    min_threshold: string;
    product_id: string;
    variant_id?: string;
}

interface Batch {
    id: string;
    batch_number: string;
    lot_number?: string;
    expiry_date?: string;
    current_quantity: string;
}

export default function InventoryPage() {
    const { user, currencySymbol, isLoading: authLoading } = useAuth();
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loadingBatches, setLoadingBatches] = useState(false);
    const [showAddBatchForm, setShowAddBatchForm] = useState(false);
    const [newBatch, setNewBatch] = useState({
        batch_number: '',
        lot_number: '',
        expiry_date: '',
        quantity: '',
        cost_per_unit: ''
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'low' | 'out'>('all');
    const [showGuide, setShowGuide] = useState(false);
    const [showOnboardingModal, setShowOnboardingModal] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user && user.role === 'cashier') {
            router.push('/terminal');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchInventory();
        }
    }, [user]);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const response = await api.get('/inventory', {
                params: { store_id: user?.store_id },
                headers: { 'X-Tenant-ID': user?.tenant_id }
            });
            setInventory(response.data);
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredInventory = useMemo(() => {
        return inventory.filter(item => {
            const matchesSearch =
                item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.variant_sku?.toLowerCase().includes(searchTerm.toLowerCase()));

            const stock = parseFloat(item.quantity);
            const min = parseFloat(item.min_threshold);

            if (activeFilter === 'low') return matchesSearch && stock <= min && stock > 0;
            if (activeFilter === 'out') return matchesSearch && stock <= 0;
            return matchesSearch;
        });
    }, [inventory, searchTerm, activeFilter]);

    const handleViewBatches = async (item: InventoryItem) => {
        setSelectedItem(item);
        setShowBatchModal(true);
        setShowAddBatchForm(false);
        setLoadingBatches(true);
        try {
            const resp = await api.get(`/inventory/${item.id}/batches`, {
                headers: { 'X-Tenant-ID': user?.tenant_id }
            });
            setBatches(resp.data);
        } catch (err) {
            console.error('Failed to fetch batches:', err);
        } finally {
            setLoadingBatches(false);
        }
    };

    const handleAddBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem || !user) return;

        try {
            await api.post('/inventory/batches', {
                tenant_id: user.tenant_id,
                inventory_id: selectedItem.id,
                ...newBatch,
                quantity: parseFloat(newBatch.quantity),
                cost_per_unit: parseFloat(newBatch.cost_per_unit || '0')
            }, {
                headers: { 'X-Tenant-ID': user.tenant_id }
            });

            // Refresh
            setNewBatch({ batch_number: '', lot_number: '', expiry_date: '', quantity: '', cost_per_unit: '' });
            setShowAddBatchForm(false);
            handleViewBatches(selectedItem);
            fetchInventory();
        } catch (err) {
            alert('Failed to add batch');
        }
    };

    const handleExportCSV = () => {
        if (filteredInventory.length === 0) return;

        const headers = ["Product", "Variant", "SKU", "Availability", "Status"];
        const rows = filteredInventory.map(item => [
            `"${item.product_name}"`,
            `"${item.variant_name || ''}"`,
            `"${item.variant_sku || item.sku}"`,
            item.quantity,
            parseFloat(item.quantity) <= 0 ? "Out of Stock" :
                parseFloat(item.quantity) <= parseFloat(item.min_threshold) ? "Low Stock" : "In Stock"
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (authLoading) return (
        <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!user) return null;

    return (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">
                <button onClick={() => router.push('/dashboard')} className="hover:text-indigo-600 transition-colors">Dashboard</button>
                <ChevronRightIcon className="w-3 h-3 text-slate-300" />
                <span className="text-slate-900">Inventory Management</span>
            </nav>

            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center space-y-6 md:space-y-0">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight font-display">Inventory Management</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <p className="text-slate-500 font-medium">Track and manage your stock levels across stores.</p>
                        <button className="text-indigo-600 hover:text-indigo-700 p-1 rounded-full hover:bg-indigo-50 transition-colors" title="SKU refers to the Unique Stock Keeping Unit for your products.">
                            <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowGuide(true)}
                        className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-all shadow-sm"
                        title="Open Inventory Guide"
                    >
                        <HelpCircle className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button
                        onClick={() => router.push('/products')}
                        className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all shadow-xl shadow-slate-200"
                    >
                        <Plus className="w-5 h-5" />
                        Receive New Stock
                    </button>
                </div>
            </header>

            {/* Search and Filters Bar */}
            <div className="flex flex-col xl:flex-row gap-6 mb-10 items-start xl:items-center justify-between">
                <div className="relative w-full xl:max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search product metadata or SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-[20px] shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-slate-100/50 p-1.5 rounded-[22px] border border-slate-200/50">
                    <button
                        onClick={() => setActiveFilter('all')}
                        className={`px-6 py-2.5 rounded-2xl text-sm font-bold transition-all ${activeFilter === 'all' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        All Stock
                    </button>
                    <button
                        onClick={() => setActiveFilter('low')}
                        className={`px-6 py-2.5 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 ${activeFilter === 'low' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {activeFilter === 'low' && <AlertCircle className="w-4 h-4" />}
                        Low Stock
                    </button>
                    <button
                        onClick={() => setActiveFilter('out')}
                        className={`px-6 py-2.5 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 ${activeFilter === 'out' ? 'bg-rose-600 text-white shadow-lg shadow-rose-100' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {activeFilter === 'out' && <AlertCircle className="w-4 h-4" />}
                        Out of Stock
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[400px]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className={`border-b border-slate-100 transition-colors ${filteredInventory.length === 0 ? 'bg-slate-50/30' : 'bg-slate-50'}`}>
                            <th className={`px-8 py-6 text-[10px] font-black uppercase tracking-widest transition-colors ${filteredInventory.length === 0 ? 'text-slate-300' : 'text-slate-450'}`}>
                                <div className="flex items-center gap-2">
                                    Product Info
                                    <Info className={`w-3 h-3 transition-colors ${filteredInventory.length === 0 ? 'text-slate-200' : 'text-slate-400'}`} />
                                </div>
                            </th>
                            <th className={`px-8 py-6 text-[10px] font-black uppercase tracking-widest transition-colors ${filteredInventory.length === 0 ? 'text-slate-300' : 'text-slate-450'}`}>Identification (SKU)</th>
                            <th className={`px-8 py-6 text-[10px] font-black uppercase tracking-widest transition-colors ${filteredInventory.length === 0 ? 'text-slate-300' : 'text-slate-450'} text-center`}>Net Availability</th>
                            <th className={`px-8 py-6 text-[10px] font-black uppercase tracking-widest transition-colors ${filteredInventory.length === 0 ? 'text-slate-300' : 'text-slate-450'}`}>Stock Health</th>
                            <th className={`px-8 py-6 text-[10px] font-black uppercase tracking-widest transition-colors ${filteredInventory.length === 0 ? 'text-slate-300' : 'text-slate-450'} text-right`}>Lifecycle</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredInventory.length > 0 ? (
                            filteredInventory.map((item) => {
                                const stock = parseFloat(item.quantity);
                                const min = parseFloat(item.min_threshold);
                                const isOut = stock <= 0;
                                const isLow = stock <= min && stock > 0;

                                return (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl ${isOut ? 'bg-rose-50 text-rose-500' : isLow ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-500'}`}>
                                                    <Package className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 text-sm uppercase tracking-tight">{item.product_name}</span>
                                                    {item.variant_name && (
                                                        <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mt-0.5">{item.variant_name}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {item.variant_sku || item.sku}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`text-lg font-black tracking-tighter ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                                                {item.quantity}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${isOut ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]' : isLow ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]' : 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'}`}></div>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                    {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                <button
                                                    onClick={() => handleViewBatches(item)}
                                                    className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-all shadow-sm"
                                                    title="View Batches"
                                                >
                                                    <History className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
                                                    title="Quick Adjust"
                                                >
                                                    <Box className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
                                                >
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={5} className="py-32 text-center px-8">
                                    <div className="flex flex-col items-center max-w-sm mx-auto">
                                        <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mb-8 relative">
                                            <Package className="w-12 h-12 text-slate-200" />
                                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white shadow-xl rounded-2xl flex items-center justify-center border border-slate-50">
                                                <Plus className="w-5 h-5 text-indigo-500" />
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight font-display mb-3">
                                            {searchTerm ? 'No results found' : 'Set Up Your Inventory'}
                                        </h3>
                                        <p className="text-slate-500 font-medium leading-relaxed mb-8">
                                            {searchTerm
                                                ? `We couldn't find any inventory matching "${searchTerm}". Try a different SKU or product name.`
                                                : "Your inventory is currently empty. First, add products to your catalog, then receive stock to track availability."
                                            }
                                        </p>
                                        <div className="flex flex-col sm:flex-row items-center gap-4">
                                            {!searchTerm && (
                                                <button
                                                    onClick={() => setShowOnboardingModal(true)}
                                                    className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 group"
                                                >
                                                    Add Product to Catalog
                                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setShowGuide(true)}
                                                className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                                            >
                                                <BookOpen className="w-4 h-4 text-indigo-500" />
                                                Inventory Guide
                                            </button>
                                        </div>
                                        {inventory.length === 0 && !searchTerm && (
                                            <div className="mt-8 pt-8 border-t border-slate-100 w-full">
                                                <button
                                                    disabled
                                                    className="w-full px-8 py-4 bg-slate-50 text-slate-300 rounded-2xl font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2 border border-slate-100"
                                                    title="First add a product to catalog"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Receive Stock (Disabled)
                                                </button>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">First add a product to catalog</p>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                {loading && (
                    <div className="py-20 text-center text-muted animate-pulse">Loading inventory records...</div>
                )}
            </div>

            {/* Batch Management Modal */}
            {showBatchModal && selectedItem && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b bg-slate-50/50">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900">{selectedItem.product_name}</h3>
                                    {selectedItem.variant_name && (
                                        <p className="text-indigo-600 font-bold uppercase tracking-tight text-xs">{selectedItem.variant_name}</p>
                                    )}
                                </div>
                                <button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-slate-600 text-3xl leading-none">×</button>
                            </div>
                            <p className="text-muted text-sm font-medium">SKU: {selectedItem.variant_sku || selectedItem.sku} • In Stock: {selectedItem.quantity}</p>
                        </div>

                        <div className="p-8">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Stock Batches (FEFO Tracking)</h4>

                            {showAddBatchForm ? (
                                <form onSubmit={handleAddBatch} className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-slate-400 ml-2">Batch Number</label>
                                            <input
                                                required
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-sm"
                                                placeholder="e.g. BATCH-001"
                                                value={newBatch.batch_number}
                                                onChange={e => setNewBatch({ ...newBatch, batch_number: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-slate-400 ml-2">Lot Number</label>
                                            <input
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-sm"
                                                placeholder="Optional"
                                                value={newBatch.lot_number}
                                                onChange={e => setNewBatch({ ...newBatch, lot_number: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-slate-400 ml-2">Expiry Date</label>
                                            <input
                                                type="date"
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-sm"
                                                value={newBatch.expiry_date}
                                                onChange={e => setNewBatch({ ...newBatch, expiry_date: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-slate-400 ml-2">Quantity</label>
                                            <input
                                                required
                                                type="number"
                                                step="0.001"
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-sm font-bold text-slate-700"
                                                placeholder="0.00"
                                                value={newBatch.quantity}
                                                onChange={e => setNewBatch({ ...newBatch, quantity: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-slate-400 ml-2">Unit Cost ({currencySymbol})</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-sm font-bold text-indigo-600"
                                            placeholder="0.00"
                                            value={newBatch.cost_per_unit}
                                            onChange={e => setNewBatch({ ...newBatch, cost_per_unit: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            className="px-6 py-2 text-slate-500 font-bold hover:text-slate-700"
                                            onClick={() => setShowAddBatchForm(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="bg-slate-900 text-white px-8 py-2 rounded-xl font-bold hover:bg-black transition-all"
                                        >
                                            Save Batch
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                                    {loadingBatches ? (
                                        <div className="py-10 text-center animate-pulse text-muted">Loading batches...</div>
                                    ) : batches.length > 0 ? (
                                        batches.map(batch => (
                                            <div key={batch.id} className="flex justify-between items-center p-4 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 transition-all">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800">Batch: {batch.batch_number}</span>
                                                    <div className="flex space-x-3 mt-1">
                                                        {batch.lot_number && <span className="text-[10px] text-muted">Lot: {batch.lot_number}</span>}
                                                        {batch.expiry_date && (
                                                            <span className="text-[10px] text-rose-500 font-bold uppercase">
                                                                Exp: {new Date(batch.expiry_date).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-lg font-black text-slate-900">{batch.current_quantity}</span>
                                                    <p className="text-[10px] text-muted font-bold uppercase tracking-tighter">Remaining</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-10 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 italic text-muted">
                                            No active batches found. All stock is currently unbatched.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-slate-50 flex justify-between items-center">
                            <button className="text-slate-500 font-bold hover:text-slate-700" onClick={() => setShowBatchModal(false)}>Close</button>
                            {!showAddBatchForm && (
                                <button
                                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all transform active:scale-95"
                                    onClick={() => setShowAddBatchForm(true)}
                                >
                                    + Receive New Batch
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Inventory Interactive Guide */}
            <InventoryGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />

            {/* Guided Onboarding Modal */}
            <AnimatePresence>
                {showOnboardingModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden relative p-10 text-center"
                        >
                            <div className="w-20 h-20 bg-indigo-50 rounded-[32px] flex items-center justify-center mx-auto mb-8">
                                <Sparkles className="w-10 h-10 text-indigo-600" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-4">First, Let's Add a Product</h3>
                            <p className="text-slate-500 font-medium leading-relaxed mb-10 px-4">
                                Inventory depends on your catalog. You must first add products to your <span className="text-slate-900 font-bold">Product Catalog</span>.
                                There, you'll be able to set initial stock levels and details.
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => router.push('/products?from=inventory')}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2 group"
                                >
                                    Continue to Catalog
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button
                                    onClick={() => setShowOnboardingModal(false)}
                                    className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

