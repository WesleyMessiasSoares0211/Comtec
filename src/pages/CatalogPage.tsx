import { useEffect, useState } from 'react';
import { Filter, Search, ChevronRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import type { Product } from '../types/database';

interface CatalogPageProps {
  onNavigate: (page: string, productId?: string) => void;
  initialCategory?: string;
}

export default function CatalogPage({ onNavigate, initialCategory = '' }: CatalogPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('');
  const [selectedSensorSubCategory, setSelectedSensorSubCategory] = useState<string>('');  
  const [selectedProtocol, setSelectedProtocol] = useState<string>('');
  const [selectedConnectivity, setSelectedConnectivity] = useState<string>('');
  const [selectedSensorType, setSelectedSensorType] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Sincronizar cuando viene desde Homepage o Header
  useEffect(() => {
    if (!initialCategory || initialCategory === 'all') {
      setSelectedMainCategory('');
      setSelectedSensorSubCategory('');
    } else {
      const catLower = initialCategory.toLowerCase();
      const sensorSubs = ['ambiental', 'mecánico', 'eléctrico', 'seguridad', 'presión'];

      if (sensorSubs.includes(catLower)) {
        setSelectedMainCategory('sensor');
        setSelectedSensorSubCategory(catLower);
      } else {
        setSelectedMainCategory(catLower);
        setSelectedSensorSubCategory('');
      }
    }
  }, [initialCategory]);

  useEffect(() => {
    applyFilters();
  }, [products, searchTerm, selectedMainCategory, selectedSensorSubCategory, selectedProtocol, selectedConnectivity, selectedSensorType]);

  const loadData = async () => {
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('featured', true) // <--- ESTE ES EL FILTRO
      .order('name');

    if (productsData) {
      setProducts(productsData);
      setFilteredProducts(productsData);
    }
};

  const applyFilters = () => {
    let filtered = [...products];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.description && p.description.toLowerCase().includes(term))
      );
    }

    if (selectedMainCategory && selectedMainCategory !== '') {
      filtered = filtered.filter(
        (p) => p.main_category?.toLowerCase() === selectedMainCategory.toLowerCase()
      );
    }

    // Filtrado por subcategoría de sensor (ahora buscando en la propiedad mapeada del JSONB)
    if (selectedMainCategory.toLowerCase() === 'sensor' && selectedSensorSubCategory) {
      filtered = filtered.filter(
        (p) => p.subcategory?.toLowerCase() === selectedSensorSubCategory.toLowerCase()
      );
    }

    if (selectedProtocol) filtered = filtered.filter((p) => p.protocol === selectedProtocol);
    if (selectedConnectivity) filtered = filtered.filter((p) => p.connectivity === selectedConnectivity);
    if (selectedSensorType) filtered = filtered.filter((p) => p.sensor_type === selectedSensorType);

    setFilteredProducts(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedMainCategory('');
    setSelectedSensorSubCategory('');
    setSelectedProtocol('');
    setSelectedConnectivity('');
    setSelectedSensorType('');
  };

  // Listas dinámicas basadas en los datos reales del JSONB mapeado
  const protocols = [...new Set(products.map((p) => p.protocol).filter(Boolean))].sort();
  const connectivities = [...new Set(products.map((p) => p.connectivity).filter(Boolean))].sort();
  
  const mainCategories = ['Gateway', 'Sensor', 'Software', 'Servicios'];
  const sensorSubCategories = ['Ambiental', 'Mecánico', 'Eléctrico', 'Seguridad', 'Presión'];

  const activeFiltersCount = [selectedMainCategory, selectedSensorSubCategory, selectedProtocol, selectedConnectivity, selectedSensorType].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-4">
            <div className="order-1 md:order-1 flex items-start md:items-center">
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center text-gray-300 hover:text-cyan-300 transition-colors space-x-2"
                aria-label="Volver a inicio">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm md:text-base">Volver a Inicio</span>
              </button>
            </div>
    
            <div className="order-3 md:order-2 md:col-span-1 flex justify-center">
              <div>
                <h1 className="text-center text-4xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 leading-tight pb-2">
                  Catálogo de Productos
                </h1>
                <p className="mt-2 text-center text-lg text-gray-400">
                  Soluciones avanzadas para la industria 4.0
                </p>
              </div>
            </div>

            <div className="order-2 md:order-3 flex justify-end items-center">
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">        
        <div className="flex flex-col lg:flex-row gap-8">          
          <aside className={`lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-cyan-500" />
                  <span>Filtros</span>
                </h2>
                {activeFiltersCount > 0 && (
                  <button onClick={clearFilters} className="text-orange-400 hover:text-orange-300 text-xs font-bold uppercase tracking-widest">
                    Limpiar
                  </button>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Categoría</label>
                  <select
                    value={selectedMainCategory}
                    onChange={(e) => {
                      setSelectedMainCategory(e.target.value);
                      setSelectedSensorSubCategory('');
                    }}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:border-cyan-500 outline-none transition-colors"
                  >
                    <option value="">Todas</option>
                    {mainCategories.map((cat) => (
                      <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                    ))}
                  </select>
                </div>

                {selectedMainCategory.toLowerCase() === 'sensor' && (
                  <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-lg animate-in fade-in zoom-in duration-300">
                    <label className="block text-xs font-bold text-cyan-500 uppercase tracking-widest mb-3">
                      Tipo Sensor
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {sensorSubCategories.map((sub) => (
                        <button
                          key={sub}
                          onClick={() => setSelectedSensorSubCategory(
                            selectedSensorSubCategory === sub.toLowerCase() ? '' : sub.toLowerCase()
                          )}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                            selectedSensorSubCategory === sub.toLowerCase() 
                            ? 'bg-cyan-500 text-white' 
                            : 'bg-slate-800 text-gray-400 hover:text-white'
                          }`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Protocolo</label>
                    <select
                      value={selectedProtocol}
                      onChange={(e) => setSelectedProtocol(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:border-cyan-500 outline-none"
                    >
                      <option value="">Cualquiera</option>
                      {protocols.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Conectividad</label>
                    <select
                      value={selectedConnectivity}
                      onChange={(e) => setSelectedConnectivity(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:border-cyan-500 outline-none"
                    >
                      <option value="">Cualquiera</option>
                      {connectivities.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            {showFilters && (
              <button 
                onClick={() => setShowFilters(false)} 
                className="lg:hidden block mt-6 w-full bg-slate-800 border border-slate-700 text-cyan-400 py-2 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cerrar Filtros
              </button>
            )}
          </aside>

          <main className="flex-1">
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className="lg:hidden block mb-4 flex items-center justify-center w-full bg-slate-800 border border-slate-700 text-cyan-500 py-3 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <Filter className="w-5 h-5 mr-2" />
              <span>Mostrar Filtros</span>
            </button>
            <div className="mb-8 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nombre o descripción técnica..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-12 pr-4 py-4 focus:border-cyan-500 outline-none transition-all placeholder:text-gray-600 shadow-2xl"/>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
  <Link 
    key={product.id}
    to={`/product/${product.id}`}
    className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all block relative"
  >
    {/* Contenedor de Imagen */}
    <div className="aspect-video bg-slate-800 relative overflow-hidden">
      <img 
        src={product.image_url || 'https://via.placeholder.com/400'} 
        alt={product.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
    </div>
    
    <div className="p-6 flex flex-col h-[calc(100%-auto)]">
      {/* Categoría y Título */}
      <div className="mb-4">
        <span className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 inline-block mb-3">
          {product.subcategory || product.main_category}
        </span>
        <h3 className="text-white font-bold text-lg group-hover:text-cyan-400 transition-colors line-clamp-2 leading-tight">
          {product.name}
        </h3>
      </div>
      
      {/* Descripción Breve */}
      <p className="text-slate-400 text-sm line-clamp-2 mb-6 flex-grow">
        {product.description}
      </p>

      {/* Precio y Botón de Acción */}
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800/50">
        <div className="flex flex-col">
          <span className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Precio Neto</span>
          <span className="text-white font-bold text-xl">
            ${(product.price || 0).toLocaleString('es-CL')}
          </span>
        </div>
        
        {/* El botón es visual; el Link envuelve toda la tarjeta */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg shadow-orange-500/25 group-hover:translate-y-[-2px] active:translate-y-0 transition-all flex items-center gap-2">
          Ver Equipo
        </div>
      </div>
    </div>
  </Link>
))}
              </div>
            ) : (
              <div className="text-center py-32 bg-slate-900/50 rounded-3xl border border-dashed border-slate-800">
                <Search className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400 font-medium">No hay productos que coincidan con tu búsqueda.</p>
                <button onClick={clearFilters} className="mt-4 text-cyan-500 hover:underline text-sm font-bold">Ver todo el catálogo</button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}