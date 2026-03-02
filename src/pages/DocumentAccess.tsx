import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, ShieldCheck, Loader2, ArrowRight, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

// Dominios corporativos internos de la empresa (Siempre permitidos)
const INTERNAL_DOMAINS = ['comtec.cl', 'comtecindustrial.cl']; 

export default function DocumentAccess() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const pendingUrl = location.state?.from;
    if (pendingUrl) {
      localStorage.setItem('pending_document_url', pendingUrl);
    }
  }, [location]);

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.toLowerCase().trim();
    const domain = cleanEmail.split('@')[1];

    if (!domain) return toast.error("Ingresa un correo electrónico válido");

    setLoading(true);

    try {
      // 1. VALIDACIÓN DE NEGOCIO: ¿Es el dominio interno o el correo exacto de un cliente?
      let isAllowed = INTERNAL_DOMAINS.includes(domain);

      if (!isAllowed) {
        // Consultar a la base de datos si el correo exacto existe en email_contacto
        const { data: clientMatch, error: dbError } = await supabase
          .from('crm_clients')
          .select('id')
          .eq('email_contacto', cleanEmail) // Búsqueda exacta en la columna solicitada
          .limit(1)
          .maybeSingle();

        if (clientMatch) isAllowed = true;
      }

      if (!isAllowed) {
        toast.error("Acceso denegado", {
          description: "Este correo no figura como contacto autorizado en nuestro sistema. Solicite a su ejecutivo ser añadido como contacto de cliente."
        });
        setLoading(false);
        return;
      }

      // 2. ENVÍO DE MAGIC LINK (Doble verificación por correo)
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: window.location.origin, 
        }
      });

      if (error) throw error;

      setSent(true);
      toast.success("Enlace de acceso seguro enviado a su correo");

    } catch (error: any) {
      console.error(error);
      toast.error("Error al procesar la solicitud", { description: "Intente nuevamente más tarde." });
    } finally {
      setLoading(false);
    }
  };
  
  if (sent) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-cyan-500/10 p-4 rounded-full mb-6">
          <Mail className="w-12 h-12 text-cyan-400" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Verifica tu Bandeja de Entrada</h2>
        <p className="text-slate-400 max-w-md">
          Hemos enviado un enlace de acceso seguro a <span className="text-cyan-400 font-bold">{email}</span>. 
          Haz clic en el enlace desde tu correo para validar tu identidad y abrir el documento.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="bg-cyan-500/10 p-3 rounded-2xl">
            <ShieldCheck className="w-8 h-8 text-cyan-500" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-white text-center mb-2">Acceso Seguro</h2>
        <p className="text-slate-400 text-sm text-center mb-8">
          Por políticas de confidencialidad, el acceso a las carpetas digitales requiere validación de identidad.
        </p>

        <form onSubmit={handleRequestAccess} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Correo Electrónico Registrado</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 rounded-xl shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>Solicitar Enlace de Acceso <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
        
        <div className="mt-6 flex items-start gap-2 p-3 bg-slate-950/50 rounded-xl border border-slate-800">
           <ShieldAlert className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
           <p className="text-[10px] text-slate-500 leading-relaxed">
             El correo ingresado debe coincidir exactamente con el contacto registrado comercialmente en nuestro sistema para recibir el enlace de validación (Magic Link).
           </p>
        </div>
      </div>
    </div>
  );
}