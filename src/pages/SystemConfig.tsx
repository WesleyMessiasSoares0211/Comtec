import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth, UserRole } from '../hooks/useAuth';
import {
  Settings,
  Users,
  Shield,
  AlertCircle,
  CheckCircle,
  Loader,
  Crown,
  UserCog,
  UserCheck,
  Wrench
} from 'lucide-react';
import { ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_COLORS } from '../utils/roleUtils';

interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export default function SystemConfig() {
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchUsers();
    }
  }, [isSuperAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setUsers(data as UserProfile[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    setUpdatingUserId(userId);
    setError(null);
    setSuccessMessage(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (updateError) throw updateError;

      setSuccessMessage(`Rol actualizado exitosamente a ${ROLE_LABELS[newRole as string]}`);
      await fetchUsers();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar rol');
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900/50 border border-red-500/30 rounded-xl p-8 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-red-400" />
            <h2 className="text-xl font-bold text-white">Acceso Denegado</h2>
          </div>
          <p className="text-slate-400">
            Esta sección solo está disponible para usuarios con rol <span className="text-purple-400 font-bold">Super Admin</span>.
          </p>
        </div>
      </div>
    );
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="w-4 h-4" />;
      case 'admin':
        return <UserCog className="w-4 h-4" />;
      case 'vendedor':
        return <UserCheck className="w-4 h-4" />;
      case 'tecnico':
        return <Wrench className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Configuración del Sistema</h1>
          </div>
          <p className="text-slate-400 ml-16">Gestión de usuarios y permisos (Solo Super Admin)</p>
        </div>

        {successMessage && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg backdrop-blur-sm">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-400 text-sm">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-slate-900/50 border border-slate-700/80 rounded-xl overflow-hidden backdrop-blur-sm shadow-2xl">
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-b border-slate-700 px-6 py-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Gestión de Usuarios y Roles</h2>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center gap-4 py-12">
                <Loader className="w-8 h-8 text-cyan-500 animate-spin" />
                <p className="text-slate-400 text-sm">Cargando usuarios...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500">No hay usuarios registrados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-5 hover:border-cyan-500/50 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 bg-gradient-to-r ${ROLE_COLORS[user.role as string]} rounded-lg`}>
                            {getRoleIcon(user.role)}
                          </div>
                          <div>
                            <p className="text-white font-semibold">{user.email}</p>
                            <p className="text-xs text-slate-500">ID: {user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                        <p className="text-sm text-slate-400 ml-12">
                          {ROLE_DESCRIPTIONS[user.role as string]}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 md:w-64">
                        <label className="text-xs text-slate-400 font-medium">Cambiar Rol:</label>
                        <select
                          value={user.role || ''}
                          onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                          disabled={updatingUserId === user.id}
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="super_admin">Super Admin</option>
                          <option value="admin">Administrador</option>
                          <option value="vendedor">Vendedor</option>
                          <option value="tecnico">Técnico</option>
                        </select>
                        {updatingUserId === user.id && (
                          <div className="flex items-center gap-2 text-cyan-400 text-xs">
                            <Loader className="w-3 h-3 animate-spin" />
                            <span>Actualizando...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-slate-900/30 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            Descripción de Roles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(ROLE_LABELS).map(([role, label]) => (
              <div key={role} className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
                <div className={`p-2 bg-gradient-to-r ${ROLE_COLORS[role]} rounded-lg flex-shrink-0`}>
                  {getRoleIcon(role as UserRole)}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{label}</p>
                  <p className="text-slate-400 text-xs mt-1">{ROLE_DESCRIPTIONS[role]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
