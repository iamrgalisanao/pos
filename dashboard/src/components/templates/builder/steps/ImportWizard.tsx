'use client';

import React, { useState, useRef } from 'react';
import { useTemplateBuilderStore, MenuItem, Category } from '@/store/useTemplateBuilderStore';
import {
    Upload,
    Table,
    CheckCircle2,
    AlertTriangle,
    ArrowRight,
    X,
    FileText,
    Download
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import api from '@/lib/api';

interface ImportWizardProps {
    onBack: () => void;
}

export default function ImportWizard({ onBack }: ImportWizardProps) {
    const { addItemsBulk } = useTemplateBuilderStore();
    const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [csvData, setCsvData] = useState<any[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({
        name: '',
        price: '',
        category: '',
        description: '',
        sku: ''
    });
    const [importReport, setImportReport] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFile(file);
            parseCSV(file);
        }
    };

    const parseCSV = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            const rows = lines.slice(1).filter(l => l.trim() !== '').map(line => {
                const values = line.split(',');
                const obj: any = {};
                headers.forEach((h, i) => {
                    obj[h] = values[i]?.trim();
                });
                return obj;
            });
            setCsvData(rows);

            // Auto-mapping logic
            const newMapping = { ...mapping };
            headers.forEach(h => {
                const lower = h.toLowerCase();
                if (lower.includes('name')) newMapping.name = h;
                if (lower.includes('price')) newMapping.price = h;
                if (lower.includes('cat')) newMapping.category = h;
                if (lower.includes('desc')) newMapping.description = h;
                if (lower.includes('sku')) newMapping.sku = h;
            });
            setMapping(newMapping);
            setStep('mapping');
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        const items: MenuItem[] = [];
        const categories: Record<string, Category> = {};

        csvData.forEach(row => {
            const catName = row[mapping.category] || 'General';
            if (!categories[catName]) {
                categories[catName] = { id: uuidv4(), name: catName };
            }

            items.push({
                id: uuidv4(),
                name: row[mapping.name] || 'Unnamed Item',
                description: row[mapping.description] || '',
                price: parseFloat(row[mapping.price]) || 0,
                sku: row[mapping.sku] || '',
                categoryId: categories[catName].id,
                modifierGroupIds: []
            });
        });

        // Validate via backend
        try {
            const response = await api.post('/platform/templates/import/validate', { items });
            setImportReport(response.data);
            setStep('preview');
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const confirmImport = () => {
        const validItems = importReport.report.filter((r: any) => r.isValid).map((r: any) => r.data);
        const uniqueCategories: Category[] = [];
        const seenCats = new Set();

        validItems.forEach((item: any) => {
            // Re-map to find categories from the current draft state if needed
            // For now we just add the categories created during mapping
        });

        // Simplified for now: just add all valid items
        addItemsBulk(validItems);
        onBack();
    };

    const downloadTemplate = () => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        window.open(`${baseUrl}/api/platform/templates/export/template-csv`, '_blank');
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 h-full flex flex-col">
            <header className="flex items-center justify-between mb-12 shrink-0">
                <div className="flex items-center space-x-6">
                    <button
                        onClick={onBack}
                        className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-800 hover:border-slate-300 transition-all shadow-sm"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Import Wizard</h2>
                        <p className="text-slate-500 font-medium">Bulk ingest your menu from CSV or Excel.</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <button
                        onClick={downloadTemplate}
                        className="flex items-center space-x-2 px-4 py-2 text-slate-400 hover:text-indigo-600 font-black text-[10px] uppercase tracking-widest transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        <span>Download CSV Template</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 bg-slate-50 rounded-[40px] border border-slate-100 overflow-hidden flex flex-col">
                {step === 'upload' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full max-w-xl aspect-video border-4 border-dashed border-slate-200 rounded-[48px] flex flex-col items-center justify-center hover:border-indigo-600 hover:bg-white transition-all cursor-pointer group mb-8"
                        >
                            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-indigo-50 group-hover:scale-110 transition-all">
                                <Upload className="w-10 h-10 text-slate-400 group-hover:text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Drop your CSV here</h3>
                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">or click to browse files</p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                                accept=".csv"
                            />
                        </div>
                        <div className="flex items-center space-x-8 text-slate-400">
                            <div className="flex items-center space-x-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest">UTF-8 Encoded</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Max 10MB</span>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'mapping' && (
                    <div className="flex-1 flex flex-col p-12 overflow-hidden">
                        <div className="grid grid-cols-2 gap-16 h-full">
                            <div className="space-y-8 overflow-y-auto pr-4">
                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Map Columns</h4>
                                {Object.keys(mapping).map(key => (
                                    <div key={key} className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                            <span>{key} Column</span>
                                            {mapping[key] && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                                        </label>
                                        <select
                                            value={mapping[key]}
                                            onChange={(e) => setMapping(prev => ({ ...prev, [key]: e.target.value }))}
                                            className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 font-bold text-slate-800 focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer appearance-none"
                                        >
                                            <option value="">Select Column...</option>
                                            {Object.keys(csvData[0] || {}).map(h => (
                                                <option key={h} value={h}>{h}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white rounded-[32px] border border-slate-200 flex flex-col overflow-hidden shadow-sm">
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <div className="flex items-center space-x-3">
                                        <Table className="w-4 h-4 text-indigo-600" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Preview (First 5 rows)</span>
                                    </div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{csvData.length} Total Rows</div>
                                </div>
                                <div className="flex-1 overflow-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 bg-white">
                                            <tr>
                                                {Object.keys(csvData[0] || {}).map(h => (
                                                    <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {csvData.slice(0, 5).map((row, i) => (
                                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                    {Object.values(row).map((val: any, j) => (
                                                        <td key={j} className="px-6 py-4 text-xs font-bold text-slate-600 border-b border-slate-50/50">{val}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-200 flex justify-end shrink-0">
                            <button
                                onClick={handleImport}
                                className="flex items-center space-x-3 px-10 py-4 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all"
                            >
                                <span>Verify Data</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 'preview' && importReport && (
                    <div className="flex-1 flex flex-col p-12 overflow-hidden">
                        <div className="grid grid-cols-3 gap-8 mb-12 shrink-0">
                            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Items</div>
                                <div className="text-3xl font-black text-slate-800 tracking-tight">{importReport.total}</div>
                            </div>
                            <div className="bg-emerald-50 p-8 rounded-[32px] border border-emerald-100">
                                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Valid Records</div>
                                <div className="text-3xl font-black text-emerald-700 tracking-tight">{importReport.validCount}</div>
                            </div>
                            <div className="bg-rose-50 p-8 rounded-[32px] border border-rose-100">
                                <div className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Invalid Records</div>
                                <div className="text-3xl font-black text-rose-700 tracking-tight">{importReport.invalidCount}</div>
                            </div>
                        </div>

                        <div className="flex-1 bg-white rounded-[32px] border border-slate-200 overflow-hidden flex flex-col shadow-sm">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <FileText className="w-4 h-4 text-indigo-600" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Validation Report</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-white">
                                        <tr>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Status</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Item Name</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Price</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Issues</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {importReport.report.map((row: any, i: number) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-8 py-4 border-b border-slate-50/50">
                                                    {row.isValid ? (
                                                        <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
                                                            <AlertTriangle className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-8 py-4 text-sm font-black text-slate-800 border-b border-slate-50/50 uppercase tracking-tight">{row.data.name}</td>
                                                <td className="px-8 py-4 text-sm font-bold text-slate-600 border-b border-slate-50/50">${parseFloat(row.data.price).toFixed(2)}</td>
                                                <td className="px-8 py-4 text-[10px] font-black text-rose-500 uppercase tracking-widest border-b border-slate-50/50">
                                                    {row.errors.join(', ')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-200 flex justify-between items-center shrink-0">
                            <button
                                onClick={() => setStep('mapping')}
                                className="px-8 py-4 text-slate-400 font-black uppercase text-[11px] tracking-widest hover:text-slate-800 transition-colors"
                            >
                                Back to Mapping
                            </button>
                            <button
                                onClick={confirmImport}
                                disabled={importReport.validCount === 0}
                                className="flex items-center space-x-3 px-12 py-4 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-30"
                            >
                                <span>Complete Import</span>
                                <CheckCircle2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
