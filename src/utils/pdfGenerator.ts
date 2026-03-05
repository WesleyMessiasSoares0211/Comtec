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
}

export const generateQuotePDF = (quote: QuoteData, client: Client, qrCodeUrl?: string): boolean => {
  try {
    const doc = new jsPDF();
    const baseUrl = window.location.origin;
    const verificationUrl = `${baseUrl}/verify/${encodeURIComponent(quote.folio)}`;
    
    // --- PALETA DE COLORES CORPORATIVA (Comtec Industrial) ---
    const colorCyan: [number, number, number] = [8, 145, 178]; // Cyan-600 (Enlaces/Totales)
    const colorSlateDark: [number, number, number] = [15, 23, 42]; // Slate-900 (Encabezados)
    const colorSlateText: [number, number, number] = [51, 65, 85]; // Slate-700 (Texto general)
    const colorSlateLight: [number, number, number] = [100, 116, 139]; // Slate-500 (Textos secundarios)
    const colorBgZebra: [number, number, number] = [248, 250, 252]; // Slate-50 (Fila cebra)

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

    const fecha = quote.created_at 
      ? new Date(quote.created_at).toLocaleDateString('es-CL') 
      : new Date().toLocaleDateString('es-CL');

    const folioText = quote.version && quote.version > 1 
      ? `COTIZACIÓN COMERCIAL (Rev. ${quote.version})` 
      : `COTIZACIÓN COMERCIAL`;
      
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
    if (quote.validity_days) {
      doc.text(`Validez de Oferta: ${quote.validity_days} días`, 196, 38, { align: 'right' });
    }

    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.setLineWidth(0.5);
    doc.line(14, 44, 196, 44);

    // --- DATOS DEL CLIENTE ---
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colorSlateLight[0], colorSlateLight[1], colorSlateLight[2]);
    doc.text('PREPARADO EXCLUSIVAMENTE PARA:', 14, 52);

    doc.setFontSize(11);
    doc.setTextColor(colorSlateDark[0], colorSlateDark[1], colorSlateDark[2]);
    doc.text(client.razon_social || 'Cliente General', 14, 58);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colorSlateText[0], colorSlateText[1], colorSlateText[2]);
    doc.text(`RUT Comercial: ${client.rut || 'No Registrado'}`, 14, 63);
    
    const ubicacion = [client.direccion, client.comuna, client.ciudad].filter(Boolean).join(', ');
    if (ubicacion) doc.text(ubicacion, 14, 68);

    if (qrCodeUrl) {
      try {
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(165, 48, 31, 34, 2, 2, 'FD');
        doc.addImage(qrCodeUrl, 'PNG', 168, 50, 25, 25);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colorCyan[0], colorCyan[1], colorCyan[2]);
        doc.text("VERIFICAR ONLINE", 180.5, 78, { align: 'center' });
      } catch (e) { console.warn("Error renderizando QR", e); }
    }

    // --- TABLA DE PRODUCTOS (AutoTable V3.0) ---
    const items = Array.isArray(quote.items) ? quote.items : [];

    // ✅ CORRECCIÓN DUPLICIDAD (PASO 1): El cuerpo de la tabla SOLO contiene el nombre del producto.
    // Ya no añadimos '\n\n Ver Ficha Técnica' aquí, así evitamos que se dibuje doble.
    const tableData = items.map(i => [
        i.part_number || 'S/N', 
        i.name || 'Sin Descripción', 
        i.quantity || 0, 
        `$${(i.unit_price || 0).toLocaleString('es-CL')}`, 
        `$${(i.total || 0).toLocaleString('es-CL')}`
    ]);

    autoTable(doc, {
      startY: 85,
      head: [['N° Parte', 'Descripción Técnica', 'Cant.', 'Precio Unit.', 'Total Neto']],
      body: tableData,
      theme: 'plain',
      headStyles: { 
        fillColor: colorSlateDark, 
        textColor: 255, 
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center'
      },
      bodyStyles: { 
        fontSize: 9, 
        textColor: colorSlateText,
        cellPadding: 4,
        valign: 'middle',
        lineColor: [226, 232, 240], // Slate-200
        lineWidth: 0.1
      },
      alternateRowStyles: {
        fillColor: colorBgZebra
      },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold', textColor: colorSlateDark },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 28, halign: 'right', fontStyle: 'bold', textColor: colorSlateDark }
      },
      // ✅ CORRECCIÓN DUPLICIDAD Y ESTÉTICA (PASO 2): Usamos didDrawCell para dibujar enlace y icono ESTÉTICO una sola vez.
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 1) {
          const item = items[data.row.index];
          if (item && item.datasheet_url) {
            // 🎨 Ajustes de color Cyan brillante para el enlace
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(colorCyan[0], colorCyan[1], colorCyan[2]);
            doc.setDrawColor(colorCyan[0], colorCyan[1], colorCyan[2]);
            doc.setLineWidth(0.3);

            // Calculamos posición Y base (justo debajo del nombre del producto)
            const textLines = doc.splitTextToSize(item.name || '', data.cell.width - 8);
            const startX = data.cell.x + 4;
            // Posición Y de línea base: data.cell.y + (número líneas * altura) + padding extra.
            const linkY = data.cell.y + (textLines.length * 4) + 8; 

            // 🖌️ CORRECCIÓN ESTÉTICA: Dibujamos icono vectorial nativo (recuadro con flecha saliendo)
            const iconSize = 3;
            const iconPad = 1.5;
            // Dibujar Recuadro de Enlace
            doc.rect(startX, linkY - iconSize + 0.5, iconSize, iconSize - 0.5, 'S'); 
            // Dibujar flecha (línea y cabeza)
            doc.line(startX + (iconSize / 2), linkY - (iconSize / 2) + 0.5, startX + iconSize + iconPad, linkY - 1.5); 
            doc.line(startX + iconSize + iconPad - 1, linkY - 2.5, startX + iconSize + iconPad, linkY - 1.5);
            doc.line(startX + iconSize + iconPad - 1, linkY - 0.5, startX + iconSize + iconPad, linkY - 1.5);

            // 3. Dibujar el texto azul "Ver Ficha Técnica" SIN corchetes
            doc.text('Ver Ficha Técnica', startX + iconSize + iconPad + 1, linkY);

            // UX: Creamos el área clicable de UX mejorada que cubre toda la celda de descripción
            doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, {
              url: item.datasheet_url
            });
          }
        }
      }
    });

    // --- BLOQUE DE TOTALES ---
    const finalY = (doc as any).lastAutoTable.finalY;
    if (finalY > 230) doc.addPage();
    const totalsY = finalY > 230 ? 20 : finalY + 10;
    
    // Caja de totales elegante
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.rect(130, totalsY, 66, 32, 'F');
    doc.line(130, totalsY, 196, totalsY);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colorSlateText[0], colorSlateText[1], colorSlateText[2]);
    doc.text('Subtotal Neto:', 135, totalsY + 8);
    doc.text(`$${Number(quote.subtotal_neto).toLocaleString('es-CL')}`, 192, totalsY + 8, { align: 'right' });
    
    doc.text('IVA (19%):', 135, totalsY + 15);
    doc.text(`$${Number(quote.iva).toLocaleString('es-CL')}`, 192, totalsY + 15, { align: 'right' });
    
    doc.setDrawColor(203, 213, 225); // Slate-300
    doc.line(135, totalsY + 19, 192, totalsY + 19);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colorCyan[0], colorCyan[1], colorCyan[2]);
    doc.text('TOTAL GENERAL:', 135, totalsY + 26);
    doc.text(`$${Number(quote.total_bruto).toLocaleString('es-CL')}`, 192, totalsY + 26, { align: 'right' });

    // --- NOTAS Y LEGALES ---
    let textY = totalsY + 40;
    
    if (quote.notes) {
      if (textY > 260) { doc.addPage(); textY = 20; }
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colorSlateDark[0], colorSlateDark[1], colorSlateDark[2]);
      doc.text('OBSERVACIONES DE LA OFERTA:', 14, textY);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colorSlateText[0], colorSlateText[1], colorSlateText[2]);
      const splitNotes = doc.splitTextToSize(quote.notes, 180);
      doc.text(splitNotes, 14, textY + 5);
      textY += (splitNotes.length * 4) + 10;
    }

    if (quote.terms) {
      if (textY > 260) { doc.addPage(); textY = 20; }
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colorSlateDark[0], colorSlateDark[1], colorSlateDark[2]);
      doc.text('TÉRMINOS Y CONDICIONES COMERCIALES:', 14, textY);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colorSlateText[0], colorSlateText[1], colorSlateText[2]);
      const splitTerms = doc.splitTextToSize(quote.terms, 180);
      doc.text(splitTerms, 14, textY + 5);
    }

    // --- PIE DE PÁGINA ---
    const pageCount = doc.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 280, 196, 280);
      doc.setFontSize(7);
      doc.setTextColor(colorSlateLight[0], colorSlateLight[1], colorSlateLight[2]);
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