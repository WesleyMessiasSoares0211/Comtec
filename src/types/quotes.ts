export type QuoteStatus = 'Borrador' | 'Pendiente' | 'Aceptada' | 'Rechazada' | 'Facturada' | 'En Produccion';

export interface QuoteItem {
  id?: string;
  name: string;
  part_number: string;
  quantity: number;
  unit_price: number;
  total: number;
  is_manual?: boolean;
  technical_spec_url?: string;
  
  // Preparación para Fase 2 (Producción)
  horas_maquina?: number;
  costo_material?: number;
}

export interface Quote {
  id: string;
  folio: string;
  client_id: string;
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