import { supabase } from '../lib/supabase';
import { Product, ProductFormData } from '../types/product';
import { storageService } from './storageService';

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
  
  extractFilePath(url: string, bucketName: string): string | null {
    if (!url) return null;
    if (!url.startsWith('http')) {
      console.log(`[Extractor] La URL ya es un path corto: ${url}`);
      return url;
    }
    
    // Rastreamos qué URL está intentando cortar
    console.log(`[Extractor] Intentando cortar URL completa: ${url}`);
    
    const separator = `/public/${bucketName}/`;
    const parts = url.split(separator);
    
    const result = parts.length > 1 ? parts[1] : null;
    console.log(`[Extractor] Resultado del corte: ${result}`);
    return result;
  },

  async create(formData: ProductFormData): Promise<Product> {
    // Ya no intentamos enviar tipo_item para evitar el Error 400 en la consola
    const payload: any = {
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

    const { data, error } = await supabase.from('products').insert([payload]).select().single();
    if (error) {
      console.error("Error creating product:", error);
      throw error;
    }
    return data;
  },

  async update(id: string, formData: Partial<ProductFormData>): Promise<Product> {
    const existingProduct = await this.getById(id);

    const payload: any = {
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

    if (formData.ej_uso !== undefined) payload.ej_uso = formatEjUsoToJSONB(formData.ej_uso);
    if (formData.metadata) payload.metadata = formData.metadata;

    const { data, error } = await supabase.from('products').update(payload).eq('id', id).select().single();
    if (error) {
      console.error("Error updating product:", error);
      throw error;
    }

    if (existingProduct) {
      try {
        if (existingProduct.image_url && existingProduct.image_url !== data.image_url) {
          const imagePath = this.extractFilePath(existingProduct.image_url, 'product-images');
          if (imagePath) await storageService.deleteFile(imagePath, 'product-images');
        }
        if (existingProduct.datasheet_url && existingProduct.datasheet_url !== data.datasheet_url) {
          const pdfPath = this.extractFilePath(existingProduct.datasheet_url, 'tech-specs');
          if (pdfPath) await storageService.deleteFile(pdfPath, 'tech-specs');
        }
      } catch (cleanupError) {
        console.warn("Error silencioso limpiando archivo huérfano:", cleanupError);
      }
    }
    return data;
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
    console.log(`[DELETE] Iniciando proceso para el producto ID: ${id}`);
    
    // 1. Rescatamos el producto
    const existingProduct = await this.getById(id);
    console.log(`[DELETE] Producto recuperado de DB:`, existingProduct);

    // 2. Borramos de Postgres
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    console.log(`[DELETE] Eliminado de la base de datos relacional con éxito.`);

    // 3. Limpieza de Storage
    if (existingProduct) {
      try {
        if (existingProduct.image_url) {
          console.log(`[DELETE] Procesando imagen original...`);
          const imagePath = this.extractFilePath(existingProduct.image_url, 'product-images');
          if (imagePath) {
            await storageService.deleteFile(imagePath, 'product-images');
            console.log("✅ Imagen eliminada exitosamente del bucket");
          } else {
             console.log("❌ No se pudo extraer el path de la imagen.");
          }
        }
        
        if (existingProduct.datasheet_url) {
          console.log(`[DELETE] Procesando PDF original...`);
          const pdfPath = this.extractFilePath(existingProduct.datasheet_url, 'tech-specs');
          if (pdfPath) {
            await storageService.deleteFile(pdfPath, 'tech-specs');
            console.log("✅ PDF eliminado exitosamente del bucket");
          } else {
             console.log("❌ No se pudo extraer el path del PDF.");
          }
        }
      } catch (cleanupError) {
        console.error("❌ Error CRÍTICO limpiando archivos de Storage:", cleanupError);
      }
    }
  }
};