'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    loyalty_tier: string;
    points_balance: number;
}

interface CustomerSearchProps {
    onSelect: (customer: Customer | null) => void;
    tenantId: string;
    selectedCustomer: Customer | null;
}

export default function CustomerSearch({ onSelect, tenantId, selectedCustomer }: CustomerSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await api.get(`/customers`, {
                    headers: { 'X-Tenant-ID': tenantId }
                });
                // Simple client-side filter for demo, in real-world we'd use a search endpoint
                const filtered = res.data.filter((c: Customer) =>
                    c.name.toLowerCase().includes(query.toLowerCase()) ||
                    c.phone.includes(query) ||
                    (c.email && c.email.toLowerCase().includes(query.toLowerCase()))
                );
                setResults(filtered.slice(0, 5));
            } catch (err) {
                console.error('Search failed', err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query, tenantId]);

    return (
        <div className="relative">
            {selectedCustomer ? (
                <div className="flex items-center justify-between p-4 bg-[#f8f9f6] border border-slate-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-[#004d3d] flex items-center justify-center text-white font-black text-xs uppercase">
                            {selectedCustomer.name[0]}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-[#121915] tracking-tight">{selectedCustomer.name}</span>
                            <div className="flex items-center space-x-2">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${selectedCustomer.loyalty_tier === 'gold' ? 'text-amber-600' :
                                    selectedCustomer.loyalty_tier === 'silver' ? 'text-slate-500' :
                                        'text-emerald-600'
                                    }`}>
                                    {selectedCustomer.loyalty_tier}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-[10px] font-bold text-slate-500">{Number(selectedCustomer.points_balance).toLocaleString()} pts</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            onSelect(null);
                            setQuery('');
                        }}
                        className="p-1 hover:bg-white rounded-lg text-slate-400 hover:text-red-500 transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Search Customer (Name/Phone)..."
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setIsOpen(true);
                            }}
                            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#f8f9f6] border border-slate-100 focus:ring-2 focus:ring-[#004d3d] focus:bg-white transition-all outline-none font-bold text-sm text-[#121915] placeholder:text-slate-400 placeholder:font-medium"
                        />
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#004d3d] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    </div>

                    {isOpen && query.length >= 2 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-1">
                            {loading ? (
                                <div className="p-4 text-center text-slate-400 text-xs font-bold animate-pulse">Searching...</div>
                            ) : results.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {results.map(cust => (
                                        <button
                                            key={cust.id}
                                            onClick={() => {
                                                onSelect(cust);
                                                setIsOpen(false);
                                            }}
                                            className="w-full flex items-center justify-between p-4 hover:bg-[#f8f9f6] transition-colors text-left group"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#004d3d] group-hover:text-white transition-all font-black text-[10px]">
                                                    {cust.name[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-[#121915]">{cust.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium">{cust.phone || cust.email || 'No contact'}</span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-[#004d3d] opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 text-center text-slate-400 text-xs font-bold italic">No customers found.</div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
