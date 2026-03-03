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
  folio?: string; 
  parent_quote_id?: string; 
}

export const quoteService = {
  // 1. CREAR COTIZACIÓN (Nueva o Revisión)
  async create(payload: QuotePayload) {
    try {
      // --- NUEVO: Obtener la identidad del usuario actual de forma segura ---
      const { data: { user } } = await supabase.auth.getUser();

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
          folio: folioToUse, 
          client_id: payload.client_id,
          items: payload.items,
          subtotal_neto: payload.subtotal_neto,
          iva: payload.iva,
          total_bruto: payload.total_bruto,
          estado: 'Pendiente', 
          notes: payload.notes,
          terms: payload.terms,
          validity_days: payload.validity_days || 15,
          version: payload.version || 1, 
          parent_quote_id: payload.parent_quote_id,
          vendedor_id: user?.id // --- NUEVO: Vinculación histórica con el vendedor ---
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;

    } catch (error) {
      console.error("Error creating quote:", error);
      throw error;
    }
  },

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