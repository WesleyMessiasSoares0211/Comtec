import React, { useState, useMemo, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FileDown, X, FileText, Loader2, Calendar, FileCheck } from 'lucide-react';
import { quoteService } from '../../services/quoteService';
import { toast } from 'sonner';
import { Client } from '../../types/client';
import { QuoteItem } from '../../types/quotes';
import { generateQuotePDF } from '../../utils/pdfGenerator';

interface Props {
  client: Client;
  items: QuoteItem[];
  totals: { subtotal: number; iva: number; total: number };
  onClose: () => void;
  // Nuevos Props V2
  notes?: string;
  terms?: string;
  validityDays?: number;
}

export default function QuotePreview({ client, items, totals, onClose, notes, terms, validityDays }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const qrRef = useRef<SVGSVGElement>(null);

  // Folio temporal visual (El real lo genera la BBDD al guardar)
  const tempDate = new Date().toLocaleDateString('es-CL');
  const baseUrl = window.location.origin;
  // URL genérica, se actualizará con el folio real en el PDF
  const verificationUrl = `${baseUrl}/verify/preview`; 

  const handleEmit = async () => {
    if (isSaving) return;
    setIsSaving(true);
    
    try {
      // 1. Generar Imagen QR
      let qrDataUrl = '';
      try {
        if (qrRef.current) {
          const svgData = new XMLSerializer().serializeToString(qrRef.current);
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const img = new Image();
          const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
          const url = URL.createObjectURL(svgBlob);
          
          await new Promise((resolve, reject) => {
            img.onload = () => {
              canvas.width = img.width;
              canvas.height = img.height;
              ctx?.drawImage(img, 0, 0);
              qrDataUrl = canvas.toDataURL("image/png");
              URL.revokeObjectURL(url);
              resolve(true);
            };
            img.onerror = (e) => reject(e);
            img.src = url;
          });
        }
      } catch (qrError) {
        console.warn("QR Error", qrError);
      }

      // 2. Guardar en Base de Datos (Aquí se genera el Folio Real)
      const savedQuote = await quoteService.create({
        client_id: client.id,
        items: items,
        subtotal_neto: totals.subtotal,
        iva: totals.iva,
        total_bruto: totals.total,
        notes,
        terms,
        validity_days: validityDays
      });

      // 3. Generar PDF con el Folio Real que nos devolvió la BBDD
      const pdfSuccess = generateQuotePDF({
        folio: savedQuote.folio, // ¡Folio Real! (ej: COT-001/2026)
        items,
        subtotal_neto: totals.subtotal,
        iva: totals.iva,
        total_bruto: totals.total,
        created_at: savedQuote.created_at,
        notes,
        terms,
        validity_days: validityDays
      }, client, qrDataUrl);

      if (pdfSuccess) {
        toast.success(`Cotización ${savedQuote.folio} emitida y descargada`);
      } else {
        toast.warning(`Cotización ${savedQuote.folio} guardada, pero falló el PDF`);
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
      
      {/* QR Oculto para generación */}
      <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
        <QRCodeSVG ref={qrRef} value={verificationUrl} size={200} level="M" includeMargin={true} />
      </div>

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
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-900/20 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              {isSaving ? 'EMITIENDO...' : 'EMITIR OFICIAL'}
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
              <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-bold mb-2 inline-block uppercase">Borrador</div>
              <p className="text-sm text-slate-500 font-medium">Fecha: {tempDate}</p>
              {validityDays && <p className="text-xs text-slate-400">Validez: {validityDays} días</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-12">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Cliente:</p>
              <p className="font-bold text-xl text-slate-900 leading-tight">{client.razon_social}</p>
              <div className="mt-2 text-sm text-slate-600">
                <p>RUT: {client.rut}</p>
                <p>{client.direccion}</p>
              </div>
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
                  <td className="py-4 text-sm font-mono text-cyan-700 font-bold">{item.part_number}</td>
                  <td className="py-4 text-sm font-semibold text-slate-700">
                    {item.name}
                    {item.datasheet_url && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-cyan-600 font-normal">
                        <FileCheck className="w-3 h-3" /> Ficha Técnica Incluida
                      </div>
                    )}
                  </td>
                  <td className="py-4 text-sm text-center font-medium">{item.quantity}</td>
                  <td className="py-4 text-sm font-bold text-right text-slate-900">${item.total.toLocaleString('es-CL')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end border-t-2 border-slate-100 pt-8 mb-12">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Subtotal:</span>
                <span className="font-bold text-slate-700">${totals.subtotal.toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">IVA (19%):</span>
                <span className="font-bold text-slate-700">${totals.iva.toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between text-2xl font-black text-cyan-700 pt-4 border-t border-cyan-100">
                <span>TOTAL:</span>
                <span>${totals.total.toLocaleString('es-CL')}</span>
              </div>
            </div>
          </div>

          {/* Notas y Condiciones */}
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

        </div>
      </div>
    </div>
  );
}