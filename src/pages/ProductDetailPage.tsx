import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, ReceiptText, ShieldCheck, Headphones, Settings, Zap, Wifi, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product } from '../types/product';

// Importamos la fuente de verdad de los modelos para filtrar campos
const CATEGORY_MODELS_DATA = {
  'PIEZAS Y BOMBAS': ['material_base', 'diametro_succion', 'tipo_sello', 'fluido_compatible'],
  'FABRICACION MECANICA': ['material', 'tolerancia_mm', 'tratamiento_termico', 'nro_plano'],
  'Sensor': ['protocolo', 'frecuencia', 'rango_medicion', 'precision'],
  'Gateway': ['conectividad', 'alimentacion', 'puertos_io', 'proteccion_ip'],
  'Software': ['tipo_licencia', 'duracion_meses', 'plataforma'],
  'Servicios': ['tipo_servicio', 'modalidad', 'tiempo_estimado']
} as const;

interface ProductDetailPageProps {
  productId?: string;
  onNavigate?: (page: string) => void;
}

export default function ProductDetailPage({ productId: propId, onNavigate }: ProductDetailPageProps) {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Lee la ID directamente de la URL, con soporte para prop como fallback
  const currentProductId = params.id || propId;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'specs' | 'downloads' | 'cases'>('specs');

  // Controladores de navegación que priorizan el Router nativo
  const handleGoBack = () => {
    if (onNavigate) onNavigate('catalog');
    else navigate('/catalog');
  };

  const handleQuoteClick = () => {
    if (onNavigate) onNavigate('clients');
    else navigate('/clients');
  };

  useEffect(() => {
    const loadProduct = async () => {
      if (!currentProductId) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', currentProductId)
          .maybeSingle();

        if (error) throw error;
        setProduct(data);
      } catch (err) {
        console.error("Error loading product:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
    window.scrollTo(0, 0);
  }, [currentProductId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <p className="text-xl mb-4">Producto no encontrado</p>
        <button onClick={handleGoBack} className="text-cyan-400 flex items-center gap-2 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Volver al catálogo
        </button>
      </div>
    );
  }

  // --- Lógica Segura de Procesamiento de Datos ---
  // Utilizamos variables seguras (as any) para evitar que TypeScript falle si los campos
  // dinámicos aún no están declarados formalmente en tu interface Product.
  const allMetadata = { ...(product.specifications || {}), ...(product.metadata || {}) };
  
  const mainCategory = product.main_category || '';
  const allowedFields = CATEGORY_MODELS_DATA[mainCategory as keyof typeof CATEGORY_MODELS_DATA] || [];
  
  const filteredSpecs = Object.entries(allMetadata).filter(([key]) => 
    allowedFields.includes(key as any) && allMetadata[key]
  );
  
  const isIot = ['Sensor', 'Gateway'].includes(mainCategory);
  
  // Extracción defensiva de variables
  const protocol = (product as any).protocol || allMetadata.protocol;
  const connectivity = (product as any).connectivity || allMetadata.connectivity;
  const partNumber = (product as any).part_number || allMetadata.part_number || 'N/A';
  const datasheetUrl = (product as any).datasheet_url || allMetadata.datasheet_url;
  const usageExample = (product as any).ej_uso || allMetadata.ej_uso || null;
  const priceSafe = typeof product.price === 'number' ? product.price : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* SECCIÓN HEADER ESTANDARIZADA */}
      <section className="relative bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-4">
              {/* Botón: aparece primero en móvil, izquierda en md+ */}
              <div className="order-1 md:order-1 flex items-start md:items-center">
                <button
                  onClick={handleGoBack}
                  className="flex items-center text-gray-300 hover:text-cyan-300 transition-colors space-x-2"
                  aria-label="Volver al catálogo">
                  <ArrowLeft className="h-4 w-4"/>
                  <span className="text-sm md:text-base">Volver al Catálogo</span>
                </button>
              </div>
      
              {/* Título: centrado, ocupa la columna central en md+ */}
              <div className="order-3 md:order-2 md:col-span-1 flex justify-center">
                <div>
                  <h1 className="text-center text-4xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 leading-tight pb-2">
                    Ficha Técnica
                  </h1>
                  <p className="mt-2 text-center text-lg text-gray-400">
                  Soluciones avanzadas para la industria 4.0
                </p>
                </div>
              </div>        
            </div>
          </div>         
        </div>
      </section>

      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 md:py-12 w-full">
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Image & Key Specs */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-2 shadow-2xl">
              <img
                src={product.image_url || 'https://via.placeholder.com/600'}
                alt={product.name || 'Producto Comtec'}
                className="w-full aspect-square object-cover rounded-2xl"
              />
            </div>
            
            {/* Cards Dinámicas */}
            <div className={`grid ${isIot ? 'grid-cols-3' : 'grid-cols-1'} gap-4`}>
              {isIot && protocol && (
                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-center">
                  <p className="text-slate-500 text-[10px] uppercase tracking-tighter mb-1 flex items-center justify-center gap-1">
                    <Zap className="w-3 h-3 text-cyan-500" /> Protocolo
                  </p>
                  <p className="font-bold text-cyan-400 text-sm truncate">{protocol}</p>
                </div>
              )}
              {isIot && connectivity && (
                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-center">
                  <p className="text-slate-500 text-[10px] uppercase tracking-tighter mb-1 flex items-center justify-center gap-1">
                    <Wifi className="w-3 h-3 text-cyan-500" /> Conexión
                  </p>
                  <p className="font-bold text-cyan-400 text-sm truncate">{connectivity}</p>
                </div>
              )}
              <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-center">
                <p className="text-slate-500 text-[10px] uppercase tracking-tighter mb-1">Part Number (P/N)</p>
                <p className="font-bold text-slate-300 text-sm truncate">{partNumber}</p>
              </div>
            </div>
          </div>

          {/* Info & Pricing */}
          <div className="flex flex-col">
            <div className="mb-4">
               <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest">
                {product.subcategory || mainCategory}
               </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent mb-6">
              {product.name}
            </h2>

            <p className="text-slate-400 text-lg leading-relaxed mb-8">
              {product.description}
            </p>

            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-8 mb-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
              
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-4xl md:text-5xl font-bold text-white">
                  ${priceSafe.toLocaleString('es-CL')}
                </span>
                <span className="text-slate-500 font-medium tracking-tight">USD + IVA</span>
              </div>

              <div className="space-y-4 mb-8">
                {[
                  { icon: <ShieldCheck />, text: "Garantía industrial de 24 meses" },
                  { icon: <Headphones />, text: "Soporte técnico especializado nivel 2" },
                  { icon: <Settings />, text: "Servicio de puesta en marcha disponible" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                    <span className="text-cyan-500 w-5 h-5">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleQuoteClick}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold text-sm uppercase tracking-widest hover:translate-y-[-2px] active:translate-y-0 transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-3"
              >
                <ReceiptText className="w-5 h-5" />
                Solicitar Cotización Formal
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Seccionadas */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="flex border-b border-slate-800 bg-slate-900/80 overflow-x-auto scrollbar-hide">
            {[
              { id: 'specs', label: 'Especificaciones', count: filteredSpecs.length },
              { id: 'downloads', label: 'Documentación', count: datasheetUrl ? 1 : 0 },
              { id: 'cases', label: 'Casos de Uso', count: usageExample ? 1 : 0 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-8 py-5 text-sm font-bold uppercase tracking-widest transition-all relative min-w-max ${
                  activeTab === tab.id ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && <span className="ml-2 text-[10px] opacity-50">({tab.count})</span>}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)]" />
                )}
              </button>
            ))}
          </div>

          <div className="p-8 md:p-12">
            {activeTab === 'specs' && (
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-2">
                {filteredSpecs.length > 0 ? (
                  filteredSpecs.map(([key, value]) => (
                    <div key={key} className="flex justify-between py-4 border-b border-slate-800/50 items-center hover:bg-slate-800/20 px-2 transition-colors">
                      <span className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                        <ChevronRight className="w-3 h-3 text-cyan-600" />
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="text-slate-200 font-semibold text-sm text-right ml-4">{String(value)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic py-4 col-span-2">No hay especificaciones técnicas adicionales listadas.</p>
                )}
              </div>
            )}

            {activeTab === 'downloads' && (
              <div className="max-w-2xl">
                {datasheetUrl ? (
                  <a
                    href={datasheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-6 bg-slate-950 border border-slate-800 rounded-2xl hover:border-cyan-500/50 transition-all group"
                  >
                    <div className="bg-cyan-500/10 p-4 rounded-xl mr-6 group-hover:bg-cyan-500/20 transition-colors">
                      <Download className="w-8 h-8 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg">Datasheet Técnico Oficial</h3>
                      <p className="text-slate-500 text-sm">Descargar PDF con curvas de rendimiento y certificaciones.</p>
                    </div>
                  </a>
                ) : (
                  <div className="text-center py-8 bg-slate-950/50 border border-slate-800 rounded-2xl">
                    <p className="text-slate-500 text-sm italic">Documentación disponible bajo solicitud directa.</p>
                  </div>
                )}
              </div>
            )}

           {activeTab === 'cases' && (
            <div className="grid md:grid-cols-2 gap-6">
              {usageExample && Array.isArray(usageExample) ? (
                usageExample.map((item: any, idx: number) => (
                  <div key={idx} className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl border-l-4 border-l-cyan-500">
                    <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase mb-4">
                      {item?.industry || 'Aplicación'}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{item?.title || 'Caso de Uso'}</h3>
                    <p className="text-slate-400 leading-relaxed text-sm">{item?.description || item}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 italic">No hay casos registrados.</p>
              )}
            </div>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}