import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'super_admin' | 'admin' | 'vendedor' | 'tecnico' | null;

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
}

interface UseAuthReturn {
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
}

export function useAuth(): UseAuthReturn {
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

      if (profileError) {
        throw profileError;
      }

      if (data) {
        setProfile(data as UserProfile);
        setError(null);
      } else {
        // Si no hay perfil y tenemos reintentos disponibles, esperar y reintentar
        if (retries > 0) {
          console.log(`Perfil no encontrado, reintentando... (${retries} intentos restantes)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchProfile(userId, retries - 1);
        }

        // Si no hay reintentos disponibles, establecer error
        console.warn('Perfil no encontrado después de varios intentos');
        setProfile(null);
        setError('Perfil no encontrado. Intente cerrar sesión y volver a iniciar.');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar perfil');
      setProfile(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);

        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);

        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError('Error al inicializar autenticación');
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        (async () => {
          setSession(newSession);

          if (newSession?.user) {
            await fetchProfile(newSession.user.id);
          } else {
            setProfile(null);
          }
        })();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const role = profile?.role || null;
  const isAuthenticated = !!session;
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'admin';
  const isVendedor = role === 'vendedor';
  const isTecnico = role === 'tecnico';

  const canDelete = isSuperAdmin || isAdmin;
  const canEdit = isSuperAdmin || isAdmin || isVendedor;
  const canCreate = isSuperAdmin || isAdmin || isVendedor;

  return {
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
    canDelete,
    canEdit,
    canCreate,
  };
}
