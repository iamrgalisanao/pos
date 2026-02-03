'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit, Package, Copy, Trash2 } from 'lucide-react';

interface ProductActionsMenuProps {
    onEdit: () => void;
    onReceiveStock: () => void;
    onDuplicate: () => void;
    onArchive: () => void;
}

export default function ProductActionsMenu({
    onEdit,
    onReceiveStock,
    onDuplicate,
    onArchive
}: ProductActionsMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                title="More actions"
            >
                <MoreHorizontal className="w-5 h-5 text-slate-400" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-10 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                        onClick={() => {
                            onEdit();
                            setIsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center space-x-3 text-slate-700 font-medium transition-colors"
                    >
                        <Edit className="w-4 h-4 text-slate-400" />
                        <span>Edit Product</span>
                    </button>
                    <button
                        onClick={() => {
                            onReceiveStock();
                            setIsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 flex items-center space-x-3 text-slate-700 font-medium transition-colors group"
                    >
                        <Package className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                        <span className="group-hover:text-emerald-700">Receive Stock</span>
                    </button>
                    <button
                        onClick={() => {
                            onDuplicate();
                            setIsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center space-x-3 text-slate-700 font-medium transition-colors"
                    >
                        <Copy className="w-4 h-4 text-slate-400" />
                        <span>Duplicate</span>
                    </button>
                    <div className="border-t border-slate-100 my-1" />
                    <button
                        onClick={() => {
                            onArchive();
                            setIsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-rose-50 text-rose-600 flex items-center space-x-3 font-medium transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Archive</span>
                    </button>
                </div>
            )}
        </div>
    );
}
