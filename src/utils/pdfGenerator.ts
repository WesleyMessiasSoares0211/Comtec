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
  notes?: string;
  terms?: string;
  validity_days?: number;
}

export const generateQuotePDF = (quote: QuoteData, client: Client, qrCodeUrl?: string): boolean => {
  try {
    const doc = new jsPDF();
    const baseUrl = window.location.origin;
    // URL de verificación real
    const verificationUrl = `${baseUrl}/verify/${quote.folio}`;
    
    // --- COLORES ---
    const colorCyan = [0, 157, 224];
    const colorSlate = [15, 23, 42];
    const colorGray = [100, 116, 139];

    // --- ENCABEZADO ---
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colorCyan[0], colorCyan[1], colorCyan[2]);
    doc.text('COMTEC', 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
    doc.text('INDUSTRIAL SOLUTIONS', 14, 25);

    // Datos Folio
    const fecha = quote.created_at 
      ? new Date(quote.created_at).toLocaleDateString('es-CL') 
      : new Date().toLocaleDateString('es-CL');

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`COTIZACIÓN`, 196, 20, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
    doc.text(`# ${quote.folio}`, 196, 26, { align: 'right' });
    doc.text(`Fecha: ${fecha}`, 196, 31, { align: 'right' });
    
    if (quote.validity_days) {
      doc.text(`Validez: ${quote.validity_days} días`, 196, 36, { align: 'right' });
    }

    doc.setDrawColor(200);
    doc.line(14, 40, 196, 40);

    // --- CLIENTE ---
    doc.setFontSize(9);
    doc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
    doc.text('PREPARADO PARA:', 14, 50);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text(client.razon_social || 'Cliente General', 14, 56);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
    doc.text(`RUT: ${client.rut || '---'}`, 14, 62);
    
    const ubicacion = [client.direccion, client.comuna, client.ciudad].filter(Boolean).join(', ');
    if (ubicacion) doc.text(ubicacion, 14, 67);

    // --- QR (Imagen) ---
    if (qrCodeUrl) {
      try {
        doc.addImage(qrCodeUrl, 'PNG', 165, 42, 25, 25);
      } catch (e) { console.warn(e); }
    }

    // --- TABLA ---
    const items = Array.isArray(quote.items) ? quote.items : [];

    autoTable(doc, {
      startY: 80,
      head: [['Cód.', 'Descripción / Ficha', 'Cant.', 'Precio Unit.', 'Total']],
      body: items.map(i => [
        i.part_number || '-', 
        i.name + (i.datasheet_url ? '\n[+] Ver Ficha Técnica' : ''), 
        i.quantity || 0, 
        `$${(i.unit_price || 0).toLocaleString('es-CL')}`, 
        `$${(i.total || 0).toLocaleString('es-CL')}`
      ]),
      theme: 'grid',
      headStyles: { 
        fillColor: colorSlate, 
        textColor: 255, 
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { 
        fontSize: 9, 
        cellPadding: 4,
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 25, fontStyle: 'bold', textColor: [0, 100, 200] },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
      },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 1) {
          const item = items[data.row.index];
          if (item && item.datasheet_url) {
            doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, {
              url: item.datasheet_url
            });
          }
        }
      }
    });

    // --- TOTALES Y PIE ---
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Nueva página si falta espacio
    if (finalY > 220) doc.addPage();
    const totalsY = finalY > 220 ? 20 : finalY;
    
    // Totales
    doc.setFontSize(10);
    doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
    doc.text('Subtotal Neto:', 140, totalsY);
    doc.text(`$${Number(quote.subtotal_neto).toLocaleString('es-CL')}`, 196, totalsY, { align: 'right' });
    
    doc.text('IVA (19%):', 140, totalsY + 6);
    doc.text(`$${Number(quote.iva).toLocaleString('es-CL')}`, 196, totalsY + 6, { align: 'right' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colorCyan[0], colorCyan[1], colorCyan[2]);
    doc.text('TOTAL:', 140, totalsY + 14);
    doc.text(`$${Number(quote.total_bruto).toLocaleString('es-CL')}`, 196, totalsY + 14, { align: 'right' });

    // Textos Legales
    let textY = totalsY + 25;
    
    if (quote.notes) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
      doc.text('OBSERVACIONES:', 14, textY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80);
      const splitNotes = doc.splitTextToSize(quote.notes, 180);
      doc.text(splitNotes, 14, textY + 5);
      textY += (splitNotes.length * 4) + 10;
    }

    if (quote.terms) {
      // Verificar salto de página para términos
      if (textY > 260) {
          doc.addPage();
          textY = 20;
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colorSlate[0], colorSlate[1], colorSlate[2]);
      doc.text('TÉRMINOS Y CONDICIONES:', 14, textY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80);
      const splitTerms = doc.splitTextToSize(quote.terms, 180);
      doc.text(splitTerms, 14, textY + 5);
    }

    // Pie de página
    const pageCount = doc.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount}`, 196, 285, { align: 'right' });
      doc.text(`Verificación: ${verificationUrl}`, 14, 285);
    }

    const safeFolio = quote.folio.replace(/[^a-z0-9]/gi, '_');
    doc.save(`Cotizacion_${safeFolio}.pdf`);
    return true;
  } catch (error) {
    console.error("PDF Generator Error:", error);
    return false;
  }
};