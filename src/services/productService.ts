import { supabase } from '../lib/supabase';
import { Product, ProductFormData } from '../types/product';

/**
 * Normaliza el campo ej_uso para que siempre sea un Array de Objetos
 */
const formatEjUsoToJSONB = (val: any): any[] => {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map(item => {
      if (typeof item === 'object' && item !== null) {
        return {
          title: item.title || "Caso de Aplicación",
          industry: item.industry || "General",
          description: item.description || ""
        };
      }
      return { title: "Caso de Aplicación", industry: "General", description: String(item) };
    });
  }
  if (typeof val === 'string') {
    return val.split('\n').map(l => l.trim()).filter(Boolean).map(line => ({
      title: "Caso de Aplicación", industry: "General", description: line
    }));
  }
  return [];
};

export const productService = {
  async create(formData: ProductFormData): Promise<Product> {
    // 1. Payload base estricto sin la columna problemática
    const basePayload: any = {
      name: formData.name,
      main_category: formData.main_category,
      subcategory: formData.subcategory || '',
      description: formData.description,
      price: formData.price,
      image_url: formData.image_url,
      featured: formData.featured || false,
      protocol: formData.protocol || formData.metadata?.protocol || '',
      connectivity: formData.connectivity || formData.metadata?.connectivity || '',
      part_number: formData.part_number || formData.metadata?.part_number || '',
      datasheet_url: formData.datasheet_url || formData.metadata?.datasheet_url || '',
      ej_uso: formatEjUsoToJSONB(formData.ej_uso),
      metadata: formData.metadata || {}
    };

    try {
      // Intentamos con la columna de Fase 2
      const fullPayload = { ...basePayload, tipo_item: formData.tipo_item || 'producto_final' };
      
      const { data, error } = await supabase.from('products').insert([fullPayload]).select().single();

      if (error) {
        // Fallback si la BBDD rechaza la columna
        if (error.message.includes('tipo_item') || error.code === 'PGRST204') {
          console.warn('⚠️ Cache DB: Creando producto sin clasificación tipo_item.');
          const { data: fallbackData, error: fallbackError } = await supabase.from('products').insert([basePayload]).select().single();
          if (fallbackError) throw fallbackError;
          return fallbackData;
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  },

  async update(id: string, formData: Partial<ProductFormData>): Promise<Product> {
    // 1. Payload base estricto
    const basePayload: any = {
      name: formData.name,
      main_category: formData.main_category,
      subcategory: formData.subcategory,
      description: formData.description,
      price: formData.price,
      image_url: formData.image_url,
      featured: formData.featured,
      protocol: formData.protocol || formData.metadata?.protocol || '',
      connectivity: formData.connectivity || formData.metadata?.connectivity || '',
      part_number: formData.part_number || formData.metadata?.part_number || '',
      datasheet_url: formData.datasheet_url || formData.metadata?.datasheet_url || '',
    };

    if (formData.ej_uso !== undefined) basePayload.ej_uso = formatEjUsoToJSONB(formData.ej_uso);
    if (formData.metadata) basePayload.metadata = formData.metadata;

    try {
      // Intentamos actualizar con la columna de Fase 2
      const fullPayload = { ...basePayload, tipo_item: formData.tipo_item || 'producto_final' };
      
      const { data, error } = await supabase.from('products').update(fullPayload).eq('id', id).select().single();

      if (error) {
        // Fallback si la BBDD rechaza la columna
        if (error.message.includes('tipo_item') || error.code === 'PGRST204') {
          console.warn('⚠️ Cache DB: Actualizando producto sin clasificación tipo_item.');
          const { data: fallbackData, error: fallbackError } = await supabase.from('products').update(basePayload).eq('id', id).select().single();
          if (fallbackError) throw fallbackError;
          return fallbackData;
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  },

  async getAll(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  }
};