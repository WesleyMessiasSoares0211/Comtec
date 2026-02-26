import React, { useState, useEffect } from 'react';
import {
  Package, Cpu, Save, Loader, Upload, FileText,
  CheckCircle2, Image as ImageIcon, Info, ChevronRight, Star,
  Wifi, Zap, Building2, Tag, PlusCircle, XCircle, Loader2, X
} from 'lucide-react';
import { toast } from 'sonner';
import { productService } from '../../services/productService';
import { storageService } from '../../services/storageService';
import { ConfirmUpdateModal } from '../../components/ui/SecurityModals';
import type { Product, ProductFormData } from '../../types/product';
import { ItemType } from '../../types/product';

// Mantenemos tus constantes intactas
const CATEGORY_MODELS_DATA = {
  'PIEZAS Y BOMBAS': ['material_base', 'diametro_succion', 'tipo_sello', 'fluido_compatible'],
  'FABRICACION MECANICA': ['material', 'tolerancia_mm', 'tratamiento_termico', 'nro_plano'],
  'Sensor': ['protocolo', 'frecuencia', 'rango_medicion', 'precision'],
  'Gateway': ['conectividad', 'alimentacion', 'puertos_io', 'proteccion_ip'],
  'Software': ['tipo_licencia', 'duracion_meses', 'plataforma'],
  'Servicios': ['tipo_servicio', 'modalidad', 'tiempo_estimado']
} as const;

