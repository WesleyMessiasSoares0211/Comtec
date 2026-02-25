import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Client } from '../types/client';

interface QuoteData {
  folio: string;
  created_at?: string;
  items: any[];
  subtotal_neto: number;
  iva: number;
  total_bruto: number;
  total?: number; // Compatibilidad
}

export const generateQuotePDF = (quote: QuoteData, client: Client): boolean => {
  try {
    // Validación básica para evitar crash
    if (!quote || !quote.folio) {
      console.error("Datos de cotización incompletos");
      return false;
    }

    const doc = new jsPDF();
    const baseUrl = window.location.origin;
    
    // --- ENCABEZADO ---
    doc.setFontSize(22);
    doc.setTextColor(0, 157, 224);
    doc.text('COMTEC INDUSTRIAL', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Soluciones Industriales de Alta Calidad', 14, 28);
    
    // Datos Folio
    const fecha = quote.created_at 
      ? new Date(quote.created_at).toLocaleDateString('es-CL') 
      : new Date().toLocaleDateString('es-CL');

    doc.setTextColor(0);
    doc.text(`Folio: ${quote.folio}`, 150, 22);
    doc.text(`Fecha: ${fecha}`, 150, 28);

    doc.setDrawColor(200);
    doc.line(14, 35, 196, 35);

    // --- CLIENTE (Validamos que client exista para evitar crash) ---
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE:', 14, 45);
    doc.setFont('helvetica', 'normal');
    
    if (client) {
      doc.text(client.razon_social || 'Sin Razón Social', 14, 52);
      doc.text(`RUT: ${client.rut || 'S/R'}`, 14, 58);
      const dir = [client.direccion, client.comuna].filter(Boolean).join(', ');
      doc.text(dir || 'Sin dirección registrada', 14, 64);
    } else {
      doc.text('Datos del cliente no disponibles', 14, 52);
    }

    // --- TABLA ---
    const items = Array.isArray(quote.items) ? quote.items : [];

    autoTable(doc, {
      startY: 75,
      head: [['P/N', 'Descripción', 'Cant.', 'P. Unitario', 'Total']],
      body: items.map(i => [
        i.part_number || '-', 
        i.name || 'Ítem', 
        i.quantity || 0, 
        `$${(i.unit_price || 0).toLocaleString('es-CL')}`, 
        `$${(i.total || 0).toLocaleString('es-CL')}`
      ]),
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 30 },
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' }
      }
    });

    // --- TOTALES ---
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const total = quote.total_bruto || quote.total || 0;
    const neto = quote.subtotal_neto || Math.round(total / 1.19);
    const iva = quote.iva || (total - neto);

    doc.setFontSize(10);
    doc.text('Subtotal Neto:', 130, finalY);
    doc.text(`$${neto.toLocaleString('es-CL')}`, 196, finalY, { align: 'right' });
    
    doc.text('IVA (19%):', 130, finalY + 7);
    doc.text(`$${iva.toLocaleString('es-CL')}`, 196, finalY + 7, { align: 'right' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 157, 224);
    doc.text('TOTAL BRUTO:', 130, finalY + 15);
    doc.text(`$${total.toLocaleString('es-CL')}`, 196, finalY + 15, { align: 'right' });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Verificación online: ${verificationUrl}`, 14, 285);

    const safeFolio = quote.folio.replace(/[^a-z0-9]/gi, '_');
    doc.save(`Cotizacion_${safeFolio}.pdf`);
   return true;
  } catch (error) {
    console.error("PDF Generation Critical Error:", error);
    // Retornamos false para que la UI muestre el toast de error en vez de crashear
    return false;
  }
};