import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Wallet, 
  AlertCircle,
  Package,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { blink } from '../lib/blink';
import { formatCurrency } from '../lib/utils';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    totalBalance: 0,
    customerCount: 0,
    activeBatches: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [customers, purchases, batches] = await Promise.all([
          blink.db.table('customers').count(),
          blink.db.table('purchases').list(),
          blink.db.table('batches').list({ where: { is_balanced: "0" } })
        ]);

        const revenue = purchases.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);
        const balance = purchases.reduce((sum, p) => sum + (Number(p.balance) || 0), 0);
        
        // Simplified profit for dashboard - more detailed in Reports
        // Usually profit = revenue - (total_cost + tax + expenses)
        // For now just showing a placeholder calculation
        
        setStats({
          totalRevenue: revenue,
          totalProfit: revenue * 0.15, // Placeholder: 15% margin for overview
          totalBalance: balance,
          customerCount: Number(customers),
          activeBatches: batches.length
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    {
      name: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: TrendingUp,
      color: 'bg-emerald-50 text-emerald-600',
      trend: '+12.5%',
      isUp: true
    },
    {
      name: 'Estimated Profit',
      value: formatCurrency(stats.totalProfit),
      icon: Wallet,
      color: 'bg-blue-50 text-blue-600',
      trend: '+8.2%',
      isUp: true
    },
    {
      name: 'Unpaid Balances',
      value: formatCurrency(stats.totalBalance),
      icon: AlertCircle,
      color: 'bg-amber-50 text-amber-600',
      trend: '-2.4%',
      isUp: false
    },
    {
      name: 'Total Customers',
      value: stats.customerCount.toString(),
      icon: Users,
      color: 'bg-indigo-50 text-indigo-600',
      trend: '+4',
      isUp: true
    },
  ];

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-32 bg-zinc-200 rounded-xl" />)}
    </div>
  </div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">Keep track of your egg business performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.name} className="card-premium p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2 rounded-lg", card.color)}>
                <card.icon className="h-6 w-6" />
              </div>
              <div className={cn(
                "flex items-center text-xs font-medium px-2 py-1 rounded-full",
                card.isUp ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
              )}>
                {card.isUp ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {card.trend}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{card.name}</p>
              <h3 className="text-2xl font-bold mt-1">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Active Batches</h3>
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            {stats.activeBatches === 0 ? (
              <p className="text-muted-foreground text-center py-8">No active batches. Create one to get started.</p>
            ) : (
              <p className="text-sm text-muted-foreground">You have {stats.activeBatches} batches currently active and awaiting balancing.</p>
            )}
          </div>
        </div>

        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Recent Alerts</h3>
            <Bell className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            {stats.totalBalance > 100000 && (
              <div className="flex items-start p-3 bg-amber-50 text-amber-800 rounded-lg text-sm">
                <AlertCircle className="h-5 w-5 mr-3 shrink-0" />
                <div>
                  <p className="font-semibold">High Outstanding Balance</p>
                  <p className="opacity-90">Total unpaid customer balance has exceeded ₦100,000.</p>
                </div>
              </div>
            )}
            <p className="text-muted-foreground text-center py-4 text-sm italic">All systems clear.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
