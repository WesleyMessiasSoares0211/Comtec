import { supabase } from '../lib/supabase';
import { Product, ProductFormData } from '../types/product';
// NUEVA IMPORTACIÓN: Traemos el servicio de almacenamiento
import { storageService } from './storageService';

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
      const fullPayload = { ...basePayload, tipo_item: formData.tipo_item || 'producto_final' };
      const { data, error } = await supabase.from('products').insert([fullPayload]).select().single();

      if (error) {
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
    // 0. ANTES DE ACTUALIZAR: Rescatamos el producto original para comparar si cambiaron los archivos
    const existingProduct = await this.getById(id);

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
      let resultData;
      const fullPayload = { ...basePayload, tipo_item: formData.tipo_item || 'producto_final' };
      const { data, error } = await supabase.from('products').update(fullPayload).eq('id', id).select().single();

      if (error) {
        if (error.message.includes('tipo_item') || error.code === 'PGRST204') {
          console.warn('⚠️ Cache DB: Actualizando producto sin clasificación tipo_item.');
          const { data: fallbackData, error: fallbackError } = await supabase.from('products').update(basePayload).eq('id', id).select().single();
          if (fallbackError) throw fallbackError;
          resultData = fallbackData;
        } else {
          throw error;
        }
      } else {
        resultData = data;
      }

      // 1. DESPUÉS DE ACTUALIZAR EXITOSAMENTE: Limpieza de archivos antiguos (si fueron reemplazados o borrados)
      if (existingProduct) {
        try {
          // Si tenía foto, y la nueva foto es diferente o nula, borramos la antigua
          if (existingProduct.image_url && existingProduct.image_url !== resultData.image_url) {
            await storageService.deleteFile(existingProduct.image_url, 'product-images');
          }
          // Si tenía PDF, y el nuevo PDF es diferente o nulo, borramos el antiguo
          if (existingProduct.datasheet_url && existingProduct.datasheet_url !== resultData.datasheet_url) {
            await storageService.deleteFile(existingProduct.datasheet_url, 'tech-specs');
          }
        } catch (cleanupError) {
          console.warn("Atención: No se pudo limpiar el archivo huérfano (quizás ya no existía en Storage):", cleanupError);
        }
      }

      return resultData;
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
    // 1. Rescatamos el producto antes de borrarlo de Postgres para saber qué archivos tenía
    const existingProduct = await this.getById(id);

    // 2. Borramos el producto de la base de datos
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;

    // 3. Si la base de datos lo borró con éxito, destruimos sus archivos en Storage
    if (existingProduct) {
      try {
        if (existingProduct.image_url) {
          await storageService.deleteFile(existingProduct.image_url, 'product-images');
        }
        if (existingProduct.datasheet_url) {
          await storageService.deleteFile(existingProduct.datasheet_url, 'tech-specs');
        }
      } catch (cleanupError) {
        console.warn("Atención: Producto eliminado, pero hubo un error limpiando sus archivos de Storage:", cleanupError);
      }
    }
  }
};