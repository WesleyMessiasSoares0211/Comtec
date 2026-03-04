import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { UserCircle, Shield, Key, Save, Loader2, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function UserProfile() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [userEmail, setUserEmail] = useState('');
  const [profile, setProfile] = useState({
    id: '',
    nombre_completo: '',
    rut: '',
    telefono: '',
    direccion: '',
    role: ''
  });

  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) return;

      setUserEmail(user.email || '');

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (profileData) {
        setProfile({
          id: profileData.id,
          nombre_completo: profileData.nombre_completo || '',
          rut: profileData.rut || '',
          telefono: profileData.telefono || '',
          direccion: profileData.direccion || '',
          role: profileData.role || ''
        });
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar los datos del perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nombre_completo: profile.nombre_completo,
          rut: profile.rut,
          telefono: profile.telefono,
          direccion: profile.direccion
        })
        .eq('id', profile.id);

      if (error) throw error;
      toast.success('Datos personales actualizados correctamente');
    } catch (error) {
      console.error(error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setSavingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword
      });

      if (error) throw error;
      
      toast.success('Contraseña actualizada con éxito');
      setPasswords({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error(error);
      toast.error('Error al cambiar la contraseña');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-2xl flex items-center justify-center shrink-0">
          <UserCircle className="w-8 h-8 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Mi Perfil</h2>
          <div className="flex items-center gap-2 mt-1">
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-sm text-slate-400">{userEmail}</span>
            <span className="ml-2 text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">
              Rol: {profile.role}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* FORMULARIO DE DATOS PERSONALES */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center gap-3">
            <Shield className="w-5 h-5 text-cyan-500" />
            <h3 className="text-white font-bold">Datos Generales</h3>
          </div>
          <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Nombre Completo</label>
              <input 
                type="text" value={profile.nombre_completo} 
                onChange={e => setProfile({...profile, nombre_completo: e.target.value})} 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none transition-all" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">RUT</label>
                <input 
                  type="text" value={profile.rut} 
                  onChange={e => setProfile({...profile, rut: e.target.value})} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none transition-all" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Teléfono</label>
                <input 
                  type="text" value={profile.telefono} 
                  onChange={e => setProfile({...profile, telefono: e.target.value})} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none transition-all" 
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Dirección o Sucursal</label>
              <input 
                type="text" value={profile.direccion} 
                onChange={e => setProfile({...profile, direccion: e.target.value})} 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none transition-all" 
              />
            </div>
            <button 
              type="submit" disabled={savingProfile} 
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl mt-2 flex justify-center items-center gap-2 transition-all disabled:opacity-50"
            >
              {savingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Guardar Datos
            </button>
          </form>
        </div>

        {/* FORMULARIO DE CAMBIO DE CONTRASEÑA */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden h-fit">
          <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center gap-3">
            <Lock className="w-5 h-5 text-orange-500" />
            <h3 className="text-white font-bold">Seguridad y Acceso</h3>
          </div>
          <form onSubmit={handleUpdatePassword} className="p-6 space-y-4">
            <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl mb-4">
              <p className="text-xs text-orange-400 font-medium">
                Si iniciaste sesión con una contraseña temporal, actualízala aquí por una clave segura que solo tú conozcas.
              </p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Nueva Contraseña</label>
              <input 
                type="password" required minLength={6}
                value={passwords.newPassword} 
                onChange={e => setPasswords({...passwords, newPassword: e.target.value})} 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-1 focus:ring-orange-500 outline-none transition-all" 
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Confirmar Contraseña</label>
              <input 
                type="password" required minLength={6}
                value={passwords.confirmPassword} 
                onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-1 focus:ring-orange-500 outline-none transition-all" 
                placeholder="Repite la nueva contraseña"
              />
            </div>
            <button 
              type="submit" disabled={savingPassword} 
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3.5 rounded-xl mt-2 flex justify-center items-center gap-2 transition-all shadow-lg shadow-orange-900/20 disabled:opacity-50"
            >
              {savingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5" />}
              Actualizar Credenciales
            </button>
          </form>
        </div>
      </div>
      
    </div>
  );
}