import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Package, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { blink } from '../lib/blink';
import { formatCurrency, cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

interface Batch {
  id: string;
  name: string;
  cost_price: number;
  tax_rate: number;
  expenses: number;
  is_balanced: number;
  created_at: string;
}

export default function Batches() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const { isAdmin } = useAuth();

  const fetchBatches = async () => {
    try {
      const data = await blink.db.table<Batch>('batches').list({
        orderBy: { created_at: 'desc' }
      });
      setBatches(data);
    } catch (error) {
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleAddBatch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const costPrice = Number(formData.get('costPrice'));
    const taxRate = Number(formData.get('taxRate'));
    const expenses = Number(formData.get('expenses'));

    try {
      await blink.db.table('batches').create({
        name,
        cost_price: costPrice,
        tax_rate: taxRate,
        expenses: expenses,
        is_balanced: 0
      });
      toast.success('Batch created successfully');
      setShowAddModal(false);
      fetchBatches();
    } catch (error) {
      toast.error('Failed to create batch');
    }
  };

  const filteredBatches = batches.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Item Batches</h2>
          <p className="text-muted-foreground">Manage your egg stock batches and track profit.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center justify-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create New Batch
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search batches..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </div>
        <button className="p-2 border rounded-lg hover:bg-secondary transition-colors">
          <Filter className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="text-center py-12 card-premium">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No batches found</h3>
          <p className="text-muted-foreground">Start by creating your first egg batch.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBatches.map((batch) => (
            <Link 
              key={batch.id} 
              to={`/batches/${batch.id}`}
              className="card-premium p-6 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 group-hover:bg-primary/10 transition-colors">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  Number(batch.is_balanced) > 0 
                    ? "bg-emerald-50 text-emerald-600" 
                    : "bg-amber-50 text-amber-600"
                )}>
                  {Number(batch.is_balanced) > 0 ? 'Balanced' : 'Active'}
                </div>
              </div>
              <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{batch.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Created: {new Date(batch.created_at).toLocaleDateString()}
              </p>
              
              <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Cost Price</p>
                  <p className="font-semibold">{formatCurrency(batch.cost_price)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Expenses</p>
                  <p className="font-semibold">{formatCurrency(batch.expenses)}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                View Details
                <ChevronRight className="ml-1 h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl p-6 border animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-4">Create New Batch</h3>
            <form onSubmit={handleAddBatch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Batch Name</label>
                <input 
                  name="name" 
                  required 
                  placeholder="e.g. Batch #2024-001"
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cost Price (₦)</label>
                  <input 
                    name="costPrice" 
                    type="number" 
                    defaultValue="0"
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expenses (₦)</label>
                  <input 
                    name="expenses" 
                    type="number" 
                    defaultValue="0"
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
                <input 
                  name="taxRate" 
                  type="number" 
                  defaultValue="0"
                  step="0.1"
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 btn-primary"
                >
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
