import React, { useState, useEffect } from 'react';
import { Building2, Tag, Users, Plus, Trash2, CreditCard, Star, Save, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { clientService, CreateClientData, Client, ClientContact, CommercialCondition } from '../../services/clientService';
import { ConfirmUpdateModal } from '../../components/ui/SecurityModals';
import { validateRut, formatRut } from '../../utils/rutValidator';

const COMMERCIAL_CONDITIONS: CommercialCondition[] = ['Contado', 'Anticipado', 'Crédito 30 días', 'Crédito 60 días', 'Crédito 90 días'];
const AVAILABLE_TAGS = ['VIP', 'Moroso', 'Potencial', 'Recurrente', 'Distribuidor'];

interface ClientsFormProps {
  initialData?: Client | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function ClientsForm({ initialData, onSuccess, onCancel }: ClientsFormProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Estados
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [contacts, setContacts] = useState<ClientContact[]>([]);
  const [formData, setFormData] = useState<CreateClientData>({
    rut: '', razon_social: '', giro: '', direccion: '', 
    comuna: '', ciudad: '', email_contacto: '', telefono: '',
    condicion_comercial: 'Contado', estado_financiero: 'pendiente'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        rut: formatRut(initialData.rut),
        razon_social: initialData.razon_social,
        giro: initialData.giro,
        direccion: initialData.direccion || '',
        comuna: initialData.comuna || '',
        ciudad: initialData.ciudad || '',
        email_contacto: initialData.email_contacto || '',
        telefono: initialData.telefono || '',
        condicion_comercial: initialData.condicion_comercial || 'Contado',
        estado_financiero: initialData.estado_financiero || 'pendiente'
      });
      setSelectedTags(initialData.tags || []);
      // Cargar contactos si existen, si no iniciar vacío
      setContacts(initialData.contacts || []);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'rut') setFormData({ ...formData, [name]: formatRut(value) });
    else setFormData({ ...formData, [name]: value });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  // --- LÓGICA DE CONTACTOS ---
  const addContact = () => {
    const isFirst = contacts.length === 0;
    setContacts([...contacts, { nombre: '', cargo: '', email: '', telefono: '', es_principal: isFirst }]);
  };
  
  const updateContact = (index: number, field: keyof ClientContact, value: any) => {
    const newContacts = [...contacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setContacts(newContacts);
  };

  const setPrincipalContact = (index: number) => {
    const newContacts = contacts.map((c, i) => ({
      ...c,
      es_principal: i === index
    }));
    setContacts(newContacts);
  };
  
  const removeContact = (index: number) => {
    const newContacts = contacts.filter((_, i) => i !== index);
    if (contacts[index].es_principal && newContacts.length > 0) {
      newContacts[0].es_principal = true;
    }
    setContacts(newContacts);
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRut(formData.rut)) return toast.error('RUT inválido');
    
    if (initialData) setShowConfirmModal(true);
    else executeSave();
  };

  const executeSave = async () => {
    setLoading(true);
    setShowConfirmModal(false);
    try {
      // Incluimos los contactos en el payload
      const payload = { ...formData, tags: selectedTags, contacts };
      
      if (initialData?.id) {
        const { error } = await clientService.update(initialData.id, payload);
        if (error) throw error;
        toast.success('Cliente actualizado correctamente');
      } else {
        const { error } = await clientService.create(payload);
        if (error) {
           // Manejo de error de cliente reactivable (soft deleted)
           if ((error as any).code === 'CLIENT_INACTIVE') {
              // Aquí podrías implementar un modal para preguntar si quiere restaurarlo
              // Por ahora solo mostramos el error
              toast.error('Este cliente ya existe pero está inactivo. Contacta al admin para restaurarlo.');
              return;
           }
           throw error;
        }
        toast.success('Cliente creado exitosamente');
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl animate-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2"><Building2 className="w-5 h-5"/> {initialData ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
        {onCancel && <button onClick={onCancel}><X className="w-5 h-5 text-slate-500 hover:text-white"/></button>}
      </div>

      <form onSubmit={handleInitialSubmit} className="space-y-8">
        
        {/* SECCIÓN 1: DATOS EMPRESA */}
        <div className="space-y-4">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800/50 pb-2 mb-4">1. Identificación</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
                <input required name="rut" value={formData.rut} onChange={handleChange} placeholder="RUT (xx.xxx.xxx-x)" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-4 text-sm outline-none focus:border-cyan-500"/>
                <input required name="razon_social" value={formData.razon_social} onChange={handleChange} placeholder="Razón Social" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-4 text-sm outline-none focus:border-cyan-500"/>
                <input required name="giro" value={formData.giro} onChange={handleChange} placeholder="Giro" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-4 text-sm outline-none focus:border-cyan-500"/>
            </div>
            <div className="space-y-3">
                <input name="direccion" value={formData.direccion} onChange={handleChange} placeholder="Dirección Comercial" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-4 text-sm outline-none focus:border-cyan-500"/>
                <div className="grid grid-cols-2 gap-3">
                  <input name="comuna" value={formData.comuna} onChange={handleChange} placeholder="Comuna" className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-4 text-sm outline-none focus:border-cyan-500"/>
                  <input name="ciudad" value={formData.ciudad} onChange={handleChange} placeholder="Ciudad" className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-4 text-sm outline-none focus:border-cyan-500"/>
                </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: CONTACTOS (MULTIPLE) */}
        <div className="space-y-4">
           <div className="flex justify-between items-center border-b border-slate-800/50 pb-2 mb-4">
             <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Users className="w-4 h-4"/> Contactos</h4>
             <button type="button" onClick={addContact} className="text-xs flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold bg-cyan-950/30 px-2 py-1 rounded border border-cyan-900"><Plus className="w-3 h-3"/> Agregar Persona</button>
           </div>
           
           {contacts.length === 0 ? (
             <div className="text-sm text-slate-500 italic text-center py-6 bg-slate-950/30 rounded-xl border border-dashed border-slate-800">
               No hay contactos registrados.
             </div>
           ) : (
             <div className="space-y-3">
               {contacts.map((contact, idx) => (
                 <div key={idx} className={`grid grid-cols-12 gap-2 items-center p-3 rounded-xl border relative group transition-all ${contact.es_principal ? 'bg-cyan-950/10 border-cyan-500/30 ring-1 ring-cyan-500/20' : 'bg-slate-950 border-slate-800'}`}>
                   
                   {/* Check Principal */}
                   <div className="col-span-1 flex justify-center">
                     <button 
                       type="button" 
                       onClick={() => setPrincipalContact(idx)}
                       title="Marcar como contacto principal"
                       className={`p-1.5 rounded-full transition-all ${contact.es_principal ? 'text-amber-400 bg-amber-400/10' : 'text-slate-600 hover:text-amber-400'}`}
                     >
                       <Star className={`w-4 h-4 ${contact.es_principal ? 'fill-amber-400' : ''}`} />
                     </button>
                   </div>

                   <div className="col-span-11 grid grid-cols-1 md:grid-cols-4 gap-2">
                      <input required placeholder="Nombre" value={contact.nombre} onChange={e => updateContact(idx, 'nombre', e.target.value)} className="bg-transparent border-b border-transparent focus:border-cyan-500 outline-none text-sm text-slate-200 placeholder-slate-600"/>
                      <input placeholder="Cargo" value={contact.cargo} onChange={e => updateContact(idx, 'cargo', e.target.value)} className="bg-transparent border-b border-transparent focus:border-cyan-500 outline-none text-sm text-slate-200 placeholder-slate-600"/>
                      <input placeholder="Email" value={contact.email} onChange={e => updateContact(idx, 'email', e.target.value)} className="bg-transparent border-b border-transparent focus:border-cyan-500 outline-none text-sm text-slate-200 placeholder-slate-600"/>
                      <div className="flex gap-2">
                        <input placeholder="Teléfono" value={contact.telefono} onChange={e => updateContact(idx, 'telefono', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-cyan-500 outline-none text-sm text-slate-200 placeholder-slate-600"/>
                        <button type="button" onClick={() => removeContact(idx)} className="p-1 text-slate-600 hover:text-red-400"><Trash2 className="w-4 h-4"/></button>
                      </div>
                   </div>
                 </div>
               ))}
             </div>
           )}
        </div>

        {/* SECCIÓN 3: ETIQUETAS Y ESTADO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-800">
           <div>
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Tag className="w-3 h-3"/> Etiquetas</h4>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map(tag => (
                  <button key={tag} type="button" onClick={() => toggleTag(tag)} className={`px-3 py-1 rounded text-xs border transition-colors ${selectedTags.includes(tag) ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>{tag}</button>
                ))}
              </div>
           </div>
           
           <div>
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><CreditCard className="w-3 h-3"/> Comercial</h4>
              <div className="flex gap-3">
                 <select name="condicion_comercial" value={formData.condicion_comercial} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 outline-none">
                    {COMMERCIAL_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
                 <select name="estado_financiero" value={formData.estado_financiero} onChange={handleChange} className={`w-full border rounded-xl py-2 px-3 text-sm font-bold bg-slate-950 outline-none ${formData.estado_financiero === 'aprobado' ? 'text-emerald-400 border-emerald-500/30' : 'text-amber-400 border-amber-500/30'}`}>
                    <option value="pendiente">⏳ Pendiente</option>
                    <option value="aprobado">✅ Aprobado</option>
                    <option value="rechazado">🚫 Rechazado</option>
                 </select>
              </div>
           </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
           <button type="button" onClick={onCancel || onSuccess} className="px-6 py-2 rounded-xl text-slate-400 hover:bg-slate-800 font-bold text-sm">Cancelar</button>
           <button type="submit" disabled={loading} className="px-6 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold shadow-lg hover:scale-105 transition-all text-sm flex items-center gap-2">
             {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Guardar Cliente
           </button>
        </div>
      </form>
      
      <ConfirmUpdateModal isOpen={showConfirmModal} title="Confirmar Actualización" message="¿Estás seguro de guardar los cambios para este cliente?" loading={loading} onClose={() => setShowConfirmModal(false)} onConfirm={executeSave} />
    </div>
  );
}