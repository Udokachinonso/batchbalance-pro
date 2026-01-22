import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Mail, Lock, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { blink } from '../lib/blink';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFirstUser, setIsFirstUser] = useState(false);
  const navigate = useNavigate();
  const { refreshUserExtra } = useAuth();

  useEffect(() => {
    const checkUsers = async () => {
      try {
        const count = await blink.db.table('users_extra').count();
        if (count === 0) {
          setIsFirstUser(true);
          setIsRegistering(true);
        }
      } catch (error) {
        console.error('Error checking users:', error);
      }
    };
    checkUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegistering) {
        // Sign up
        const { user } = await blink.auth.signUp({ email, password });
        
        // Create user extra record
        await blink.db.table('users_extra').create({
          id: user.id,
          username: email.split('@')[0],
          role: isFirstUser ? 'super_admin' : 'sales_team',
          date_joined: new Date().toISOString(),
        });
        
        await refreshUserExtra();
        toast.success(isFirstUser ? 'Super Admin account created' : 'Account created');
      } else {
        // Sign in
        await blink.auth.signInWithEmail(email, password);
        await refreshUserExtra();
        toast.success('Signed in successfully');
      }
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-2xl border shadow-xl">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary mb-4 shadow-lg shadow-primary/20">
            <Package className="h-10 w-10 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">BatchBalance Pro</h2>
          <p className="text-muted-foreground mt-2">
            {isFirstUser 
              ? 'First time setup: Create Super Admin' 
              : (isRegistering ? 'Create your account' : 'Sign in to your account')}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center py-3 text-base"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              isRegistering ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        {!isFirstUser && (
          <div className="text-center mt-4">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              {isRegistering ? 'Already have an account? Sign in' : 'New here? Create an account'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
