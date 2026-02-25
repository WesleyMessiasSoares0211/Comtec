import { supabase } from '../lib/supabase';
import { QuoteItem } from '../types/quotes';

export interface QuotePayload {
  client_id: string;
  items: QuoteItem[];
  subtotal_neto: number;
  iva: number;
  total_bruto: number;
  notes?: string;
  terms?: string;
  validity_days?: number;
  version?: number;
}

export const quoteService = {
  async create(payload: QuotePayload) {
    try {
      // 1. Obtener Folio Automático desde BBDD
      const { data: folio, error: folioError } = await supabase
        .rpc('get_next_quote_folio');

      if (folioError) throw folioError;

      // 2. Insertar Cotización
      // Nota: Los items guardan 'datasheet_url' para persistencia
      const { data, error } = await supabase
        .from('crm_quotes')
        .insert([{
          folio: folio, 
          client_id: payload.client_id,
          items: payload.items, // Asegurarse que los items llevan datasheet_url
          subtotal_neto: payload.subtotal_neto,
          iva: payload.iva,
          total_bruto: payload.total_bruto,
          estado: 'Pendiente',
          notes: payload.notes,
          terms: payload.terms, // Aquí viajan los términos personalizados del cliente
          validity_days: payload.validity_days || 15,
          version: payload.version || 1
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;

    } catch (error) {
      console.error("Error creating quote:", error);
      throw error;
    }
  }
};