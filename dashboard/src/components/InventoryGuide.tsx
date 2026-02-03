'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ChevronRight,
    ChevronLeft,
    Package,
    Search,
    Filter,
    AlertCircle,
    History,
    CheckCircle2,
    Lightbulb
} from 'lucide-react';

interface GuideStep {
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

const steps: GuideStep[] = [
    {
        title: "Inventory Overview",
        description: "Welcome! This is where you track everything you sell. Keep an eye on your stock levels to ensure you never run out of your best-sellers.",
        icon: <Package className="w-12 h-12" />,
        color: "bg-indigo-600"
    },
    {
        title: "Receiving New Stock",
        description: "Click 'Receive New Stock' to add incoming inventory. You can track batches with expiry dates and lot numbers for better compliance.",
        icon: <PlusIcon />,
        color: "bg-emerald-600"
    },
    {
        title: "Stock Health",
        description: "We use color-coded indicators (In Stock, Low, Out of Stock) to help you prioritize. Green is good, Amber needs attention, and Red is urgent.",
        icon: <AlertCircle className="w-12 h-12" />,
        color: "bg-rose-600"
    },
    {
        title: "Smart Filtering",
        description: "Use the filter chips to quickly isolate 'Low Stock' or 'Out of Stock' items. The search bar helps you find specific SKUs instantly.",
        icon: <Filter className="w-12 h-12" />,
        color: "bg-amber-600"
    },
    {
        title: "Batch History (FEFO)",
        description: "Click the history icon on any row to view individual batches. We follow FEFO (First-Expiry, First-Out) to minimize waste.",
        icon: <History className="w-12 h-12" />,
        color: "bg-slate-900"
    }
];

function PlusIcon() {
    return (
        <div className="relative">
            <Package className="w-12 h-12" />
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-1 border-2 border-white">
                <ChevronRight className="w-4 h-4 text-white" />
            </div>
        </div>
    );
}

interface InventoryGuideProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function InventoryGuide({ isOpen, onClose }: InventoryGuideProps) {
    const [currentStep, setCurrentStep] = useState(0);

    if (!isOpen) return null;

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const step = steps[currentStep];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden relative"
                >
                    {/* Top Progress Bar */}
                    <div className="absolute top-0 left-0 w-full h-1.5 flex gap-1 px-4 pt-4">
                        {steps.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-full flex-1 rounded-full transition-all duration-500 ${idx <= currentStep ? 'bg-indigo-600' : 'bg-slate-100'}`}
                            />
                        ))}
                    </div>

                    <div className="p-12 pt-16 flex flex-col items-center text-center">
                        <motion.div
                            key={currentStep}
                            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            className={`w-24 h-24 ${step.color} text-white rounded-[32px] flex items-center justify-center mb-10 shadow-xl shadow-slate-200`}
                        >
                            {step.icon}
                        </motion.div>

                        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
                            {step.title}
                        </h2>

                        <p className="text-slate-500 text-lg font-medium leading-relaxed mb-12 px-4 italic">
                            "{step.description}"
                        </p>

                        <div className="flex items-center justify-between w-full">
                            <button
                                onClick={prevStep}
                                className={`flex items-center gap-2 font-bold transition-all ${currentStep === 0 ? 'opacity-0 cursor-default' : 'text-slate-400 hover:text-slate-900'}`}
                            >
                                <ChevronLeft className="w-5 h-5" />
                                Back
                            </button>

                            <button
                                onClick={nextStep}
                                className="px-10 py-4 bg-slate-900 text-white rounded-3xl font-black text-sm hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center gap-3 active:scale-95"
                            >
                                {currentStep === steps.length - 1 ? 'Finish Guide' : 'Next Step'}
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="bg-slate-50 p-6 flex items-center justify-center gap-3">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Pro Tip: Use the search bar to find products by SKU or Name instantly.
                        </span>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
