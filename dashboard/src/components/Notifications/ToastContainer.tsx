'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Toast } from './Toast';

export const ToastContainer: React.FC = () => {
    const notifications = useNotificationStore((state) => state.notifications);

    return (
        <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence mode="popLayout">
                {notifications.map((notification) => (
                    <Toast key={notification.id} notification={notification} />
                ))}
            </AnimatePresence>
        </div>
    );
};
