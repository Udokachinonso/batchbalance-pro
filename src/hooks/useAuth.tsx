import React, { createContext, useContext, useEffect, useState } from 'react';
import { blink } from '../lib/blink';
import type { BlinkUser } from '@blinkdotnew/sdk';

interface UserExtra {
  id: string;
  username: string;
  mobile: string;
  role: 'super_admin' | 'sales_team';
  avatar?: string;
  dob?: string;
  date_joined: string;
}

interface AuthContextType {
  user: BlinkUser | null;
  userExtra: UserExtra | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  refreshUserExtra: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<BlinkUser | null>(null);
  const [userExtra, setUserExtra] = useState<UserExtra | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserExtra = async (userId?: string) => {
    const id = userId || user?.id;
    if (!id) return;
    try {
      const extra = await blink.db.table<UserExtra>('users_extra').get(id);
      setUserExtra(extra);
    } catch (error) {
      console.error('Error fetching user extra:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged(async (state) => {
      setUser(state.user);
      if (state.user) {
        await refreshUserExtra(state.user.id);
      } else {
        setUserExtra(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logout = async () => {
    await blink.auth.signOut();
  };

  const isAdmin = userExtra?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{ user, userExtra, loading, isAdmin, logout, refreshUserExtra }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
