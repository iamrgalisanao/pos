'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Calendar, Hash, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Product {
    id: string;
    name: string;
    sku: string;
    base_price: number;
}

interface ReceiveStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    product: Product | null;
    tenantId: string;
    storeId: string;
}

export default function ReceiveStockModal({ isOpen, onClose, onSuccess, product, tenantId, storeId }: ReceiveStockModalProps) {
    const { currencySymbol } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [currentStock, setCurrentStock] = useState<number | null>(null);
    const [inventoryId, setInventoryId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        batch_number: '',
        lot_number: '',
        expiry_date: '',
        quantity: '',
        cost_per_unit: ''
    });

    // Fetch current inventory level when modal opens
    useEffect(() => {
        if (isOpen && product) {
            fetchCurrentStock();
            generateBatchNumber();
        }
    }, [isOpen, product]);

    const fetchCurrentStock = async () => {
        if (!product) return;

        try {
            const response = await api.get('/inventory', {
                params: { store_id: storeId },
                headers: { 'X-Tenant-ID': tenantId }
            });

            const inventoryItem = response.data.find((item: any) => item.product_id === product.id);
            if (inventoryItem) {
                setCurrentStock(parseFloat(inventoryItem.quantity));
                setInventoryId(inventoryItem.id);
            } else {
                setCurrentStock(0);
                setInventoryId(null);
            }
        } catch (error) {
            console.error('Failed to fetch current stock:', error);
            setCurrentStock(0);
        }
    };

    const generateBatchNumber = () => {
        const timestamp = Date.now().toString().slice(-6);
        setFormData(prev => ({ ...prev, batch_number: `BATCH-${timestamp}` }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product || loading) return;

        setLoading(true);
        try {
            // Step 1: Update inventory stock (backend handles UPSERT automatically)
            const invResponse = await api.post('/inventory', {
                tenant_id: tenantId,
                store_id: storeId,
                product_id: product.id,
                variant_id: null,
                quantity: parseFloat(formData.quantity),
                type: 'receive',
                reference_id: null  // reference_id is for order IDs, not batch numbers
            }, {
                headers: { 'X-Tenant-ID': tenantId }
            });


            // Step 2: Create the batch record
            await api.post('/inventory/batches', {
                tenant_id: tenantId,
                inventory_id: invResponse.data.id,
                batch_number: formData.batch_number,
                lot_number: formData.lot_number || null,
                expiry_date: formData.expiry_date || null,
                quantity: parseFloat(formData.quantity),
                cost_per_unit: formData.cost_per_unit ? parseFloat(formData.cost_per_unit) : 0
            }, {
                headers: { 'X-Tenant-ID': tenantId }
            });

            setSuccess(true);
            setTimeout(() => {
                handleClose();
                onSuccess();
            }, 2000);
        } catch (error: any) {
            console.error('Failed to receive stock:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
            console.error('Backend error details:', error.response?.data);
            alert(`Failed to receive stock: ${errorMessage}\n\nPlease check the console for more details.`);
        } finally {
            setLoading(false);
        }
    };


    const handleClose = () => {
        setFormData({
            batch_number: '',
            lot_number: '',
            expiry_date: '',
            quantity: '',
            cost_per_unit: ''
        });
        setSuccess(false);
        setCurrentStock(null);
        setInventoryId(null);
        onClose();
    };

    if (!isOpen || !product) return null;

    const newStockLevel = currentStock !== null && formData.quantity
        ? currentStock + parseFloat(formData.quantity || '0')
        : currentStock;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-10 py-8 border-b border-slate-100">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Receive Stock</h2>
                                <p className="text-slate-400 text-sm font-medium mt-1">Add inventory batch for {product.name}</p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-slate-100 rounded-2xl transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-10 py-8 overflow-y-auto max-h-[calc(90vh-200px)]">
                        {success ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center justify-center py-12 space-y-4"
                            >
                                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800">Stock Received Successfully!</h3>
                                <p className="text-slate-500 font-medium">
                                    Added {formData.quantity} units to inventory
                                </p>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Product Info Card */}
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Product</p>
                                            <p className="text-lg font-black text-slate-800 mt-1">{product.name}</p>
                                            <p className="text-sm text-slate-500 font-medium">SKU: {product.sku}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Stock</p>
                                            <p className="text-2xl font-black text-slate-800 mt-1">
                                                {currentStock !== null ? currentStock : '—'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Batch Details */}
                                <div className="space-y-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center">
                                            <Package className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <h3 className="font-black text-slate-800 uppercase tracking-tight">Batch Details</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Batch Number */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center space-x-1">
                                                <Hash className="w-3 h-3" />
                                                <span>Batch Number</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.batch_number}
                                                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                                                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-bold text-slate-700"
                                                placeholder="BATCH-001"
                                            />
                                        </div>

                                        {/* Lot Number */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                                Lot Number (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.lot_number}
                                                onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
                                                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-bold text-slate-700"
                                                placeholder="LOT-123"
                                            />
                                        </div>

                                        {/* Quantity */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 ml-1">
                                                Quantity to Receive *
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                min="0.01"
                                                step="0.01"
                                                value={formData.quantity}
                                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                                className="w-full px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-black text-emerald-700 text-lg"
                                                placeholder="0.00"
                                            />
                                        </div>

                                        {/* Cost Per Unit */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center space-x-1">
                                                <span>Cost Per Unit ({currencySymbol})</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={formData.cost_per_unit}
                                                onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                                                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-bold text-slate-700"
                                                placeholder="0.00"
                                            />
                                        </div>

                                        {/* Expiry Date */}
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center space-x-1">
                                                <Calendar className="w-3 h-3" />
                                                <span>Expiry Date (Optional)</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.expiry_date}
                                                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-bold text-slate-700"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Stock Preview */}
                                {formData.quantity && currentStock !== null && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200"
                                    >
                                        <div className="flex items-center space-x-2 text-emerald-700">
                                            <AlertCircle className="w-5 h-5" />
                                            <p className="font-bold text-sm">
                                                New stock level will be: <span className="text-xl font-black">{newStockLevel?.toFixed(2)}</span> units
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </form>
                        )}
                    </div>

                    {/* Footer */}
                    {!success && (
                        <div className="px-10 py-6 border-t border-slate-100 flex items-center justify-end space-x-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="px-6 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !formData.quantity || !formData.batch_number}
                                className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Package className="w-4 h-4" />
                                        <span>Receive Stock</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
