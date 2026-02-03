'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AnalyticsService } from '@/lib/analyticsService';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { LayoutDashboard, TrendingUp, Package, Users, PieChart as PieChartIcon, Download, RefreshCcw, Calendar } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

export default function AnalyticsPage() {
    const { currencySymbol } = useAuth();
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [productData, setProductData] = useState<any[]>([]);
    const [staffData, setStaffData] = useState<any[]>([]);
    const [categoryData, setCategoryData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rev, prod, staff, cat] = await Promise.all([
                AnalyticsService.getRevenueTrend(dateRange.start, dateRange.end),
                AnalyticsService.getProductPerformance(dateRange.start, dateRange.end),
                AnalyticsService.getStaffPerformance(dateRange.start, dateRange.end),
                AnalyticsService.getCategoryPerformance(dateRange.start, dateRange.end)
            ]);
            setRevenueData(rev);
            setProductData(prod);
            setStaffData(staff);
            setCategoryData(cat);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const totalRevenue = revenueData.reduce((acc, curr) => acc + Number(curr.revenue), 0);
    const totalOrders = revenueData.reduce((acc, curr) => acc + Number(curr.order_count), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    if (loading) return (
        <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <>
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                            <TrendingUp className="w-8 h-8 text-indigo-600" />
                            Advanced Analytics
                        </h1>
                        <p className="text-slate-500 mt-1">Real-time performance metrics and business intelligence.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                            <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                className="bg-transparent border-none text-sm focus:ring-0 mr-2"
                            />
                            <span className="text-slate-300">to</span>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                className="bg-transparent border-none text-sm focus:ring-0 ml-2"
                            />
                        </div>

                        <button
                            onClick={() => AnalyticsService.exportCSV()}
                            className="btn-secondary flex items-center gap-2 px-4 py-2"
                        >
                            <Download className="w-4 h-4" />
                            <span>Export CSV</span>
                        </button>

                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
                        >
                            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-morphism p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
                            <p className="text-2xl font-bold text-slate-900">{currencySymbol}{totalRevenue.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="glass-morphism p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Package className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Order Volume</p>
                            <p className="text-2xl font-bold text-slate-900">{totalOrders.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="glass-morphism p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                            <LayoutDashboard className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Avg Order Value</p>
                            <p className="text-2xl font-bold text-slate-900">{currencySymbol}{avgOrderValue.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                {/* Main Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Revenue Trend */}
                    <div className="glass-morphism p-6 flex flex-col h-[400px]">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-500" />
                            Revenue Trend
                        </h3>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(val: string) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        stroke="#94a3b8"
                                        fontSize={12}
                                    />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val: number) => `${currencySymbol}${val}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        labelFormatter={(label) => new Date(label).toDateString()}
                                        formatter={(value: any) => [`${currencySymbol}${Number(value || 0).toLocaleString()}`, 'Revenue']}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Products */}
                    <div className="glass-morphism p-6 flex flex-col h-[400px]">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Package className="w-5 h-5 text-emerald-500" />
                            Top Sellers by Revenue
                        </h3>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={productData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(val: number) => `${currencySymbol}${val}`} />
                                    <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={100} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any) => [`${currencySymbol}${Number(value || 0).toLocaleString()}`, 'Total Revenue']}
                                    />
                                    <Bar dataKey="total_revenue" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Category Split */}
                    <div className="glass-morphism p-6 flex flex-col h-[400px]">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <PieChartIcon className="w-5 h-5 text-pink-500" />
                            Category Distribution
                        </h3>
                        <div className="flex-1 w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="total_revenue"
                                        nameKey="category_name"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value) => `${currencySymbol}${Number(value).toLocaleString()}`}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Staff Performance */}
                    <div className="glass-morphism p-6 flex flex-col h-[400px]">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Users className="w-5 h-5 text-amber-500" />
                            Staff Performance
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 italic">
                                        <th className="py-3 px-4 text-slate-500 font-medium">Staff Member</th>
                                        <th className="py-3 px-4 text-slate-500 font-medium text-right">Orders</th>
                                        <th className="py-3 px-4 text-slate-500 font-medium text-right">Revenue</th>
                                        <th className="py-3 px-4 text-slate-500 font-medium text-right">Avg Ticket</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staffData.length > 0 ? staffData.map((staff, idx) => (
                                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-4 font-semibold text-slate-900">{staff.staff_name}</td>
                                            <td className="py-4 px-4 text-right text-slate-600">{staff.order_count}</td>
                                            <td className="py-4 px-4 text-right text-indigo-600 font-bold">{currencySymbol}{Number(staff.total_revenue).toLocaleString()}</td>
                                            <td className="py-4 px-4 text-right text-slate-600">
                                                {currencySymbol}{(Number(staff.total_revenue) / Number(staff.order_count)).toFixed(2)}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-slate-400 italic">No staff data found for this period.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}

