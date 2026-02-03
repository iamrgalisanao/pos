'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import type { TutorialStep } from '@/hooks/useTutorial';

interface TutorialOverlayProps {
    isActive: boolean;
    currentStep: number;
    totalSteps: number;
    stepData: TutorialStep | null;
    onNext: () => void;
    onPrevious: () => void;
    onSkip: () => void;
}

export default function TutorialOverlay({
    isActive,
    currentStep,
    totalSteps,
    stepData,
    onNext,
    onPrevious,
    onSkip,
}: TutorialOverlayProps) {
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isActive || !stepData) return;

        const updateTargetPosition = () => {
            if (stepData.target === 'center') {
                setTargetRect(null);
                return;
            }

            const element = document.querySelector(stepData.target);
            if (element) {
                const rect = element.getBoundingClientRect();
                setTargetRect(rect);

                // Calculate tooltip position
                const tooltipHeight = tooltipRef.current?.offsetHeight || 300;
                const tooltipWidth = tooltipRef.current?.offsetWidth || 400;
                const padding = 20;

                let top = 0;
                let left = 0;

                const position = stepData.position || 'bottom';

                switch (position) {
                    case 'top':
                        top = rect.top - tooltipHeight - padding;
                        left = rect.left + rect.width / 2 - tooltipWidth / 2;
                        break;
                    case 'bottom':
                        top = rect.bottom + padding;
                        left = rect.left + rect.width / 2 - tooltipWidth / 2;
                        break;
                    case 'left':
                        top = rect.top + rect.height / 2 - tooltipHeight / 2;
                        left = rect.left - tooltipWidth - padding;
                        break;
                    case 'right':
                        top = rect.top + rect.height / 2 - tooltipHeight / 2;
                        left = rect.right + padding;
                        break;
                    default:
                        top = rect.bottom + padding;
                        left = rect.left + rect.width / 2 - tooltipWidth / 2;
                }

                // Keep tooltip within viewport
                const maxLeft = window.innerWidth - tooltipWidth - 20;
                const maxTop = window.innerHeight - tooltipHeight - 20;
                left = Math.max(20, Math.min(left, maxLeft));
                top = Math.max(20, Math.min(top, maxTop));

                setTooltipPosition({ top, left });
            }
        };

        updateTargetPosition();
        window.addEventListener('resize', updateTargetPosition);
        window.addEventListener('scroll', updateTargetPosition);

        return () => {
            window.removeEventListener('resize', updateTargetPosition);
            window.removeEventListener('scroll', updateTargetPosition);
        };
    }, [isActive, stepData]);

    if (!isActive || !stepData) return null;

    const isCenter = stepData.target === 'center';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999]"
                style={{ pointerEvents: 'none' }}
            >
                {/* Backdrop with spotlight */}
                <div className="absolute inset-0 bg-black/60" style={{ pointerEvents: 'auto' }}>
                    {targetRect && !isCenter && (
                        <div
                            className="absolute bg-transparent border-4 border-white rounded-xl shadow-2xl transition-all duration-300"
                            style={{
                                top: targetRect.top - 8,
                                left: targetRect.left - 8,
                                width: targetRect.width + 16,
                                height: targetRect.height + 16,
                                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.5)',
                                pointerEvents: 'none',
                            }}
                        />
                    )}
                </div>

                {/* Tooltip */}
                <motion.div
                    ref={tooltipRef}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="absolute bg-white rounded-2xl shadow-2xl overflow-hidden"
                    style={{
                        top: isCenter ? '50%' : tooltipPosition.top,
                        left: isCenter ? '50%' : tooltipPosition.left,
                        transform: isCenter ? 'translate(-50%, -50%)' : 'none',
                        width: '440px',
                        maxWidth: 'calc(100vw - 40px)',
                        pointerEvents: 'auto',
                    }}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <HelpCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg">{stepData.title}</h3>
                                <p className="text-indigo-100 text-xs font-medium">
                                    Step {currentStep + 1} of {totalSteps}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onSkip}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-5">
                        <p className="text-slate-700 leading-relaxed">{stepData.content}</p>
                    </div>

                    {/* Progress Dots */}
                    <div className="px-6 pb-4 flex items-center justify-center space-x-2">
                        {Array.from({ length: totalSteps }).map((_, index) => (
                            <div
                                key={index}
                                className={`h-2 rounded-full transition-all duration-300 ${index === currentStep
                                        ? 'w-8 bg-indigo-600'
                                        : index < currentStep
                                            ? 'w-2 bg-indigo-400'
                                            : 'w-2 bg-slate-200'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                        <button
                            onClick={onPrevious}
                            disabled={currentStep === 0}
                            className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Previous</span>
                        </button>

                        <button
                            onClick={onSkip}
                            className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            Skip Tutorial
                        </button>

                        <button
                            onClick={onNext}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center space-x-1 shadow-lg"
                        >
                            <span>{currentStep === totalSteps - 1 ? 'Finish' : 'Next'}</span>
                            {currentStep < totalSteps - 1 && <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
