'use client';

import Sidebar from '@/components/Sidebar';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-slate-50/50 p-6 md:p-10 custom-scrollbar">
                {children}
            </main>
        </div>
    );
}
