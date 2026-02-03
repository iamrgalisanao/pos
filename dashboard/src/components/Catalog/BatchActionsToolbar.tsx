'use client';

import { X, Trash2, Download, Edit } from 'lucide-react';

interface BatchActionsToolbarProps {
    selectedCount: number;
    onClearSelection: () => void;
    onBulkArchive: () => void;
    onBulkExport: () => void;
}

export default function BatchActionsToolbar({
    selectedCount,
    onClearSelection,
    onBulkArchive,
    onBulkExport
}: BatchActionsToolbarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-slate-900 text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center space-x-6">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center font-black text-sm">
                        {selectedCount}
                    </div>
                    <span className="font-bold">
                        {selectedCount} product{selectedCount > 1 ? 's' : ''} selected
                    </span>
                </div>

                <div className="h-6 w-px bg-slate-700" />

                <div className="flex items-center space-x-2">
                    <button
                        onClick={onBulkExport}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-sm transition-colors flex items-center space-x-2"
                        title="Export selected"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                    </button>

                    <button
                        onClick={onBulkArchive}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-xl font-bold text-sm transition-colors flex items-center space-x-2"
                        title="Archive selected"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Archive</span>
                    </button>

                    <button
                        onClick={onClearSelection}
                        className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
                        title="Clear selection"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
