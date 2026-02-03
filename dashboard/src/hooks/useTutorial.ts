'use client';

import { useState, useEffect } from 'react';

export interface TutorialStep {
    id: string;
    title: string;
    content: string;
    target: string; // CSS selector or data-tutorial-id
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    action?: () => void;
}

interface UseTutorialReturn {
    isActive: boolean;
    currentStep: number;
    totalSteps: number;
    currentStepData: TutorialStep | null;
    startTutorial: () => void;
    nextStep: () => void;
    previousStep: () => void;
    skipTutorial: () => void;
    completeTutorial: () => void;
    hasCompletedTutorial: boolean;
}

export function useTutorial(
    tutorialId: string,
    steps: TutorialStep[]
): UseTutorialReturn {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [hasCompletedTutorial, setHasCompletedTutorial] = useState(false);

    // Check if user has completed this tutorial before
    useEffect(() => {
        const completed = localStorage.getItem(`tutorial_${tutorialId}_completed`);
        setHasCompletedTutorial(completed === 'true');
    }, [tutorialId]);

    const startTutorial = () => {
        setIsActive(true);
        setCurrentStep(0);
    };

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            completeTutorial();
        }
    };

    const previousStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const skipTutorial = () => {
        setIsActive(false);
        setCurrentStep(0);
    };

    const completeTutorial = () => {
        setIsActive(false);
        setCurrentStep(0);
        localStorage.setItem(`tutorial_${tutorialId}_completed`, 'true');
        setHasCompletedTutorial(true);
    };

    const currentStepData = isActive && steps[currentStep] ? steps[currentStep] : null;

    return {
        isActive,
        currentStep,
        totalSteps: steps.length,
        currentStepData,
        startTutorial,
        nextStep,
        previousStep,
        skipTutorial,
        completeTutorial,
        hasCompletedTutorial,
    };
}
