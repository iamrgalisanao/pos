'use client';

import { ChevronUp, ChevronDown } from 'lucide-react';

interface SortableColumnHeaderProps<T = any> {
    label: string;
    sortKey: T;
    currentSortKey: T | null;
    currentSortDirection: 'asc' | 'desc';
    onSort: (key: T) => void;
}

export default function SortableColumnHeader<T = any>({
    label,
    sortKey,
    currentSortKey,
    currentSortDirection,
    onSort
}: SortableColumnHeaderProps<T>) {
    const isActive = currentSortKey === sortKey;

    return (
        <button
            onClick={() => onSort(sortKey)}
            className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors group"
        >
            <span className={isActive ? 'text-indigo-600' : ''}>{label}</span>
            <div className="flex flex-col">
                <ChevronUp
                    className={`w-3 h-3 -mb-1 transition-colors ${isActive && currentSortDirection === 'asc'
                        ? 'text-indigo-600'
                        : 'text-slate-300 group-hover:text-slate-400'
                        }`}
                />
                <ChevronDown
                    className={`w-3 h-3 transition-colors ${isActive && currentSortDirection === 'desc'
                        ? 'text-indigo-600'
                        : 'text-slate-300 group-hover:text-slate-400'
                        }`}
                />
            </div>
        </button>
    );
}
