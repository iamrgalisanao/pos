'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface CatalogSearchProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export const CatalogSearch: React.FC<CatalogSearchProps> = ({ value, onChange, placeholder = "Search by name or SKU..." }) => (
    <div className="flex-1 relative">
        <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm transition-all outline-none text-slate-700 placeholder:text-slate-400 font-medium"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-5 h-5" />
        </div>
    </div>
);

interface CategoryFilterProps {
    value: string;
    onChange: (value: string) => void;
    categories: { id: string; name: string }[];
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ value, onChange, categories }) => (
    <div className="w-64 relative">
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-4 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm transition-all outline-none text-slate-700 font-medium appearance-none cursor-pointer"
        >
            <option value="all">All Categories</option>
            {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
        </div>
    </div>
);
