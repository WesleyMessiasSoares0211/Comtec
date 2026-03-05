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
  version?: number;
  attention_to?: string; 
  seller_profile?: any; 
}

export const generateQuotePDF = (quote: QuoteData, client: Client, qrCodeUrl?: string): boolean => {
  try {
    const doc = new jsPDF();
    const baseUrl = window.location.origin;
    const verificationUrl = `${baseUrl}/verify/${encodeURIComponent(quote.folio)}`;
    
    // Paleta de colores
    const colorCyan: [number, number, number] = [8, 145, 178]; 
    const colorSlateDark: [number, number, number] = [15, 23, 42]; 
    const colorSlateText: [number, number, number] = [51, 65, 85]; 
    const colorSlateLight: [number, number, number] = [100, 116, 139]; 
    const colorBgZebra: [number, number, number] = [248, 250, 252]; 

    // --- ENCABEZADO ---
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colorCyan[0], colorCyan[1], colorCyan[2]);
    doc.text('COMTEC', 14, 22);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colorSlateDark[0], colorSlateDark[1], colorSlateDark[2]);
    doc.text('INDUSTRIAL SOLUTIONS', 14, 28);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colorSlateLight[0], colorSlateLight[1], colorSlateLight[2]);
    doc.text('www.comtecindustrial.com', 14, 33);

    const fecha = quote.created_at ? new Date(quote.created_at).toLocaleDateString('es-CL') : new Date().toLocaleDateString('es-CL');
    const folioText = quote.version && quote.version > 1 ? `COTIZACIÓN COMERCIAL (Rev. ${quote.version})` : `COTIZACIÓN COMERCIAL`;
      
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colorSlateDark[0], colorSlateDark[1], colorSlateDark[2]);
    doc.text(folioText, 196, 22, { align: 'right' });
    
    doc.setFontSize(11);
    doc.setTextColor(colorCyan[0], colorCyan[1], colorCyan[2]);
    doc.text(`Nº ${quote.folio}`, 196, 28, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colorSlateText[0], colorSlateText[1], colorSlateText[2]);
    doc.text(`Fecha de Emisión: ${fecha}`, 196, 33, { align: 'right' });
    if (quote.validity_days) doc.text(`Validez de Oferta: ${quote.validity_days} días`, 196, 38, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 44, 196, 44);

    // --- DATOS DEL CLIENTE ---
    const isGeneric = client.rut === '1-9' || client.rut === 'Contado' || client.id === '00000000-0000-0000-0000-000000000000';

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colorSlateLight[0], colorSlateLight[1], colorSlateLight[2]);
    doc.text(isGeneric ? 'ATENCIÓN A:' : 'PREPARADO EXCLUSIVAMENTE PARA:', 14, 52);

    if (isGeneric) {
      doc.setFontSize(12);
      doc.setTextColor(colorSlateDark[0], colorSlateDark[1], colorSlateDark[2]);
      doc.text(quote.attention_to ? quote.attention_to.toUpperCase() : 'VENTA EXPRESS (CONTADO)', 14, 58);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colorSlateText[0], colorSlateText[1], colorSlateText[2]);
      doc.text('Cotización al Contado', 14, 63);
    } else {
      doc.setFontSize(11);
      doc.setTextColor(colorSlateDark[0], colorSlateDark[1], colorSlateDark[2]);
      doc.text(client.razon_social || 'Cliente General', 14, 58);
      
      let nextY = 63;
      if (quote.attention_to) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colorCyan[0], colorCyan[1], colorCyan[2]);
        doc.text(`ATN: ${quote.attention_to}`, 14, nextY);
        nextY += 5;
      }
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colorSlateText[0], colorSlateText[1], colorSlateText[2]);
      doc.text(`RUT Comercial: ${client.rut || 'No Registrado'}`, 14, nextY);
      nextY += 5;
      
      const ubicacion = [client.direccion, client.comuna, client.ciudad].filter(Boolean).join(', ');
      if (ubicacion) doc.text(ubicacion, 14, nextY);
    }

    if (qrCodeUrl) {
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(165, 48, 31, 34, 2, 2, 'FD');
      doc.addImage(qrCodeUrl, 'PNG', 168, 50, 25, 25);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colorCyan[0], colorCyan[1], colorCyan[2]);
      doc.text("VERIFICAR ONLINE", 180.5, 78, { align: 'center' });
    }

    // --- TABLA DE PRODUCTOS ---
    const items = Array.isArray(quote.items) ? quote.items : [];

    const tableData = items.map(i => [
      i.part_number || 'S/N', 
      '', // Dejamos la columna descripción "vacía" para dibujarla nosotros
      i.quantity || 0, 
      `$${(i.unit_price || 0).toLocaleString('es-CL')}`, 
      `$${(i.total || 0).toLocaleString('es-CL')}`
    ]);

    autoTable(doc, {
      startY: 85,
      head: [['N° Parte', 'Descripción Técnica', 'Cant.', 'Precio Unit.', 'Total Neto']],
      body: tableData,
      theme: 'plain',
      headStyles: { fillColor: colorSlateDark, textColor: 255, fontStyle: 'bold', fontSize: 9, halign: 'center' },
      bodyStyles: { fontSize: 9, textColor: colorSlateText, cellPadding: 4, valign: 'top', lineColor: [226, 232, 240], lineWidth: 0.1 },
      alternateRowStyles: { fillColor: colorBgZebra },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold', textColor: colorSlateDark },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 28, halign: 'right', fontStyle: 'bold', textColor: colorSlateDark }
      },
      didParseCell: (data) => {
        // Reservamos la altura de la fila creando líneas en blanco ocultas
        if (data.section === 'body' && data.column.index === 1) {
           const item = items[data.row.index];
           let linesRequired = doc.splitTextToSize(item.name || 'Sin Descripción', data.cell.width - 8).length;
           
           if (item.comment) linesRequired += doc.splitTextToSize(`Nota: ${item.comment}`, data.cell.width - 8).length + 0.5;
           if (item.datasheet_url) linesRequired += 1.5;
           
           data.cell.text = Array(Math.ceil(linesRequired)).fill(''); // Expande la fila automáticamente
        }
      },
      didDrawCell: (data) => {
        // Dibujamos nuestro propio contenido ordenado en la columna Descripción
        if (data.section === 'body' && data.column.index === 1) {
          const item = items[data.row.index];
          let currentY = data.cell.y + 5; 
          const startX = data.cell.x + 3; 

          // 1. Nombre Principal
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(colorSlateText[0], colorSlateText[1], colorSlateText[2]);
          const nameLines = doc.splitTextToSize(item.name || 'Sin Descripción', data.cell.width - 6);
          doc.text(nameLines, startX, currentY);
          currentY += (nameLines.length * 4); // Espaciado

          // 2. Comentario (Si existe)
          if (item.comment) {
             doc.setFontSize(8);
             doc.setFont('helvetica', 'italic');
             doc.setTextColor(colorSlateLight[0], colorSlateLight[1], colorSlateLight[2]);
             const commentLines = doc.splitTextToSize(`Nota: ${item.comment}`, data.cell.width - 6);
             doc.text(commentLines, startX, currentY);
             currentY += (commentLines.length * 3.5) + 1.5; 
          }

          // 3. Link Ficha Técnica (Si existe)
          if (item.datasheet_url) {
            currentY += 1; // Un pequeño respiro antes del botón
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(colorCyan[0], colorCyan[1], colorCyan[2]);
            doc.setDrawColor(colorCyan[0], colorCyan[1], colorCyan[2]);
            doc.setLineWidth(0.25);

            const iconY = currentY - 2.5; 
            const iconW = 2.4; const iconH = 3.0;

            doc.line(startX, iconY, startX, iconY + iconH); 
            doc.line(startX, iconY + iconH, startX + iconW, iconY + iconH); 
            doc.line(startX + iconW, iconY + iconH, startX + iconW, iconY + 0.8); 
            doc.line(startX + iconW - 0.8, iconY, startX, iconY); 
            doc.line(startX + iconW - 0.8, iconY, startX + iconW, iconY + 0.8);
            doc.line(startX + iconW - 0.8, iconY, startX + iconW - 0.8, iconY + 0.8);
            doc.line(startX + iconW - 0.8, iconY + 0.8, startX + iconW, iconY + 0.8);
            doc.line(startX + 0.5, iconY + 1.4, startX + 1.6, iconY + 1.4);
            doc.line(startX + 0.5, iconY + 2.0, startX + 1.2, iconY + 2.0);

            doc.text('Ver Ficha Técnica', startX + iconW + 1.5, currentY);
            doc.link(data.cell.x, currentY - 3, 30, 4, { url: item.datasheet_url });
          }
        }
      }
    });

    // --- BLOQUE DE TOTALES ---
    const finalY = (doc as any).lastAutoTable.finalY;
    if (finalY > 230) doc.addPage();
    const totalsY = finalY > 230 ? 20 : finalY + 10;
    
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.rect(130, totalsY, 66, 32, 'F');
    doc.line(130, totalsY, 196, totalsY);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colorSlateText[0], colorSlateText[1], colorSlateText[2]);
    doc.text('Subtotal Neto:', 135, totalsY + 8);
    doc.text(`$${Number(quote.subtotal_neto).toLocaleString('es-CL', { maximumFractionDigits: 0 })}`, 192, totalsY + 8, { align: 'right' });
    
    doc.text('IVA (19%):', 135, totalsY + 15);
    doc.text(`$${Number(quote.iva).toLocaleString('es-CL', { maximumFractionDigits: 0 })}`, 192, totalsY + 15, { align: 'right' });
    
    doc.setDrawColor(203, 213, 225);
    doc.line(135, totalsY + 19, 192, totalsY + 19);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colorCyan[0], colorCyan[1], colorCyan[2]);
    doc.text('TOTAL GENERAL:', 135, totalsY + 26);
    doc.text(`$${Number(quote.total_bruto).toLocaleString('es-CL', { maximumFractionDigits: 0 })}`, 192, totalsY + 26, { align: 'right' });

    let textY = totalsY + 40;
    
    if (quote.notes) {
      if (textY > 260) { doc.addPage(); textY = 20; }
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(colorSlateDark[0], colorSlateDark[1], colorSlateDark[2]);
      doc.text('OBSERVACIONES DE LA OFERTA:', 14, textY);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(colorSlateText[0], colorSlateText[1], colorSlateText[2]);
      const splitNotes = doc.splitTextToSize(quote.notes, 180);
      doc.text(splitNotes, 14, textY + 5);
      textY += (splitNotes.length * 4) + 10;
    }

    if (quote.terms) {
      if (textY > 260) { doc.addPage(); textY = 20; }
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(colorSlateDark[0], colorSlateDark[1], colorSlateDark[2]);
      doc.text('TÉRMINOS Y CONDICIONES COMERCIALES:', 14, textY);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(colorSlateText[0], colorSlateText[1], colorSlateText[2]);
      const splitTerms = doc.splitTextToSize(quote.terms, 180);
      doc.text(splitTerms, 14, textY + 5);
      textY += (splitTerms.length * 4) + 10;
    }

    if (quote.seller_profile) {
       if (textY > 260) { doc.addPage(); textY = 20; }
       doc.setDrawColor(226, 232, 240); doc.line(14, textY, 80, textY); 
       doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(colorSlateLight[0], colorSlateLight[1], colorSlateLight[2]);
       doc.text('Emitido por:', 14, textY + 5);
       doc.setFontSize(9); doc.setTextColor(colorSlateDark[0], colorSlateDark[1], colorSlateDark[2]);
       doc.text(quote.seller_profile.nombre_completo || 'Representante de Ventas', 14, textY + 10);
       doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(colorSlateText[0], colorSlateText[1], colorSlateText[2]);
       doc.text(`${quote.seller_profile.email || ''} ${quote.seller_profile.telefono ? `| Tel: ${quote.seller_profile.telefono}` : ''}`, 14, textY + 14);
    }

    const pageCount = doc.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240); doc.line(14, 280, 196, 280);
      doc.setFontSize(7); doc.setTextColor(colorSlateLight[0], colorSlateLight[1], colorSlateLight[2]);
      doc.text(`Página ${i} de ${pageCount}`, 196, 285, { align: 'right' });
      doc.text(`Documento generado por Sistema Comtec Industrial. Para verificar autenticidad escanee el código QR o visite:`, 14, 285);
      doc.setTextColor(colorCyan[0], colorCyan[1], colorCyan[2]);
      doc.textWithLink(verificationUrl, 14, 289, { url: verificationUrl });
    }

    const safeFolio = quote.folio.replace(/[^a-z0-9]/gi, '_');
    doc.save(`Cotizacion_${safeFolio}.pdf`);
    return true;
  } catch (error) {
    console.error("PDF Generator Error:", error);
    return false;
  }
};