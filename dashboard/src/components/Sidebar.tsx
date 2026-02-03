'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard,
    Users,
    BarChart3,
    Zap,
    Activity,
    Monitor,
    Package,
    ChefHat,
    Warehouse,
    BookUser,
    Layout,
    Settings,
    LogOut
} from 'lucide-react';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    if (!user) return null;

    const groups = [
        {
            name: 'Operations',
            links: [
                { name: 'POS Terminal', href: '/terminal', icon: Monitor, roles: ['owner', 'manager', 'cashier'] },
                { name: 'Kitchen Display', href: '/kds', icon: ChefHat, roles: ['owner', 'manager', 'cashier'] },
                { name: 'Inventory', href: '/inventory', icon: Warehouse, roles: ['owner', 'manager'] },
                { name: 'Product Catalog', href: '/products', icon: Package, roles: ['owner', 'manager'] },
                { name: 'Sales Overview', href: '/', icon: Activity, roles: ['owner', 'manager'] },
                { name: 'Customer Directory', href: '/customers', icon: BookUser, roles: ['owner', 'manager', 'cashier'] },
            ]
        },
        {
            name: 'Configuration',
            links: [
                { name: 'Global Overview', href: '/admin', icon: LayoutDashboard, roles: ['owner', 'manager'] },
                { name: 'Staff Management', href: '/staff', icon: Users, roles: ['owner', 'manager'] },
                { name: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['owner', 'manager'] },
                { name: 'Marketing', href: '/marketing', icon: Zap, roles: ['owner', 'manager'] },
                { name: 'Platform Templates', href: '/admin/templates', icon: Layout, roles: ['owner'] },
                { name: 'Settings', href: '/settings', icon: Settings, roles: ['owner', 'manager'] },
            ]
        }
    ];


    return (
        <aside className="w-64 glass-morphism border-r hidden md:flex flex-col p-6 space-y-8 h-screen sticky top-0">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                    N
                </div>
                <span className="text-xl font-bold tracking-tight gradient-text">Nodal POS</span>
            </div>

            <nav className="flex-1 space-y-8 overflow-y-auto no-scrollbar">
                {groups.map((group) => {
                    const filteredLinks = group.links.filter(link => link.roles.includes(user.role));
                    if (filteredLinks.length === 0) return null;

                    return (
                        <div key={group.name} className="space-y-3">
                            <h3 className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{group.name}</h3>
                            <div className="space-y-1">
                                {filteredLinks.map((link) => {
                                    const isActive = pathname === link.href;
                                    const Icon = link.icon;
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all group ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}
                                        >
                                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                                            <span className="text-sm font-bold tracking-tight">{link.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            <div className="pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                            {user.name?.[0] || 'U'}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium truncate max-w-[100px]">{user.name}</span>
                            <span className="text-[10px] text-muted uppercase tracking-wider">{user.role}</span>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