interface Props {
  initialData?: Product;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ProductsForm({ initialData, onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [uploading, setUploading] = useState({ img: false, doc: false });

  const [showUseCase, setShowUseCase] = useState(false);
  const [useCaseTitle, setUseCaseTitle] = useState('Modernización de Planta');
  const [useCaseIndustry, setUseCaseIndustry] = useState('Industrial');

  const emptyState: ProductFormData = {
    name: '', part_number: '', description: '', price: 0,
    image_url: '', datasheet_url: '', main_category: '', subcategory: '',
    featured: false, ej_uso: '', protocol: '', connectivity: '', metadata: {},
    tipo_item: 'producto_final' as ItemType
  };

  const [formData, setFormData] = useState<ProductFormData>(emptyState);

  // EFECTO DE CARGA INICIAL (Sin cambios estructurales)
  useEffect(() => {
    if (initialData) {
      const specs = initialData.specifications || initialData.metadata || {};
      const rawEjUso = initialData.ej_uso;
      
      let descriptionText = '';
      if (Array.isArray(rawEjUso) && rawEjUso.length > 0) {
        setShowUseCase(true);
        const firstCase = rawEjUso[0];
        setUseCaseTitle(firstCase?.title || 'Modernización de Planta');
        setUseCaseIndustry(firstCase?.industry || 'Industrial');
        descriptionText = firstCase?.description || '';
      } else {
        descriptionText = typeof rawEjUso === 'string' ? rawEjUso : '';
      }

      setFormData({
        name: initialData.name || '',
        part_number: initialData.part_number || specs.part_number || '',
        description: initialData.description || '',
        price: initialData.price || 0,
        image_url: initialData.image_url || '',
        datasheet_url: initialData.datasheet_url || '',
        // MODIFICACIÓN: Aseguramos leer main_category o category por compatibilidad
        main_category: initialData.main_category || initialData.category || '',
        subcategory: initialData.subcategory || '',
        featured: Boolean(initialData.featured),
        ej_uso: descriptionText,
        protocol: initialData.protocol || specs.protocol || '',
        connectivity: initialData.connectivity || specs.connectivity || '',
        metadata: specs,
        tipo_item: (initialData.tipo_item as ItemType) || 'producto_final'
      });
    }
  }, [initialData]);

  const isIotOrGateway = ['Sensor', 'Gateway'].includes(formData.main_category);

  // MANEJO DE ARCHIVOS (Sin cambios)
  const handleFileChange = async (file: File, type: 'img' | 'doc') => {
    setUploading(prev => ({ ...prev, [type]: true }));
    const toastId = toast.loading(`Subiendo ${type === 'img' ? 'imagen' : 'documento'}...`);
    try {
      const bucket = type === 'img' ? 'product-images' : 'tech-specs';
      const url = await storageService.uploadFile(file, bucket);
      if (url) {
        setFormData(prev => ({ ...prev, [type === 'img' ? 'image_url' : 'datasheet_url']: url }));
        toast.success('Archivo vinculado', { id: toastId });
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = Number(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("El precio debe ser un número válido mayor o igual a cero.");
      return;
    }
    if (!formData.main_category) {
      toast.error("Debe seleccionar una línea de negocio principal.");
      return;
    }

    if (initialData) setShowConfirmModal(true);
    else executeSave();
  };

  const executeSave = async () => {
    setLoading(true);
    setShowConfirmModal(false);
    const toastId = toast.loading(initialData ? 'Actualizando ficha...' : 'Registrando en catálogo...');

    try {
      // PREPARACIÓN DEL PAYLOAD (MODIFICADO PARA COMPATIBILIDAD DB)
      const finalPayload = {
        ...formData,
        price: Number(formData.price),
        // Si tu DB usa 'category' además de 'main_category', guardamos en ambos para evitar conflictos
        category: formData.main_category, 
        main_category: formData.main_category,
        ej_uso: showUseCase ? [{ title: useCaseTitle, industry: useCaseIndustry, description: formData.ej_uso }] : []
      };

      if (initialData?.id) {
        await productService.update(initialData.id, finalPayload);
        toast.success('Producto actualizado correctamente', { id: toastId });
      } else {
        await productService.create(finalPayload);
        toast.success('Producto añadido al catálogo', { id: toastId });
      }
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      toast.error('Error al procesar: ' + (err.message || 'Error de conexión'), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // LAYOUT VISUAL INTACTO
  return (
    <>
      <form onSubmit={handleInitialSubmit} className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl space-y-8 shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
              <Package className="w-5 h-5" /> {initialData ? 'Actualización de Ítem' : 'Ficha Técnica de Ítem'}
            </h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">
              Ingreso a base de datos de inventario
            </p>
          </div>
          {onCancel && (
            <button type="button" onClick={onCancel} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <SectionHeader icon={<ImageIcon className="w-4 h-4" />} title="Multimedia y Clasificación" color="text-cyan-400" />
            <div className="grid grid-cols-2 gap-4">
              <UploadBox label="Imagen" type="image/*" loading={uploading.img} preview={formData.image_url} onUpload={(f: File) => handleFileChange(f, 'img')} hasValue={!!formData.image_url} />
              <UploadBox label="DataSheet" type=".pdf" loading={uploading.doc} hasValue={!!formData.datasheet_url} onUpload={(f: File) => handleFileChange(f, 'doc')} />
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Línea de Negocio Principal *</label>
                <select required className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:border-cyan-500 outline-none text-sm transition-all" value={formData.main_category} onChange={(e) => setFormData({...formData, main_category: e.target.value})}>
                  <option value="">Seleccione Categoría...</option>
                  {Object.keys(CATEGORY_MODELS_DATA).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <InputField label="Nombre del Producto *" required value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="N° Parte (P/N) *" required value={formData.part_number} onChange={(v: string) => setFormData({...formData, part_number: v})} />
                <InputField label="Sub-Categoría" value={formData.subcategory} onChange={(v: string) => setFormData({...formData, subcategory: v})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Clasificación Fase 2 *</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:border-cyan-500 outline-none text-sm transition-all" value={formData.tipo_item || 'producto_final'} onChange={(e) => setFormData({...formData, tipo_item: e.target.value as ItemType})}>
                  <option value="producto_final">Producto Final</option>
                  <option value="materia_prima">Materia Prima</option>
                  <option value="insumo">Insumo / Consumible</option>
                  <option value="servicio_maquinaria">Servicio Máquina</option>
                </select>
              </div>
              <FeaturedToggle active={formData.featured} onChange={(val) => setFormData(prev => ({ ...prev, featured: val }))} />
            </div>
          </div>

          <div className="space-y-6">
            <SectionHeader icon={<Cpu className="w-4 h-4" />} title="Especificaciones Técnicas" color="text-orange-500" />
            <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-800/50 min-h-[300px] space-y-4">
              {isIotOrGateway && (
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-800/50">
                  <InputField label="Protocolo" value={formData.protocol || ''} onChange={(v: string) => setFormData({...formData, protocol: v})} icon={<Zap className="w-3 h-3 text-cyan-500"/>} />
                  <InputField label="Conectividad" value={formData.connectivity || ''} onChange={(v: string) => setFormData({...formData, connectivity: v})} icon={<Wifi className="w-3 h-3 text-cyan-500"/>} />
                </div>
              )}
              {formData.main_category ? (
                <div className="grid grid-cols-2 gap-4">
                  {CATEGORY_MODELS_DATA[formData.main_category as keyof typeof CATEGORY_MODELS_DATA]?.map((attr) => (
                    <InputField key={attr} label={attr.replace(/_/g, ' ')} value={formData.metadata[attr] || ''} onChange={(v: string) => setFormData(prev => ({ ...prev, metadata: { ...prev.metadata, [attr]: v } }))} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-slate-600 italic text-xs text-center opacity-40">
                  <Info className="w-6 h-6 mb-2" />
                  <p>Define la línea de negocio para<br/>habilitar atributos técnicos específicos.</p>
                </div>
              )}
              <div className="pt-4 border-t border-slate-800/50">
                <InputField required label="Valor Unitario (USD) *" type="number" step="0.01" min="0" value={formData.price.toString()} onChange={(v: string) => setFormData({...formData, price: v})} />
              </div>
            </div>
          </div>

          <div className="col-span-full space-y-4">
            <button type="button" onClick={() => setShowUseCase(!showUseCase)} className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${showUseCase ? 'bg-cyan-500/10 border-cyan-500/50' : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${showUseCase ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className={`text-xs font-black uppercase tracking-widest ${showUseCase ? 'text-cyan-400' : 'text-slate-400'}`}>Casos de Uso / Ejemplos</h4>
                </div>
              </div>
              {showUseCase ? <XCircle className="text-cyan-500 w-5 h-5" /> : <ChevronRight className="text-slate-600 w-5 h-5" />}
            </button>
            {showUseCase && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-950/30 rounded-2xl border border-slate-800/50">
                <div className="space-y-4">
                  <InputField label="Título del Caso" value={useCaseTitle} onChange={setUseCaseTitle} icon={<Tag className="w-3 h-3 text-cyan-500"/>} />
                  <InputField label="Industria / Sector" value={useCaseIndustry} onChange={setUseCaseIndustry} icon={<Building2 className="w-3 h-3 text-cyan-500"/>} />
                </div>
                <TextArea label="Descripción del Escenario" value={formData.ej_uso || ''} onChange={(v: string) => setFormData({...formData, ej_uso: v})} />
              </div>
            )}
          </div>
          <div className="col-span-full">
            <TextArea label="Descripción Técnica Detallada *" required value={formData.description} onChange={(v: string) => setFormData({...formData, description: v})} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
          <button type="button" onClick={onCancel || onSuccess} className="px-6 py-2.5 rounded-xl font-bold text-slate-400 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all text-sm">
            Cancelar
          </button>
          <button type="submit" disabled={loading || Object.values(uploading).some(Boolean)} className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 text-sm">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</> : <><Save className="w-4 h-4" /> {initialData ? 'Actualizar Ficha' : 'Registrar en Catálogo'}</>}
          </button>
        </div>
      </form>

      <ConfirmUpdateModal 
        isOpen={showConfirmModal}
        title="Confirmar Actualización"
        message={`¿Estás seguro que deseas sobreescribir la ficha técnica de ${formData.part_number}?`}
        loading={loading}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeSave}
      />
    </>
  );
}

// Subcomponentes (Mantenidos igual para preservar el layout)
function SectionHeader({ icon, title, color }: { icon: React.ReactNode, title: string, color: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
      <div className={`${color} bg-slate-950 p-2 rounded-lg border border-slate-800`}>{icon}</div>
      <h3 className={`${color} font-bold text-[10px] uppercase tracking-[0.2em]`}>{title}</h3>
    </div>
  );
}

function InputField({ label, value, onChange, type = "text", icon, required, min, step }: any) {
  return (
    <div className="group space-y-1.5">
      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1 group-focus-within:text-cyan-500 transition-colors">
        {icon || <ChevronRight className="w-3 h-3 text-cyan-600" />} {label}
      </label>
      <input required={required} type={type} min={min} step={step} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 outline-none text-sm transition-all" />
    </div>
  );
}

function TextArea({ label, value, onChange, required }: { label: string, value: string, onChange: (v: string) => void, required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{label}</label>
      <textarea required={required} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 text-sm min-h-[120px] focus:border-cyan-500/50 outline-none transition-all resize-none" />
    </div>
  );
}

function UploadBox({ label, type, loading, preview, hasValue, onUpload }: any) {
  return (
    <label className="flex flex-col items-center justify-center h-36 cursor-pointer bg-slate-950/60 border-2 border-slate-800 border-dashed rounded-xl relative overflow-hidden group hover:border-cyan-500/40 transition-all">
      <input type="file" className="hidden" accept={type} onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
      {preview && !loading && <img src={preview} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-110 transition-transform" alt="Preview" />}
      {loading ? <Loader className="animate-spin text-cyan-400 w-6 h-6" /> : type.includes('image') ? <Upload className="text-slate-600 group-hover:text-cyan-400" /> : <FileText className="text-slate-600 group-hover:text-orange-500" />}
      <span className="text-[9px] font-bold text-slate-500 mt-3 uppercase tracking-wider">{label}</span>
      {hasValue && <div className="absolute top-2 right-2 bg-emerald-500/20 p-1 rounded-full"><CheckCircle2 className="w-3 h-3 text-emerald-500" /></div>}
    </label>
  );
}

function FeaturedToggle({ active, onChange }: { active: boolean, onChange: (v: boolean) => void }) {
  return (
    <div className="pt-2">
      <button type="button" onClick={() => onChange(!active)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all select-none ${active ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-slate-950/40 border-slate-800'}`}>
        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${active ? 'bg-cyan-500 border-cyan-500' : 'bg-slate-900 border-slate-700'}`}>
          {active && <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />}
        </div>
        <div className="flex items-center gap-2">
          <Star className={`w-4 h-4 transition-colors ${active ? 'text-cyan-400 fill-cyan-400' : 'text-slate-600'}`} />
          <div className="flex flex-col items-start">
            <span className={`text-[10px] font-bold uppercase ${active ? 'text-cyan-400' : 'text-slate-400'}`}>Producto Destacado</span>
          </div>
        </div>
      </button>
    </div>
  );
}