import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Send, Mail, Phone, MapPin, Loader, 
  CheckCircle2, AlertCircle, Building2, User, FileText 
} from 'lucide-react';

export default function ClientsPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    empresa: '',
    rut: '',
    telefono: '',
    comentarios: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.email) return;

    setStatus('loading');
    try {
      const { error } = await supabase.from('clients').insert([{
        nombre: formData.nombre.trim(),
        email: formData.email.trim(),
        empresa: formData.empresa.trim() || null,
        rut: formData.rut.trim() || null,
        telefono: formData.telefono.trim() || null,
        comentarios: formData.comentarios.trim() || null,
        estado: 'pendiente'
      }]);

      if (error) throw error;
      setStatus('success');
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-32 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          
          {/* BLOQUE IZQUIERDO: INFO DE CONTACTO */}
          <div className="lg:col-span-2 space-y-10">
            <div>
              <h2 className="text-5xl font-extrabold text-white mb-6 tracking-tighter">
                Diseñemos tu <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">próximo proyecto</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                Estamos listos para asesorarte en la implementación de sensores y protocolos industriales de última generación.
              </p>
            </div>

            <div className="space-y-6">
              <ContactCard icon={<Mail className="text-cyan-400" />} title="Canal Directo" detail="comercial@comtecindustrial.com" />
              <ContactCard icon={<Phone className="text-orange-500" />} title="Soporte Comercial" detail="+56 9 4252 1168" />
              <ContactCard icon={<MapPin className="text-slate-400" />} title="Oficina Central" detail="Antofagasta, Chile" />
            </div>
          </div>

          {/* BLOQUE DERECHO: FORMULARIO AMPLIADO */}
          <div className="lg:col-span-3">
            {status === 'success' ? (
              <SuccessState onReset={() => setStatus('idle')} />
            ) : (
              <form onSubmit={handleSubmit} className="bg-slate-900/40 border border-slate-800/60 p-10 rounded-[2rem] backdrop-blur-sm shadow-2xl space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nombre */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-cyan-500 uppercase tracking-widest ml-1">Nombre Completo*</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input 
                        required 
                        type="text"
                        placeholder="Juan Pérez"
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-white focus:border-cyan-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-cyan-500 uppercase tracking-widest ml-1">Email Corporativo*</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input 
                        required 
                        type="email"
                        placeholder="nombre@empresa.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-white focus:border-cyan-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* RUT */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">RUT (Opcional)</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                      <input 
                        type="text"
                        placeholder="12.345.678-9"
                        value={formData.rut}
                        onChange={(e) => setFormData({...formData, rut: e.target.value})}
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-white focus:border-slate-700 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Empresa */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Empresa</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                      <input 
                        type="text"
                        placeholder="Nombre de la compañía"
                        value={formData.empresa}
                        onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-white focus:border-slate-700 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Teléfono */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Teléfono de Contacto</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                    <input 
                      type="tel"
                      placeholder="+56 9 1234 5678"
                      value={formData.telefono}
                      onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-white focus:border-slate-700 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Comentarios */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Mensaje o Requerimiento</label>
                  <textarea 
                    rows={4}
                    placeholder="Describe brevemente lo que necesitas..."
                    value={formData.comentarios}
                    onChange={(e) => setFormData({...formData, comentarios: e.target.value})}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-white focus:border-cyan-500 outline-none transition-all resize-none"
                  />
                </div>

                {status === 'error' && (
                  <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    <AlertCircle className="w-4 h-4" /> Error de conexión. Reintenta en unos segundos.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black py-4 rounded-xl shadow-xl shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {status === 'loading' ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  SOLICITAR ASESORÍA TÉCNICA
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// COMPONENTES AUXILIARES
function ContactCard({ icon, title, detail }: { icon: any, title: string, detail: string }) {
  return (
    <div className="flex items-center gap-5 p-4 rounded-2xl bg-slate-900/30 border border-slate-800/50 hover:border-slate-700 transition-colors group">
      <div className="bg-slate-950 p-4 rounded-xl shadow-inner group-hover:scale-110 transition-transform">{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{title}</p>
        <p className="text-white font-semibold text-lg">{detail}</p>
      </div>
    </div>
  );
}

function SuccessState({ onReset }: { onReset: () => void }) {
  return (
    <div className="bg-slate-900/40 border border-emerald-500/30 p-12 rounded-[2rem] text-center space-y-6 animate-in zoom-in duration-300">
      <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 className="text-emerald-500 w-10 h-10" />
      </div>
      <h3 className="text-3xl font-bold text-white">¡Mensaje Recibido!</h3>
      <p className="text-slate-400">Tu requerimiento ha sido ingresado a nuestro sistema. Un ingeniero se contactará contigo pronto.</p>
      <button onClick={onReset} className="text-cyan-400 font-bold hover:underline underline-offset-4">Enviar otra consulta</button>
    </div>
  );
}