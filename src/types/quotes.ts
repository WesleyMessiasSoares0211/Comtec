export type QuoteStatus = 'Borrador' | 'Pendiente' | 'Pendiente de Aprobacion' | 'Aceptada' | 'Rechazada' | 'Facturada' | 'En Produccion';

export interface QuoteItem {
  id?: string;
  product_id?: string | null; // null si es genérico
  name: string;
  part_number: string;
  quantity: number;
  unit_price: number;
  total: number;
  is_manual?: boolean;
  technical_spec_url?: string;
  
  // --- NUEVOS CAMPOS: FASE 1.5 ---
  cost?: number;        // Costo base del producto
  margin_pct?: number;  // Margen de ganancia aplicado
  comment?: string;     // Comentario específico del ítem
  is_generic?: boolean; // Flag para saber si es fuera de catálogo
  
  // Preparación para Fase 2 (Producción)
  horas_maquina?: number;
  costo_material?: number;
}

export interface Quote {
  id: string;
  folio: string;
  client_id: string;
  attention_to?: string; // Para el cliente genérico
  estado: QuoteStatus;
  items: QuoteItem[];
  subtotal_neto: number;
  iva: number;
  total_bruto: number;
  created_at: string;
  
  // Relaciones
  crm_clients?: {
    razon_social: string;
    rut: string;
  };
}

export interface QuoteTelemetry {
  id: string;
  quote_id: string;
  action_type: 'view_portal' | 'download_official_pdf' | 'open_single_spec' | 'open_multiple_specs' | 'download_zip_specs';
  client_email: string;
  user_agent: string;
  metadata: any;
  created_at: string;
}