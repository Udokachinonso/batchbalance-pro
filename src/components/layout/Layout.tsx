import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  Bell, 
  LogOut,
  ChevronRight,
  Menu,
  X,
  UserCircle,
  Check
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { blink } from '../../lib/blink';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { user, userExtra, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      const data = await blink.db.table('notifications').list({
        where: { user_id: user.id, is_read: "0" },
        orderBy: { created_at: 'desc' }
      });
      setNotifications(data);
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Polling for demo
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (id: string) => {
    await blink.db.table('notifications').update(id, { is_read: "1" });
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Item Batches', href: '/batches', icon: Package },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Team Management', href: '/profile', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-white dark:bg-zinc-900 border-r z-50 transition-transform duration-300 lg:relative lg:translate-x-0",
        !sidebarOpen && "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b shrink-0">
            <Package className="h-8 w-8 text-primary mr-2" />
            <span className="text-xl font-bold tracking-tight">BatchBalance</span>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User profile */}
          <div className="p-4 border-t shrink-0">
            <div className="flex items-center px-3 py-2 space-x-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                {userExtra?.avatar ? (
                  <img src={userExtra.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <UserCircle className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userExtra?.username || user?.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{userExtra?.role?.replace('_', ' ') || 'User'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5 shrink-0" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-zinc-900 border-b flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold ml-2 lg:ml-0">
              {navigation.find(n => location.pathname === n.href || (n.href !== '/' && location.pathname.startsWith(n.href)))?.name || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-muted-foreground hover:text-foreground relative"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-destructive rounded-full border-2 border-white dark:border-zinc-900"></span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border rounded-xl shadow-2xl z-[100] animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-bold text-sm">Notifications</h3>
                    <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                      {notifications.length} New
                    </span>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-8 text-center text-sm text-muted-foreground italic">No new notifications</p>
                    ) : (
                      <div className="divide-y">
                        {notifications.map((n) => (
                          <div key={n.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-xs font-bold">{n.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                                <p className="text-[10px] text-muted-foreground mt-2">
                                  {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <button 
                                onClick={() => markAsRead(n.id)}
                                className="p-1 text-muted-foreground hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
