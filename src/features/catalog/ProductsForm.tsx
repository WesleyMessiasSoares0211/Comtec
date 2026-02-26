import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Product } from '../../types/product';

interface Props {
  productToEdit?: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProductForm({ productToEdit, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    part_number: '', // P/N
    description: '',
    price: 0,
    stock: 0,
    min_stock: 5,
    main_category: '', // CAMBIO CRÍTICO: Usamos main_category
    brand: '',
    datasheet_url: '',
    image_url: ''
  });

  // Cargar datos si estamos editando
  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name || '',
        part_number: productToEdit.part_number || '',
        description: productToEdit.description || '',
        price: productToEdit.price || 0,
        stock: productToEdit.stock || 0,
        min_stock: productToEdit.min_stock || 5,
        // Compatibilidad: Leemos main_category, si no existe leemos category
        main_category: productToEdit.main_category || productToEdit.category || '',
        brand: productToEdit.brand || '',
        datasheet_url: productToEdit.datasheet_url || '',
        image_url: productToEdit.image_url || ''
      });
    }
  }, [productToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación Básica
    if (!formData.name || !formData.part_number || formData.price <= 0) {
      toast.error("Datos incompletos", {
        description: "El nombre, número de parte y precio son obligatorios."
      });
      return;
    }

    setLoading(true);

    try {
      const productData = {
        ...formData,
        // Guardamos en ambos campos por compatibilidad, o solo en main_category según tu DB
        category: formData.main_category, 
        main_category: formData.main_category 
      };

      if (productToEdit) {
        // ACTUALIZAR
        const { error } = await supabase
          .from('products') // Verifica nombre de tabla
          .update(productData)
          .eq('id', productToEdit.id);
        
        if (error) throw error;
        toast.success("Producto actualizado correctamente");
      } else {
        // CREAR
        const { error } = await supabase
          .from('products') // Verifica nombre de tabla
          .insert([productData]);

        if (error) throw error;
        toast.success("Producto creado exitosamente");
      }

      onSuccess(); // Recargar lista
      onClose();   // Cerrar modal

    } catch (error: any) {
      console.error(error);
      toast.error("Error al guardar", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {productToEdit ? <EditIcon /> : <PlusIcon />}
            {productToEdit ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY (Scrollable) */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          
          {/* Fila 1: Identificación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Nombre Producto *</label>
              <input 
                required
                type="text" 
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                placeholder="Ej: Sensor Inductivo M12"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Part Number (P/N) *</label>
              <input 
                required
                type="text" 
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:ring-1 focus:ring-cyan-500 outline-none"
                placeholder="Ej: XS612B1PAL2"
                value={formData.part_number}
                onChange={e => setFormData({...formData, part_number: e.target.value})}
              />
            </div>
          </div>

          {/* Fila 2: Categoría y Marca */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Categoría Principal</label>
              <input 
                type="text" 
                list="categories-list" // Sugerencias nativas HTML
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                placeholder="Ej: Sensores, PLCs..."
                value={formData.main_category}
                onChange={e => setFormData({...formData, main_category: e.target.value})}
              />
              {/* Datalist para sugerencias rápidas */}
              <datalist id="categories-list">
                <option value="Sensores" />
                <option value="PLCs" />
                <option value="VFD" />
                <option value="Conectividad" />
              </datalist>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Marca</label>
              <input 
                type="text" 
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                placeholder="Ej: Schneider, Siemens"
                value={formData.brand}
                onChange={e => setFormData({...formData, brand: e.target.value})}
              />
            </div>
          </div>

          {/* Fila 3: Precios y Stock */}
          <div className="grid grid-cols-3 gap-4 bg-slate-800/20 p-4 rounded-xl border border-slate-800">
            <div className="space-y-1">
              <label className="text-xs font-bold text-cyan-500 uppercase">Precio Venta (Neto) *</label>
              <input 
                required
                type="number" min="0"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold text-right focus:ring-1 focus:ring-cyan-500 outline-none"
                value={formData.price}
                onChange={e => setFormData({...formData, price: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-emerald-500 uppercase">Stock Actual</label>
              <input 
                type="number" min="0"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-right focus:ring-1 focus:ring-emerald-500 outline-none"
                value={formData.stock}
                onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-orange-500 uppercase">Stock Mínimo</label>
              <input 
                type="number" min="0"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-right focus:ring-1 focus:ring-orange-500 outline-none"
                value={formData.min_stock}
                onChange={e => setFormData({...formData, min_stock: Number(e.target.value)})}
              />
            </div>
          </div>

          {/* Fila 4: Links */}
          <div className="space-y-3">
             <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">URL Ficha Técnica (PDF)</label>
              <input 
                type="url" 
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-cyan-400 text-sm focus:ring-1 focus:ring-cyan-500 outline-none"
                placeholder="https://..."
                value={formData.datasheet_url}
                onChange={e => setFormData({...formData, datasheet_url: e.target.value})}
              />
            </div>
             <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">URL Imagen Producto</label>
              <div className="flex gap-2">
                <input 
                  type="url" 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-300 text-sm focus:ring-1 focus:ring-cyan-500 outline-none"
                  placeholder="https://..."
                  value={formData.image_url}
                  onChange={e => setFormData({...formData, image_url: e.target.value})}
                />
                {formData.image_url && (
                  <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors font-bold text-sm"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-cyan-900/20 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {productToEdit ? 'Guardar Cambios' : 'Crear Producto'}
          </button>
        </div>

      </div>
    </div>
  );
}

// Iconos Auxiliares
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);