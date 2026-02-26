import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ShieldCheck, FileText, AlertTriangle, Loader2, ChevronRight,
  Building2, Layers, Printer
} from 'lucide-react';
import { Quote } from '../types/quotes';

// CORRECCIÓN: Aceptamos folio como prop (que viene del Wrapper en App.tsx)
interface Props {
  folio?: string;
}

export default function VerifyQuote({ folio: propFolio }: Props) {
  const [searchParams] = useSearchParams();
  
  // LÓGICA DE PRIORIDAD: Usar el prop si existe (ruta), si no, usar searchParams
  const folio = propFolio || searchParams.get('folio');
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuote() {
      // Decodificamos por seguridad, aunque React Router suele hacerlo
      const decodedFolio = folio ? decodeURIComponent(folio) : null;

      if (!decodedFolio) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('crm_quotes')
          .select(`
            *,
            crm_clients (razon_social, rut)
          `)
          .eq('folio', decodedFolio)
          .maybeSingle();

        if (error) throw error;
        setQuote(data);
      } catch (err) {
        console.error("Error validando folio:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchQuote();
  }, [folio]);

  // ... (RESTO DEL CÓDIGO IGUAL: handlePrintQuote, renderizado, etc.)
  
  const handlePrintQuote = () => { window.print(); };

  const handleDownloadAllSpecs = () => {
    if (!quote || !quote.items) return;
    const urls = quote.items
      .map(item => item.technical_spec_url) // Ojo: asegura que sea technical_spec_url o datasheet_url según tu esquema
      .filter((url): url is string => !!url);
    if (urls.length === 0) return;
    urls.forEach((url, index) => {
      setTimeout(() => window.open(url, '_blank'), index * 300);
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
      <p className="text-slate-500 font-bold tracking-widest text-xs uppercase italic">Autenticando Folio...</p>
    </div>
  );

  if (!quote) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-red-500/20 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
        <div className="bg-red-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-white font-bold text-xl mb-2">Folio no Registrado</h2>
        <p className="text-slate-400 text-sm mb-8">
          El documento <span className="text-white font-mono">{folio || 'SIN FOLIO'}</span> no ha sido emitido por el sistema oficial.
        </p>
        <Link to="/" className="inline-flex items-center gap-2 text-cyan-500 font-bold hover:text-cyan-400 transition-colors uppercase text-xs tracking-tighter">
          Volver al Portal <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );

  const hasTechSpecs = quote.items?.some(i => i.technical_spec_url || i.datasheet_url); // Ajustado para soportar ambos nombres

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-cyan-500/30 font-sans print:bg-white print:text-black">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none print:hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-10 print:hidden">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 rounded-full mb-4">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em]">Origen Verificado</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Verificación Documental</h1>
          <p className="text-slate-500 text-sm font-medium">Documento emitido por Comtec Industrial</p>
        </div>

        {/* Acciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 print:hidden">
          <button onClick={handlePrintQuote} className="bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-950/40 flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-orange-400/20">
            <Printer className="w-5 h-5" />
            <span className="text-sm tracking-tight uppercase">Imprimir / Guardar PDF Oferta</span>
          </button>
          {hasTechSpecs && (
            <button onClick={handleDownloadAllSpecs} className="bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl border border-slate-700 flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
              <Layers className="w-5 h-5 text-cyan-500" />
              <span className="text-sm tracking-tight uppercase">Descargar Fichas Técnicas</span>
            </button>
          )}
        </div>

        {/* Certificado */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl mb-8 print:bg-white print:border-none print:shadow-none print:text-black">
          <div className="p-8 border-b border-slate-800 bg-gradient-to-br from-slate-900/50 to-slate-950/50 print:bg-none print:border-b-2 print:border-black">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-1 print:text-black">Folio Registrado</p>
                <p className="text-cyan-500 font-mono text-3xl font-bold tracking-tight print:text-black">{quote.folio}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-1 print:text-black">Fecha de Emisión</p>
                <p className="text-white font-bold print:text-black">{new Date(quote.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-950/80 p-5 rounded-2xl border border-slate-800/50 print:bg-slate-100 print:border-black">
              <div className="bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/20 print:hidden">
                <Building2 className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-0.5 print:text-black">Cliente Titular</p>
                <p className="text-white font-bold leading-tight truncate print:text-black">{(quote as any).crm_clients?.razon_social}</p>
                <p className="text-cyan-500/60 font-mono text-xs mt-1 print:text-black">{(quote as any).crm_clients?.rut}</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-6 flex items-center gap-2 print:text-black">
              <FileText className="w-4 h-4 text-cyan-500 print:hidden" /> Detalle de Productos
            </h3>
            <div className="space-y-3">
              {quote.items?.map((item, idx) => (
                <div key={idx} className="group relative bg-slate-950/40 border border-slate-800/50 p-4 rounded-2xl print:bg-white print:border-black print:text-black">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-mono text-cyan-500 mb-0.5 font-bold tracking-tighter print:text-black">P/N: {item.part_number}</p>
                      <h4 className="text-white font-bold text-sm truncate print:text-black">{item.name}</h4>
                    </div>
                    {(item.technical_spec_url || item.datasheet_url) && (
                      <div className="bg-cyan-500/10 text-cyan-400 p-1.5 rounded-lg border border-cyan-500/20 print:hidden">
                        <Layers className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-slate-800 print:border-black">
               <div className="flex justify-between items-center">
                 <span className="text-slate-500 text-xs font-bold uppercase print:text-black">Total Oferta Comercial (Neto):</span>
                 <span className="text-white font-mono font-bold text-xl print:text-black">${Number(quote.total || quote.total_bruto || 0).toLocaleString('es-CL')}</span>
               </div>
            </div>
          </div>
        </div>

        <div className="text-center px-4">
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em] mb-4 print:text-black">Comtec Industrial Solutions</p>
          <p className="text-slate-500 text-[11px] leading-relaxed italic print:text-black">"Este certificado garantiza que la oferta comercial adjunta ha sido generada bajo los estándares de calidad de Comtec Industrial."</p>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: ` @media print { body { background: white !important; } .no-print { display: none !important; } @page { margin: 2cm; } } `}} />
    </div>
  );
}