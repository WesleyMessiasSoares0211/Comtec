export type CommercialCondition = 
  | 'Contado' 
  | 'Anticipado'
  | 'Crédito 30 días' 
  | 'Crédito 60 días' 
  | 'Crédito 90 días';

export type FinancialStatus = 'pendiente' | 'aprobado' | 'rechazado';

export interface ClientContact {
  id?: string; // Opcional (generado por DB)
  client_id?: string;
  nombre: string;
  cargo: string;
  email: string;
  telefono: string;
  es_principal: boolean;
}

export interface Client {
  id: string;
  rut: string;
  razon_social: string;
  giro: string;
  direccion?: string | null;
  comuna?: string | null;
  ciudad?: string | null;
  
  // Estos campos se mantienen por compatibilidad, pero la verdad está en 'contacts'
  email_contacto?: string | null; 
  telefono?: string | null;      
  
  tags?: string[];
  last_contact_date?: string | null;
  
  // Financiero
  condicion_comercial?: CommercialCondition;
  estado_financiero?: FinancialStatus;
  
  // Relación (Supabase devuelve esto al hacer join)
  contacts?: ClientContact[];

  created_at?: string;
  deleted_at?: string | null;
}

export interface CreateClientData {
  rut: string;
  razon_social: string;
  giro: string;
  direccion?: string;
  comuna?: string;
  ciudad?: string;
  email_contacto?: string;
  telefono?: string;

  tags?: string[];
  condicion_comercial?: CommercialCondition;
  estado_financiero?: FinancialStatus;

  contacts?: ClientContact[];
}

export interface ClientStats {
  totalActive: number;
  newThisMonth: number;
  topClients: Array<{
    id: string;
    razon_social: string;
    totalAmount: number;
  }>;
}

export interface ClientQuoteHistory {
  id: string;
  folio: string;
  total: number;
  estado: string;
  created_at: string;
  items?: any;
}