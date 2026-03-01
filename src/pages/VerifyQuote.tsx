import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ShieldCheck, FileText, AlertTriangle, Loader2, ChevronRight,
  Building2, Layers, Printer
} from 'lucide-react';
import { Quote } from '../types/quotes';
import { generateQuotePDF } from '../utils/pdfGenerator';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import JSZip from 'jszip'; // Requiere: npm install jszip file-saver
import { saveAs } from 'file-saver';

interface Props {
  folio?: string;
}

export default function VerifyQuote({ folio: propFolio }: Props) {
  const [searchParams] = useSearchParams();
  const folio = propFolio || searchParams.get('folio');
  const quoteId = searchParams.get('id'); // NUEVO: Extraemos el ID exacto
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    async function fetchQuote() {
      const decodedFolio = folio ? decodeURIComponent(folio) : null;

      // Validamos que venga algún identificador
      if (!decodedFolio && !quoteId) {
        setLoading(false);
        return;
      }

      try {
        let query = supabase.from('crm_quotes').select(`*, crm_clients (*)`);

        // CORRECCIÓN CRÍTICA: Lógica de búsqueda adaptativa
        if (quoteId) {
          // 1. Prioridad: Búsqueda exacta por ID (Soporta Revisiones)
          query = query.eq('id', quoteId);
        } else if (decodedFolio) {
          // 2. Fallback: QRs antiguos. Si hay revisiones, forzamos traer solo la más reciente
          query = query.eq('folio', decodedFolio).order('version', { ascending: false }).limit(1);
        }

        const { data, error } = await query.maybeSingle();

        if (error) throw error;
        setQuote(data);
      } catch (err) {
        console.error("Error validando documento:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchQuote();
  }, [folio, quoteId]);

  const handleDownloadOfficialPDF = async () => {
    if (!quote || !(quote as any).crm_clients) return;
    
    setIsGeneratingPdf(true);
    try {
      const clientData = (quote as any).crm_clients;
      const baseUrl = window.location.origin;
      
      // NUEVO: Reconstruimos el QR usando el ID para que coincida con el nuevo estándar
      const docsUrl = `${baseUrl}/quote/docs?id=${quote.id}`;
      
      const qrDataUrl = await QRCode.toDataURL(docsUrl, {
        width: 200, margin: 1, color: { dark: '#000000', light: '#ffffff' }
      });

      const success = generateQuotePDF({
        folio: quote.folio,
        items: quote.items,
        subtotal_neto: quote.subtotal_neto,
        iva: quote.iva,
        total_bruto: quote.total_bruto || quote.total,
        created_at: quote.created_at,
        notes: quote.notes,
        terms: quote.terms,
        validity_days: quote.validity_days,
        version: quote.version
      }, clientData, qrDataUrl);

      if (success) toast.success("PDF Oficial descargado");
      else toast.error("Error al generar el PDF");

    } catch (err) {
      console.error(err);
      toast.error("Error técnico al generar PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // CORRECCIÓN FUNCIONAL: Empaquetado de Fichas Técnicas
  const handleDownloadAllSpecs = async () => {
    if (!quote || !quote.items) return;
    
    const urls = quote.items
      .map(item => ({ url: item.datasheet_url || item.technical_spec_url, partNumber: item.part_number }))
      .filter((doc): doc is {url: string, partNumber: string} => !!doc.url && doc.url.length > 5);

    if (urls.length === 0) {
      toast.info("No hay fichas técnicas disponibles.");
      return;
    }

    // Si es solo 1 ficha (típico uso en celular), la abrimos directo
    if (urls.length === 1) {
      window.open(urls[0].url, '_blank');
      return;
    }

    // Si son múltiples, armamos el paquete ZIP para evitar bloqueos del navegador
    toast.loading(`Generando carpeta digital con ${urls.length} fichas...`, { id: 'zip-process' });
    
    try {
      const zip = new JSZip();
      const folderName = `Fichas_Tecnicas_${quote.folio}_v${quote.version || 1}`;
      const folder = zip.folder(folderName);

      await Promise.all(urls.map(async (doc, index) => {
        try {
          const response = await fetch(doc.url);
          const blob = await response.blob();
          folder?.file(`${doc.partNumber}_Especificacion_${index + 1}.pdf`, blob);
        } catch (fetchErr) {
          console.error(`Error obteniendo ${doc.partNumber}:`, fetchErr);
        }
      }));

      const zipContent = await zip.generateAsync({ type: 'blob' });
      saveAs(zipContent, `${folderName}.zip`);
      toast.success("Carpeta digital descargada", { id: 'zip-process' });
    } catch (zipError) {
      console.error(zipError);
      toast.error("Hubo un problema al comprimir los archivos", { id: 'zip-process' });
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
      <p className="text-slate-500 font-bold tracking-widest text-xs uppercase italic">Autenticando Documento...</p>
    </div>
  );

  if (!quote) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-red-500/20 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
        <div className="bg-red-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-white font-bold text-xl mb-2">Documento no Registrado</h2>
        <p className="text-slate-400 text-sm mb-8">
          El documento con identificador no ha sido emitido o se encuentra expirado en nuestros registros.
        </p>
        <Link to="/" className="inline-flex items-center gap-2 text-cyan-500 font-bold hover:text-cyan-400 transition-colors uppercase text-xs tracking-tighter">
          Volver al Portal <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );

  const hasTechSpecs = quote.items?.some(i => i.datasheet_url || i.technical_spec_url);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-cyan-500/30 font-sans print:bg-white print:text-black">
      <div className="fixed inset-0 overflow-hidden pointer-events-none print:hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-10 print:hidden">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 rounded-full mb-4">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em]">Origen Verificado</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Verificación Documental</h1>
          <p className="text-slate-500 text-sm font-medium">Documento emitido por Comtec Industrial</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 print:hidden">
          <button 
            onClick={handleDownloadOfficialPDF}
            disabled={isGeneratingPdf}
            className="bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-950/40 flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-orange-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
            <span className="text-sm tracking-tight uppercase">
              {isGeneratingPdf ? 'Generando...' : 'Descargar PDF Oficial'}
            </span>
          </button>

          {hasTechSpecs && (
            <button 
              onClick={handleDownloadAllSpecs}
              className="bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl border border-slate-700 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
            >
              <Layers className="w-5 h-5 text-cyan-500" />
              <span className="text-sm tracking-tight uppercase">Descargar Fichas Técnicas</span>
            </button>
          )}
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl mb-8">
          <div className="p-8 border-b border-slate-800 bg-gradient-to-br from-slate-900/50 to-slate-950/50">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-1">Folio Registrado</p>
                <div className="flex items-end gap-2">
                   <p className="text-cyan-500 font-mono text-3xl font-bold tracking-tight">{quote.folio}</p>
                   {quote.version && quote.version > 1 && (
                     <span className="text-amber-500 font-bold mb-1">Rev. {quote.version}</span>
                   )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-1">Fecha de Emisión</p>
                <p className="text-white font-bold">{new Date(quote.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-950/80 p-5 rounded-2xl border border-slate-800/50">
              <div className="bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/20">
                <Building2 className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-0.5">Cliente Titular</p>
                <p className="text-white font-bold leading-tight truncate">{(quote as any).crm_clients?.razon_social}</p>
                <p className="text-cyan-500/60 font-mono text-xs mt-1">{(quote as any).crm_clients?.rut}</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-500" />
              Detalle de Productos Cotizados
            </h3>
            
            <div className="space-y-3">
              {quote.items?.map((item, idx) => (
                <div key={idx} className="group relative bg-slate-950/40 border border-slate-800/50 p-4 rounded-2xl">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-mono text-cyan-500 mb-0.5 font-bold tracking-tighter">P/N: {item.part_number}</p>
                      <h4 className="text-white font-bold text-sm truncate">{item.name}</h4>
                    </div>
                    
                    {(item.datasheet_url || item.technical_spec_url) && (
                      <div className="bg-cyan-500/10 text-cyan-400 p-1.5 rounded-lg border border-cyan-500/20" title="Ficha disponible">
                        <Layers className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800">
               <div className="flex justify-between items-center">
                 <span className="text-slate-500 text-xs font-bold uppercase">Total Oferta Comercial (Neto):</span>
                 <span className="text-white font-mono font-bold text-xl">
                   ${Number(quote.total || quote.total_bruto || 0).toLocaleString('es-CL')}
                 </span>
               </div>
            </div>
          </div>
        </div>

        <div className="text-center px-4">
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Comtec Industrial Solutions</p>
          <p className="text-slate-500 text-[11px] leading-relaxed italic">
            "Este certificado digital confirma la autenticidad de la oferta comercial en nuestros registros."
          </p>
        </div>
      </div>
    </div>
  );
}