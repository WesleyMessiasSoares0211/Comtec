import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, Shield, Edit, Trash2, Plus, Search, 
  Loader2, Mail, Ban, CheckCircle, AlertCircle, X 
} from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  nombre_completo?: string;
  rut?: string;
  direccion?: string;
  telefono?: string;
  created_at: string;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modales
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nombre_completo: editingUser.nombre_completo,
          rut: editingUser.rut,
          direccion: editingUser.direccion,
          telefono: editingUser.telefono,
          role: editingUser.role,
        })
        .eq('id', editingUser.id);

      if (error) throw error;
      toast.success('Usuario actualizado correctamente');
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error('Error al actualizar el usuario');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleStatus = async (user: UserProfile) => {
    const newStatus = !user.is_active;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: newStatus })
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success(newStatus ? 'Usuario reactivado' : 'Usuario suspendido');
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u));
    } catch (error) {
      console.error(error);
      toast.error('Error al cambiar estado del usuario');
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setIsProcessing(true);

    try {
      // Solución de INSERT seguro: Se envía Magic Link, Supabase crea el usuario al hacer clic.
      const { error } = await supabase.auth.signInWithOtp({ email: inviteEmail });
      if (error) throw error;
      
      toast.success('Invitación enviada', { 
        description: 'El usuario aparecerá en la lista cuando inicie sesión por primera vez.' 
      });
      setShowInviteModal(false);
      setInviteEmail('');
    } catch (error) {
      console.error(error);
      toast.error('Error al enviar invitación');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.nombre_completo && u.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.rut && u.rut.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <Users className="w-6 h-6 text-cyan-500" />
            Gestión de Equipo
          </h2>
          <p className="text-sm text-slate-400 mt-1">Administra accesos, roles y perfiles comerciales.</p>
        </div>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-900/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Invitar Usuario
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input 
          type="text"
          placeholder="Buscar por nombre, correo o RUT..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all shadow-lg"
        />
      </div>

      {/* USER LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>
        ) : filteredUsers.length === 0 ? (
          <div className="col-span-full text-center py-10 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            No se encontraron usuarios.
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className={`bg-slate-900 border ${user.is_active ? 'border-slate-800 hover:border-cyan-500/30' : 'border-red-900/30 bg-slate-950'} p-5 rounded-2xl transition-all shadow-lg`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${user.is_active ? 'bg-cyan-500/10 text-cyan-400' : 'bg-red-500/10 text-red-500'}`}>
                    {user.is_active ? <CheckCircle className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm truncate max-w-[150px]">{user.nombre_completo || 'Sin Nombre'}</h4>
                    <p className="text-slate-500 text-[10px] uppercase tracking-widest">{user.role}</p>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={() => setEditingUser(user)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors" title="Editar Perfil">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleToggleStatus(user)} 
                    className={`p-2 rounded-lg transition-colors ${user.is_active ? 'bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400' : 'bg-emerald-900/30 text-emerald-500 hover:bg-emerald-800/50'}`}
                    title={user.is_active ? "Suspender Usuario (Soft Delete)" : "Reactivar Usuario"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mt-4 pt-4 border-t border-slate-800/50">
                <p className="text-xs text-slate-400 flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" /> {user.email}
                </p>
                {user.rut && (
                  <p className="text-xs text-slate-400 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-slate-500 shrink-0" /> RUT: {user.rut}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL DE EDICIÓN */}
      {editingUser && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-950/50 p-6 border-b border-slate-800 flex justify-between items-center">
               <h3 className="text-white font-bold text-lg">Editar Usuario</h3>
               <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Nombre Completo</label>
                 <input type="text" value={editingUser.nombre_completo || ''} onChange={e => setEditingUser({...editingUser, nombre_completo: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none" placeholder="Ej: Juan Pérez" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">RUT</label>
                   <input type="text" value={editingUser.rut || ''} onChange={e => setEditingUser({...editingUser, rut: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none" placeholder="12.345.678-9" />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Teléfono</label>
                   <input type="text" value={editingUser.telefono || ''} onChange={e => setEditingUser({...editingUser, telefono: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none" placeholder="+56 9..." />
                 </div>
               </div>
               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Dirección Sucursal</label>
                 <input type="text" value={editingUser.direccion || ''} onChange={e => setEditingUser({...editingUser, direccion: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none" placeholder="Calle, Ciudad" />
               </div>
               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Rol de Sistema</label>
                 <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none">
                   <option value="tecnico">Técnico (Solo Lectura)</option>
                   <option value="vendedor">Vendedor</option>
                   <option value="admin">Administrador</option>
                   <option value="super_admin">Super Administrador</option>
                 </select>
               </div>
               <button type="submit" disabled={isProcessing} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 rounded-xl mt-4 flex justify-center transition-all disabled:opacity-50">
                 {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar Cambios'}
               </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE INVITACIÓN (INSERT) */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6">
               <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-4">
                 <Mail className="w-6 h-6 text-cyan-400" />
               </div>
               <h3 className="text-white font-bold text-xl mb-2">Invitar Colaborador</h3>
               <p className="text-slate-400 text-sm mb-6">Ingresa el correo corporativo. Se enviará un enlace mágico para que el usuario inicie sesión por primera vez y quede registrado.</p>
               
               <form onSubmit={handleInvite}>
                 <input 
                   type="email" required placeholder="correo@comtecindustrial.com"
                   value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                   className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:ring-1 focus:ring-cyan-500 outline-none mb-4" 
                 />
                 <div className="flex gap-3">
                   <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3.5 rounded-xl font-bold transition-all">Cancelar</button>
                   <button type="submit" disabled={isProcessing} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-3.5 rounded-xl font-bold flex justify-center transition-all disabled:opacity-50 shadow-lg shadow-cyan-900/20">
                     {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar Invitación'}
                   </button>
                 </div>
               </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}