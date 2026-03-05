import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react'; 
import QRCode from 'qrcode'; 
import { FileDown, X, FileText, Loader2, FileCheck, AlertTriangle } from 'lucide-react';
import { quoteService } from '../../services/quoteService';
import { supabase } from '../../lib/supabase'; // Importante para traer el perfil del vendedor
import { toast } from 'sonner';
import { Client } from '../../types/client';
import { QuoteItem } from '../../types/quotes';
import { generateQuotePDF } from '../../utils/pdfGenerator';

interface Props {
  client: Client;
  items: QuoteItem[];
  totals: { subtotal: number; iva: number; total: number };
  onClose: () => void;
  notes?: string;
  terms?: string;
  validityDays?: number;
  existingFolio?: string;
  nextVersion?: number;
  parentQuoteId?: string;
  onSuccess?: () => void;
  
  // Nuevos Props V2
  attentionTo?: string;
  requiresApproval?: boolean;
}

export default function QuotePreview({ 
  client, items, totals, onClose, 
  notes, terms, validityDays,
  existingFolio, nextVersion, parentQuoteId, onSuccess,
  attentionTo, requiresApproval
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Buscar los datos del vendedor logueado para el pie de firma
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('nombre_completo, email, telefono')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  const tempDate = new Date().toLocaleDateString('es-CL');
  const baseUrl = window.location.origin;
  const previewUrl = `${baseUrl}/quote/preview/docs`; 

  const handleEmit = async () => {
    if (isSaving) return;
    setIsSaving(true);
    
    try {
      // 1. Guardar en Base de Datos (Inyectamos los nuevos campos)
      // Nota: Forzamos el tipo (as any) temporalmente hasta que actualicemos la interfaz en quoteService.ts
      const payload: any = {
        client_id: client.id,
        items: items,
        subtotal_neto: totals.subtotal,
        iva: totals.iva,
        total_bruto: totals.total,
        // Agregamos una nota automática silenciosa si requiere aprobación
        notes: requiresApproval ? `[REQUIERE APROBACIÓN POR MARGEN BAJO] ${notes || ''}` : notes,
        terms,
        validity_days: validityDays,
        version: nextVersion,
        folio: existingFolio,
        parent_quote_id: parentQuoteId,
        attention_to: attentionTo || null, 
        estado_sugerido: requiresApproval ? 'Borrador' : 'Pendiente' // Usamos un estado oficial
      };

      const savedQuote = await quoteService.create(payload);

      // Si requiere aprobación, detenemos el proceso aquí (NO generamos el PDF oficial)
      if (requiresApproval) {
        toast.success(`Cotización guardada como borrador. Requiere aprobación de Jefatura por margen menor al 15%.`);
        if (onSuccess) onSuccess();
        onClose();
        return;
      }

      // 2. Generar QR Real (Solo si se aprueba/emite)
      const docsUrl = `${baseUrl}/quote/docs?id=${savedQuote.id}`;
      let qrDataUrl = '';
      try {
        qrDataUrl = await QRCode.toDataURL(docsUrl, {
          width: 200, margin: 1, color: { dark: '#000000', light: '#ffffff' }
        });
      } catch (qrErr) {
        console.warn("Error generando código QR para PDF:", qrErr);
      }

      // 3. Generar PDF
      const pdfSuccess = generateQuotePDF({
        folio: savedQuote.folio,
        items,
        subtotal_neto: totals.subtotal,
        iva: totals.iva,
        total_bruto: totals.total,
        created_at: savedQuote.created_at,
        notes,
        terms,
        validity_days: validityDays,
        version: savedQuote.version
      }, client, qrDataUrl);

      if (pdfSuccess) {
        toast.success(`Cotización ${savedQuote.folio} emitida correctamente`);
        if (onSuccess) onSuccess();
      } else {
        toast.warning(`Cotización ${savedQuote.folio} guardada, pero hubo un error generando el PDF`);
      }
      
      onClose();

    } catch (error: any) {
      console.error("Proceso fallido:", error);
      toast.error("Error al emitir", { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        
        {/* Header Control */}
        <div className="bg-slate-900 p-4 flex justify-between items-center border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-cyan-500/10 p-1.5 rounded-lg">
              <FileText className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Vista Previa</h3>
              <p className="text-slate-500 text-[10px]">Revisa antes de emitir oficial</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleEmit}
              disabled={isSaving}
              className={`${requiresApproval ? 'bg-orange-600 hover:bg-orange-500 shadow-orange-900/20' : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-900/20'} text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50`}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (requiresApproval ? <AlertTriangle className="w-4 h-4" /> : <FileDown className="w-4 h-4" />)}
              {isSaving ? 'PROCESANDO...' : (requiresApproval ? 'SOLICITAR APROBACIÓN' : 'EMITIR Y DESCARGAR')}
            </button>
            <button onClick={onClose} disabled={isSaving} className="bg-slate-800 hover:bg-slate-700 text-slate-400 p-2 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* DOCUMENTO VISUAL (HTML) */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-white text-slate-800 custom-scrollbar">
          
          {/* Encabezado Doc */}
          <div className="flex justify-between border-b-2 border-slate-100 pb-8 mb-8">
            <div>
              <h1 className="text-3xl font-black text-cyan-600 tracking-tighter">COMTEC</h1>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Industrial Solutions</p>
            </div>
            <div className="text-right">
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold mb-2 inline-block uppercase ${requiresApproval ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>
                {requiresApproval ? 'Borrador - Bloqueado' : 'Borrador'}
              </div>
              <p className="text-sm text-slate-500 font-medium">Fecha: {tempDate}</p>
              {validityDays && <p className="text-xs text-slate-400">Validez: {validityDays} días</p>}
              {existingFolio && <p className="text-xs font-bold text-amber-600 mt-1">Rev: {nextVersion}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-12">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Cliente:</p>
              <p className="font-bold text-xl text-slate-900 leading-tight">{client.razon_social}</p>
              {attentionTo && (
                <p className="text-sm font-bold text-cyan-700 mt-1 uppercase">ATN: {attentionTo}</p>
              )}
              <div className="mt-2 text-sm text-slate-600">
                <p>RUT: {client.rut}</p>
                <p>{client.direccion}</p>
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <div className="p-2 border border-slate-100 rounded-lg">
                <QRCodeSVG value={previewUrl} size={80} level="M" />
              </div>
              <p className="text-[9px] text-slate-400 mt-1 text-right">Escanear para Carpeta Digital</p>
            </div>
          </div>

          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-slate-900 text-left">
                <th className="py-3 text-[11px] font-bold text-slate-500 uppercase">P/N</th>
                <th className="py-3 text-[11px] font-bold text-slate-500 uppercase">Descripción</th>
                <th className="py-3 text-[11px] font-bold text-slate-500 text-center uppercase">Cant</th>
                <th className="py-3 text-[11px] font-bold text-slate-500 text-right uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-4 text-sm font-mono text-cyan-700 font-bold align-top">{item.part_number}</td>
                  <td className="py-4 text-sm font-semibold text-slate-700 align-top">
                    {item.name}
                    {item.datasheet_url && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-cyan-600 font-normal">
                        <FileCheck className="w-3 h-3" /> Ficha Técnica Incluida
                      </div>
                    )}
                    {/* Renderizado del Comentario Específico */}
                    {item.comment && (
                      <div className="mt-1 text-xs text-slate-500 font-normal italic whitespace-pre-line">
                        Nota: {item.comment}
                      </div>
                    )}
                  </td>
                  <td className="py-4 text-sm text-center font-medium align-top">{item.quantity}</td>
                  <td className="py-4 text-sm font-bold text-right text-slate-900 align-top">${item.total.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end border-t-2 border-slate-100 pt-8 mb-12">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Subtotal:</span>
                <span className="font-bold text-slate-700">${totals.subtotal.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">IVA (19%):</span>
                <span className="font-bold text-slate-700">${totals.iva.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-2xl font-black text-cyan-700 pt-4 border-t border-cyan-100">
                <span>TOTAL:</span>
                <span>${totals.total.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs border-t border-slate-100 pt-8">
            {notes && (
              <div>
                <h4 className="font-bold text-slate-700 uppercase mb-2">Observaciones</h4>
                <p className="text-slate-500 whitespace-pre-line leading-relaxed">{notes}</p>
              </div>
            )}
            {terms && (
              <div>
                <h4 className="font-bold text-slate-700 uppercase mb-2">Términos y Condiciones</h4>
                <p className="text-slate-500 whitespace-pre-line leading-relaxed">{terms}</p>
              </div>
            )}
          </div>

          {/* Sección de Firma del Emisor */}
          {profile && (
            <div className="mt-12 pt-8 border-t border-slate-200">
              <div className="text-xs text-slate-500">
                <p className="font-bold text-slate-700 uppercase tracking-widest mb-1">Emitido por:</p>
                <p className="font-semibold text-slate-800 text-sm">{profile.nombre_completo}</p>
                <p>{profile.email} {profile.telefono ? `| Tel: ${profile.telefono}` : ''}</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}