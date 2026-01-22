import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Receipt, 
  Scale,
  Download,
  Calendar,
  Filter,
  Package,
  Loader2
} from 'lucide-react';
import { blink } from '../lib/blink';
import { formatCurrency, cn } from '../lib/utils';

interface BatchStats {
  id: string;
  name: string;
  revenue: number;
  cost: number;
  expenses: number;
  tax: number;
  profit: number;
  tithe: number;
  margin: number;
  is_balanced: boolean;
}

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<BatchStats[]>([]);
  const [timeframe, setTimeframe] = useState('all');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [batchesData, purchasesData] = await Promise.all([
          blink.db.table('batches').list({ orderBy: { created_at: 'desc' } }),
          blink.db.table('purchases').list()
        ]);

        const stats: BatchStats[] = batchesData.map((b: any) => {
          const batchPurchases = purchasesData.filter((p: any) => p.batch_id === b.id);
          const revenue = batchPurchases.reduce((sum, p: any) => sum + (Number(p.total_amount) || 0), 0);
          const cost = Number(b.cost_price) || 0;
          const expenses = Number(b.expenses) || 0;
          const tax = revenue * (Number(b.tax_rate) / 100);
          
          const profit = revenue - cost - expenses - tax;
          const tithe = profit > 0 ? profit * 0.1 : 0;
          const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

          return {
            id: b.id,
            name: b.name,
            revenue,
            cost,
            expenses,
            tax,
            profit,
            tithe,
            margin,
            is_balanced: Number(b.is_balanced) > 0
          };
        });

        setBatches(stats);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const totalRevenue = batches.reduce((sum, b) => sum + b.revenue, 0);
  const totalProfit = batches.reduce((sum, b) => sum + b.profit, 0);
  const totalTithe = batches.reduce((sum, b) => sum + b.tithe, 0);
  const totalExpenses = batches.reduce((sum, b) => sum + b.expenses + b.tax, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Financial Reports</h2>
          <p className="text-muted-foreground">Detailed breakdown of profit, tithe, and tax per batch.</p>
        </div>
        <button className="btn-secondary flex items-center justify-center">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-premium p-6">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Sales</p>
          <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
          <div className="mt-4 flex items-center text-xs text-emerald-600">
            <TrendingUp className="h-3 w-3 mr-1" />
            Gross Income
          </div>
        </div>
        <div className="card-premium p-6">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Net Profit</p>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalProfit)}</p>
          <div className="mt-4 flex items-center text-xs text-emerald-600">
            <TrendingUp className="h-3 w-3 mr-1" />
            After Tax & Expenses
          </div>
        </div>
        <div className="card-premium p-6">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Tithe (10%)</p>
          <p className="text-2xl font-bold text-indigo-600">{formatCurrency(totalTithe)}</p>
          <div className="mt-4 flex items-center text-xs text-indigo-600 font-medium">
            <Receipt className="h-3 w-3 mr-1" />
            Mandatory Deduction
          </div>
        </div>
        <div className="card-premium p-6">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Overheads</p>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalExpenses)}</p>
          <div className="mt-4 flex items-center text-xs text-amber-600">
            <Scale className="h-3 w-3 mr-1" />
            Tax + Item Expenses
          </div>
        </div>
      </div>

      {/* Batch Breakdown Table */}
      <div className="card-premium overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="font-bold text-lg">Batch-by-Batch Analysis</h3>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <select 
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="text-sm bg-transparent border-none focus:ring-0 cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-left">
                <th className="px-6 py-4 font-bold">Batch Name</th>
                <th className="px-6 py-4 font-bold">Revenue</th>
                <th className="px-6 py-4 font-bold">Profit</th>
                <th className="px-6 py-4 font-bold">Tithe</th>
                <th className="px-6 py-4 font-bold">Margin</th>
                <th className="px-6 py-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 font-bold">{batch.name}</td>
                  <td className="px-6 py-4">{formatCurrency(batch.revenue)}</td>
                  <td className="px-6 py-4 text-emerald-600 font-bold">{formatCurrency(batch.profit)}</td>
                  <td className="px-6 py-4 text-indigo-600 font-medium">{formatCurrency(batch.tithe)}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-bold",
                      batch.margin > 20 ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-700"
                    )}>
                      {batch.margin.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "flex items-center gap-1.5",
                      batch.is_balanced ? "text-emerald-600" : "text-amber-600"
                    )}>
                      <div className={cn("h-1.5 w-1.5 rounded-full", batch.is_balanced ? "bg-emerald-600" : "bg-amber-600")} />
                      {batch.is_balanced ? 'Balanced' : 'Active'}
                    </div>
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
