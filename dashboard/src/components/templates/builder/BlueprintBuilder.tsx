'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTemplateBuilderStore } from '@/store/useTemplateBuilderStore';
import { TemplateBuilderErrorBoundary } from './ErrorBoundary';
import CoreInfoForm from './steps/CoreInfoForm';
import CategoryManager from './steps/CategoryManager';
import ItemManager from './steps/ItemManager';
import ModifierGroupBuilder from './steps/ModifierGroupBuilder';
import PublishManager from './steps/PublishManager';
import POSSimulator from './POSSimulator';
import TemplateGallery from './steps/TemplateGallery';
import ImportWizard from './steps/ImportWizard';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import {
    ChevronRight,
    ChevronLeft,
    Undo2,
    Redo2,
    Rocket,
    CheckCircle2,
    AlertCircle,
    Eye,
    X,
    LayoutDashboard
} from 'lucide-react';

const VERTICAL_NAMES: Record<string, string> = {
    'cafe': 'Premium Café',
    'fast-food': 'Fast Food',
    'retail': 'Retail Shop',
    'restaurant': 'Full Restaurant'
};

const STEPS = [
    { id: 'core', title: 'Core Info', description: 'Brand metadata' },
    { id: 'categories', title: 'Categories', description: 'Menu organization' },
    { id: 'items', title: 'Menu Items', description: 'Catalog details' },
    { id: 'modifiers', title: 'Customizations', description: 'Modifier groups' },
    { id: 'publish', title: 'Review & Publish', description: 'Final deployment' }
];

