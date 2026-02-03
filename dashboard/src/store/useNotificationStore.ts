import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    duration?: number;
}

interface NotificationState {
    notifications: Notification[];
    addNotification: (type: NotificationType, message: string, duration?: number) => void;
    removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    addNotification: (type, message, duration = 5000) => {
        const id = uuidv4();
        const notification: Notification = { id, type, message, duration };

        set((state) => ({
            notifications: [...state.notifications, notification],
        }));

        if (duration !== Infinity) {
            setTimeout(() => {
                set((state) => ({
                    notifications: state.notifications.filter((n) => n.id !== id),
                }));
            }, duration);
        }
    },
    removeNotification: (id) =>
        set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
        })),
}));
