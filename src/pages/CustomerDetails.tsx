import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Users, 
  ArrowLeft, 
  Phone, 
  Mail, 
  ShoppingBag, 
  Clock, 
  Wallet,
  Loader2,
  Calendar,
  ChevronRight,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import { blink } from '../lib/blink';
import { formatCurrency, cn } from '../lib/utils';

interface Customer {
  id: string;
  name: string;
  email: string;
  mobile: string;
  created_at: string;
}

interface Purchase {
  id: string;
  batch_id: string;
  batch_name?: string;
  total_amount: number;
  cash_paid: number;
  balance: number;
  created_at: string;
  paid_date?: string;
}

interface SizeReport {
  size_name: string;
  total_quantity: number;
  total_spent: number;
}

export default function CustomerDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sizeReports, setSizeReports] = useState<SizeReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!id) return;
    try {
      const [customerData, purchasesData, itemsData, batchesData] = await Promise.all([
        blink.db.table<Customer>('customers').get(id),
        blink.db.table<Purchase>('purchases').list({ where: { customer_id: id }, orderBy: { created_at: 'desc' } }),
        blink.db.table('purchase_items').list(),
        blink.db.table('batches').list()
      ]);

      if (!customerData) {
        toast.error('Customer not found');
        navigate('/customers');
        return;
      }

      setCustomer(customerData);

      // Attach batch names
      const enhancedPurchases = purchasesData.map(p => ({
        ...p,
        batch_name: batchesData.find((b: any) => b.id === p.batch_id)?.name || 'Deleted Batch'
      }));
      setPurchases(enhancedPurchases);

      // Calculate size reports
      const customerPurchaseIds = purchasesData.map(p => p.id);
      const customerItems = itemsData.filter((item: any) => customerPurchaseIds.includes(item.purchase_id));
      
      const sizeMap = new Map<string, SizeReport>();
      customerItems.forEach((item: any) => {
        const existing = sizeMap.get(item.size_name) || { size_name: item.size_name, total_quantity: 0, total_spent: 0 };
        existing.total_quantity += Number(item.quantity);
        existing.total_spent += Number(item.quantity) * Number(item.price_per_unit);
        sizeMap.set(item.size_name, existing);
      });

      setSizeReports(Array.from(sizeMap.values()));

    } catch (error) {
      toast.error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading || !customer) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalSpent = purchases.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);
  const currentBalance = purchases.reduce((sum, p) => sum + (Number(p.balance) || 0), 0);

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/customers" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{customer.name}</h2>
          <p className="text-muted-foreground">Customer since {new Date(customer.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile & Stats */}
        <div className="lg:col-span-1 space-y-8">
          <div className="card-premium p-6">
            <h3 className="font-bold mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-center text-sm">
                <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mr-3">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Mobile</p>
                  <p className="font-medium">{customer.mobile || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center text-sm">
                <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mr-3">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Email</p>
                  <p className="font-medium">{customer.email || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card-premium p-6 bg-primary text-primary-foreground">
            <h3 className="font-bold mb-6 flex items-center">
              <Wallet className="h-5 w-5 mr-2" />
              Account Balance
            </h3>
            <div className="space-y-1">
              <p className="text-sm opacity-80">Total Outstanding Balance</p>
              <p className="text-4xl font-bold">{formatCurrency(currentBalance)}</p>
            </div>
            <div className="mt-8 pt-6 border-t border-white/20 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs opacity-70 uppercase font-bold">Total Spent</p>
                <p className="text-lg font-bold">{formatCurrency(totalSpent)}</p>
              </div>
              <div>
                <p className="text-xs opacity-70 uppercase font-bold">Total Orders</p>
                <p className="text-lg font-bold">{purchases.length}</p>
              </div>
            </div>
          </div>

          <div className="card-premium p-6">
            <h3 className="font-bold mb-4 flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Size Summary
            </h3>
            {sizeReports.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 italic">No order history available.</p>
            ) : (
              <div className="space-y-4">
                {sizeReports.map((report) => (
                  <div key={report.size_name} className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">{report.size_name}</p>
                      <p className="text-xs text-muted-foreground">{report.total_quantity} units total</p>
                    </div>
                    <p className="font-bold text-sm">{formatCurrency(report.total_spent)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order History */}
        <div className="lg:col-span-2 space-y-8">
          <div className="card-premium p-6">
            <h3 className="font-bold text-lg mb-6 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Order History
            </h3>

            {purchases.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-xl">
                <p className="text-muted-foreground">This customer hasn't made any purchases yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {purchases.map((purchase) => (
                  <div key={purchase.id} className="p-4 border rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-secondary rounded-lg">
                          <ShoppingBag className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold">{purchase.batch_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center mt-0.5">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(purchase.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Total</p>
                          <p className="font-bold">{formatCurrency(purchase.total_amount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Paid</p>
                          <p className="font-bold text-emerald-600">{formatCurrency(purchase.cash_paid)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Balance</p>
                          <p className={cn(
                            "font-bold px-2 py-0.5 rounded",
                            Number(purchase.balance) > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                          )}>
                            {formatCurrency(purchase.balance)}
                          </p>
                        </div>
                        <Link 
                          to={`/batches/${purchase.batch_id}`}
                          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
