'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    CheckCircle,
    AlertCircle,
    Info,
    AlertTriangle,
    X
} from 'lucide-react';
import { Notification, NotificationType, useNotificationStore } from '@/store/useNotificationStore';

const icons: Record<NotificationType, React.ReactNode> = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-indigo-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
};

const styles: Record<NotificationType, string> = {
    success: 'bg-emerald-50/80 border-emerald-100 shadow-emerald-100/50',
    error: 'bg-rose-50/80 border-rose-100 shadow-rose-100/50',
    info: 'bg-indigo-50/80 border-indigo-100 shadow-indigo-100/50',
    warning: 'bg-amber-50/80 border-amber-100 shadow-amber-100/50',
};

export const Toast: React.FC<{ notification: Notification }> = ({ notification }) => {
    const removeNotification = useNotificationStore((state) => state.removeNotification);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={`
                flex items-center gap-4 p-4 pr-3 rounded-2xl border backdrop-blur-md shadow-xl
                pointer-events-auto min-w-[320px] max-w-md
                ${styles[notification.type]}
            `}
        >
            <div className="flex-shrink-0">
                {icons[notification.type]}
            </div>

            <p className="flex-1 text-sm font-bold text-slate-700 leading-tight">
                {notification.message}
            </p>

            <button
                onClick={() => removeNotification(notification.id)}
                className="p-1 hover:bg-white/50 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
};
