'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { db, type PendingOrder } from '@/lib/db';
import { SyncService } from '@/lib/syncService';
import { TerminalService } from '@/lib/terminal';
import ConnectivityStatus from '@/components/ConnectivityStatus';
import CustomerSearch from '@/components/CustomerSearch';
import { MarketingService } from '@/lib/marketingService';
import { Tag, Ticket, X } from 'lucide-react';

interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    loyalty_tier: string;
    points_balance: number;
}

interface Variant {
    id: string;
    product_id: string;
    name: string;
    sku: string;
    price_override?: string;
}

interface Product {
    id: string;
    name: string;
    base_price: string;
    tax_rate: string;
    category_id: string;
    image_url?: string;
    send_to_kds?: boolean;
    variants?: Variant[];
}

interface Category {
    id: string;
    name: string;
    is_active: boolean;
}

interface CartItem {
    product: Product;
    variant?: Variant;
    quantity: number;
}

export default function POSTerminal() {
    const { user, store, currencySymbol, logout, isLoading: authLoading } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [voucherCode, setVoucherCode] = useState('');
    const [appliedVoucher, setAppliedVoucher] = useState<{ id: string, amount: number, code: string } | null>(null);
    const [voucherError, setVoucherError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [serviceMode, setServiceMode] = useState<'dine-in' | 'take-away' | 'online'>('dine-in');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [storeSettings, setStoreSettings] = useState<any>({});
    const [todayCount, setTodayCount] = useState(0);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            const loadData = async () => {
                setLoading(true);
                await fetchStoreSettings();
                await fetchCategories();
                await fetchProducts();
                setLoading(false);
            };
            loadData();

            // Initialize Terminal ID and Heartbeat
            const initTerminal = async () => {
                try {
                    await TerminalService.register(user.tenant_id, user.store_id);
                    const stopHeartbeat = TerminalService.startHeartbeat(user.tenant_id);
                    return stopHeartbeat;
                } catch (err) {
                    console.error('Terminal init failed', err);
                }
            };
            const stopHeartbeatPromise = initTerminal();
            const stopSync = SyncService.startBackgroundSync(user.tenant_id);

            return () => {
                stopSync();
                stopHeartbeatPromise.then(stop => stop?.());
            };
        }
    }, [user]);

    const fetchStoreSettings = async () => {
        if (!user) return;
        try {
            const resp = await api.get('/stores', {
                headers: { 'X-Tenant-ID': user.tenant_id }
            });
            const stores = resp.data;
            const currentStore = stores.find((s: any) => s.id === user.store_id);
            if (currentStore) {
                setStoreSettings(currentStore.settings || {});
            }
        } catch (err) {
            console.error('Failed to fetch store settings', err);
        }
    };

    const fetchCategories = async () => {
        try {
            const resp = await api.get('/categories', {
                headers: { 'X-Tenant-ID': user?.tenant_id }
            });
            setCategories(resp.data);
            // Cache in local DB (future iteration could add categories table to Dexie)
        } catch (err) {
            console.error('Failed to fetch categories', err);
        }
    };

    const fetchProducts = async () => {
        try {
            const resp = await api.get('/products', {
                headers: { 'X-Tenant-ID': user?.tenant_id }
            });
            const apiProducts = resp.data;
            setProducts(apiProducts);

            for (const p of apiProducts) {
                await db.products.put({ ...p, last_updated: Date.now(), tenant_id: user?.tenant_id });
            }
        } catch (err: any) {
            console.warn('Network load failed, falling back to local cache', err);
            const localProducts = await db.products.where('tenant_id').equals(user?.tenant_id || '').toArray();
            if (localProducts.length > 0) {
                setProducts(localProducts as any);
            } else {
                setError('Failed to load products and no offline data found.');
            }
        }
    };

    const addToCart = (product: Product, variant?: Variant) => {
        setCart(prev => {
            const existing = prev.find(item =>
                item.product.id === product.id &&
                (!item.variant || item.variant.id === variant?.id)
            );

            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id &&
                        (!item.variant || item.variant.id === variant?.id)
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, variant, quantity: 1 }];
        });
        setSelectedProduct(null);
    };

    const handleProductClick = async (product: Product) => {
        try {
            // Priority 1: Network fetch for latest variants
            const resp = await api.get(`/products/${product.id}/variants`, {
                headers: { 'X-Tenant-ID': user?.tenant_id }
            });
            const variants = resp.data;

            // Update local variant cache
            if (variants && variants.length > 0) {
                for (const v of variants) {
                    await db.variants.put({ ...v, last_updated: Date.now(), tenant_id: user?.tenant_id });
                }
                setSelectedProduct({ ...product, variants });
            } else {
                addToCart(product);
            }
        } catch (err) {
            console.warn('Network variant fetch failed, checking local cache');
            // Priority 2: Local cache for variants
            const localVariants = await db.variants.where('product_id').equals(product.id).toArray();
            if (localVariants.length > 0) {
                setSelectedProduct({ ...product, variants: localVariants as any });
            } else {
                addToCart(product);
            }
        }
    };

    const removeFromCart = (product_id: string, variant_id?: string) => {
        setCart(prev => prev.filter(item =>
            !(item.product.id === product_id && (!item.variant || item.variant.id === variant_id))
        ));
    };

    const updateQuantity = (product_id: string, variant_id: string | undefined, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === product_id && (!item.variant || item.variant.id === variant_id)) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        }));
    };

    const calculateSubtotal = () => {
        return cart.reduce((acc, item) => {
            const price = item.variant?.price_override
                ? parseFloat(item.variant.price_override)
                : parseFloat(item.product.base_price);
            return acc + (price * item.quantity);
        }, 0);
    };

    const calculateTax = () => {
        return cart.reduce((acc, item) => {
            const price = item.variant?.price_override
                ? parseFloat(item.variant.price_override)
                : parseFloat(item.product.base_price);
            const rate = parseFloat(item.product.tax_rate) / 100;
            return acc + (price * rate * item.quantity);
        }, 0);
    };

    const handleCheckout = async () => {
        if (cart.length === 0 || !user) return;
        setLoading(true);

        const subtotal = calculateSubtotal();
        const tax = calculateTax();
        const discount = appliedVoucher ? appliedVoucher.amount : 0;
        const total = Math.max(0, subtotal + tax - discount);

        const payload: any = {
            temp_id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            terminal_id: TerminalService.getTerminalId(),
            tenant_id: user.tenant_id,
            store_id: user.store_id,
            staff_id: user.id,
            total_amount: total,
            tax_amount: tax,
            items: cart.map(item => {
                const price = item.variant?.price_override
                    ? parseFloat(item.variant.price_override)
                    : parseFloat(item.product.base_price);
                return {
                    product_id: item.product.id,
                    variant_id: item.variant?.id,
                    product_name: item.variant ? `${item.product.name} (${item.variant.name})` : item.product.name,
                    send_to_kds: item.product.send_to_kds,
                    quantity: item.quantity,
                    unit_price: price,
                    tax_amount: (price * (parseFloat(item.product.tax_rate) / 100)) * item.quantity
                };
            }),
            customer_id: selectedCustomer?.id,
            voucher_id: appliedVoucher?.id,
            discount_amount: appliedVoucher?.amount || 0,
            payments: [{
                payment_method: 'cash',
                amount: total
            }]
        };

        try {
            await api.post('/orders', payload);
            setCart([]);
            setSelectedCustomer(null);
            setAppliedVoucher(null);
            setVoucherCode('');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.warn('Checkout network error, queueing locally', err);
            // Queue for offline sync
            await db.ordersQueue.add({
                temp_id: payload.temp_id,
                order_data: payload,
                status: 'pending',
                created_at: Date.now(),
                tenant_id: user!.tenant_id
            });

            setCart([]);
            setSuccess(true); // Still show success, but maybe with "Queued" note
            setError('System is offline. Your order has been saved and will sync automatically once reconnected.');
            setTimeout(() => {
                setSuccess(false);
                setError(null);
            }, 5000);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return (
        <div className="h-full flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!user) return null;

    if (error) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50">
                <div className="premium-card max-w-md w-full text-center">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold mb-2">Error</h2>
                    <p className="text-muted mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn-primary w-full"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row h-full -m-6 md:-m-10 bg-[#f4f5f1] overflow-hidden font-sans text-[#121915]">
            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col p-4 lg:p-8 overflow-hidden transition-all ${isCartOpen ? 'hidden lg:flex' : 'flex'}`}>
                {/* Modern Header */}
                <header className="flex justify-between items-start mb-8">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-[#004d3d] rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg">
                            {store?.name?.charAt(0) || 'G'}
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter leading-none">{store?.name || 'Loading...'}</h2>
                            <p className="text-[#004d3d] text-[10px] font-bold uppercase tracking-widest mt-1">
                                {store?.address ? store.address.split(',')[0] : 'POS Terminal'}
                            </p>
                        </div>
                        <div className="h-10 w-[1px] bg-slate-200 mx-6 hidden md:block" />
                        <div className="hidden md:block">
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-none">
                                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                            <p className="text-slate-400 text-[10px] font-medium mt-1">Ready for Orders</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button className="bg-white px-5 py-2.5 rounded-full text-xs font-bold shadow-sm border border-slate-100 flex items-center gap-2 hover:bg-slate-50 transition-all">
                            <span>Report</span>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </button>
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 relative cursor-pointer hover:bg-slate-50">
                            <svg className="w-5 h-5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        </div>
                        <div
                            onClick={logout}
                            className="hidden sm:flex items-center space-x-3 bg-white pl-1 pr-4 py-1 rounded-full shadow-sm border border-slate-100 cursor-pointer hover:bg-slate-50 transition-all"
                        >
                            <div className="w-8 h-8 bg-slate-100 rounded-full overflow-hidden flex items-center justify-center font-bold text-slate-600 uppercase text-xs">
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-xs font-black leading-none">{user.name}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{user.role}</p>
                            </div>
                        </div>

                        {/* Mobile Cart Toggle */}
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="lg:hidden relative w-12 h-12 bg-[#004d3d] rounded-2xl flex items-center justify-center text-white shadow-lg"
                        >
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            {cart.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-4 border-[#f4f5f1]">
                                    {cart.reduce((sum, i) => sum + i.quantity, 0)}
                                </span>
                            )}
                        </button>
                    </div>
                </header>

                {/* Search Bar */}
                <div className="relative mb-8 max-w-2xl mx-auto w-full">
                    <input
                        type="text"
                        placeholder="Search product name or SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white rounded-2xl px-12 py-4 h-14 shadow-sm border-none focus:ring-2 focus:ring-[#004d3d] transition-all text-sm font-medium"
                    />
                    <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400">⌘ K</span>
                    </div>
                </div>

                {/* Categories - Spread evenly */}
                <div className="flex w-full gap-4 mb-8 overflow-x-auto pb-4 lg:pb-0 custom-scrollbar">
                    <button
                        onClick={() => setActiveCategory(null)}
                        className={`flex-1 min-w-[140px] p-4 rounded-3xl transition-all relative overflow-hidden h-28 lg:h-32 border ${!activeCategory ? 'bg-[#004d3d] text-white border-transparent' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                    >
                        <div className="relative z-10 flex flex-col justify-between h-full items-start text-left">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${!activeCategory ? 'bg-emerald-800' : 'bg-slate-100 text-slate-500'}`}>All</span>
                            <div>
                                <h3 className="text-lg font-black leading-tight">All Items</h3>
                                <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 opacity-60`}>{products.length} Items</p>
                            </div>
                        </div>
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex-1 min-w-[140px] p-4 rounded-3xl transition-all relative overflow-hidden h-28 lg:h-32 border ${activeCategory === cat.id ? 'bg-[#004d3d] text-white border-transparent' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                        >
                            <div className="relative z-10 flex flex-col justify-between h-full items-start text-left">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${activeCategory === cat.id ? 'bg-emerald-800' : 'bg-slate-100 text-slate-500'}`}>Available</span>
                                <div>
                                    <h3 className="text-lg font-black leading-tight">{cat.name}</h3>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 opacity-60`}>{products.filter(p => p.category_id === cat.id).length} Items</p>
                                </div>
                            </div>
                            {/* Simple illustration representation */}
                            <div className={`absolute -right-4 -bottom-4 w-20 h-20 opacity-10 transition-transform ${activeCategory === cat.id ? 'scale-110 opacity-20' : ''}`}>
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                                </svg>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                                <div key={i} className="aspect-[4/5] rounded-[2rem] bg-white animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-8">
                            {products
                                .filter(p => !activeCategory || p.category_id === activeCategory)
                                .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.includes(searchQuery))
                                .map(product => (
                                    <button
                                        key={product.id}
                                        onClick={() => handleProductClick(product)}
                                        className="bg-white rounded-[2rem] lg:rounded-[2.5rem] p-3 lg:p-4 flex flex-col shadow-sm border border-slate-100 hover:shadow-xl hover:border-emerald-100 transition-all group relative h-full aspect-[4/5]"
                                    >
                                        <div className="flex-1 flex flex-col items-center justify-center p-2 mb-2 bg-[#f8f9f6] rounded-[1.5rem] overflow-hidden">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                            ) : (
                                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center opacity-30">
                                                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-left px-2 w-full">
                                            <h3 className="font-black text-sm text-[#121915] line-clamp-1">{product.name}</h3>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-xs font-bold text-slate-400 tracking-tight">{currencySymbol}{product.base_price}</span>
                                                <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[#121915] shadow-sm group-hover:bg-[#004d3d] group-hover:text-white group-hover:border-transparent transition-all">
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Cart Sidebar (The "Receipt") */}
            <div className={`fixed lg:relative inset-0 lg:inset-auto w-full lg:w-[420px] bg-white flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-50 p-6 lg:p-8 transition-transform duration-300 transform ${isCartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="flex justify-between items-center mb-6 lg:mb-8">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="lg:hidden p-2 -ml-2 text-slate-400"
                            >
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <div>
                                <h2 className="text-xl font-black">Purchase Receipt</h2>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">#{user.store_id?.slice(0, 5) || 'STORE'} • Active Order</p>
                            </div>
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 text-slate-400 cursor-pointer hover:bg-slate-100 transition-all active:scale-90"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                            </button>

                            {isMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setIsMenuOpen(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-20 animate-in fade-in zoom-in duration-200">
                                        <button
                                            onClick={() => {
                                                setCart([]);
                                                setIsMenuOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            Clear Cart
                                        </button>

                                        {(user.role !== 'cashier' || storeSettings?.allow_cashier_dashboard_access) && (
                                            <>
                                                <div className="h-[1px] bg-slate-100 my-1" />
                                                <button
                                                    onClick={() => router.push('/')}
                                                    className="w-full text-left px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                                >
                                                    Back to Dashboard
                                                </button>
                                            </>
                                        )}

                                        <div className="h-[1px] bg-slate-100 my-1" />
                                        <button
                                            onClick={logout}
                                            className="w-full text-left px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </header>

                    {/* Service Mode Toggle */}
                    <div className="flex bg-[#f8f9f6] p-1.5 rounded-2xl mb-8">
                        <button
                            onClick={() => setServiceMode('dine-in')}
                            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${serviceMode === 'dine-in' ? 'bg-[#004d3d] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Dine In
                        </button>
                        <button
                            onClick={() => setServiceMode('take-away')}
                            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${serviceMode === 'take-away' ? 'bg-[#004d3d] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Take Away
                        </button>
                        <button
                            onClick={() => setServiceMode('online')}
                            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${serviceMode === 'online' ? 'bg-[#004d3d] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Online
                        </button>
                    </div>

                    {/* Customer Selection */}
                    <div className="mb-8">
                        <CustomerSearch
                            tenantId={user.tenant_id}
                            onSelect={setSelectedCustomer}
                            selectedCustomer={selectedCustomer}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Order List</p>
                        <div className="space-y-6">
                            {cart.map((item, idx) => (
                                <div key={`${item.product.id}-${item.variant?.id || 'base'}-${idx}`} className="flex items-center space-x-4">
                                    <div className="w-16 h-16 bg-[#f8f9f6] rounded-2xl flex items-center justify-center overflow-hidden border border-slate-50">
                                        {item.product.image_url ? (
                                            <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <svg className="w-6 h-6 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-sm">{item.product.name}</h4>
                                        <p className="text-[#004d3d] text-xs font-bold mt-0.5">
                                            {currencySymbol}{item.variant?.price_override || item.product.base_price} <span className="text-slate-300 mx-1">×</span> {item.quantity}
                                        </p>
                                        {item.variant && <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{item.variant.name}</p>}
                                    </div>
                                    <div className="flex flex-col items-end space-y-2">
                                        <span className="font-black text-sm">{currencySymbol}{((item.variant?.price_override ? parseFloat(item.variant.price_override) : parseFloat(item.product.base_price)) * item.quantity).toFixed(2)}</span>
                                        <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100 scale-90 lg:scale-100">
                                            <button
                                                onClick={() => updateQuantity(item.product.id, item.variant?.id, -1)}
                                                className="w-10 h-10 lg:w-8 lg:h-8 flex items-center justify-center text-slate-400 hover:text-[#121915] active:bg-slate-200 rounded-lg transition-colors"
                                            >
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M5 12h14" /></svg>
                                            </button>
                                            <span className="text-sm font-black px-3">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.product.id, item.variant?.id, 1)}
                                                className="w-10 h-10 lg:w-8 lg:h-8 flex items-center justify-center text-slate-400 hover:text-[#121915] active:bg-slate-200 rounded-lg transition-colors"
                                            >
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M12 5v14M5 12h14" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {cart.length === 0 && (
                                <div className="py-20 text-center opacity-20">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                    </div>
                                    <p className="text-sm font-bold uppercase tracking-widest">Cart is empty</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer / Payment Details */}
                <div className="mt-8 pt-8 border-t border-slate-100 space-y-6">
                    {/* Voucher Section */}
                    <div className="bg-[#f8f9f6] p-4 rounded-2xl border border-slate-100">
                        {!appliedVoucher ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Voucher Code"
                                    value={voucherCode}
                                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-[#004d3d] transition-all"
                                />
                                <button
                                    onClick={async () => {
                                        setVoucherError(null);
                                        try {
                                            const res = await MarketingService.validateVoucher(voucherCode, calculateSubtotal());
                                            if (res.valid) {
                                                setAppliedVoucher({
                                                    id: res.voucher_id!,
                                                    amount: res.discount_amount!,
                                                    code: voucherCode
                                                });
                                                setVoucherCode('');
                                            } else {
                                                setVoucherError(res.message || 'Invalid');
                                            }
                                        } catch (err) {
                                            setVoucherError('Error');
                                        }
                                    }}
                                    className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#004d3d] transition-all"
                                >
                                    Apply
                                </button>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center text-emerald-600">
                                <div className="flex items-center gap-2">
                                    <Tag className="w-3 h-3" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{appliedVoucher.code} Active</span>
                                </div>
                                <button onClick={() => setAppliedVoucher(null)} className="text-emerald-800 hover:text-red-500 transition-colors">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                        {voucherError && <p className="text-[9px] text-red-500 font-bold mt-2 ml-1">! {voucherError}</p>}
                    </div>

                    <div className="space-y-3 px-2 text-sm font-black">
                        <div className="flex justify-between text-slate-400 text-xs font-bold uppercase tracking-widest">
                            <span>Subtotal</span>
                            <span className="text-[#121915]">{currencySymbol}{calculateSubtotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400 text-xs font-bold uppercase tracking-widest">
                            <span>Tax (10%)</span>
                            <span className="text-[#121915]">{currencySymbol}{calculateTax().toFixed(2)}</span>
                        </div>
                        {appliedVoucher && (
                            <div className="flex justify-between text-emerald-600 text-xs font-bold uppercase tracking-widest">
                                <span>Discount</span>
                                <span>-{currencySymbol}{appliedVoucher.amount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                            <span className="text-sm font-black uppercase tracking-tighter">Total</span>
                            <span className="text-2xl font-black">{currencySymbol}{Math.max(0, calculateSubtotal() + calculateTax() - (appliedVoucher?.amount || 0)).toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || loading}
                        className="w-full bg-[#004d3d] text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/10 hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center space-x-3"
                    >
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </div>
                        <span>Place Order</span>
                    </button>
                </div>
            </div>

            {/* Success Overlay */}
            {success && (
                <div className="fixed inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center z-[100] animate-in fade-in duration-500 p-6 text-center">
                    <div className="w-20 h-20 lg:w-24 lg:h-24 bg-[#004d3d] rounded-full flex items-center justify-center text-white mb-6 animate-in zoom-in spin-in-12 duration-700">
                        <svg className="w-10 h-10 lg:w-12 lg:h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter">Order Placed!</h2>
                    <p className="text-slate-400 text-[10px] lg:text-xs font-bold uppercase tracking-widest mt-2">{selectedCustomer ? `Points added to ${selectedCustomer.name}` : 'Thank you for your business'}</p>
                </div>
            )}

            {/* Variant Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end lg:items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-t-[3rem] lg:rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in slide-in-from-bottom-20 duration-500">
                        <div className="p-6 lg:p-10">
                            <div className="flex justify-between items-start mb-6 lg:mb-8">
                                <div>
                                    <h3 className="text-xl lg:text-2xl font-black">{selectedProduct.name}</h3>
                                    <p className="text-slate-400 text-[10px] lg:text-xs font-bold uppercase tracking-widest mt-1">Select Variant</p>
                                </div>
                                <button onClick={() => setSelectedProduct(null)} className="text-slate-300 hover:text-slate-600 transition-colors">
                                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="grid grid-cols-1 gap-3 lg:gap-4 overflow-y-auto max-h-[70vh] lg:max-h-[60vh] custom-scrollbar pb-6 lg:pb-0">
                                {selectedProduct.variants?.map(variant => (
                                    <button
                                        key={variant.id}
                                        onClick={() => addToCart(selectedProduct, variant)}
                                        className="flex justify-between items-center p-5 lg:p-6 rounded-3xl border border-slate-100 hover:border-[#004d3d] hover:bg-[#f8f9f6] transition-all group"
                                    >
                                        <div className="text-left">
                                            <span className="font-black text-md lg:text-lg">{variant.name}</span>
                                            <p className="text-[10px] lg:text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">SKU: {variant.sku}</p>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <span className="text-lg lg:text-xl font-bold text-[#004d3d]">{currencySymbol}{variant.price_override || selectedProduct.base_price}</span>
                                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#004d3d] group-hover:text-white transition-all">
                                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M12 5v14M5 12h14" /></svg>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
