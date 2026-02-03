import { useAuth } from '@/context/AuthContext';

interface Summary {
    total_revenue: string;
    total_orders: string;
    average_ticket_size: string;
}

interface TopProduct {
    product_name: string;
    total_quantity: string;
    total_sales: string;
}

interface GlobalStatsProps {
    summary: Summary;
    topProducts: TopProduct[];
}

export default function GlobalStats({ summary, topProducts }: GlobalStatsProps) {
    const { currencySymbol } = useAuth();

    return (
        <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="premium-card bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Revenue</p>
                    <h3 className="text-3xl font-black text-indigo-600 font-display">
                        {currencySymbol}{parseFloat(summary.total_revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                </div>

                <div className="premium-card bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Orders</p>
                    <h3 className="text-3xl font-black text-slate-900 font-display">
                        {parseInt(summary.total_orders).toLocaleString()}
                    </h3>
                </div>

                <div className="premium-card bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Avg. Ticket Size</p>
                    <h3 className="text-3xl font-black text-emerald-600 font-display">
                        {currencySymbol}{parseFloat(summary.average_ticket_size).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                </div>
            </div>

            {/* Top Products Table */}
            <div className="premium-card bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                <h3 className="text-xl font-black text-slate-900 mb-6 font-display">Top Selling Products (All Stores)</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-50 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                <th className="pb-4">Product Name</th>
                                <th className="pb-4">Quantity Sold</th>
                                <th className="pb-4 text-right">Total Sales</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {topProducts.map((product, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 font-bold text-slate-900">{product.product_name}</td>
                                    <td className="py-4 text-slate-600 font-medium">{product.total_quantity}</td>
                                    <td className="py-4 text-right font-black text-indigo-600">
                                        {currencySymbol}{parseFloat(product.total_sales).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
