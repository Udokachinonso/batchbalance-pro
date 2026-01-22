import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  MoreVertical, 
  ChevronRight, 
  Phone, 
  Mail,
  Loader2,
  Wallet,
  ShoppingBag
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { blink } from '../lib/blink';
import { formatCurrency, cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

interface Customer {
  id: string;
  name: string;
  email: string;
  mobile: string;
  created_at: string;
  total_spent?: number;
  current_balance?: number;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const { isAdmin } = useAuth();

  const fetchCustomers = async () => {
    try {
      const [customersData, purchasesData] = await Promise.all([
        blink.db.table<Customer>('customers').list({ orderBy: { created_at: 'desc' } }),
        blink.db.table('purchases').list()
      ]);

      const enhancedCustomers = customersData.map(c => {
        const customerPurchases = purchasesData.filter((p: any) => p.customer_id === c.id);
        const totalSpent = customerPurchases.reduce((sum, p: any) => sum + (Number(p.total_amount) || 0), 0);
        const currentBalance = customerPurchases.reduce((sum, p: any) => sum + (Number(p.balance) || 0), 0);
        return { ...c, total_spent: totalSpent, current_balance: currentBalance };
      });

      setCustomers(enhancedCustomers);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await blink.db.table('customers').create({
        name: formData.get('name'),
        email: formData.get('email'),
        mobile: formData.get('mobile'),
      });
      toast.success('Customer added successfully');
      setShowAddModal(false);
      fetchCustomers();
    } catch (error) {
      toast.error('Failed to add customer');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground">Manage your customer database and track their order history.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center justify-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Customer
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by name or mobile..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12 card-premium">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No customers found</h3>
          <p className="text-muted-foreground">Add your first customer to start tracking orders.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <Link 
              key={customer.id} 
              to={`/customers/${customer.id}`}
              className="card-premium p-6 group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                {Number(customer.current_balance) > 0 && (
                  <div className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                    Has Balance
                  </div>
                )}
              </div>
              
              <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{customer.name}</h3>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 mr-2" />
                  {customer.mobile || 'No mobile'}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 mr-2" />
                  {customer.email || 'No email'}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Total Spent</p>
                  <p className="text-sm font-bold">{formatCurrency(customer.total_spent || 0)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Balance</p>
                  <p className={cn(
                    "text-sm font-bold",
                    Number(customer.current_balance) > 0 ? "text-amber-600" : "text-emerald-600"
                  )}>
                    {formatCurrency(customer.current_balance || 0)}
                  </p>
                </div>
              </div>

              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="h-5 w-5 text-primary" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl p-6 border animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-4">Add New Customer</h3>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input 
                  name="name" 
                  required 
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mobile Number</label>
                <input 
                  name="mobile" 
                  placeholder="e.g. 08012345678"
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email Address (Optional)</label>
                <input 
                  name="email" 
                  type="email"
                  placeholder="e.g. john@example.com"
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
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
