export type ItemType = 'producto_final' | 'materia_prima' | 'insumo' | 'servicio_maquinaria';

export interface Product {
  id: string;
  name: string;
  part_number: string;
  price: number;
  tipo_item?: ItemType | string; // Clave para la Fase 2
  main_category: string;
  subcategory?: string;
  description?: string;
  image_url?: string;
  featured?: boolean;
  datasheet_url?: string;
  
  // Especificaciones técnicas
  protocol?: string;
  connectivity?: string;
  ej_uso?: string;
  metadata?: Record<string, any>;
  
  created_at?: string;
  updated_at?: string;
}