import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'; 
import { supabase } from '../lib/supabase';
import { FileText, Download, Package, AlertCircle, ShieldCheck, Printer, Loader2 } from 'lucide-react';
import { QuoteItem } from '../types/quotes';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { generateQuotePDF } from '../utils/pdfGenerator';

export default function QuoteDocsViewer() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [itemsWithDocs, setItemsWithDocs] = useState<QuoteItem[]>([]);
  const [fullQuote, setFullQuote] = useState<any>(null);
  const [error, setError] = useState('');
  const [displayTitle, setDisplayTitle] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // REDIRECCIÓN DE SEGURIDAD (Hacia el portal de clientes, no al login administrativo)
  useEffect(() => {
    if (!authLoading && !session) {
      toast.info("Requiere validación de seguridad");
      navigate('/acceso-documento', { state: { from: location.pathname + location.search }, replace: true });
    }
  }, [session, authLoading, navigate, location]);

  useEffect(() => {
    if (!session) return; 

    let isMounted = true;

    const fetchQuoteDocs = async () => {
      const folioParam = searchParams.get('folio'); 
      const idParam = searchParams.get('id');

      if (!folioParam && !idParam) {
        if (isMounted) {
          setLoading(false);
          setError('Enlace incompleto: No se detectó un identificador de documento válido.');
        }
        return;
      }

      try {
        let resultData = null;
        const query = supabase.from('crm_quotes').select(`*, crm_clients (*)`);

        if (idParam) {
          const { data, error } = await query.eq('id', idParam).maybeSingle();
          if (error) throw error;
          resultData = data;
        } else if (folioParam) {
          const decodedFolio = decodeURIComponent(folioParam);
          const { data, error } = await query.eq('folio', decodedFolio).order('version', { ascending: false }).limit(1);
          if (error) throw error;
          resultData = data && data.length > 0 ? data[0] : null;
        }

        if (!resultData) throw new Error("Documento no encontrado en los registros.");

        if (isMounted) {
          setFullQuote(resultData);
          setDisplayTitle(`${resultData.folio}${resultData.version > 1 ? ` (Rev. ${resultData.version})` : ''}`);
          
          if (resultData && resultData.items) {
            const docs = (resultData.items as QuoteItem[]).filter(
              item => (item.datasheet_url && item.datasheet_url.length > 5) || 
                      (item.technical_spec_url && item.technical_spec_url.length > 5)
            );
            setItemsWithDocs(docs);
          }
        }
      } catch (err) {
        console.error("Error validando documento:", err);
        if (isMounted) setError('Documento no encontrado o expirado.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchQuoteDocs();

    return () => { isMounted = false; };
  }, [searchParams, session]);

  const handleDownloadOfficialPDF = async () => {
    if (!fullQuote || !fullQuote.crm_clients) return;
    
    setIsGeneratingPdf(true);
    try {
      const clientData = fullQuote.crm_clients;
      const baseUrl = window.location.origin;
      const docsUrl = `${baseUrl}/quote/docs?id=${fullQuote.id}`;
      
      const qrDataUrl = await QRCode.toDataURL(docsUrl, {
        width: 200, margin: 1, color: { dark: '#000000', light: '#ffffff' }
      });

      const success = generateQuotePDF({
        folio: fullQuote.folio,
        items: fullQuote.items,
        subtotal_neto: fullQuote.subtotal_neto,
        iva: fullQuote.iva,
        total_bruto: fullQuote.total_bruto || fullQuote.total,
        created_at: fullQuote.created_at,
        notes: fullQuote.notes,
        terms: fullQuote.terms,
        validity_days: fullQuote.validity_days,
        version: fullQuote.version
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

  if (loading || authLoading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
      <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">Validando...</span>
    </div>
  );

  if (!session) return null; 

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-8">
        
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 mb-4">
            <ShieldCheck className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Documentación Técnica</h1>
          <p className="text-slate-400">Carpeta Digital para Cotización <span className="text-cyan-400 font-mono">{displayTitle || 'No Identificada'}</span></p>
        </div>

        {fullQuote && !error && (
          <div className="flex justify-center mb-6">
            <button 
              onClick={handleDownloadOfficialPDF}
              disabled={isGeneratingPdf}
              className="w-full sm:w-auto bg-orange-600 hover:bg-orange-500 text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-orange-950/40 flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-orange-400/20 disabled:opacity-50"
            >
              {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
              <span className="text-sm tracking-tight uppercase">Descargar Cotización (PDF)</span>
            </button>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
          {error ? (
            <div className="text-center py-8 text-red-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>{error}</p>
            </div>
          ) : itemsWithDocs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Esta cotización no incluye productos con ficha técnica adjunta.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-4 border-b border-slate-800 pb-2">Fichas Técnicas Adjuntas</p>
              {itemsWithDocs.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-xl hover:border-cyan-500/30 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-800 rounded-lg text-red-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">{item.part_number}</p>
                    </div>
                  </div>
                  
                  <a 
                    href={item.datasheet_url || item.technical_spec_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors shadow-lg shadow-cyan-900/20"
                    title="Descargar Ficha"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center text-xs text-slate-600">
          <p>© {new Date().getFullYear()} Comtec Industrial Solutions</p>
        </div>
      </div>
    </div>
  );
}