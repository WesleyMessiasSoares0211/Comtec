import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ShieldCheck, FileText, AlertTriangle, Loader2,
  Building2, Layers, Printer, ExternalLink, FileArchive
} from 'lucide-react';
import { Quote } from '../types/quotes';
import { generateQuotePDF } from '../utils/pdfGenerator';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import JSZip from 'jszip'; 
import { saveAs } from 'file-saver';
import { useAuth } from '../hooks/useAuth';
// --- NUEVO: Importación del servicio de telemetría ---
import { logQuoteInteraction } from '../services/telemetryService';

interface Props {
  folio?: string;
}

export default function VerifyQuote({ folio: propFolio }: Props) {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    if (!authLoading && !session) {
      toast.info("Requiere validación de seguridad corporativa");
      navigate('/acceso-documento', { state: { from: location.pathname + location.search }, replace: true });
    }
  }, [session, authLoading, navigate, location]);

  useEffect(() => {
    if (!session) return; 

    let isMounted = true;

    async function fetchQuote() {
      const folio = propFolio || searchParams.get('folio');
      const quoteId = searchParams.get('id');
      const decodedFolio = folio ? decodeURIComponent(folio) : null;

      if (!decodedFolio && !quoteId) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        let resultData = null;
        const query = supabase.from('crm_quotes').select(`*, crm_clients (*)`);

        if (quoteId) {
          const { data, error } = await query.eq('id', quoteId).maybeSingle();
          if (error) throw error;
          resultData = data;
        } else if (decodedFolio) {
          const { data, error } = await query.eq('folio', decodedFolio).order('version', { ascending: false }).limit(1);
          if (error) throw error;
          resultData = data && data.length > 0 ? data[0] : null;
        }

        if (isMounted) {
          setQuote(resultData);
          // --- NUEVO: Telemetría de Apertura (Portal Viewer) ---
          if (resultData) {
            logQuoteInteraction(resultData.id, 'view_portal', session?.user?.email, { folio: resultData.folio });
          }
        }
      } catch (err) {
        console.error("Error validando documento:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchQuote();

    return () => { isMounted = false; };
  }, [propFolio, searchParams, session]);

  const handleDownloadOfficialPDF = async () => {
    if (!quote || !(quote as any).crm_clients) return;
    
    // --- NUEVO: Telemetría de Descarga PDF ---
    logQuoteInteraction(quote.id, 'download_official_pdf', session?.user?.email);

    setIsGeneratingPdf(true);
    try {
      const clientData = (quote as any).crm_clients;
      const baseUrl = window.location.origin;
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

  const handleOpenSpecsTabs = () => {
    if (!quote || !quote.items) return;
    const urls = quote.items
      .map(item => item.datasheet_url || item.technical_spec_url)
      .filter((url): url is string => !!url && url.length > 5);

    if (urls.length === 0) {
      toast.info("No hay fichas técnicas disponibles.");
      return;
    }

    // --- NUEVO: Telemetría de Apertura de Fichas Técnicas ---
    logQuoteInteraction(
      quote.id, 
      urls.length === 1 ? 'open_single_spec' : 'open_multiple_specs', 
      session?.user?.email, 
      { cantidad_archivos: urls.length }
    );

    if (urls.length === 1) {
      window.open(urls[0], '_blank');
      return;
    }

    toast.success(`Intentando abrir ${urls.length} fichas técnicas...`);
    
    urls.forEach((url, index) => {
      setTimeout(() => {
        const newWindow = window.open(url, '_blank');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          if (index === 1) { 
            toast.warning("El navegador bloqueó múltiples pestañas. Por favor permite los pop-ups o usa la opción '.ZIP'.", { duration: 8000 });
          }
        }
      }, index * 150);
    });
  };

  const handleDownloadZip = async () => {
    if (!quote || !quote.items) return;
    const urls = quote.items
      .map(item => ({ url: item.datasheet_url || item.technical_spec_url, partNumber: item.part_number }))
      .filter((doc): doc is {url: string, partNumber: string} => !!doc.url && doc.url.length > 5);

    // --- NUEVO: Telemetría de Descarga de paquete ZIP ---
    logQuoteInteraction(quote.id, 'download_zip_specs', session?.user?.email, { cantidad_archivos: urls.length });

    toast.loading(`Comprimiendo ${urls.length} fichas...`, { id: 'zip-process' });
    
    try {
      const zip = new JSZip();
      const folderName = `Fichas_Tecnicas_${quote.folio}_v${quote.version || 1}`;
      const folder = zip.folder(folderName);

      await Promise.all(urls.map(async (doc, index) => {
        try {
          const response = await fetch(doc.url);
          const blob = await response.blob();
          folder?.file(`${doc.partNumber}_Especificacion.pdf`, blob);
        } catch (err) {
          console.error(`Error obteniendo ${doc.partNumber}`, err);
        }
      }));

      const zipContent = await zip.generateAsync({ type: 'blob' });
      saveAs(zipContent, `${folderName}.zip`);
      toast.success("Carpeta digital descargada", { id: 'zip-process' });
    } catch (zipError) {
      toast.error("Hubo un problema al comprimir los archivos", { id: 'zip-process' });
    }
  };

  if (loading || authLoading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
      <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">Verificando...</span>
    </div>
  );

  if (!session) return null; 

  if (!quote) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-red-500/20 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
        <div className="bg-red-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-white font-bold text-xl mb-2">Documento no Registrado</h2>
        <p className="text-slate-400 text-sm">
          El documento con identificador no ha sido emitido o se encuentra expirado en nuestros registros.
        </p>
      </div>
    </div>
  );

  const hasTechSpecs = quote.items?.some(i => i.datasheet_url || i.technical_spec_url);

  // ... (El bloque return y JSX se mantienen exactamente idénticos, sin tocar la estructura ni el HTML)