export default function BlueprintBuilder() {
    const router = useRouter();
    const {
        activeStep,
        setStep,
        undo,
        redo,
        past,
        future,
        isSaving,
        lastSaved,
        config,
        publishSuccess
    } = useTemplateBuilderStore();

    const { id: templateId } = useParams();
    const [showSimulator, setShowSimulator] = useState(false);
    const [overlayView, setOverlayView] = useState<'gallery' | 'import' | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Calculate Health Score based on 20% per step
    const calculateHealthScore = () => {
        const issues: { step: number; text: string; tip?: string }[] = [];
        let score = 0;

        // Step 1: Core Info (20%)
        let step1Score = 0;
        if (config.name) step1Score += 10;
        else issues.push({ step: 0, text: 'Blueprint needs a name', tip: 'Give your menu a recognizable name like "Main Menu" or "Summer Collection".' });

        if (config.vertical) step1Score += 10;
        else issues.push({ step: 0, text: 'Business type not selected', tip: 'Select a business type to get optimized category suggestions.' });
        score += step1Score;

        // Step 2: Categories (20%)
        let step2Score = 0;
        if (config.categories.length >= 1) step2Score += 10;
        else issues.push({ step: 1, text: 'No categories defined', tip: 'Create at least 2 categories (e.g., "Drinks" and "Food") for better organization.' });

        if (config.categories.length >= 2) step2Score += 10;
        else if (config.categories.length === 1) issues.push({ step: 1, text: 'Only one category', tip: 'Most successful menus have at least 2 categories.' });
        score += step2Score;

        // Step 3: Menu Items (20%)
        let step3Score = 0;
        const itemsWithoutPrice = config.items.filter(i => i.price <= 0);

        if (config.items.length >= 1) step3Score += 10;
        else issues.push({ step: 2, text: 'No items in menu', tip: 'Add your first item to see how it looks in the simulator!' });

        if (config.items.length > 0 && itemsWithoutPrice.length === 0) step3Score += 10;
        else if (config.items.length > 0) issues.push({ step: 2, text: `${itemsWithoutPrice.length} items missing price`, tip: 'All items must have a price before they can be sold.' });
        score += step3Score;

        // Step 4: Customizations (20%)
        let step4Score = 0;
        const emptyGroups = config.modifier_groups.filter(g => g.options.length === 0);

        if (config.modifier_groups.length >= 1) step4Score += 10;
        else issues.push({ step: 3, text: 'No customizations', tip: 'Add modifier groups like "Toppings" or "Milk Options" for item variations.' });

        if (config.modifier_groups.length > 0 && emptyGroups.length === 0) step4Score += 10;
        else if (config.modifier_groups.length > 0) issues.push({ step: 3, text: `${emptyGroups.length} groups missing options`, tip: 'Every customization group must have at least one option (e.g., "Regular" or "Default").' });
        score += step4Score;

        // Step 5: Review (20%)
        // Final 20% ONLY if we are on the review page AND no HIGH priority issues exist for earlier steps
        const highPriorityIssues = issues.filter(i => i.step < 4);
        if (activeStep === 4 && highPriorityIssues.length === 0) score += 20;

        return { score, issues };
    };

    const { score, issues } = calculateHealthScore();

    // Step Validation for Navigation
    const validateStep = (stepIdx: number) => {
        const stepIssues = issues.filter(i => i.step === stepIdx);
        if (stepIssues.length > 0) {
            // Return failure if mandatory items for this step are missing
            // For now, let's say "Continue" is blocked if ANY issue exists for the current step
            return {
                isValid: false,
                message: stepIssues[0].text,
                tip: stepIssues[0].tip
            };
        }
        return { isValid: true };
    };

    // Auto-Sync Persistence
    useEffect(() => {
        if (templateId === 'new') return; // Don't auto-save new until first publish or explicit save if we had one

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(async () => {
            try {
                // Update the current version (Draft) with ui_state and health_score
                // We'll use the latest version if it's a draft
                await api.post('/platform/templates/versions', {
                    template_id: templateId,
                    version_code: 'DRAFT', // The backend can handle 'DRAFT' as an indicator to update latest draft or create new
                    config: config,
                    ui_state: { activeStep },
                    health_score: score
                });
            } catch (err) {
                console.error('Auto-sync failed:', err);
            }
        }, 2000); // 2 second debounce

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [config, activeStep, score, templateId]);
    const [celebration, setCelebration] = useState<{ active: boolean; milestone: number }>({ active: false, milestone: 0 });
    const reachedMilestones = useRef<Set<number>>(new Set());
    const { width, height } = useWindowSize();

    // Milestone Celebration Effect
    useEffect(() => {
        if (score >= 50 && score < 100 && !reachedMilestones.current.has(50)) {
            setCelebration({ active: true, milestone: 50 });
            reachedMilestones.current.add(50);
            setTimeout(() => setCelebration({ active: false, milestone: 50 }), 5000);
        } else if (score >= 100 && !reachedMilestones.current.has(100)) {
            setCelebration({ active: true, milestone: 100 });
            reachedMilestones.current.add(100);
            setTimeout(() => setCelebration({ active: false, milestone: 100 }), 5000);
        }
    }, [score]);

    const [navError, setNavError] = useState<{ message: string; tip?: string } | null>(null);
    const [showHealthCheck, setShowHealthCheck] = useState(false);

    const handleNext = () => {
        const validation = validateStep(activeStep);
        if (!validation.isValid) {
            setNavError({ message: validation.message!, tip: validation.tip });
            setTimeout(() => setNavError(null), 5000);
            return;
        }
        setNavError(null);
        if (activeStep < STEPS.length - 1) setStep(activeStep + 1);
    };

    const handleBack = () => {
        if (activeStep > 0) setStep(activeStep - 1);
    };

    return (
        <TemplateBuilderErrorBoundary>
            <div className="flex flex-col h-screen bg-slate-50 overflow-hidden text-slate-900 border-l border-slate-200">
                {/* Top Header / Action Bar */}
                <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-6">
                        <button
                            onClick={() => router.push('/admin/templates')}
                            className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200 group relative"
                            title="Exit to Dashboard"
                        >
                            <LayoutDashboard className="w-5 h-5" />
                        </button>

                        <div className="h-8 w-[1px] bg-slate-100" />

                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100 uppercase">
                                {config.name ? config.name.charAt(0) : 'N'}
                            </div>
                            <div>
                                <h1 className="text-lg font-black text-slate-800 tracking-tight uppercase">
                                    {config.name || 'Untitled Blueprint'}
                                </h1>
                                <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 font-mono">
                                    <span className="uppercase tracking-widest">{VERTICAL_NAMES[config.vertical] || config.vertical}</span>
                                    <span>•</span>
                                    <span>DRAFT v1.0.4</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-6">
                        <button
                            onClick={() => setShowSimulator(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all uppercase tracking-widest"
                        >
                            <Eye className="w-4 h-4" />
                            <span>Simulate</span>
                        </button>

                        <div className="h-4 w-[1px] bg-slate-200" />

                        {/* History Controls */}
                        <div className="flex items-center bg-slate-100 rounded-xl p-1">
                            <button
                                onClick={undo}
                                disabled={past.length === 0}
                                className="p-2 hover:bg-white hover:shadow-sm rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                title="Undo (Ctrl+Z)"
                            >
                                <Undo2 className="w-4 h-4 text-slate-600" />
                            </button>
                            <button
                                onClick={redo}
                                disabled={future.length === 0}
                                className="p-2 hover:bg-white hover:shadow-sm rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                title="Redo (Ctrl+Y)"
                            >
                                <Redo2 className="w-4 h-4 text-slate-600" />
                            </button>
                        </div>

                        <div className="h-8 w-[1px] bg-slate-200" />

                        <div className="flex items-center space-x-3">
                            <span className="text-[11px] font-bold text-slate-400 italic">
                                {isSaving ? 'Synching...' : publishSuccess ? 'Deployed' : lastSaved ? `Autosaved` : 'Not saved'}
                            </span>
                            <button
                                onClick={() => setStep(4)}
                                disabled={publishSuccess}
                                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg group font-black uppercase tracking-widest ${publishSuccess ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'}`}
                            >
                                {publishSuccess ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>PUBLISHED</span>
                                    </>
                                ) : (
                                    <>
                                        <Rocket className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        <span>PUBLISH</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Wizard Progress Stepper */}
                <nav className="bg-white border-b border-slate-100 px-12 py-10 shrink-0">
                    <div className="max-w-6xl mx-auto flex items-center justify-between relative">
                        {/* Step Connector Background Line */}
                        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-100 -translate-y-[1.5rem] -z-0" />

                        {STEPS.map((step, idx) => {
                            const isActive = activeStep === idx;
                            const isPast = activeStep > idx;
                            const stepValidation = validateStep(idx);
                            const isStepComplete = stepValidation.isValid;

                            return (
                                <button
                                    key={step.id}
                                    onClick={() => setStep(idx)}
                                    className={`flex flex-col items-center space-y-4 group relative z-10 transition-all duration-300 ${isActive ? 'scale-105' : 'hover:scale-102'}`}
                                >
                                    {/* Step Circle */}
                                    <div className={`
                                        w-12 h-12 rounded-full flex items-center justify-center font-black text-xs transition-all duration-500 relative
                                        ${isActive ? 'bg-indigo-600 text-white shadow-[0_0_25px_rgba(79,70,229,0.3)] ring-4 ring-indigo-50 border-2 border-white' : ''}
                                        ${isStepComplete && !isActive ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] border-2 border-white' : ''}
                                        ${!isActive && !isStepComplete ? 'bg-white text-slate-300 border-2 border-slate-100' : ''}
                                    `}>
                                        {isStepComplete ? <CheckCircle2 className="w-5 h-5 animate-in zoom-in duration-300" /> : idx + 1}

                                        {/* Status Pulse for active unfinished step */}
                                        {isActive && !isStepComplete && (
                                            <div className="absolute inset-0 rounded-full animate-ping-slow bg-indigo-400/20 -z-10" />
                                        )}
                                    </div>

                                    {/* Step Label */}
                                    <div className="text-center">
                                        <div className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                            STEP {idx + 1}
                                        </div>
                                        <div className={`text-xs font-black uppercase tracking-tight transition-colors ${isActive ? 'text-slate-900 px-3 py-1 bg-indigo-50 rounded-lg' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                            {step.title}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </nav>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-12 bg-slate-50">
                    <div className="max-w-6xl mx-auto min-h-[600px] bg-white rounded-[40px] shadow-sm border border-slate-100 p-12 relative flex flex-col">
                        {/* Render Content Based on Step */}
                        <div className="flex-1">
                            {overlayView === 'gallery' ? (
                                <TemplateGallery onBack={() => setOverlayView(null)} />
                            ) : overlayView === 'import' ? (
                                <ImportWizard onBack={() => setOverlayView(null)} />
                            ) : (
                                <>
                                    {activeStep === 0 && (
                                        <CoreInfoForm
                                            onOpenGallery={() => setOverlayView('gallery')}
                                            onOpenImport={() => setOverlayView('import')}
                                        />
                                    )}
                                    {activeStep === 1 && <CategoryManager />}
                                    {activeStep === 2 && <ItemManager />}
                                    {activeStep === 3 && <ModifierGroupBuilder />}
                                    {activeStep === 4 && <PublishManager />}
                                </>
                            )}
                        </div>

                        {/* Step Navigation Buttons */}
                        <div className="flex items-center justify-between pt-12 mt-12 border-t border-slate-50 shrink-0 relative">
                            {navError && (
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 -translate-y-full w-full max-w-md bg-white border border-rose-100 rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 z-50">
                                    <div className="flex items-start space-x-4">
                                        <div className="p-2 bg-rose-500 rounded-2xl text-white shadow-lg shadow-rose-100">
                                            <AlertCircle className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[11px] font-black text-rose-800 uppercase tracking-widest leading-none mb-2">Step Requirements Missing</div>
                                            <div className="text-sm font-bold text-slate-700 mb-3">{navError.message}</div>
                                            {navError.tip && (
                                                <div className="text-[10px] font-bold text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-100 italic leading-relaxed">
                                                    <span className="text-indigo-600 uppercase font-black mr-2 not-italic">Pro Tip:</span>
                                                    {navError.tip}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleBack}
                                disabled={activeStep === 0}
                                className={`flex items-center space-x-3 px-10 py-5 bg-white border-2 border-slate-100 rounded-[2.5rem] font-black text-slate-400 hover:bg-slate-50 hover:text-slate-600 hover:border-slate-200 transition-all shadow-sm uppercase tracking-[0.2em] text-[10px] ${activeStep === 0 ? 'opacity-0 pointer-events-none' : ''}`}
                            >
                                <ChevronLeft className="w-5 h-5" />
                                <span>BACK</span>
                            </button>

                            <button
                                onClick={handleNext}
                                disabled={activeStep === STEPS.length - 1}
                                className={`group flex items-center space-x-3 px-12 py-5 bg-indigo-600 text-white rounded-[2.5rem] font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 uppercase tracking-[0.2em] text-[10px] ${activeStep === STEPS.length - 1 ? 'opacity-0 pointer-events-none' : ''}`}
                            >
                                <span>CONTINUE</span>
                                <ChevronRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </main>

                {/* Simulator Overlay */}
                {showSimulator && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] p-12 animate-in fade-in duration-300">
                        <div className="bg-slate-50 rounded-[3rem] w-full h-full shadow-[0_0_100px_rgba(0,0,0,0.4)] overflow-hidden relative flex flex-col">
                            <div className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-10 shrink-0">
                                <div className="flex items-center space-x-3">
                                    <Eye className="w-5 h-5 text-indigo-600" />
                                    <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-800">Visual Preview Mode</h3>
                                </div>
                                <button
                                    onClick={() => setShowSimulator(false)}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-hidden p-8">
                                <POSSimulator />
                            </div>
                        </div>
                    </div>
                )}

                {/* Floating Health Score Indicator */}
                <div className="fixed bottom-8 right-8 flex flex-col items-end space-y-4 z-50">
                    {/* Celebration Banner */}
                    {celebration.active && (
                        <div className="bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-2xl animate-bounce font-black text-sm uppercase tracking-widest flex items-center space-x-3">
                            <Rocket className="w-5 h-5" />
                            <span>{celebration.milestone}% MILESTONE REACHED!</span>
                        </div>
                    )}

                    {/* Health Check Drawer (Expanded) */}
                    {showHealthCheck && (
                        <div className="w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 animate-in slide-in-from-bottom-10 fade-in duration-500 overflow-hidden relative">
                            <div className="flex items-center justify-between mb-6">
                                <div className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Blueprint Health Check</div>
                                <button onClick={() => setShowHealthCheck(false)} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                {issues.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                        <div className="text-sm font-black text-slate-800">Perfect Blueprint!</div>
                                        <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Ready for production deployment</div>
                                    </div>
                                ) : (
                                    issues.map((issue, idx) => (
                                        <div key={idx} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 group transition-all hover:border-indigo-100">
                                            <div className="flex items-start space-x-3">
                                                <div className="p-1.5 bg-white rounded-xl shadow-sm border border-slate-100 text-indigo-500">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black text-slate-800 leading-tight mb-1">{issue.text}</div>
                                                    {issue.tip && <div className="text-[10px] font-bold text-slate-500 leading-normal mb-2">{issue.tip}</div>}
                                                    <div className="text-[9px] font-black text-indigo-500 uppercase flex items-center">
                                                        <span>Step {issue.step + 1} Target</span>
                                                        <ChevronRight className="w-2.5 h-2.5 ml-1" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    <div
                        onClick={() => setShowHealthCheck(!showHealthCheck)}
                        className="flex items-center bg-white rounded-2xl shadow-2xl p-4 border border-slate-100 space-x-4 cursor-pointer hover:border-indigo-200 transition-all group scale-100 active:scale-95"
                    >
                        <div className="relative w-12 h-12">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path className="text-slate-100" strokeDasharray="100, 100" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                <path
                                    className={`${score >= 100 ? 'text-emerald-500' : 'text-indigo-600'} transition-all duration-1000 ease-out`}
                                    strokeDasharray={`${score}, 100`}
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                            <div className={`absolute inset-0 flex items-center justify-center text-[10px] font-black ${score >= 100 ? 'text-emerald-500' : 'text-indigo-600'}`}>
                                {score}%
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 group-hover:text-indigo-400">Blueprint Health</div>
                            <div className={`text-sm font-black ${score >= 100 ? 'text-emerald-600' : 'text-slate-800'}`}>
                                {score === 0 ? 'Empty' : score < 40 ? 'Drafting' : score < 80 ? 'Building' : score < 100 ? 'Optimizing' : 'Ready'}
                            </div>
                        </div>

                        {issues.length > 0 && (
                            <>
                                <div className="h-10 w-[1px] bg-slate-100 mx-2" />
                                <div className="flex -space-x-2">
                                    <div
                                        className="w-8 h-8 rounded-full bg-rose-50 border-2 border-white flex items-center justify-center text-rose-500"
                                        title={`${issues.length} actionable tips found`}
                                    >
                                        <AlertCircle className="w-4 h-4" />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {celebration.active && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} gravity={0.1} colors={['#4f46e5', '#10b981', '#f59e0b', '#ef4444']} />}
            </div>
        </TemplateBuilderErrorBoundary>
    );
}
