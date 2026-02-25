import { useState } from 'react';
import { Send, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PublicContactFormProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function PublicContactForm({ onClose, onSuccess }: PublicContactFormProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    empresa: '',
    rut: '',
    telefono: '',
    solicitud: '',
    comentarios: '',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Formateador flexible: Solo aplica puntos y guion si detecta que es un RUT estándar
  const formatRUT = (value: string): string => {
    let cleaned = value.replace(/[^0-9kK]/g, ''); // Limpia caracteres extraños
    if (cleaned.length < 2) return cleaned;
    
    // Si tiene el largo de un RUT chileno típico, lo formatea, si no, lo deja libre
    if (cleaned.length >= 7 && cleaned.length <= 9) {
      const body = cleaned.slice(0, -1);
      const dv = cleaned.slice(-1).toUpperCase();
      const formattedBody = body.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
      return `${formattedBody}-${dv}`;
    }
    return value; // Devuelve el valor original si es una entrada inusual
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Solo formateamos el RUT si el usuario está escribiendo algo parecido a uno
    if (name === 'rut') {
      setFormData({ ...formData, [name]: value.length > 10 ? value : formatRUT(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    // ÚNICOS REQUISITOS OBLIGATORIOS
    if (!formData.nombre.trim()) {
      setStatus('error');
      setErrorMessage('Por favor, ingresa tu nombre');
      return;
    }

    if (!formData.email.trim() || !validateEmail(formData.email)) {
      setStatus('error');
      setErrorMessage('Por favor, ingresa un correo electrónico válido');
      return;
    }

    try {
      const { error } = await supabase.from('clients').insert([
        {
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          empresa: formData.empresa.trim() || null,
          rut: formData.rut.trim() || null,
          telefono: formData.telefono.trim() || null,
          solicitud: formData.solicitud || null,
          comentarios: formData.comentarios.trim() || null,
          estado: 'pendiente',
        },
      ]);

      if (error) throw error;

      setStatus('success');
      setFormData({
        nombre: '', email: '', empresa: '', rut: '',
        telefono: '', solicitud: '', comentarios: '',
      });

      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('Ocurrió un inconveniente al enviar. Revisa tu conexión.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CAMPOS OBLIGATORIOS */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-cyan-500 uppercase ml-1">Nombre*</label>
          <input
            type="text"
            name="nombre"
            required
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej: Juan Pérez"
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-cyan-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-cyan-500 uppercase ml-1">Email*</label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="correo@ejemplo.com"
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-cyan-500 outline-none transition-all"
          />
        </div>

        {/* CAMPOS FLEXIBLES */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">RUT (Opcional)</label>
          <input
            type="text"
            name="rut"
            value={formData.rut}
            onChange={handleChange}
            placeholder="12.345.678-9"
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-slate-600 outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Teléfono</label>
          <input
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            placeholder="+56 9..."
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-slate-600 outline-none transition-all"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Mensaje o Comentarios</label>
        <textarea
          name="comentarios"
          value={formData.comentarios}
          onChange={handleChange}
          rows={3}
          placeholder="¿Cómo podemos ayudarte?"
          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-cyan-500 outline-none transition-all resize-none"
        />
      </div>

      {status === 'error' && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4" /> {errorMessage}
        </div>
      )}

      {status === 'success' && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3 text-emerald-400 text-xs">
          <CheckCircle className="w-4 h-4" /> ¡Solicitud enviada con éxito!
        </div>
      )}

      <div className="flex justify-center pt-2">
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full md:w-2/3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          {status === 'loading' ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          Enviar ahora
        </button>
      </div>
    </form>
  );
}