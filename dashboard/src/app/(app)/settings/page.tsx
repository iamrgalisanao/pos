'use client';

import React, { useState, useEffect } from 'react';
import { SettingsService } from '@/lib/settingsService';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
    Settings,
    Store,
    ShieldCheck,
    FileText,
    Download,
    AlertTriangle,
    Clock,
    Lock,
    HelpCircle,
    Sparkles,
    Info,
    X,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';

export default function SettingsPage() {
    const { user, store, currencySymbol, refreshStoreInfo } = useAuth();
    const { addNotification } = useNotificationStore();
    const [activeTab, setActiveTab] = useState('general');
    const [zReports, setZReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [storeId, setStoreId] = useState<string | null>(null);

    // Guide State
    const [showGuide, setShowGuide] = useState(false);
    const [activeGuideStep, setActiveGuideStep] = useState(0);

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        tin: '',
        tax_type: 'VAT',
        timezone: 'UTC',
        currency_code: 'PHP'
    });

    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // Reset Store Modal State
    const [showResetModal, setShowResetModal] = useState(false);
    const [confirmStoreName, setConfirmStoreName] = useState('');
    const [isResetting, setIsResetting] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const stores = await SettingsService.getStores();
            if (stores.length > 0) {
                const s = stores[0];
                setStoreId(s.id);
                setFormData({
                    name: s.name || '',
                    address: s.address || '',
                    tin: s.tin || '',
                    tax_type: s.tax_type || 'VAT',
                    timezone: s.timezone || 'UTC',
                    currency_code: s.currency_code || 'PHP'
                });

                const reports = await SettingsService.getZReports(s.id);
                setZReports(reports);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStore = async (e: React.FormEvent) => {
        e.preventDefault();
        const effectiveStoreId = store?.id || storeId;
        if (!effectiveStoreId) {
            addNotification('error', 'Store context missing. Please refresh and try again.');
            return;
        }

        setSaving(true);
        try {
            await SettingsService.updateStore(effectiveStoreId, {
                ...formData,
                reason: 'Managerial update via Dashboard'
            });
            await refreshStoreInfo();
            addNotification('success', 'Store settings updated and synchronized across terminals.');
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message || 'Failed to update store';
            if (errorMsg.includes('BIR_COMPLIANCE_ERROR')) {
                addNotification('warning', 'Compliance Lock: Cannot change currency or timezone once transactions exist.');
            } else {
                addNotification('error', errorMsg);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleZReading = async () => {
        const effectiveStoreId = store?.id || storeId;
        if (!effectiveStoreId || !user) {
            addNotification('error', 'Operation context missing. please refresh.');
            return;
        }

        if (!confirm('Proceed with Z-Reading? This will generate a daily sales aggregate for BIR compliance.')) return;

        try {
            await SettingsService.generateZReport(effectiveStoreId, user.id);
            addNotification('success', 'Z-Report generated successfully!');
            fetchInitialData();
        } catch (error: any) {
            addNotification('error', error.response?.data?.error || 'Failed to generate Z-Report');
        }
    };

    const handleResetStore = async () => {
        const effectiveStoreId = store?.id || storeId;
        if (!effectiveStoreId || confirmStoreName.toUpperCase() !== 'RESET') return;

        setIsResetting(true);
        try {
            await SettingsService.resetStoreTransactions(effectiveStoreId);
            addNotification('success', 'Store transactions have been cleared.');
            setShowResetModal(false);
            setConfirmStoreName('');
            fetchInitialData();
        } catch (error: any) {
            addNotification('error', error.response?.data?.error || 'Failed to reset store');
        } finally {
            setIsResetting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <>
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                            <Settings className="w-8 h-8 text-indigo-600" />
                            Store Settings
                        </h1>
                        <p className="text-slate-500 mt-1">Manage store profile, tax compliance, and report generation.</p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setShowGuide(true);
                            setActiveGuideStep(0);
                        }}
                        className="flex items-center space-x-2 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-bold text-sm hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm"
                    >
                        <HelpCircle className="w-5 h-5" />
                        <span>How it Works</span>
                    </button>
                </div>

                {/* Tabs Navigation */}
                <div className="flex items-center space-x-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`px-6 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'general' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Store className="w-4 h-4" />
                        General
                    </button>
                    <button
                        onClick={() => setActiveTab('compliance')}
                        className={`px-6 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'compliance' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <ShieldCheck className="w-4 h-4" />
                        Compliance & Reports
                    </button>
                    {user?.role === 'owner' && (
                        <button
                            onClick={() => setActiveTab('maintenance')}
                            className={`px-6 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'maintenance' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <AlertTriangle className="w-4 h-4" />
                            Maintenance
                        </button>
                    )}
                </div>

                {/* Tab Content */}
                <div className="glass-morphism p-8 min-h-[500px]">

                    {activeTab === 'general' && (
                        <form onSubmit={handleUpdateStore} className="space-y-6 max-w-2xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
                                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                                        <Store className="w-4 h-4 text-indigo-600" />
                                        Business Profile
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Business Name</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="form-input w-full"
                                                placeholder="Enter registered name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Business Address</label>
                                            <textarea
                                                rows={3}
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                className="form-input w-full"
                                                placeholder="Enter full registered address"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 shadow-inner space-y-4">
                                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                                        <Clock className="w-4 h-4 text-amber-600" />
                                        Localization
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Currency</label>
                                            <select
                                                value={formData.currency_code}
                                                onChange={(e) => setFormData({ ...formData, currency_code: e.target.value })}
                                                className="form-input w-full"
                                            >
                                                <option value="PHP">PHP (₱) - Philippine Peso</option>
                                                <option value="USD">USD ($) - US Dollar</option>
                                                <option value="EUR">EUR (€) - Euro</option>
                                                <option value="GBP">GBP (£) - British Pound</option>
                                                <option value="JPY">JPY (¥) - Japanese Yen</option>
                                                <option value="AUD">AUD (A$) - Australian Dollar</option>
                                                <option value="CAD">CAD (C$) - Canadian Dollar</option>
                                                <option value="SGD">SGD (S$) - Singapore Dollar</option>
                                                <option value="AED">AED (DH) - UAE Dirham</option>
                                                <option value="SAR">SAR (SR) - Saudi Riyal</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Timezone</label>
                                            <select
                                                value={formData.timezone}
                                                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                                                className="form-input w-full"
                                            >
                                                <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
                                                <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                                                <option value="Europe/London">Europe/London (GMT+0/1)</option>
                                                <option value="America/New_York">America/New_York (GMT-5/4)</option>
                                                <option value="UTC">UTC (Universal Time)</option>
                                            </select>
                                            <p className="flex items-center gap-2 text-[10px] text-amber-600 font-bold italic mt-2 bg-amber-50 p-2 rounded-lg">
                                                <AlertTriangle className="w-3 h-3" />
                                                Locked after first transaction.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex items-center gap-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn-primary px-8 flex items-center gap-2"
                                >
                                    {saving ? 'Saving...' : 'Save Settings'}
                                </button>
                                {saving && (
                                    <span className="text-xs text-indigo-500 font-bold animate-pulse">Syncing...</span>
                                )}
                            </div>
                        </form>
                    )}

                    {activeTab === 'compliance' && (
                        <div className="space-y-12 max-w-4xl">
                            {/* Card: BIR Compliance Details */}
                            <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                        <ShieldCheck className="w-6 h-6 text-indigo-600" />
                                        BIR Compliance Details
                                    </h3>
                                    <div className="px-3 py-1 bg-amber-50 rounded-lg text-amber-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                        <AlertTriangle className="w-3 h-3" />
                                        Form 2303 (COR)
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                            Tax Identification Number (TIN)
                                            <button type="button" title="Your 12-digit registered TIN" className="text-slate-300 hover:text-indigo-600">
                                                <Info className="w-3.5 h-3.5" />
                                            </button>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.tin}
                                            onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                                            className="form-input w-full font-mono tracking-wider"
                                            placeholder="000-000-000-000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Tax Type</label>
                                        <select
                                            value={formData.tax_type}
                                            onChange={(e) => setFormData({ ...formData, tax_type: e.target.value })}
                                            className="form-input w-full"
                                        >
                                            <option value="VAT">VAT-Registered</option>
                                            <option value="NON-VAT">Non-VAT (Percentage Tax)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-50">
                                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-slate-400" />
                                        Audit Controls
                                    </h4>
                                    <label className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group">
                                        <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">Require Manager Override for Voids</p>
                                            <p className="text-[11px] text-slate-500">All cancelled orders must be approved by a Manager/Owner account.</p>
                                        </div>
                                    </label>
                                </div>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handleUpdateStore}
                                        disabled={saving}
                                        className="btn-primary"
                                    >
                                        {saving ? 'Saving...' : 'Save Compliance Config'}
                                    </button>
                                    {saving && (
                                        <span className="text-xs text-indigo-500 font-bold animate-pulse">Syncing...</span>
                                    )}
                                </div>
                            </div>

                            {/* Card: BIR Reports & Operations */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-xl space-y-4">
                                    <h3 className="text-xl font-bold flex items-center gap-3">
                                        <Clock className="w-6 h-6 text-indigo-400" />
                                        Daily Z-Reading
                                    </h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        Finalize sales count for today. Generates an immutable aggregate for BIR auditing.
                                        <span className="text-indigo-300 font-bold ml-1 cursor-help" title="Z-Reading aggregates all transactions since the last report.">What&apos;s this?</span>
                                    </p>
                                    <button
                                        onClick={handleZReading}
                                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg text-sm uppercase tracking-widest"
                                    >
                                        Generate Z-Report
                                    </button>
                                </div>

                                <div className="p-8 rounded-[2.5rem] bg-white border border-slate-200 shadow-sm space-y-6">
                                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                        <Download className="w-6 h-6 text-emerald-600" />
                                        Sales Export
                                    </h3>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    const now = new Date();
                                                    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                                                    const end = now.toISOString().split('T')[0];
                                                    setDateRange({ start, end });
                                                }}
                                                className="flex-1 py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-100 transition-all"
                                            >
                                                This Month
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const now = new Date();
                                                    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                                    const end = now.toISOString().split('T')[0];
                                                    setDateRange({ start, end });
                                                }}
                                                className="flex-1 py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-100 transition-all"
                                            >
                                                Last 30 Days
                                            </button>
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="date"
                                                value={dateRange.start}
                                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                                className="form-input flex-1 py-2 text-xs"
                                            />
                                            <input
                                                type="date"
                                                value={dateRange.end}
                                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                                className="form-input flex-1 py-2 text-xs"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => store && SettingsService.exportBIRSalesCSV(store.id, dateRange.start, dateRange.end)}
                                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all shadow-lg text-sm uppercase tracking-widest"
                                    >
                                        Download CSV
                                    </button>
                                </div>
                            </div>

                            {/* Recent Z-Reports List */}
                            <div className="space-y-4">
                                <h4 className="text-lg font-bold text-slate-900 px-2 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-slate-400" />
                                    Recent Audit Reports
                                </h4>
                                <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50">
                                            <tr className="border-b border-slate-200">
                                                <th className="py-5 px-8 text-slate-500 font-bold uppercase text-[10px] tracking-widest">Date Generated</th>
                                                <th className="py-5 px-8 text-slate-500 font-bold uppercase text-[10px] tracking-widest">OR Range</th>
                                                <th className="py-5 px-8 text-slate-500 font-bold uppercase text-[10px] tracking-widest text-right">Gross Sales</th>
                                                <th className="py-5 px-8 text-slate-500 font-bold uppercase text-[10px] tracking-widest text-right">VAT Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {zReports.length > 0 ? zReports.map((report: any, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="py-5 px-8 font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                                                        {new Date(report.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="py-5 px-8 text-slate-400 text-xs font-mono">
                                                        {report.beginning_or} - {report.ending_or}
                                                    </td>
                                                    <td className="py-5 px-8 text-right font-black text-slate-900">
                                                        {currencySymbol}{Number(report.gross_sales).toLocaleString()}
                                                    </td>
                                                    <td className="py-5 px-8 text-right text-indigo-600 font-bold">
                                                        {currencySymbol}{Number(report.vat_amount).toLocaleString()}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={4} className="py-20 text-center space-y-4">
                                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-200">
                                                            <FileText className="w-8 h-8" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-slate-900 font-bold">No Z-Reports generated yet</p>
                                                            <p className="text-slate-400 text-xs max-w-xs mx-auto">Click "Generate Z-Report" above at the end of your business day to start your audit history.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'maintenance' && (
                        <div className="space-y-8 max-w-2xl">
                            <div className="p-6 rounded-3xl bg-red-50 border border-red-100 space-y-4">
                                <div className="flex items-center gap-3 text-red-600">
                                    <AlertTriangle className="w-6 h-6" />
                                    <h3 className="text-lg font-bold">Danger Zone</h3>
                                </div>
                                <p className="text-red-800 text-sm leading-relaxed">
                                    The following actions are destructive and cannot be undone. Use them with extreme caution, typically only for resetting test data before final BIR commissioning.
                                </p>

                                <div className="pt-4 border-t border-red-100 flex items-center justify-between gap-8">
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm">Reset Store Transactions</h4>
                                        <p className="text-slate-500 text-[12px] mt-1 leading-relaxed">
                                            Permanently delete all orders, items, payments, and Z-reports. This will also reset your Official Receipt (OR) sequence to zero.
                                            <span className="block mt-2 text-red-600 font-bold uppercase text-[10px] tracking-wider">Permitted for non-commissioned units only.</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowResetModal(true)}
                                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shrink-0"
                                    >
                                        Reset Store
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div >

            {/* Reset Confirmation Modal */}
            {
                showResetModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
                            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>

                            <div className="text-center space-y-2">
                                <h3 className="text-2xl font-bold text-slate-900">Are you absolutely sure?</h3>
                                <p className="text-slate-500 text-sm">
                                    This will permanently delete all transaction data for <span className="font-bold text-slate-900 italic">&quot;{store?.name || formData.name}&quot;</span>.
                                    This action is recorded in the audit logs and cannot be undone.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block text-center">
                                    Type <span className="text-red-600">&quot;RESET&quot;</span> to authorize
                                </label>
                                <input
                                    type="text"
                                    value={confirmStoreName}
                                    onChange={(e) => setConfirmStoreName(e.target.value)}
                                    className="w-full bg-red-50 border-2 border-red-100 rounded-2xl py-4 text-center font-black text-red-600 placeholder:text-red-200 focus:border-red-600 focus:ring-4 focus:ring-red-100 outline-none transition-all"
                                    placeholder="RESET"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        setShowResetModal(false);
                                        setConfirmStoreName('');
                                    }}
                                    className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleResetStore}
                                    disabled={confirmStoreName.toUpperCase() !== 'RESET' || isResetting}
                                    className={`py-3 px-6 rounded-2xl font-bold transition-all shadow-lg ${confirmStoreName.toUpperCase() === 'RESET' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                                >
                                    {isResetting ? 'Wiping Data...' : 'Yes, Wipe Everything'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <style jsx>{`
                .glass-morphism {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 2rem;
                    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
                }
                .form-input {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 0.75rem;
                    padding: 0.625rem 1rem;
                    font-size: 0.875rem;
                    color: #1e293b;
                    transition: all 0.2s;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                }
                .form-input:focus {
                    outline: none;
                    border-color: #6366f1;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
                }
                .btn-primary {
                    background: #6366f1;
                    color: white;
                    border-radius: 0.75rem;
                    padding: 0.625rem 1.5rem;
                    font-size: 0.875rem;
                    font-weight: 600;
                    transition: all 0.2s;
                    box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);
                }
                .btn-primary:hover {
                    background: #4f46e5;
                    transform: translateY(-1px);
                    box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
                }
                .btn-primary:active {
                    transform: translateY(0);
                }
            `}</style>
            {/* Interactive Guide Overlay */}
            <AnimatePresence>
                {showGuide && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-[40px] shadow-[0_30px_100px_rgba(0,0,0,0.4)] w-full max-w-5xl overflow-hidden flex h-[700px] border border-white/20"
                        >
                            {/* Sidebar Navigation */}
                            <div className="w-80 bg-slate-50 border-r border-slate-100 p-10 flex flex-col font-sans">
                                <div className="flex items-center space-x-3 mb-12">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 uppercase tracking-tighter leading-none">Settings Guide</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Enterprise Config</p>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-2">
                                    {[
                                        { title: 'Store Identity', sub: 'Profile & Localization', icon: Store },
                                        { title: 'Tax Compliance', sub: 'TIN & Registration', icon: ShieldCheck },
                                        { title: 'Audit Controls', sub: 'Manager Overrides', icon: Lock },
                                        { title: 'End-of-Day', sub: 'Z-Reports & Exports', icon: FileText },
                                    ].map((step, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setActiveGuideStep(i)}
                                            className={`w-full text-left p-4 rounded-2xl transition-all flex items-center space-x-4 border-2 ${activeGuideStep === i ? 'bg-white border-indigo-100 shadow-sm' : 'border-transparent hover:bg-slate-100/50 opacity-60'}`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${activeGuideStep === i ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                                <step.icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className={`text-[10px] uppercase font-black tracking-widest leading-none ${activeGuideStep === i ? 'text-indigo-600' : 'text-slate-400'}`}>Step 0{i + 1}</p>
                                                <p className="text-sm font-bold text-slate-800 mt-1">{step.title}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-auto">
                                    <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 flex items-start space-x-3">
                                        <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                        <p className="text-[10px] font-bold text-indigo-700 leading-relaxed uppercase">
                                            Ensure your store settings are accurately configured for legal and operational compliance.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 flex flex-col relative bg-white font-sans">
                                <button
                                    onClick={() => setShowGuide(false)}
                                    className="absolute top-8 right-8 p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-300"
                                >
                                    <X className="w-6 h-6" />
                                </button>

                                <div className="flex-1 p-16 px-20 overflow-y-auto custom-scrollbar">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={activeGuideStep}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="min-h-full"
                                        >
                                            {activeGuideStep === 0 && (
                                                <div className="space-y-8">
                                                    <div className="space-y-4">
                                                        <h2 className="text-4xl font-black text-slate-900 leading-none">STORE IDENTITY</h2>
                                                        <p className="text-slate-500 font-medium text-lg leading-relaxed">Fundamental profile and localization settings for your business.</p>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-8 pt-4">
                                                        <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4">
                                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-indigo-600">
                                                                <Store className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-black text-slate-800 uppercase tracking-tight">Profile Data</h3>
                                                                <p className="text-xs text-slate-400 font-medium leading-relaxed mt-2">Business Name and Address as they appear on your legal documents and customer receipts.</p>
                                                            </div>
                                                        </div>

                                                        <div className="p-8 bg-slate-900 rounded-[2.5rem] space-y-4 text-white">
                                                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                                                                <Clock className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-black uppercase tracking-tight">Localization</h3>
                                                                <p className="text-xs text-slate-400 font-medium leading-relaxed mt-2">Timezone and Currency are critical for reporting. Note: they lock after the first transaction for data integrity.</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeGuideStep === 1 && (
                                                <div className="space-y-8">
                                                    <div className="space-y-4">
                                                        <h2 className="text-4xl font-black text-slate-900 leading-none">TAX COMPLIANCE</h2>
                                                        <p className="text-slate-500 font-medium text-lg leading-relaxed">Official details required for BIR legal reporting and receipt issuance.</p>
                                                    </div>

                                                    <div className="p-10 bg-amber-50 rounded-[3rem] border border-amber-100 flex items-center space-x-10">
                                                        <div className="flex-1 space-y-6">
                                                            <div className="flex items-center space-x-4">
                                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md text-amber-600">
                                                                    <ShieldCheck className="w-6 h-6" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-black text-slate-800 uppercase tracking-tight">TIN Registration</h3>
                                                                    <p className="text-xs text-slate-400 font-medium leading-relaxed">Your 12-digit Tax Identification Number must be accurate for BIR compliance.</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-4">
                                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md text-indigo-600">
                                                                    <FileText className="w-6 h-6" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-black text-slate-800 uppercase tracking-tight">Tax Type (VAT/NON-VAT)</h3>
                                                                    <p className="text-xs text-slate-400 font-medium leading-relaxed">Defines how taxes are calculated and displayed on Official Receipts.</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="w-64 h-64 bg-amber-100/50 rounded-[2.5rem] flex items-center justify-center shadow-inner relative overflow-hidden group">
                                                            <div className="bg-white p-6 rounded-3xl shadow-2xl relative z-10 text-center scale-90 transition-transform">
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">BIR Form 2303</p>
                                                                <p className="text-2xl font-black text-amber-600 tracking-tighter">COR</p>
                                                                <div className="mt-4 px-3 py-1 bg-amber-50 rounded-lg text-amber-600 font-black text-[8px] uppercase tracking-widest">Legal Basis</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeGuideStep === 2 && (
                                                <div className="space-y-8">
                                                    <div className="space-y-4">
                                                        <h2 className="text-4xl font-black text-slate-900 leading-none">AUDIT CONTROLS</h2>
                                                        <p className="text-slate-500 font-medium text-lg leading-relaxed">Security measures to prevent fraud and track unauthorized changes.</p>
                                                    </div>

                                                    <div className="flex items-center space-x-6 p-8 bg-slate-900 rounded-[2.5rem] text-white">
                                                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                                                            <Lock className="w-8 h-8" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-black uppercase tracking-tight">Manager Overrides</h4>
                                                            <p className="text-xs text-slate-400 leading-relaxed mt-1">Require a manager PIN or account for critical actions like voiding orders or applying large discounts.</p>
                                                        </div>
                                                    </div>

                                                    <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem]">
                                                        <h3 className="font-black text-slate-800 uppercase text-xs tracking-tight mb-4">Audit Logs</h3>
                                                        <p className="text-slate-500 text-xs leading-relaxed italic">"Every managerial action is time-stamped and linked to a specific user for accountability during audits."</p>
                                                    </div>
                                                </div>
                                            )}

                                            {activeGuideStep === 3 && (
                                                <div className="space-y-8">
                                                    <div className="space-y-4">
                                                        <h2 className="text-4xl font-black text-slate-900 leading-none">END-OF-DAY OPS</h2>
                                                        <p className="text-slate-500 font-medium text-lg leading-relaxed">Daily routines to finalize sales and prepare for government audits.</p>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 space-y-4">
                                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                                                                <Clock className="w-6 h-6" />
                                                            </div>
                                                            <h4 className="font-black text-slate-800 uppercase tracking-tight">Z-Reading</h4>
                                                            <p className="text-xs text-slate-400 font-medium leading-relaxed">Run this at the end of every business day to aggregate sales and close the register officially.</p>
                                                        </div>

                                                        <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 space-y-4">
                                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                                                                <Download className="w-6 h-6" />
                                                            </div>
                                                            <h4 className="font-black text-slate-800 uppercase tracking-tight">Sales Export</h4>
                                                            <p className="text-xs text-slate-400 font-medium leading-relaxed">Download your transaction history in BIR-recognized CSV formats for accounting software.</p>
                                                        </div>
                                                    </div>

                                                    <div className="text-center pt-4">
                                                        <button
                                                            onClick={() => setShowGuide(false)}
                                                            className="px-12 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center space-x-3 mx-auto"
                                                        >
                                                            <Sparkles className="w-5 h-5" />
                                                            <span>Setup Complete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* Footer Navigation */}
                                <div className="p-8 px-12 md:px-16 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                                    <button
                                        onClick={() => setActiveGuideStep(prev => Math.max(0, prev - 1))}
                                        disabled={activeGuideStep === 0}
                                        className="flex items-center space-x-2 text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all uppercase font-black text-[10px] tracking-widest"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        <span>Back</span>
                                    </button>
                                    <div className="flex space-x-2">
                                        {[0, 1, 2, 3].map(i => (
                                            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${activeGuideStep === i ? 'bg-indigo-600 w-4' : 'bg-slate-200'}`} />
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => activeGuideStep === 3 ? setShowGuide(false) : setActiveGuideStep(prev => Math.min(3, prev + 1))}
                                        className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition-all uppercase font-black text-[10px] tracking-widest"
                                    >
                                        <span>{activeGuideStep === 3 ? 'Finish' : 'Next Step'}</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

