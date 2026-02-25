// FILE: src/hooks/useAuth.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'super_admin' | 'admin' | 'vendedor' | 'tecnico' | null;

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isVendedor: boolean;
  isTecnico: boolean;
  canDelete: boolean;
  canEdit: boolean;
  canCreate: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (userId: string, retries = 3): Promise<void> => {
    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      if (data) {
        setProfile(data as UserProfile);
        setError(null);
      } else {
        if (retries > 0) {
          setTimeout(() => fetchProfile(userId, retries - 1), 1000);
        } else {
          console.warn('Perfil no encontrado');
          setProfile(null);
        }
      }
    } catch (err: any) {
      console.error('Error profile:', err);
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(currentSession);
          if (currentSession?.user) {
            await fetchProfile(currentSession.user.id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (mounted) {
        setSession(newSession);
        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const role = profile?.role || null;
  const isAuthenticated = !!session;
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'admin';
  const isVendedor = role === 'vendedor';
  const isTecnico = role === 'tecnico';

  const value = {
    session,
    profile,
    role,
    loading,
    error,
    isAuthenticated,
    isSuperAdmin,
    isAdmin,
    isVendedor,
    isTecnico,
    canDelete: isSuperAdmin || isAdmin,
    canEdit: isSuperAdmin || isAdmin || isVendedor,
    canCreate: isSuperAdmin || isAdmin || isVendedor,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}