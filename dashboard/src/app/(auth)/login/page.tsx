'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { Info } from 'lucide-react';

function LoginContent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('expired') === 'true') {
            setInfo('Your session has expired. Please sign in again.');
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await login(email, password);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                        N
                    </div>
                </div>

                <div className="premium-card bg-white p-10">
                    <div className="text-center mb-10">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h1>
                        <p className="text-muted">Sign in to manage your POS systems</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                            {error}
                        </div>
                    )}

                    {info && (
                        <div className="mb-6 p-4 bg-amber-50 text-amber-700 text-sm rounded-xl border border-amber-100 flex items-center gap-3">
                            <Info className="w-4 h-4 shrink-0" />
                            {info}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="owner@example.com"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-sm font-medium text-slate-700">Password</label>
                                <a href="#" className="text-xs text-indigo-600 hover:underline">Forgot password?</a>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full btn-primary py-3 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-500">
                        Don't have an account? <a href="#" className="text-indigo-600 font-semibold hover:underline">Start free trial</a>
                    </p>
                </div>

                <div className="mt-8 text-center text-xs text-muted">
                    &copy; 2026 Nodal POS. Trusted by 5,000+ businesses.
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}

