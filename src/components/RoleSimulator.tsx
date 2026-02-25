import React, { useState } from 'react';
import { useAuth, UserRole } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { TestTube2, Crown, UserCog, UserCheck, Wrench, RefreshCw } from 'lucide-react';
import { ROLE_LABELS, ROLE_COLORS } from '../utils/roleUtils';

export default function RoleSimulator() {
  const { profile, role } = useAuth();
  const [isChanging, setIsChanging] = useState(false);

  if (!import.meta.env.DEV) {
    return null;
  }

  if (!profile) {
    return null;
  }

  const changeRole = async (newRole: UserRole) => {
    if (!newRole) return;

    setIsChanging(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profile.id);

      if (error) {
        console.error('Error changing role:', error);
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsChanging(false);
    }
  };

  const getRoleIcon = (roleValue: UserRole) => {
    switch (roleValue) {
      case 'super_admin':
        return <Crown className="w-3 h-3" />;
      case 'admin':
        return <UserCog className="w-3 h-3" />;
      case 'vendedor':
        return <UserCheck className="w-3 h-3" />;
      case 'tecnico':
        return <Wrench className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-slate-900 border-2 border-yellow-500/50 rounded-lg p-4 shadow-2xl shadow-yellow-500/20 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-3">
          <TestTube2 className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400 text-xs font-bold uppercase tracking-wide">
            Debug Mode
          </span>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-slate-400 mb-2">
            Rol Actual: <span className={`text-transparent bg-clip-text bg-gradient-to-r ${ROLE_COLORS[role as string]} font-bold`}>
              {ROLE_LABELS[role as string]}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => changeRole('super_admin')}
              disabled={isChanging || role === 'super_admin'}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                role === 'super_admin'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Crown className="w-3 h-3" />
              Super Admin
            </button>

            <button
              onClick={() => changeRole('admin')}
              disabled={isChanging || role === 'admin'}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                role === 'admin'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <UserCog className="w-3 h-3" />
              Admin
            </button>

            <button
              onClick={() => changeRole('vendedor')}
              disabled={isChanging || role === 'vendedor'}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                role === 'vendedor'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <UserCheck className="w-3 h-3" />
              Vendedor
            </button>

            <button
              onClick={() => changeRole('tecnico')}
              disabled={isChanging || role === 'tecnico'}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                role === 'tecnico'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Wrench className="w-3 h-3" />
              Técnico
            </button>
          </div>

          {isChanging && (
            <div className="flex items-center gap-2 text-cyan-400 text-xs pt-2">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Cambiando rol...</span>
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-700">
          <p className="text-[10px] text-slate-500 text-center">
            Solo visible en desarrollo
          </p>
        </div>
      </div>
    </div>
  );
}
