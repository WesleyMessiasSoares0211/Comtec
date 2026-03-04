import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Key, ShieldAlert, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onSuccess: () => void;
  userEmail?: string;
}

export default function ForcePasswordChange({ onSuccess, userEmail }: Props) {
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Error de sesión");

      // 1. Actualizamos la contraseña en Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwords.newPassword
      });

      if (updateError) throw updateError;

      // 2. Apagamos la bandera de seguridad en la tabla profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ requires_password_change: false })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast.success('¡Contraseña establecida con éxito!');
      onSuccess(); // Libera el bloqueo de pantalla

    } catch (error) {
      console.error(error);
      toast.error('Error al actualizar la contraseña. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-500">
        
        <div className="p-8 text-center border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950">
          <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/10">
            <ShieldAlert className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Actualización Requerida</h2>
          <p className="text-sm text-slate-400 mt-2">
            Por políticas de seguridad, debes cambiar tu contraseña temporal antes de acceder al sistema CRM.
          </p>
          {userEmail && (
            <div className="mt-4 py-1.5 px-3 bg-slate-950 rounded-lg inline-block border border-slate-800">
              <span className="text-xs font-mono text-cyan-400">{userEmail}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Nueva Contraseña Definitiva</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="password" required minLength={6}
                value={passwords.newPassword} 
                onChange={e => setPasswords({...passwords, newPassword: e.target.value})} 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-1 focus:ring-orange-500 outline-none transition-all shadow-inner" 
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>
          
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Confirmar Contraseña</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="password" required minLength={6}
                value={passwords.confirmPassword} 
                onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-1 focus:ring-orange-500 outline-none transition-all shadow-inner" 
                placeholder="Repite la nueva contraseña"
              />
            </div>
          </div>

          <button 
            type="submit" disabled={loading} 
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-xl mt-4 flex justify-center items-center gap-2 transition-all shadow-lg shadow-orange-900/40 disabled:opacity-50 active:scale-95"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Establecer y Entrar'}
          </button>
        </form>
      </div>
      
      <p className="mt-8 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
        Comtec Industrial Solutions © {new Date().getFullYear()}
      </p>
    </div>
  );
}