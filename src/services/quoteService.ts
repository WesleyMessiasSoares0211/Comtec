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
  folio?: string; // Nuevo: Opcional, si viene es una revisión
  parent_quote_id?: string; // Nuevo: ID de la cotización original
}

export const quoteService = {
  // 1. CREAR COTIZACIÓN (Nueva o Revisión)
  async create(payload: QuotePayload) {
    try {
      let folioToUse = payload.folio;

      // A. Si NO traemos folio (es nueva), generamos uno nuevo automático
      if (!folioToUse) {
        const { data: newFolio, error: folioError } = await supabase
          .rpc('get_next_quote_folio');
        if (folioError) throw folioError;
        folioToUse = newFolio;
      }

      // B. Insertar Cotización
      const { data, error } = await supabase
        .from('crm_quotes')
        .insert([{
          folio: folioToUse, // Usamos el folio determinado
          client_id: payload.client_id,
          items: payload.items,
          subtotal_neto: payload.subtotal_neto,
          iva: payload.iva,
          total_bruto: payload.total_bruto,
          estado: 'Pendiente', // Las revisiones nacen pendientes
          notes: payload.notes,
          terms: payload.terms,
          validity_days: payload.validity_days || 15,
          version: payload.version || 1, // Si es revisión, vendrá > 1
          parent_quote_id: payload.parent_quote_id // Vinculación histórica
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;

    } catch (error) {
      console.error("Error creating quote:", error);
      throw error;
    }
  }, // <--- ESTA COMA ES VITAL PARA SEPARAR LAS FUNCIONES

  // 2. ACTUALIZAR ESTADO (Pendiente -> Aceptada/Facturada/Rechazada)
  async updateStatus(id: string, status: string) {
    try {
      const { error } = await supabase
        .from('crm_quotes')
        .update({ estado: status })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating status:', error);
      return false;
    }
  }
};