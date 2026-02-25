import React, { useState, useMemo, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown, X, FileText, Loader2, ShieldCheck } from 'lucide-react';
import { quoteService } from '../../services/quoteService';
import { toast } from 'sonner';
import { Client } from '../../services/clientService';
import { QuoteItem } from '../../types/quotes';

interface Props {
  client: Client;
  items: QuoteItem[];
  totals: { subtotal: number; iva: number; total: number };
  onClose: () => void;
}

export default function QuotePreview({ client, items, totals, onClose }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  
  // Referencia oculta para generar el QR como imagen para el PDF
  const qrRef = useRef<SVGSVGElement>(null);

  // Folio generado (Mejor usar timestamp para evitar colisiones simples en frontend)
  const folio = useMemo(() => `OCT-${Date.now().toString().slice(-6)}`, []);
  
  // URL Correcta que coincide con App.tsx
  const baseUrl = window.location.origin; // Detecta automáticamente localhost o prod
  const verificationUrl = `${baseUrl}/verify/${folio}`;

  const generatePDF = async () => {
    if (isSaving) return;
    
    try {
      setIsSaving(true);

      // 1. Guardar en Base de Datos
      await quoteService.create({
        folio: folio,
        client_id: client.id,
        items: items.map(item => ({
          ...item,
          technical_spec_url: item.technical_spec_url || null 
        })),
        subtotal_neto: totals.subtotal,
        iva: totals.iva,
        total_bruto: totals.total
      });

      // 2. Preparar Imagen QR
      let qrDataUrl = '';
      if (qrRef.current) {
        const svgData = new XMLSerializer().serializeToString(qrRef.current);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);
        
        await new Promise((resolve) => {
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            qrDataUrl = canvas.toDataURL("image/png");
            URL.revokeObjectURL(url);
            resolve(true);
          };
          img.src = url;
        });
      }

      // 3. Generar PDF
      const doc = new jsPDF();
      
      // -- Header --
      doc.setFontSize(22);
      doc.setTextColor(0, 157, 224); // Cyan corporativo
      doc.text('COMTEC INDUSTRIAL', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('Soluciones Industriales de Alta Calidad', 14, 28);
      
      // Datos Folio
      doc.setTextColor(0);
      doc.text(`Folio: ${folio}`, 150, 22);
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, 150, 28);

      doc.setDrawColor(200);
      doc.line(14, 35, 196, 35);

      // -- Cliente --
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('CLIENTE:', 14, 45);
      doc.setFont('helvetica', 'normal');
      doc.text(client.razon_social, 14, 52);
      doc.text(`RUT: ${client.rut}`, 14, 58);
      doc.text(`${client.direccion || ''}, ${client.comuna || ''}`, 14, 64);

      // -- Insertar QR en el PDF si se generó --
      if (qrDataUrl) {
        doc.addImage(qrDataUrl, 'PNG', 160, 40, 30, 30);
        doc.setFontSize(8);
        doc.text("Verificar Oferta", 160, 75);
      }

      // -- Tabla --
      autoTable(doc, {
        startY: 85,
        head: [['P/N', 'Descripción Técnica', 'Cant.', 'P. Unitario', 'Total']],
        body: items.map(i => [
          i.part_number, 
          i.name, 
          i.quantity, 
          `$${i.unit_price.toLocaleString('es-CL')}`, 
          `$${i.total.toLocaleString('es-CL')}`
        ]),
        headStyles: { fillColor: [15, 23, 42] }, // Slate-950
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 30 },
          2: { halign: 'center' },
          3: { halign: 'right' },
          4: { halign: 'right' }
        }
      });

      // -- Totales --
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.text(`Subtotal Neto:`, 130, finalY);
      doc.text(`$${totals.subtotal.toLocaleString('es-CL')}`, 196, finalY, { align: 'right' });
      
      doc.text(`IVA (19%):`, 130, finalY + 7);
      doc.text(`$${totals.iva.toLocaleString('es-CL')}`, 196, finalY + 7, { align: 'right' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 157, 224);
      doc.text(`TOTAL BRUTO:`, 130, finalY + 15);
      doc.text(`$${totals.total.toLocaleString('es-CL')}`, 196, finalY + 15, { align: 'right' });

      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Validación online: ${verificationUrl}`, 14, 285);

      doc.save(`Oferta_Comtec_${folio}.pdf`);
      
      toast.success(`Oferta ${folio} registrada`, {
        description: "El PDF se ha descargado y el registro se guardó en la base de datos."
      });
      onClose();

    } catch (error: any) {
      console.error("Error PDF:", error);
      toast.error("Error al generar documento", {
        description: "Hubo un problema al guardar o generar el PDF."
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      
      {/* Elemento QR Oculto para renderizado Canvas/PDF */}
      <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
        <QRCodeSVG 
          ref={qrRef}
          value={verificationUrl} 
          size={200} 
          level="M" 
          includeMargin={true}
        />
      </div>

      <div className="bg-white w-full max-w-4xl my-auto rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        
        {/* Header Modal */}
        <div className="bg-slate-900 p-4 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="bg-cyan-500/10 p-1.5 rounded-lg">
              <FileText className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Vista Previa de Oferta</h3>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">{folio}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={generatePDF}
              disabled={isSaving}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-900/20 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              EMITIR Y DESCARGAR
            </button>
            <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-slate-400 p-2 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* --- Visualización (Sin cambios mayores, solo el QR visible) --- */}
        <div className="p-12 text-slate-800 bg-white overflow-y-auto max-h-[75vh]">
          {/* Header Documento */}
          <div className="flex justify-between border-b-2 border-slate-100 pb-8 mb-8">
            <div>
              <h1 className="text-3xl font-black text-blue-600 tracking-tighter">COMTEC</h1>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Industrial Solutions</p>
            </div>
            <div className="text-right">
              <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-bold mb-2 inline-block uppercase">Borrador</div>
              <p className="text-sm text-slate-500 font-medium">{new Date().toLocaleDateString('es-CL')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-12">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Atención a:</p>
              <p className="font-bold text-xl text-slate-900 leading-tight">{client.razon_social}</p>
              <div className="mt-4 space-y-1 text-sm text-slate-600">
                <p>RUT: {client.rut}</p>
                <p>{client.direccion}</p>
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              {/* QR Visible para el usuario */}
              <div className="p-3 border-2 border-slate-100 rounded-2xl bg-white shadow-sm inline-block">
                <QRCodeSVG value={verificationUrl} size={90} level="M" />
              </div>
              <p className="text-[8px] text-slate-400 mt-1 text-right italic">Escanee para verificar</p>
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
                  <td className="py-4 text-sm font-mono text-blue-600 font-bold">{item.part_number}</td>
                  <td className="py-4 text-sm font-semibold text-slate-700">{item.name}</td>
                  <td className="py-4 text-sm text-center font-medium">{item.quantity}</td>
                  <td className="py-4 text-sm font-bold text-right text-slate-900">${item.total.toLocaleString('es-CL')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer Totales */}
          <div className="flex justify-end border-t-2 border-slate-100 pt-8">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Subtotal:</span>
                <span className="font-bold text-slate-700">${totals.subtotal.toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">IVA (19%):</span>
                <span className="font-bold text-slate-700">${totals.iva.toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between text-2xl font-black text-blue-700 pt-4 border-t border-blue-100">
                <span>TOTAL:</span>
                <span>${totals.total.toLocaleString('es-CL')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}