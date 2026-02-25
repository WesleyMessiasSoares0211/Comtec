import { supabase } from '../lib/supabase';
import { QuoteItem } from '../types/quotes';

export interface QuotePayload {
  client_id: string;
  items: QuoteItem[];
  subtotal_neto: number;
  iva: number;
  total_bruto: number;
  // Nuevos campos V2
  notes?: string;
  terms?: string;
  validity_days?: number;
  version?: number;
  parent_quote_id?: string; // Para futuras revisiones
}

export const quoteService = {
  // 1. Obtener el siguiente folio disponible (Sin consumirlo, solo para vista previa si quisieras)
  // Nota: Lo ideal es generarlo al guardar para evitar huecos.
  
  async create(payload: QuotePayload) {
    try {
      // A. Generar Folio Automático usando la función SQL
      const { data: folio, error: folioError } = await supabase
        .rpc('get_next_quote_folio');

      if (folioError) throw folioError;

      // B. Insertar la Cotización
      const { data, error } = await supabase
        .from('crm_quotes')
        .insert([{
          folio: folio, // Usamos el folio que nos dio la BBDD (ej: COT-001/2026)
          client_id: payload.client_id,
          items: payload.items,
          subtotal_neto: payload.subtotal_neto,
          iva: payload.iva,
          total_bruto: payload.total_bruto,
          estado: 'Pendiente',
          // Campos V2
          notes: payload.notes,
          terms: payload.terms,
          validity_days: payload.validity_days || 15,
          version: payload.version || 1
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;

    } catch (error) {
      console.error("Error en servicio de cotizaciones:", error);
      throw error;
    }
  },

  // Método para futura implementación de "Nueva Versión"
  async createRevision(originalQuoteId: string) {
    // Lógica pendiente para Fase 4: Clonar datos y aumentar versión
  }
};