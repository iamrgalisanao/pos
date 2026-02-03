'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class TemplateBuilderErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Template Builder Crash:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center p-20 bg-rose-50 rounded-[40px] border-2 border-dashed border-rose-200 text-center">
                    <div className="p-6 bg-white rounded-full shadow-xl mb-8">
                        <AlertTriangle className="w-16 h-16 text-rose-500" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">STUDIO CRASHED</h2>
                    <p className="max-w-md text-slate-500 mb-8 font-medium">
                        The template builder encountered a fatal UI error. This usually happens with malformed configuration data.
                    </p>
                    <div className="bg-slate-900 p-6 rounded-3xl mb-10 w-full max-w-lg overflow-x-auto text-left">
                        <code className="text-rose-300 text-xs font-mono">
                            {this.state.error?.toString()}
                        </code>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center space-x-3 px-8 py-4 bg-rose-500 text-white font-black rounded-2xl hover:bg-rose-600 transition-all shadow-lg"
                    >
                        <RotateCcw className="w-5 h-5" />
                        <span>RELOAD STUDIO</span>
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
