'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

import { io, Socket } from 'socket.io-client';
import api from '@/lib/api';

interface OrderItem {
    product_id: string;
    product_name?: string;
    quantity: number;
}

interface KDSOrder {
    orderId: string;
    items: OrderItem[];
    timestamp: string;
    total_amount: number;
    status: 'received' | 'preparing' | 'ready' | 'completed';
}

export default function KDSPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [orders, setOrders] = useState<KDSOrder[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [selectedStation, setSelectedStation] = useState<string>('All');
    const router = useRouter();

    const stations = ['All', 'Kitchen', 'Bar'];

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user) return;

        const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const newSocket = io(socketUrl);

        newSocket.on('connect', () => {
            console.log('KDS Connected to socket');
            if (selectedStation === 'All') {
                newSocket.emit('join_store', user.store_id);
            } else {
                newSocket.emit('join_station', { storeId: user.store_id, station: selectedStation });
            }
        });

        newSocket.on('order:fired', (payload: any) => {
            if (payload.type === 'status_update') {
                setOrders(prev => {
                    if (payload.status === 'completed' || payload.status === 'cancelled') {
                        return prev.filter(o => o.orderId !== payload.orderId);
                    }
                    return prev.map(o => o.orderId === payload.orderId ? { ...o, status: payload.status } : o);
                });
            } else {
                // New order - check if we already have it to avoid duplicates from multiple channels
                setOrders(prev => {
                    const exists = prev.find(o => o.orderId === payload.orderId);
                    if (exists) return prev;
                    return [{ ...payload, status: 'received' }, ...prev];
                });
            }
        });

        setSocket(newSocket);
        setOrders([]); // Clear orders when swapping stations

        return () => {
            newSocket.disconnect();
        };
    }, [user, selectedStation]);

    const updateStatus = async (orderId: string, nextStatus: string) => {
        try {
            await api.put(`/orders/${orderId}/status`, {
                status: nextStatus,
                tenant_id: user?.tenant_id
            });
            // Local state will update via socket if everything is working, 
            // but we can also update it manually for faster feedback if desired.
        } catch (err) {
            console.error('Failed to update status:', err);
            alert('Status update failed');
        }
    };

    if (authLoading) return (
        <div className="h-full flex items-center justify-center bg-slate-900">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!user) return null;

    return (
        <div className="min-h-full bg-slate-900 -m-6 md:-m-10 p-6 md:p-10 transition-colors">
            <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end space-y-6 md:space-y-0 text-white">
                <div>
                    <h1 className="text-4xl font-black font-display tracking-tight mb-2">Kitchen Display</h1>
                    <p className="text-slate-500 font-medium">Live routing for {user.store_id?.slice(0, 8)}</p>
                </div>

                <div className="flex flex-col items-end space-y-4">
                    <div className="flex bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
                        {stations.map(station => (
                            <button
                                key={station}
                                onClick={() => setSelectedStation(station)}
                                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedStation === station
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                {station}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center space-x-3 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active Connection</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {orders.length === 0 ? (
                    <div className="col-span-full h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-[40px] text-slate-700">
                        <span className="text-7xl mb-6 grayscale opacity-20">🔥</span>
                        <p className="font-bold text-xl uppercase tracking-widest opacity-30">Kitchen is Clear</p>
                    </div>
                ) : (
                    orders.map((order) => {
                        const isReceived = order.status === 'received';
                        const isPreparing = order.status === 'preparing';
                        const isReady = order.status === 'ready';

                        return (
                            <div key={order.orderId} className={`bg-white rounded-[32px] shadow-2xl flex flex-col overflow-hidden transition-all duration-500 ${isReady ? 'ring-8 ring-emerald-500/20' : ''
                                }`}>
                                <div className={`p-5 flex justify-between items-center ${isReceived ? 'bg-indigo-600' : isPreparing ? 'bg-amber-500' : 'bg-emerald-600'
                                    } text-white`}>
                                    <div className="flex flex-col">
                                        <span className="font-black text-xl">#{order.orderId?.slice(-4).toUpperCase() || 'ORD'}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                                            {order.status}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold opacity-80 block">{new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[200px]">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-start">
                                            <div className="flex space-x-4">
                                                <span className={`font-black w-8 h-8 rounded-xl flex items-center justify-center text-sm ${isReceived ? 'bg-indigo-50 text-indigo-600' :
                                                    isPreparing ? 'bg-amber-50 text-amber-600' :
                                                        'bg-emerald-50 text-emerald-600'
                                                    }`}>
                                                    {item.quantity}
                                                </span>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 text-lg leading-tight">
                                                        {item.product_name || `Item ${item.product_id?.slice(0, 5) || 'N/A'}`}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">SKU: {item.product_id?.slice(0, 8) || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-6 bg-slate-50 border-t border-slate-100 italic text-[10px] text-slate-400 font-medium">
                                    Amount Total: ${order.total_amount}
                                </div>

                                <div className="p-4 bg-white border-t border-slate-100">
                                    {isReceived && (
                                        <button
                                            onClick={() => updateStatus(order.orderId, 'preparing')}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-sm transition-all transform active:scale-95 shadow-lg shadow-indigo-100 uppercase tracking-widest"
                                        >
                                            Start Cooking
                                        </button>
                                    )}
                                    {isPreparing && (
                                        <button
                                            onClick={() => updateStatus(order.orderId, 'ready')}
                                            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-2xl font-black text-sm transition-all transform active:scale-95 shadow-lg shadow-amber-100 uppercase tracking-widest"
                                        >
                                            Ready for Pickup
                                        </button>
                                    )}
                                    {isReady && (
                                        <button
                                            onClick={() => updateStatus(order.orderId, 'completed')}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-sm transition-all transform active:scale-95 shadow-lg shadow-emerald-200 uppercase tracking-widest"
                                        >
                                            Complete Order
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>

    );
}
