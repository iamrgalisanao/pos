'use client';

interface StatusBadgeProps {
    isActive: boolean;
    lifecycleStatus?: string;
}

export default function StatusBadge({ isActive, lifecycleStatus }: StatusBadgeProps) {
    if (!isActive) {
        return (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 font-bold text-xs">
                <div className="w-2 h-2 rounded-full bg-slate-400" />
                <span>Inactive</span>
            </span>
        );
    }

    return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active</span>
        </span>
    );
}
