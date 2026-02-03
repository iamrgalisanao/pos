'use client';

import React, { useState, useEffect } from 'react';
import { useTemplateBuilderStore } from '@/store/useTemplateBuilderStore';
import { TemplateValidator } from '@/lib/TemplateValidator';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
    Rocket,
    CheckCircle2,
    AlertTriangle,
    History,
    Globe,
    ShieldCheck,
    ArrowRight,
    Loader2
} from 'lucide-react';

export default function PublishManager() {
    const { id: templateId } = useParams();
    const router = useRouter();
    const { config, isSaving, setStep, setLastSaved, publishSuccess, setPublishSuccess } = useTemplateBuilderStore();
    const [validationErrors, setValidationErrors] = useState<{ message: string, path: string }[]>([]);
    const [isPublishing, setIsPublishing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const errors = TemplateValidator.validate(config);
        setValidationErrors(errors.map(e => ({ message: e.message, path: e.path })));
    }, [config]);

    const getStepFromPath = (path: string) => {
        if (path.includes('name') || path.includes('vertical')) return 0;
        if (path.includes('categories')) return 1;
        if (path.includes('items')) return 2;
        if (path.includes('modifier_groups')) return 3;
        return 0;
    };

    const handlePublish = async () => {
        if (validationErrors.length > 0) return;

        setIsPublishing(true);
        setError(null);
        try {
            // 1. Create a new version
            await api.post('/platform/templates/versions', {
                template_id: templateId,
                version_code: '1.0.' + (Math.floor(Date.now() / 100000) % 1000), // Simple dynamic version
                config: config
            });

            // 2. Fetch the newly created version and publish it if we want immediate effect
            // In a real system, we'd probably have a separate "Publish" state or let the API handle it.
            // For now, let's assume create + publish is the desired flow for this builder.

            setPublishSuccess(true);
            setLastSaved(new Date());

            // 3. For new templates, redirect to the list view after a short delay
            if (templateId === 'new') {
                setTimeout(() => {
                    router.push('/admin/templates');
                }, 2000);
            }
        } catch (err: any) {
            console.error('Publish error:', err);
            setError(err.response?.data?.error || 'Failed to publish blueprint');
        } finally {
            setIsPublishing(false);
        }
    };

    if (publishSuccess) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in-95 duration-700">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-emerald-50">
                    <ShieldCheck className="w-12 h-12" />
                </div>
                <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tight uppercase">DEPLOYMENT INITIALIZED</h2>
                <p className="max-w-md text-center text-slate-500 font-medium mb-10 leading-relaxed">
                    Your blueprint <strong>"{config.name}"</strong> is being synchronized across the platform. It will be available for new onboardings immediately.
                </p>
                <div className="flex items-center space-x-4">
                    <button className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl">
                        View Assets
                    </button>
                    <button className="px-8 py-3 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                        Close Builder
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-12">
                <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight uppercase">PUBLISHING COCKPIT</h2>
                <p className="text-slate-500 font-medium font-mono text-xs uppercase tracking-widest">Version Control & Governance Layer</p>
            </div>

            <div className="grid grid-cols-2 gap-12">
                {/* Left: Validation & Summary */}
                <div className="space-y-8">
                    <div className="bg-slate-50 border-2 border-slate-100 rounded-[40px] p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Blueprint integrity</h3>
                            {validationErrors.length === 0 ? (
                                <div className="flex items-center space-x-2 text-emerald-600">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2 text-rose-500">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{validationErrors.length} ISSUES</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            {validationErrors.length === 0 ? (
                                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center space-x-4">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">All business rules satisfied. Ready for production.</p>
                                </div>
                            ) : (
                                validationErrors.map((err, i) => (
                                    <div key={i} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-between group">
                                        <div className="flex items-center space-x-4">
                                            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                                            <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wide">{err.message}</p>
                                        </div>
                                        <button
                                            onClick={() => setStep(getStepFromPath(err.path))}
                                            className="px-4 py-1.5 bg-rose-100 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-rose-200 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            Fix Issue
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-white border-2 border-slate-100 rounded-[40px] p-8 space-y-8">
                        <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Deployment Summary</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="space-y-1">
                                <div className="text-2xl font-black text-slate-800">{config.categories.length}</div>
                                <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Categories</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-2xl font-black text-slate-800">{config.items.length}</div>
                                <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Catalog Items</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-2xl font-black text-slate-800">{config.modifier_groups.length}</div>
                                <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Mod Groups</div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Auto-Versioning</span>
                                <span className="text-[11px] font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-md">MINOR (+0.0.1)</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Global Asset</span>
                                <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md uppercase">ENABLED</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="space-y-8">
                    <div className="bg-indigo-600 rounded-[40px] p-10 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                        <Globe className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10 group-hover:scale-110 transition-transform duration-700" />

                        <h3 className="text-2xl font-black mb-6 tracking-tight uppercase">Ready to Commit?</h3>
                        <p className="text-indigo-100 font-medium mb-10 leading-relaxed text-sm">
                            Publishing this blueprint will create a new immutable platform version. All future tenants selecting the <strong>{config.vertical}</strong> vertical will receive this specific configuration by default.
                        </p>

                        <button
                            disabled={validationErrors.length > 0 || isPublishing}
                            onClick={handlePublish}
                            className={`
                        w-full group/btn relative flex items-center justify-center space-x-4 py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] transition-all
                        ${validationErrors.length > 0
                                    ? 'bg-indigo-400/50 text-indigo-200 cursor-not-allowed'
                                    : 'bg-white text-indigo-700 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'}
                    `}
                        >
                            {isPublishing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>FINALIZING...</span>
                                </>
                            ) : (
                                <>
                                    <Rocket className="w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                    <span>PUBLISH ASSET</span>
                                </>
                            )}
                        </button>

                        {error && (
                            <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-2">
                                <AlertTriangle className="w-5 h-5 text-rose-300" />
                                <p className="text-xs font-bold text-rose-100 uppercase tracking-wide">{error}</p>
                            </div>
                        )}
                    </div>

                    <div className="p-8 bg-slate-900 rounded-[40px] text-white flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-400">
                                <History className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">History Management</div>
                                <div className="text-sm font-bold">Manage previous versions</div>
                            </div>
                        </div>
                        <button className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-all">
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 bg-amber-50 rounded-[32px] border border-amber-100 flex items-start space-x-4">
                        <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                        <p className="text-[10px] font-black text-amber-700 uppercase leading-relaxed tracking-wider italic">
                            Caution: Once published, the core structure of this version becomes read-only to maintain data integrity for existing stores.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
