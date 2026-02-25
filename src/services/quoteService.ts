import { supabase } from '../lib/supabase';

export interface QuoteItem {
  id?: string;
  name: string;
  part_number: string;
  quantity: number;
  unit_price: number;
  total: number;
  technical_spec_url?: string | null;
  is_manual?: boolean;
}

export interface QuotePayload {
  folio: string;
  client_id: string;
  items: QuoteItem[];
  subtotal_neto: number;
  iva: number;
  total_bruto: number;
}

export const quoteService = {
  async getAll() {
    const { data, error } = await supabase
      .from('crm_quotes')
      .select('*, crm_clients(razon_social)')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  },

  async updateStatus(id: string, newStatus: string) {
    const { error } = await supabase
      .from('crm_quotes')
      .update({ estado: newStatus })
      .eq('id', id);
      
    if (error) throw error;
  },

  async create(payload: QuotePayload) {
    // Aseguramos que el payload coincida con la estructura de la DB
    const { error } = await supabase
      .from('crm_quotes')
      .insert([{
        folio: payload.folio,
        client_id: payload.client_id,
        items: payload.items, // Supabase maneja JSONB automáticamente
        subtotal_neto: payload.subtotal_neto,
        iva: payload.iva,
        total_bruto: payload.total_bruto,
        estado: 'generada' // Estado inicial por defecto
      }]);
      
    if (error) {
        console.error("Error creating quote:", error);
        throw error;
    }
  }
};