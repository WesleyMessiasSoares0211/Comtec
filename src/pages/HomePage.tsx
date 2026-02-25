import { useEffect, useState } from 'react';
import { 
  ArrowRight, BellRing, ShieldPlus, Radio, Unplug, 
  ChevronLeft, ChevronRight, Thermometer, Settings, 
  Zap, Shield, ShieldAlert, Gauge, RadioTower, Rocket, Activity  
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

import { supabase } from '../lib/supabase';
import type { Product } from '../types/database';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// --- CONFIGURACIÓN DE DATOS ---

const INDUSTRIAL_FEATURES = [
  { title: 'Robustez', desc: 'Ip67+, Nema, Atex', icon: ShieldPlus, color: 'text-cyan-400', border: 'group-hover:border-cyan-500/50' },
  { title: 'Alarmas', desc: 'Inteligentes', icon: BellRing, color: 'text-orange-400', border: 'group-hover:border-orange-500/50' },
  { title: 'Plug & Play', desc: 'Fácil Instalación', icon: Unplug, color: 'text-yellow-400', border: 'group-hover:border-yellow-500/50' },
  { title: 'Flexibilidad', desc: 'Multiprotocolo', icon: Radio, color: 'text-green-400', border: 'group-hover:border-green-500/50' },
];

const SENSOR_CATEGORIES = [
  { name: 'Ambiental', icon: Thermometer, sub: 'ambiental', cat: 'Temperatura - Humedad - Saturación CO2' },
  { name: 'Mecánico', icon: Settings, sub: 'mecánico', cat: 'Vibraciones - Inclinación - Temperatura' },
  { name: 'Eléctrico', icon: Zap, sub: 'eléctrico', cat: 'Corrientes - Amperaje - Tensión' },
  { name: 'Seguridad', icon: ShieldAlert, sub: 'seguridad', cat: 'Movimiento - Apertura/Cierre - Conteo de Vehículos' },
  { name: 'Presión', icon: Gauge, sub: 'presión', cat: 'Presión Máxima - Presión Mínima - Presión Diferencial' }
];

interface HomePageProps {
  onNavigate: (page: string, productId?: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('featured', true)
      .limit(10);
    
    if (productsData) setFeaturedProducts(productsData);
  };

  return (
    <div className="bg-slate-950 min-h-screen">
      {/* 1. SECCIÓN HERO */}
      <HeroSection onNavigate={onNavigate} />

      {/* 2. NUEVA SECCIÓN: CAPACIDADES IIOT (APP MONITOREO) */}
      <MonitoringCapabilitiesSection onNavigate={onNavigate} />
      
      {/* 3. CATEGORÍAS */}
      <section className="py-12 bg-slate-900">
        <SensorCategoryGrid onNavigate={onNavigate} />
        <GatewayHighlight onNavigate={onNavigate} />
      </section>

      {/* 4. PRODUCTOS DESTACADOS */}
      {featuredProducts.length > 0 && (
        <FeaturedProductsCarousel products={featuredProducts} onNavigate={onNavigate} />
      )}

      {/* 5. CONSULTA PERSONALIZADA */}
      <CTASection onNavigate={onNavigate} />
    </div>
  );
}

// --- SUB-COMPONENTES REESTRUCTURADOS ---

function HeroSection({ onNavigate }: HomePageProps) {
  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      <div className="absolute inset-0 bg-[url(https://ohjtnuezbuqnljhitdod.supabase.co/storage/v1/object/public/Imagenes%20y%20Archivos/HomePage/2pfvd79audbg1.png)] bg-[length:100%_auto] bg-top bg-no-repeat opacity-60"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <div className="inline-flex items-center space-x-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-cyan-200 rounded-full animate-pulse"></span>
              <span className="text-cyan-400 font-bold text-sm">Industria 4.0</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Optimiza tus Procesos con Dispositivos de <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500"> Alta Tecnología</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-8">
              Monitoreo en tiempo real para entornos industriales exigentes. Sensores robustos y datos precisos para optimizar tus operaciones.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => onNavigate('catalog')} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-2 rounded-lg font-semibold shadow-lg shadow-orange-500/25 flex items-center justify-center space-x-2">
                <span>Ver Catálogo</span> <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={() => onNavigate('clients')} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-2 rounded-lg font-semibold shadow-lg shadow-orange-500/25 flex items-center justify-center space-x-2">
                <span>Contactar Ventas</span> <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-700/50 pt-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {INDUSTRIAL_FEATURES.map((feat) => (
              <div key={feat.title} className="flex items-center space-x-4 group">
                <div className={`p-3 bg-slate-900/50 rounded-lg border border-slate-700 ${feat.border}`}>
                  <feat.icon className={`w-6 h-6 ${feat.color}`} />
                </div>
                <div><h3 className="text-xl font-bold text-white leading-none">{feat.title}</h3><p className="text-gray-200 text-sm mt-1">{feat.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * SECCIÓN DE CAPACIDADES: Visualización de App y Bomba Centrífuga
 */

function MonitoringCapabilitiesSection({ onNavigate }: HomePageProps) {
  return (
    <section className="py-12 bg-slate-950 flex flex-col gap-16">
      
      {/* EJEMPLO 1: BOMBA (Móvil a la Izquierda) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-6 items-center">
          
          {/* Mockup Móvil */}
          <div className="relative flex justify-center order-2 lg:order-1">
            <div className="absolute -inset-6 bg-cyan-500/10 blur-[80px] rounded-full"></div>
            <div className="relative w-64 h-[500px] bg-slate-900 border-[6px] border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden ring-1 ring-slate-700">
              <div className="flex flex-col h-full bg-slate-950 font-sans">
                <div className="pt-8 px-5 pb-4 bg-slate-900/50">
                   <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider">Activo Crítico</span>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                   </div>
                   <h4 className="text-white text-sm font-bold">Bomba Centrífuga B-01</h4>
                </div>
                <div className="p-4 space-y-4">
                   <div className="space-y-1">
                     <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800">
                      <div className=" flex justify-between text-[12px] text-slate-300"><span>Vibración RMS</span><span className="text-cyan-400 font-bold">4.2 mm/s</span></div>
                      <div className="h-1 w-full bg-slate-800 rounded-full"><div className="h-full w-[60%] bg-cyan-500 rounded-full"></div></div>
                     </div>
                   </div>
                   <div className="space-y-1">
                     <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800">
                      <div className="flex justify-between text-[12px] text-slate-300"><span>Temperatura</span><span className="text-orange-400 font-bold">68.5 °C</span></div>
                      <div className="h-1 w-full bg-slate-800 rounded-full"><div className="h-full w-[82%] bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)]"></div></div>
                   </div>
                   </div>
                  <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800">
                   <div className="flex items-center space-x-2 text-green-400 text-[15px]"><Activity size={12} /><span>Estable</span></div>
                </div>
                </div>
              </div>
            </div>
          </div>

          {/* Texto */}
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 leading-tight">
              Monitoreo Predictivo <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">en Tiempo Real</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Transformamos sus activos mecánicos en nodos inteligentes. Supervisión de salud de bombas y motores para reducir paradas no programadas hasta en un 30%.
            </p>
            <div className="space-y-4 mb-10">
              <div className="flex items-start space-x-4">
                <div className="bg-orange-500/10 p-2 rounded-lg border border-orange-500/20"><Zap className="text-orange-500" size={20}/></div>
                <div><h4 className="text-white font-bold">Detección Temprana</h4><p className="text-slate-400 text-sm">Alertas instantáneas ante anomalías de vibración donde estés.</p></div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/20"><Activity className="text-cyan-500" size={20}/></div>
                <div><h4 className="text-white font-bold">Análisis de Tendencias</h4><p className="text-slate-400 text-sm">Visualización histórica de temperatura y parámetros críticos.</p></div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-orange-500/10 p-2 rounded-lg border border-orange-500/20"><Rocket className="text-orange-500" size={20}/></div>
                <div><h4 className="text-white font-bold">Facil Configuración</h4><p className="text-slate-400 text-sm">Instalación y configuración en pocos pasos. No más protocolos complejos.</p></div>
              </div>
            </div>
            
            
            <button onClick={() => onNavigate('solutions')} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:scale-105 transition-all shadow-lg shadow-orange-500/25">
              Ver Soluciones IoT
            </button>
          </div>
        </div>
      </div>

      {/* EJEMPLO 2: GENERADOR (Móvil a la Derecha - Efecto Zig-Zag) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Texto (A la izquierda en escritorio) */}
          <div className="order-1">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 leading-tight">
              Eficiencia Energética y <br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Generación Inteligente</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Análisis en tiempo real de parámetros eléctricos para grupos electrógenos. Controle carga, tensión y frecuencia de forma remota y segura.
            </p>
            <div className="space-y-4 mb-10">
              <div className="flex items-start space-x-4">
                <div className="bg-orange-500/10 p-2 rounded-lg border border-orange-500/20"><Zap className="text-orange-500" size={20}/></div>
                <div><h4 className="text-white font-bold">Supervisión de Carga</h4><p className="text-slate-400 text-sm">Monitoreo de consumo y balance de fases en tiempo real.</p></div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/20"><Activity className="text-cyan-500" size={20}/></div>
                <div><h4 className="text-white font-bold">Calidad de Energía</h4><p className="text-slate-400 text-sm">Registro continuo de frecuencia y estabilidad del sistema.</p></div>
              </div>
            </div>
            <button onClick={() => onNavigate('solutions')} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:scale-105 transition-all shadow-lg shadow-orange-500/25">
              Ver Soluciones IoT
            </button>
          </div>

          {/* Mockup Móvil (A la derecha en escritorio) */}
          <div className="relative flex justify-center order-2">
            <div className="absolute -inset-6 bg-orange-500/10 blur-[80px] rounded-full"></div>
            <div className="relative w-64 h-[500px] bg-slate-900 border-[6px] border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden ring-1 ring-slate-700">
              <div className="flex flex-col h-full bg-slate-950 font-sans">
                <div className="pt-8 px-5 pb-4 bg-slate-900/50">
                   <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] text-orange-400 font-bold uppercase tracking-wider">Generación Eléctrica</span>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                   </div>
                   <h4 className="text-white text-sm font-bold">Generador CAT-500</h4>
                </div>
                <div className="p-5 space-y-4">
                   <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <p className="text-[9px] text-slate-500 uppercase tracking-tighter">Voltaje L1-L2</p>
                      <p className="text-lg font-mono text-white">380.5 <span className="text-[10px] text-slate-400">V</span></p>
                   </div>
                   <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <p className="text-[9px] text-slate-500 uppercase tracking-tighter">Carga Actual</p>
                      <p className="text-lg font-mono text-cyan-400">74 <span className="text-[10px] text-slate-400">%</span></p>
                   </div>
                   <div className="flex justify-between items-center bg-orange-500/5 p-2 rounded-md border border-orange-500/20">
                      <span className="text-[10px] text-slate-300">Frecuencia</span>
                      <span className="text-orange-400 text-xs font-bold">50.02 Hz</span>
                   </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}


/**
 * Cuadrícula de categorías de sensores industriales
 */
function SensorCategoryGrid({ onNavigate }: HomePageProps) {
  return (
    <div className="py-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-start mb-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 leading-tight">
              Sensores de <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500"> Grado Industrial</span>
            </h2>
        <p className="text-justify hyphen-auto text-gray-400 text-lg max-w-4xl mx-auto mb-10 leading-relaxed">
          Optimiza tu operación con sensores industriales de alta gama, diseñados para ofrecer una precisión absoluta y una integración perfecta con tu infraestructura actual. Nuestra tecnología garantiza una confiabilidad ininterrumpida, manteniendo un rendimiento superior incluso en ambientes hostiles. Descubra nuestra gama de sensores.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {SENSOR_CATEGORIES.map((item) => (
          <div
            key={item.sub}
            onClick={() => onNavigate('catalog', item.sub)}
            className="flex flex-col items-center text-center bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-4 hover:border-cyan-500/50 hover:translate-y-[-4px] transition-all cursor-pointer group shadow-xl"
          >
            <div className="w-20 h-20 bg-slate-950/50 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-cyan-500/10 transition-all border border-slate-700/50 mb-2 group-hover:border-cyan-500/30">
              <item.icon size={36} className="text-cyan-400 transition-colors" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-cyan-400 transition-colors">{item.name}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{item.cat}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Destaque de Gateways
 */
function GatewayHighlight({ onNavigate }: HomePageProps) {
  return (
    <div className="py-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-start mb-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 leading-tight">
              Gateways de <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600"> Gran Alcance</span>
            </h2>
        <p className="text-justify hyphen-auto text-gray-400 text-lg max-w-4xl mx-auto mb-8 leading-relaxed">
          En el corazón de la Industria 4.0, nuestros <strong>Gateways</strong> no solo conectan dispositivos; transforman el flujo de datos en decisiones estratégicas en tiempo real. Anticípate al futuro de tus operaciones; encuentra tu mejor opción con nosotros.
        </p>
      </div>
      <div className="flex justify-center">
        <div
          onClick={() => onNavigate('catalog', 'gateway')}
          className="flex flex-col items-center text-center bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-4 hover:border-orange-500/50 hover:translate-y-[-4px] transition-all cursor-pointer group shadow-xl"
        >
          <div className="w-20 h-20 bg-slate-950/50 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-orange-500/10 transition-all border border-slate-700/50 mb-2 group-hover:border-orange-500/30">
            <RadioTower size={36} className="text-orange-400 transition-colors" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-orange-400 transition-colors">Gateways</h3>
          <p className="text-gray-400 text-sm leading-relaxed">Infraestructura robusta para transmisión de datos.</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Carrusel dinámico de productos marcados como destacados
 */
function FeaturedProductsCarousel({ products, onNavigate }: { products: Product[], onNavigate: any }) {
  return (
    <section className="py-20 bg-slate-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 pb-2 mb-4">
            Productos Destacados
          </h2>
          <p className="text-gray-400 text-lg">Las soluciones más populares de nuestro catálogo</p>
        </div>

        <div className="relative group px-4">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={25}
            slidesPerView={1}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            pagination={{ clickable: true, dynamicBullets: true }}
            navigation={{ nextEl: '.next-btn', prevEl: '.prev-btn' }}
            breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
            className="pb-14"
          >
            {products.map((product) => (
              <SwiperSlide key={product.id} className="h-auto">
                <div
                  onClick={() => onNavigate('product', product.id)}
                  className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all cursor-pointer group h-full flex flex-col"
                >
                  <div className="aspect-video bg-slate-800 overflow-hidden">
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">{product.name}</h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-grow">{product.description}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-2xl font-bold text-white">${product.price.toFixed(2)}</span>
                      <div className="text-cyan-400 hover:text-cyan-300 font-medium text-sm flex items-center space-x-1">
                        <span>Ver más</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          
          <button className="prev-btn absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-slate-900/80 p-2 rounded-full border border-slate-700 text-white opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block hover:bg-cyan-600">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button className="next-btn absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-slate-900/80 p-2 rounded-full border border-slate-700 text-white opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block hover:bg-cyan-600">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * Sección final de conversión
 */
function CTASection({ onNavigate }: HomePageProps) {
  return (
    <section className="py-20 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">¿Necesitas una solución personalizada?</h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Nuestro equipo de expertos puede ayudarte a diseñar la solución IIoT perfecta para tu industria
          </p>
          <button
            onClick={() => onNavigate('clients')}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-lg text-base font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/25"
          >
            Solicitar Consulta Técnica
          </button>
        </div>
      </div>
    </section>
  );
}