import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, ShieldCheck, Loader2, ArrowRight, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

const INTERNAL_DOMAINS = [ 'comtecindustrial.com']; 

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
      // 1. VALIDACIÓN DE DOMINIOS INTERNOS
      let isAllowed = INTERNAL_DOMAINS.includes(domain);

      // 2. VALIDACIÓN RPC (BYPASS DE RLS): Consulta segura a la base de datos
      if (!isAllowed) {
        const { data: isAuthorized, error: rpcError } = await supabase.rpc('check_email_authorized', { 
          search_email: cleanEmail 
        });

        if (rpcError) throw rpcError;
        if (isAuthorized) isAllowed = true;
      }

      // Si la base de datos respondió que el correo no existe
      if (!isAllowed) {
        toast.error("Acceso denegado", {
          description: "Este correo no figura como contacto autorizado. Solicite a su ejecutivo comercial ser añadido a la ficha de su empresa."
        });
        setLoading(false);
        return;
      }

      // 3. ENVÍO DE MAGIC LINK (Si pasó la validación)
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
      console.error("Error al procesar solicitud:", error);
      toast.error("Error de conexión", { description: "No se pudo validar el correo. Intente más tarde." });
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
             El correo ingresado debe coincidir con el contacto registrado comercialmente en nuestro sistema para recibir el enlace de validación (Magic Link).
           </p>
        </div>
      </div>
    </div>
  );
}