'use client';

import { useState, useEffect } from 'react';

export default function ConnectivityStatus() {
    const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) {
        return (
            <div className="glass-morphism px-4 py-2 rounded-xl flex items-center space-x-2 border border-emerald-100">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Online</span>
            </div>
        );
    }

    return (
        <div className="glass-morphism px-4 py-2 rounded-xl flex items-center space-x-2 border border-rose-100 bg-rose-50/50">
            <div className="w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Offline Mode</span>
        </div>
    );
}
