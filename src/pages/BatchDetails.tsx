import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Package, 
  ChevronLeft, 
  Edit2, 
  Trash2, 
  Plus, 
  ShoppingBag,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
  UserPlus
} from 'lucide-react';
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

interface EggSize {
  id: string;
  batch_id: string;
  size_name: string;
  price: number;
  stock_quantity: number;
}

interface Purchase {
  id: string;
  customer_id: string;
  customer_name?: string;
  total_amount: number;
  cash_paid: number;
  balance: number;
  created_at: string;
}

export default function BatchDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  
  const [batch, setBatch] = useState<Batch | null>(null);
  const [sizes, setSizes] = useState<EggSize[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showEditBatch, setShowEditBatch] = useState(false);
  const [showAddSize, setShowAddSize] = useState(false);
  const [showAddPurchase, setShowAddPurchase] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    try {
      const [batchData, sizesData, purchasesData, customers] = await Promise.all([
        blink.db.table<Batch>('batches').get(id),
        blink.db.table<EggSize>('egg_sizes').list({ where: { batch_id: id } }),
        blink.db.table<Purchase>('purchases').list({ where: { batch_id: id }, orderBy: { created_at: 'desc' } }),
        blink.db.table('customers').list()
      ]);

      if (!batchData) {
        toast.error('Batch not found');
        navigate('/batches');
        return;
      }

      setBatch(batchData);
      setSizes(sizesData);
      
      // Attach customer names to purchases
      const purchasesWithNames = purchasesData.map(p => ({
        ...p,
        customer_name: customers.find((c: any) => c.id === p.customer_id)?.name || 'Unknown'
      }));
      setPurchases(purchasesWithNames);

    } catch (error) {
      toast.error('Failed to load batch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDeletePurchase = async (purchaseId: string) => {
    if (!window.confirm('Are you sure you want to delete this purchase record?')) return;
    try {
      await blink.db.table('purchases').delete(purchaseId);
      toast.success('Purchase deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete purchase');
    }
  };

  if (loading || !batch) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleDeleteBatch = async () => {
    if (!window.confirm('Are you sure you want to delete this batch? All related data will be lost.')) return;
    try {
      await blink.db.table('batches').delete(batch.id);
      toast.success('Batch deleted');
      navigate('/batches');
    } catch (error) {
      toast.error('Failed to delete batch');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/batches" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{batch.name}</h2>
              <div className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                Number(batch.is_balanced) > 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              )}>
                {Number(batch.is_balanced) > 0 ? 'Balanced' : 'Active'}
              </div>
            </div>
            <p className="text-muted-foreground">Created on {new Date(batch.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowEditBatch(true)}
              className="p-2 border rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button 
              onClick={handleDeleteBatch}
              className="p-2 border border-destructive/20 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info & Sizes */}
        <div className="lg:col-span-1 space-y-8">
          {/* Batch Info Card */}
          <div className="card-premium p-6">
            <h3 className="font-bold mb-4 flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Financial Details
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground text-sm">Cost Price</span>
                <span className="font-semibold">{formatCurrency(batch.cost_price)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground text-sm">Expenses</span>
                <span className="font-semibold">{formatCurrency(batch.expenses)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground text-sm">Tax Rate</span>
                <span className="font-semibold">{batch.tax_rate}%</span>
              </div>
            </div>
          </div>

          {/* Inventory Sizes Card */}
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center">
                <Package className="h-4 w-4 mr-2 text-primary" />
                Egg Sizes & Pricing
              </h3>
              <button 
                onClick={() => setShowAddSize(true)}
                className="p-1 hover:bg-secondary rounded transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {sizes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 italic">No sizes defined for this batch.</p>
            ) : (
              <div className="space-y-3">
                {sizes.map((size) => (
                  <div key={size.id} className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">{size.size_name}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(size.price)} / unit</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium uppercase tracking-tighter text-muted-foreground">Stock</p>
                      <p className="font-mono text-sm">{size.stock_quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Purchases */}
        <div className="lg:col-span-2 space-y-8">
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2" />
                Purchases
              </h3>
              <button 
                onClick={() => setShowAddPurchase(true)}
                className="btn-primary flex items-center text-sm py-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Purchase
              </button>
            </div>

            {purchases.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-xl">
                <p className="text-muted-foreground">No purchases yet. Start recording sales.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="pb-4 font-semibold text-sm">Date</th>
                      <th className="pb-4 font-semibold text-sm">Customer</th>
                      <th className="pb-4 font-semibold text-sm">Total</th>
                      <th className="pb-4 font-semibold text-sm">Paid</th>
                      <th className="pb-4 font-semibold text-sm text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {purchases.map((purchase) => (
                      <tr key={purchase.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="py-4 text-sm text-muted-foreground">
                          {new Date(purchase.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 font-medium">{purchase.customer_name}</td>
                        <td className="py-4 text-sm">{formatCurrency(purchase.total_amount)}</td>
                        <td className="py-4 text-sm text-emerald-600 font-medium">
                          {formatCurrency(purchase.cash_paid)}
                        </td>
                        <td className="py-4 text-sm text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className={cn(
                              "px-2 py-1 rounded text-xs font-bold",
                              Number(purchase.balance) > 0 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                            )}>
                              {formatCurrency(purchase.balance)}
                            </span>
                            {isAdmin && (
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDeletePurchase(purchase.id);
                                }}
                                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Size Modal */}
      {showAddSize && (
        <AddSizeModal 
          batchId={batch.id} 
          onClose={() => setShowAddSize(false)} 
          onSuccess={fetchData} 
        />
      )}

      {/* Add Purchase Modal */}
      {showAddPurchase && (
        <AddPurchaseModal 
          batch={batch}
          sizes={sizes}
          onClose={() => setShowAddPurchase(false)} 
          onSuccess={fetchData} 
        />
      )}
    </div>
  );
}

// Modal Components
function AddSizeModal({ batchId, onClose, onSuccess }: { batchId: string, onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await blink.db.table('egg_sizes').create({
        batch_id: batchId,
        size_name: formData.get('name'),
        price: Number(formData.get('price')),
        stock_quantity: Number(formData.get('stock')),
      });
      toast.success('Size added');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to add size');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 border animate-in fade-in zoom-in duration-200">
        <h3 className="text-xl font-bold mb-4">Add Egg Size</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Size Name</label>
            <input name="name" required placeholder="e.g. Extra Large" className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Price (₦)</label>
              <input name="price" type="number" required placeholder="0" className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stock Qty</label>
              <input name="stock" type="number" required placeholder="0" className="w-full px-4 py-2 border rounded-lg" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Save Size'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddPurchaseModal({ batch, sizes, onClose, onSuccess }: { batch: Batch, sizes: EggSize[], onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [items, setItems] = useState<{sizeId: string, quantity: number}[]>([]);
  const [cashPaid, setCashPaid] = useState(0);
  const [previousBalance, setPreviousBalance] = useState(0);

  useEffect(() => {
    const fetchCustomers = async () => {
      const data = await blink.db.table('customers').list();
      setCustomers(data);
    };
    fetchCustomers();
  }, []);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!selectedCustomerId) {
        setPreviousBalance(0);
        return;
      }
      // Sum all balances for this customer across all batches
      const purchases = await blink.db.table('purchases').list({
        where: { customer_id: selectedCustomerId }
      });
      const totalBalance = purchases.reduce((sum, p) => sum + (Number(p.balance) || 0), 0);
      setPreviousBalance(totalBalance);
    };
    fetchBalance();
  }, [selectedCustomerId]);

  const addItem = () => {
    if (sizes.length === 0) return;
    setItems([...items, { sizeId: sizes[0].id, quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const totalAmount = items.reduce((sum, item) => {
    const size = sizes.find(s => s.id === item.sizeId);
    return sum + (size?.price || 0) * item.quantity;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return toast.error('Select a customer');
    if (items.length === 0) return toast.error('Add at least one item');
    
    setLoading(true);
    try {
      // 1. AUTO-BALANCING LOGIC
      // If customer has previous debt, apply cashPaid to old purchases first
      let remainingCash = cashPaid;
      
      if (previousBalance > 0 && remainingCash > 0) {
        const oldPurchases = await blink.db.table('purchases').list({
          where: { customer_id: selectedCustomerId, balance: { gt: 0 } },
          orderBy: { created_at: 'asc' }
        });

        let clearedCount = 0;
        for (const op of oldPurchases) {
          if (remainingCash <= 0) break;
          const currentBalance = Number(op.balance);
          const payment = Math.min(remainingCash, currentBalance);
          
          await blink.db.table('purchases').update(op.id, {
            cash_paid: Number(op.cash_paid) + payment,
            balance: currentBalance - payment,
            paid_date: currentBalance - payment === 0 ? new Date().toISOString() : op.paid_date
          });
          
          if (currentBalance - payment === 0) clearedCount++;
          remainingCash -= payment;
        }

        if (clearedCount > 0) {
          const customerName = customers.find(c => c.id === selectedCustomerId)?.name || 'A customer';
          await blink.db.table('notifications').create({
            user_id: user?.id,
            title: 'Payment Cleared',
            message: `${clearedCount} old debt(s) cleared for ${customerName}.`,
            type: 'success'
          });
        }
      }

      // 2. CREATE NEW PURCHASE
      const newPurchaseTotal = totalAmount;
      const newBalance = Math.max(0, newPurchaseTotal - remainingCash);
      const appliedCash = Math.min(remainingCash, newPurchaseTotal);

      const purchase = await blink.db.table('purchases').create({
        batch_id: batch.id,
        customer_id: selectedCustomerId,
        total_amount: newPurchaseTotal,
        cash_paid: appliedCash,
        balance: newBalance,
        paid_date: newBalance === 0 ? new Date().toISOString() : null
      });

      // 3. CREATE PURCHASE ITEMS & UPDATE STOCK
      await Promise.all(items.map(async (item) => {
        const size = sizes.find(s => s.id === item.sizeId)!;
        await blink.db.table('purchase_items').create({
          purchase_id: purchase.id,
          size_name: size.size_name,
          quantity: item.quantity,
          price_per_unit: size.price
        });
        
        // Update stock
        await blink.db.table('egg_sizes').update(size.id, {
          stock_quantity: Math.max(0, size.stock_quantity - item.quantity)
        });
      }));

      toast.success('Purchase recorded');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to record purchase');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchCustomer.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl p-6 border overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <h3 className="text-xl font-bold mb-6 flex items-center">
          <ShoppingBag className="h-5 w-5 mr-2" />
          Add New Purchase
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select Customer</label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Search customers..." 
                    value={searchCustomer}
                    onChange={(e) => setSearchCustomer(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                  />
                </div>
                <select 
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800"
                  required
                >
                  <option value="">-- Select --</option>
                  {filteredCustomers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {previousBalance > 0 && (
                <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-xs flex items-start">
                  <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
                  <div>
                    <p className="font-bold">Outstanding Debt: {formatCurrency(previousBalance)}</p>
                    <p className="opacity-80">Payments will first be applied to clear this balance.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cash Paid (₦)</label>
                <input 
                  type="number" 
                  value={cashPaid}
                  onChange={(e) => setCashPaid(Number(e.target.value))}
                  className="w-full px-4 py-3 border rounded-lg text-xl font-bold text-emerald-600"
                  placeholder="0"
                />
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Order Total:</span>
                  <span className="font-bold">{formatCurrency(totalAmount)}</span>
                </div>
                {previousBalance > 0 && (
                  <div className="flex justify-between text-sm text-amber-600">
                    <span>Previous Debt:</span>
                    <span>{formatCurrency(previousBalance)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                  <span>Grand Total Due:</span>
                  <span>{formatCurrency(totalAmount + previousBalance)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm">Order Items</h4>
              <button 
                type="button" 
                onClick={addItem}
                className="text-primary text-xs font-bold hover:underline"
              >
                + Add Another Size
              </button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-4 items-end p-3 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Size</label>
                    <select 
                      value={item.sizeId}
                      onChange={(e) => updateItem(index, 'sizeId', e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-zinc-800 text-sm"
                    >
                      {sizes.map(s => (
                        <option key={s.id} value={s.id}>{s.size_name} ({formatCurrency(s.price)})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Qty</label>
                    <input 
                      type="number" 
                      value={item.quantity}
                      min="1"
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-zinc-800 text-sm"
                    />
                  </div>
                  <div className="w-24 text-right">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Subtotal</p>
                    <p className="text-sm font-bold h-[34px] flex items-center justify-end">
                      {formatCurrency((sizes.find(s => s.id === item.sizeId)?.price || 0) * item.quantity)}
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary py-3">Cancel</button>
            <button 
              type="submit" 
              disabled={loading || items.length === 0}
              className="flex-1 btn-primary py-3 font-bold text-lg"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : 'Confirm Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
