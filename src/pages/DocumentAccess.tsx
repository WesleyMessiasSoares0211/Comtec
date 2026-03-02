import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, ShieldCheck, Loader2, ArrowRight, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

// Lista negra de dominios genéricos (No se permiten bajo ninguna circunstancia)
const BANNED_DOMAINS = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'live.com', 'icloud.com'];

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

    if (!domain) return toast.error("Ingresa un correo válido");

    // 1. FILTRO RÁPIDO: Bloquear correos genéricos
    if (BANNED_DOMAINS.includes(domain)) {
      toast.error("Acceso denegado", { 
        description: "Por políticas de seguridad, solo se admiten correos corporativos." 
      });
      return;
    }

    setLoading(true);

    try {
      // 2. VALIDACIÓN DE NEGOCIO: ¿Es el dominio interno o de un cliente activo?
      let isAllowed = INTERNAL_DOMAINS.includes(domain);

      if (!isAllowed) {
        // Consultar a la base de datos si algún cliente activo usa este dominio
        // NOTA: Requiere que la tabla crm_clients tenga un campo de email de contacto,
        // o puedes crear una tabla 'allowed_client_domains'.
        const { data: clientMatch, error: dbError } = await supabase
          .from('crm_clients')
          .select('id')
          .ilike('email', `%@${domain}`) // Busca si algún cliente tiene ese dominio
          .limit(1)
          .maybeSingle();

        if (clientMatch) isAllowed = true;
      }

      if (!isAllowed) {
        toast.error("Dominio no autorizado", {
          description: "Su empresa no figura como cliente activo en nuestro sistema. Contacte a su ejecutivo comercial."
        });
        setLoading(false);
        return;
      }

      // 3. ENVÍO DE MAGIC LINK (Solo si pasó todas las barreras)
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: window.location.origin, 
        }
      });

      if (error) throw error;

      setSent(true);
      toast.success("Enlace de acceso seguro enviado a tu correo corporativo");

    } catch (error: any) {
      console.error(error);
      toast.error("Error al procesar la solicitud", { description: "Intente nuevamente más tarde." });
    } finally {
      setLoading(false);
    }
  };

  // ... (El resto del render de la UI se mantiene igual que en mi respuesta anterior)
  // [Render de la vista "Sent" y el "Formulario" con estética Slate-950/Cyan]
  
  if (sent) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-cyan-500/10 p-4 rounded-full mb-6">
          <Mail className="w-12 h-12 text-cyan-400" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Verifica tu Bandeja de Entrada</h2>
        <p className="text-slate-400 max-w-md">
          Hemos enviado un enlace de acceso seguro a <span className="text-cyan-400 font-bold">{email}</span>. 
          Haz clic en el enlace desde tu correo para abrir el documento.
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
        <h2 className="text-2xl font-black text-white text-center mb-2">Acceso a Documento</h2>
        <p className="text-slate-400 text-sm text-center mb-8">
          Por razones de seguridad industrial, el acceso requiere validación mediante correo corporativo activo.
        </p>

        <form onSubmit={handleRequestAccess} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Correo Corporativo</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu.nombre@empresa.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 rounded-xl shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>Solicitar Acceso Seguro <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
        
        <div className="mt-6 flex items-start gap-2 p-3 bg-slate-950/50 rounded-xl border border-slate-800">
           <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
           <p className="text-[10px] text-slate-500 leading-relaxed">
             No se admiten correos genéricos (Gmail, Hotmail, etc.). El dominio ingresado debe coincidir con el registro comercial de un cliente activo.
           </p>
        </div>
      </div>
    </div>
  );
}