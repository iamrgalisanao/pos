'use client';

import React from 'react';

interface ProductItemCardProps {
    name: string;
    sku: string;
    internalName?: string;
    type?: string;
    categoryName: string;
    categoryColor?: string;
    price: number;
    currencySymbol: string;
    status?: string;
    isActive?: boolean;
    actions: React.ReactNode;
}

export const ProductItemCard: React.FC<ProductItemCardProps> = ({
    name,
    sku,
    internalName,
    type,
    categoryName,
    categoryColor,
    price,
    currencySymbol,
    status,
    isActive,
    actions
}) => {
    const isActuallyActive = status === 'active' || isActive;

    return (
        <tr className="hover:bg-slate-50/50 transition-colors group">
            <td className="px-8 py-6">
                <div className="flex flex-col">
                    <span className="font-black text-slate-800 text-sm uppercase tracking-tight">{name}</span>
                    <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-lg">{sku}</span>
                        {internalName && (
                            <span className="text-[10px] font-bold text-indigo-400 truncate max-w-[150px] uppercase tracking-wider">{internalName}</span>
                        )}
                    </div>
                </div>
            </td>
            <td className="px-8 py-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                    {type || 'food'}
                </span>
            </td>
            <td className="px-8 py-6">
                <span
                    className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm"
                    style={{
                        backgroundColor: categoryColor ? `${categoryColor}10` : '#f8fafc',
                        color: categoryColor || '#64748b',
                        border: `1px solid ${categoryColor ? `${categoryColor}20` : '#e2e8f0'}`
                    }}
                >
                    {categoryName}
                </span>
            </td>
            <td className="px-8 py-6">
                <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-sm tracking-tighter">{currencySymbol}{price.toFixed(2)}</span>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-0.5">Base Catalog</span>
                </div>
            </td>
            <td className="px-8 py-6 text-right">
                <div className="flex items-center justify-end space-x-6">
                    <div className="flex items-center space-x-2 mr-4">
                        <div className={`w-2 h-2 rounded-full ${isActuallyActive ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-slate-300'}`}></div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isActuallyActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {status || (isActive ? 'active' : 'inactive')}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2 opacity-20 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-4">
                        {actions}
                    </div>
                </div>
            </td>
        </tr>
    );
};
