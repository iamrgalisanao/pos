'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface KDSOrder {
    orderId: string;
    items: any[];
    total_amount: string;
    timestamp: string;
    status: 'queued' | 'prepping' | 'ready';
}

export default function KDSView({ storeId }: { storeId: string }) {
    const [orders, setOrders] = useState<KDSOrder[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';
        const newSocket = io(wsUrl);
        setSocket(newSocket);

        newSocket.emit('join_store', storeId);

        newSocket.on('order:fired', (newOrder: any) => {
            setOrders((prev) => [...prev, { ...newOrder, status: 'queued' }]);
        });

        return () => {
            newSocket.close();
        };
    }, [storeId]);

    const updateStatus = (orderId: string, nextStatus: 'queued' | 'prepping' | 'ready') => {
        setOrders((prev) =>
            prev.map((o) => o.orderId === orderId ? { ...o, status: nextStatus } : o)
        );
        // In a real app, emit updateStatus to socket/backend here
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
                <div key={order.orderId} className={`premium-card ${order.status === 'ready' ? 'border-emerald-500' : ''}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-bold text-lg">Order {order.orderId.slice(0, 8)}</h3>
                            <span className="text-xs text-muted">{new Date(order.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${order.status === 'queued' ? 'bg-slate-100 text-slate-600' :
                            order.status === 'prepping' ? 'bg-indigo-100 text-indigo-600' :
                                'bg-emerald-100 text-emerald-600'
                            }`}>
                            {order.status}
                        </span>
                    </div>

                    <div className="space-y-2 mb-6">
                        {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span>{item.quantity}x {item.product_name || 'Item'}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex space-x-2">
                        {order.status === 'queued' && (
                            <button
                                onClick={() => updateStatus(order.orderId, 'prepping')}
                                className="flex-1 bg-indigo-600 text-white text-xs py-2 rounded-lg font-bold"
                            >
                                START PREPPING
                            </button>
                        )}
                        {order.status === 'prepping' && (
                            <button
                                onClick={() => updateStatus(order.orderId, 'ready')}
                                className="flex-1 bg-emerald-600 text-white text-xs py-2 rounded-lg font-bold"
                            >
                                MARK READY
                            </button>
                        )}
                        {order.status === 'ready' && (
                            <button
                                onClick={() => setOrders(prev => prev.filter(o => o.orderId !== order.orderId))}
                                className="flex-1 bg-slate-900 text-white text-xs py-2 rounded-lg font-bold"
                            >
                                DISPOSE
                            </button>
                        )}
                    </div>
                </div>
            ))}
            {orders.length === 0 && (
                <div className="col-span-full py-20 text-center opacity-50">
                    <p className="text-xl font-medium">No active orders in the kitchen.</p>
                    <p className="text-sm">Orders will appear here in real-time.</p>
                </div>
            )}
        </div>
    );
}
