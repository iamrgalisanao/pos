'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

import api from '@/lib/api';
import ProductModal from '@/components/ProductModal';
import CategoryModal from '@/components/CategoryModal';
import ReceiveStockModal from '@/components/ReceiveStockModal';
import SortableColumnHeader from '@/components/Catalog/SortableColumnHeader';
import StatusBadge from '@/components/Catalog/StatusBadge';
import ProductActionsMenu from '@/components/Catalog/ProductActionsMenu';
import BatchActionsToolbar from '@/components/Catalog/BatchActionsToolbar';
import { ArrowLeft, Package, Plus, Search, X, Filter, Info, ChevronUp, ChevronDown } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    internal_name?: string;
    product_type?: string;
    lifecycle_status?: string;
    description?: string;
    sku: string;
    base_price: number;
    category_id: string;
    category_name?: string;
    is_active: boolean;
    tax_rate: number;
    stock_quantity?: number;
}

interface Category {
    id: string;
    name: string;
    send_to_kds: boolean;
    kds_station?: string;
}

export default function ProductsPage() {
    const { user, store, currencySymbol, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const fromInventory = searchParams.get('from') === 'inventory';

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
    const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(true);

    // Sorting state
    const [sortConfig, setSortConfig] = useState<{
        key: keyof Product;
        direction: 'asc' | 'desc';
    } | null>(null);

    // Batch selection state
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

    // Modal states
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isReceiveStockModalOpen, setIsReceiveStockModalOpen] = useState(false);
    const [receivingProduct, setReceivingProduct] = useState<Product | null>(null);

    useEffect(() => {
        if (!authLoading && (!user || (user.role !== 'owner' && user.role !== 'manager'))) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user) return;
        fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [prodRes, catRes, invRes] = await Promise.all([
                api.get('/products', { headers: { 'X-Tenant-ID': user?.tenant_id } }),
                api.get('/categories', { headers: { 'X-Tenant-ID': user?.tenant_id } }),
                api.get('/inventory', {
                    params: { store_id: store?.id || user?.store_id },
                    headers: { 'X-Tenant-ID': user?.tenant_id }
                })
            ]);

            // Merge inventory data with products
            const inventoryMap = new Map(invRes.data.map((inv: any) => [inv.product_id, parseFloat(inv.quantity) || 0]));
            const productsWithStock = prodRes.data.map((p: any) => ({
                ...p,
                stock_quantity: inventoryMap.get(p.id) || 0
            }));

            setProducts(productsWithStock);
            setCategories(catRes.data);
        } catch (err) {
            console.error('Failed to fetch product data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyTemplate = async (industry: string) => {
        if (!confirm(`Apply the ${industry.toUpperCase()} template? This adds default categories and modifier groups.`)) return;
        try {
            setLoading(true);
            await api.post('/onboarding/apply-template', { tenant_id: user?.tenant_id, industry });
            await fetchData();
            setIsOnboardingOpen(false);
            alert('Industry template applied successfully!');
        } catch (err) {
            console.error('Failed to apply template', err);
            alert('Failed to apply industry template.');
        } finally {
            setLoading(false);
        }
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setIsProductModalOpen(true);
    };

    const handleAddProduct = () => {
        setEditingProduct(null);
        setIsProductModalOpen(true);
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm('Are you sure you want to archive this product? It will no longer appear in the terminal.')) return;
        try {
            await api.delete(`/products/${id}`, { headers: { 'X-Tenant-ID': user?.tenant_id } });
            fetchData();
        } catch (err) {
            console.error('Failed to delete product', err);
        }
    };

    const handleReceiveStock = (product: Product) => {
        setReceivingProduct(product);
        setIsReceiveStockModalOpen(true);
    };

    const handleSort = (key: keyof Product) => {
        setSortConfig(prev => ({
            key,
            direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleSelectAll = () => {
        if (selectedProducts.size === filteredProducts.length) {
            setSelectedProducts(new Set());
        } else {
            setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
        }
    };

    const handleSelectProduct = (id: string) => {
        const newSet = new Set(selectedProducts);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedProducts(newSet);
    };

    const handleDuplicateProduct = async (product: Product) => {
        try {
            const duplicatedProduct = {
                ...product,
                name: `${product.name} (Copy)`,
                sku: `${product.sku}-COPY`,
                id: undefined
            };
            await api.post('/products', duplicatedProduct, {
                headers: { 'X-Tenant-ID': user?.tenant_id }
            });
            fetchData();
        } catch (err) {
            console.error('Failed to duplicate product', err);
            alert('Failed to duplicate product');
        }
    };

    const handleBulkArchive = async () => {
        if (!confirm(`Archive ${selectedProducts.size} product(s)?`)) return;
        try {
            await Promise.all(
                Array.from(selectedProducts).map(id =>
                    api.delete(`/products/${id}`, { headers: { 'X-Tenant-ID': user?.tenant_id } })
                )
            );
            setSelectedProducts(new Set());
            fetchData();
        } catch (err) {
            console.error('Failed to archive products', err);
            alert('Failed to archive some products');
        }
    };

    const handleBulkExport = () => {
        const selectedProductsData = products.filter(p => selectedProducts.has(p.id));
        const headers = ["Name", "SKU", "Category", "Type", "Price", "Status"];
        const rows = selectedProductsData.map(p => [
            `"${p.name}"`,
            `"${p.sku}"`,
            `"${p.category_name || 'Uncategorized'}"`,
            `"${p.product_type || ''}"`,
            p.base_price.toString(),
            p.is_active ? "Active" : "Inactive"
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `products_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredProducts = useMemo(() => {
        let filtered = products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.internal_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (p.category_name?.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;

            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'active' && p.is_active) ||
                (statusFilter === 'inactive' && !p.is_active);

            return matchesSearch && matchesCategory && matchesStatus;
        });

        // Apply sorting
        if (sortConfig) {
            filtered.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];

                if (aVal === null || aVal === undefined) return 1;
                if (bVal === null || bVal === undefined) return -1;

                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    return sortConfig.direction === 'asc'
                        ? aVal.localeCompare(bVal)
                        : bVal.localeCompare(aVal);
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    }, [products, searchQuery, selectedCategory, statusFilter, sortConfig]);

    if (authLoading || loading) return (
        <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!user) return null;

    return (
        <>
            {fromInventory && (
                <nav className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">
                    <button onClick={() => router.push('/inventory')} className="flex items-center space-x-2 hover:text-indigo-600 transition-colors group">
                        <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Inventory</span>
                    </button>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-900">Add Products</span>
                </nav>
            )}

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 space-y-4 md:space-y-0 text-slate-800">
                <div>
                    <h1 className="text-3xl font-black font-display tracking-tight">Product Catalog</h1>
                    <p className="text-slate-500 font-medium">Manage your items, pricing, and stations</p>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setIsInfoPanelOpen(!isInfoPanelOpen)}
                        className="px-6 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-700 font-bold text-sm hover:bg-indigo-100 transition-all flex items-center space-x-2"
                    >
                        <Info className="w-4 h-4" />
                        <span>Guide</span>
                        {isInfoPanelOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setIsOnboardingOpen(!isOnboardingOpen)}
                            className="px-6 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-700 font-bold text-sm hover:bg-indigo-100 transition-all flex items-center space-x-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>Quick Setup</span>
                        </button>
                        {isOnboardingOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-10 py-2 animate-in fade-in slide-in-from-top-2">
                                <button onClick={() => handleApplyTemplate('cafe')} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center space-x-2">
                                    <span>☕ Café Template</span>
                                </button>
                                <button onClick={() => handleApplyTemplate('fast-food')} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center space-x-2">
                                    <span>🍔 Fast Food Template</span>
                                </button>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
                    >
                        Categories
                    </button>
                    <button
                        onClick={handleAddProduct}
                        className="bg-slate-900 text-white rounded-2xl flex items-center space-x-2 px-6 py-3 font-bold shadow-lg shadow-slate-200"
                    >
                        <span className="text-xl leading-none font-black">+</span>
                        <span>Add Product</span>
                    </button>
                </div>
            </header>

            {/* Option 2: Info Panel */}
            {isInfoPanelOpen && (
                <div className="mb-8 p-6 bg-indigo-50 border border-indigo-100 rounded-[32px] animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-start space-x-6">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200">
                            <Info className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-black text-indigo-900 mb-2 font-display">How to Receive Stock</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="space-y-1">
                                    <p className="text-xs font-black uppercase tracking-widest text-indigo-400">Step 1</p>
                                    <p className="text-sm text-indigo-800 font-medium">Click the actions menu (•••) on any product and select <b>Receive Stock</b>.</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-black uppercase tracking-widest text-indigo-400">Step 2</p>
                                    <p className="text-sm text-indigo-800 font-medium">Enter the quantity, batch number, and optional lot/expiry info for tracking.</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-black uppercase tracking-widest text-indigo-400">Step 3</p>
                                    <p className="text-sm text-indigo-800 font-medium">Click <b>Receive Stock</b> to save. The system logs a trackable batch and transaction.</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-black uppercase tracking-widest text-indigo-400">Step 4</p>
                                    <p className="text-sm text-indigo-800 font-medium">Watch the <b>Stock</b> column update with color-coded badges indicating levels.</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsInfoPanelOpen(false)} className="text-indigo-400 hover:text-indigo-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Enhanced Search and Filter Section */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-8">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search products by name, SKU, or category..."
                        className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium text-slate-700 placeholder:text-slate-400"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Filter Chips */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-4 py-2.5 rounded-full font-bold text-sm transition-all ${statusFilter === 'all'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        All Products
                    </button>
                    <button
                        onClick={() => setStatusFilter('active')}
                        className={`px-4 py-2.5 rounded-full font-bold text-sm transition-all ${statusFilter === 'active'
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setStatusFilter('inactive')}
                        className={`px-4 py-2.5 rounded-full font-bold text-sm transition-all ${statusFilter === 'inactive'
                            ? 'bg-slate-600 text-white shadow-lg shadow-slate-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Inactive
                    </button>
                </div>

                {/* Category Dropdown */}
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-3 rounded-2xl bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-slate-700 cursor-pointer"
                >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            {/* Enhanced Table */}
            <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-6 py-5 w-12">
                                <input
                                    type="checkbox"
                                    checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                            </th>
                            <th className="px-6 py-5">
                                <SortableColumnHeader
                                    label="Product"
                                    sortKey="name"
                                    currentSortKey={sortConfig?.key || null}
                                    currentSortDirection={sortConfig?.direction || 'asc'}
                                    onSort={handleSort}
                                />
                            </th>
                            <th className="px-6 py-5">
                                <SortableColumnHeader
                                    label="SKU"
                                    sortKey="sku"
                                    currentSortKey={sortConfig?.key || null}
                                    currentSortDirection={sortConfig?.direction || 'asc'}
                                    onSort={handleSort}
                                />
                            </th>
                            <th className="px-6 py-5">
                                <SortableColumnHeader
                                    label="Category"
                                    sortKey="category_name"
                                    currentSortKey={sortConfig?.key || null}
                                    currentSortDirection={sortConfig?.direction || 'asc'}
                                    onSort={handleSort}
                                />
                            </th>
                            <th className="px-6 py-5">
                                <SortableColumnHeader
                                    label="Type"
                                    sortKey="product_type"
                                    currentSortKey={sortConfig?.key || null}
                                    currentSortDirection={sortConfig?.direction || 'asc'}
                                    onSort={handleSort}
                                />
                            </th>
                            <th className="px-6 py-5">
                                <SortableColumnHeader
                                    label="Price"
                                    sortKey="base_price"
                                    currentSortKey={sortConfig?.key || null}
                                    currentSortDirection={sortConfig?.direction || 'asc'}
                                    onSort={handleSort}
                                />
                            </th>
                            <th className="px-6 py-5">
                                <SortableColumnHeader
                                    label="Stock"
                                    sortKey="stock_quantity"
                                    currentSortKey={sortConfig?.key || null}
                                    currentSortDirection={sortConfig?.direction || 'asc'}
                                    onSort={handleSort}
                                />
                            </th>
                            <th className="px-6 py-5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</span>
                            </th>
                            <th className="px-6 py-5 text-right">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-8 py-20">
                                    <div className="flex flex-col items-center justify-center space-y-6">
                                        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center">
                                            <Package className="w-12 h-12 text-indigo-400" />
                                        </div>
                                        <div className="text-center space-y-2">
                                            <h3 className="text-xl font-black text-slate-800">
                                                {products.length === 0 ? 'No Products Yet' : 'No Matches Found'}
                                            </h3>
                                            <p className="text-slate-500 font-medium max-w-md">
                                                {products.length === 0
                                                    ? 'Get started by adding your first product to the catalog.'
                                                    : 'Try adjusting your search or filters to find what you\'re looking for.'}
                                            </p>
                                        </div>
                                        {products.length === 0 && (
                                            <button
                                                onClick={handleAddProduct}
                                                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center space-x-2"
                                            >
                                                <Plus className="w-5 h-5" />
                                                <span>Add Your First Product</span>
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map((product) => (
                                <tr
                                    key={product.id}
                                    className={`hover:bg-slate-50/50 transition-colors ${selectedProducts.has(product.id) ? 'bg-indigo-50/30' : ''
                                        }`}
                                >
                                    <td className="px-6 py-5">
                                        <input
                                            type="checkbox"
                                            checked={selectedProducts.has(product.id)}
                                            onChange={() => handleSelectProduct(product.id)}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                                                {product.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{product.name}</p>
                                                {product.internal_name && (
                                                    <p className="text-xs text-slate-400 font-medium">{product.internal_name}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="font-mono text-sm text-slate-600 font-bold">{product.sku}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-sm font-medium text-slate-700">
                                            {product.category_name || 'Uncategorized'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-sm font-medium text-slate-600">
                                            {product.product_type || '—'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="font-bold text-slate-800">
                                            {currencySymbol}{Number(product.base_price).toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center space-x-2">
                                            <span className={`font-bold text-sm px-3 py-1.5 rounded-lg ${(product.stock_quantity || 0) > 10
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : (product.stock_quantity || 0) > 0
                                                    ? 'bg-amber-50 text-amber-700'
                                                    : 'bg-red-50 text-red-700'
                                                }`}>
                                                {Math.floor(product.stock_quantity || 0)} units
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <StatusBadge isActive={product.is_active} lifecycleStatus={product.lifecycle_status} />
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-end space-x-2">
                                            <ProductActionsMenu
                                                onEdit={() => handleEditProduct(product)}
                                                onReceiveStock={() => handleReceiveStock(product)}
                                                onDuplicate={() => handleDuplicateProduct(product)}
                                                onArchive={() => handleDeleteProduct(product.id)}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Product Count Footer */}
                {filteredProducts.length > 0 && (
                    <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                        <p className="text-sm text-slate-500 font-medium">
                            Showing <span className="font-bold text-slate-700">{filteredProducts.length}</span> of{' '}
                            <span className="font-bold text-slate-700">{products.length}</span> products
                        </p>
                        {selectedProducts.size > 0 && (
                            <p className="text-sm text-indigo-600 font-bold">
                                {selectedProducts.size} selected
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Batch Actions Toolbar */}
            <BatchActionsToolbar
                selectedCount={selectedProducts.size}
                onClearSelection={() => setSelectedProducts(new Set())}
                onBulkArchive={handleBulkArchive}
                onBulkExport={handleBulkExport}
            />

            <ProductModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onSave={fetchData}
                tenantId={user.tenant_id}
                product={editingProduct}
                categories={categories}
            />

            <CategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                onSave={fetchData}
                tenantId={user.tenant_id}
                categories={categories}
            />

            <ReceiveStockModal
                isOpen={isReceiveStockModalOpen}
                onClose={() => setIsReceiveStockModalOpen(false)}
                onSuccess={fetchData}
                product={receivingProduct}
                tenantId={user.tenant_id}
                storeId={store?.id || user.store_id}
            />
        </>
    );
}

