'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';


interface DashboardStats {
  revenue: number;
  orders: number;
  customers: number;
  lowStock: number;
  recentTransactions: any[];
  topItems: Array<{ name: string, total_sold: number }>;
}

export default function DashboardPage() {
  const { user, currencySymbol, logout, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && user.role === 'cashier') {
      // Cashiers shouldn't see the main dashboard with revenue, 
      // redirect them to the terminal.
      router.push('/terminal');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/stats', {
          headers: { 'X-Tenant-ID': user?.tenant_id }
        });
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && user.role !== 'cashier') {
      fetchStats();
    }
  }, [user]);

  if (authLoading || isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-transparent">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl mb-4"></div>
          <span className="text-slate-500 font-medium">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-muted">Welcome back, {user.name}. Here's what's happening today.</p>
        </div>
        <div className="flex space-x-4">
          <button className="bg-white border rounded-xl px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors">
            Export Report
          </button>
          <Link href="/terminal" className="btn-primary text-sm flex items-center justify-center">
            New Transaction
          </Link>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard title="Total Revenue" value={`${currencySymbol}${stats?.revenue.toLocaleString() || '0.00'}`} change="+0%" />
        <StatCard title="Total Orders" value={stats?.orders.toString() || '0'} change="+0%" />
        <StatCard title="Active Customers" value={stats?.customers.toString() || '0'} change="+0%" />
        <StatCard title="Inventory Alerts" value={stats?.lowStock.toString() || '0'} change={stats?.lowStock ? "Attention needed" : "Healthy"} isWarning={!!stats?.lowStock} />
      </div>

      {/* Charts & Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 premium-card">
          <h2 className="text-xl font-bold mb-6">Recent Transactions</h2>
          <div className="space-y-4">
            {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
              stats.recentTransactions.map((tx: any) => (
                <TransactionItem
                  key={tx.id}
                  id={`#${tx.id?.slice(0, 8) || 'TX'}`}
                  customer={tx.customer_name || 'Guest'}
                  amount={`${currencySymbol}${parseFloat(tx.amount).toFixed(2)}`}
                  status={tx.status}
                />
              ))
            ) : (
              <p className="text-center text-slate-400 py-8">No recent transactions found.</p>
            )}
          </div>
        </div>
        <div className="premium-card">
          <h2 className="text-xl font-bold mb-6">Top Selling Items</h2>
          <div className="space-y-4">
            {stats?.topItems && stats.topItems.length > 0 ? (
              stats.topItems.map((item, idx) => (
                <TopItem
                  key={idx}
                  name={item.name}
                  sales={`${item.total_sold} units sold`}
                />
              ))
            ) : (
              <p className="text-center text-slate-400 py-8 text-sm">Selling trends will appear here once more data is collected.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}


function StatCard({ title, value, change, isWarning = false }: { title: string, value: string, change: string, isWarning?: boolean }) {
  return (
    <div className="premium-card">
      <h3 className="text-sm font-medium text-muted mb-2">{title}</h3>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold">{value}</span>
        <span className={`text-xs font-semibold ${isWarning ? 'text-amber-500' : 'text-emerald-500'}`}>
          {change}
        </span>
      </div>
    </div>
  );
}

function TransactionItem({ id, customer, amount, status }: { id: string, customer: string, amount: string, status: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0 border-slate-100">
      <div className="flex flex-col">
        <span className="text-sm font-bold text-slate-900">{id}</span>
        <span className="text-xs text-muted">{customer}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-sm font-bold">{amount}</span>
        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600">{status}</span>
      </div>
    </div>
  )
}

function TopItem({ name, sales }: { name: string, sales: string }) {
  return (
    <div className="flex items-center space-x-4">
      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
        {name[0]}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold">{name}</span>
        <span className="text-xs text-muted">{sales}</span>
      </div>
    </div>
  )
}
