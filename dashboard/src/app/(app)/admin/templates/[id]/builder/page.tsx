'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTemplateBuilderStore } from '@/store/useTemplateBuilderStore';
import api from '@/lib/api';
import BlueprintBuilder from '@/components/templates/builder/BlueprintBuilder';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function BuilderPage() {
    const { id } = useParams();
    const router = useRouter();
    const { setConfig, reset } = useTemplateBuilderStore();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadInitialData = async () => {
            if (id === 'new') {
                reset();
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                // 1. Get template metadata
                const tRes = await api.get('/platform/templates');
                const template = tRes.data.find((t: any) => t.id === id);

                if (!template) {
                    setError('Template not found');
                    return;
                }

                // 2. Get latest version's config
                const vRes = await api.get(`/platform/templates/${id}/versions`);
                const latest = vRes.data.find((v: any) => v.status === 'published') || vRes.data[0];

                if (latest) {
                    const config = typeof latest.config === 'string' ? JSON.parse(latest.config) : latest.config;
                    const uiState = typeof latest.ui_state === 'string' ? JSON.parse(latest.ui_state) : (latest.ui_state || {});

                    // Merge metadata into config if needed
                    setConfig({
                        ...config,
                        name: template.name,
                        description: template.description,
                        vertical: template.vertical,
                        activeStep: uiState.activeStep ?? 0,
                        healthScore: latest.health_score ?? 0
                    });
                } else {
                    // Fallback to basic template info
                    setConfig({
                        name: template.name,
                        description: template.description,
                        vertical: template.vertical,
                        categories: [],
                        items: [],
                        modifier_groups: []
                    });
                }
            } catch (err) {
                console.error('Failed to load builder data:', err);
                setError('Failed to load template data');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadInitialData();
        }
    }, [id, setConfig, reset]);

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Initializing Design Studio...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-rose-50 rounded-[32px] flex items-center justify-center mb-6">
                    <AlertCircle className="w-10 h-10 text-rose-500" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">Access Denied</h2>
                <p className="text-slate-500 font-medium mb-8">{error}</p>
                <button
                    onClick={() => router.push('/admin/templates')}
                    className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all"
                >
                    Back to Blueprints
                </button>
            </div>
        );
    }

    return <BlueprintBuilder />;
}
