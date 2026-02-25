import { useEffect, useState } from 'react';
import {
  Package, ExternalLink, Cpu, Network,
  Settings as SettingsIcon, Search, Filter,
  Settings2, Droplets, Ruler, Trash2
} from 'lucide-react';
import { productService } from '../../services/productService';
import type { Product } from '../../types/product';
import ProductsForm from './ProductsForm';
import { useAuth } from '../../hooks/useAuth';
import { PasswordDeleteModal } from '../../components/ui/SecurityModals'; // ⬅️ Importamos el Modal
import { toast } from 'sonner';

export default function ProductsList() {
  const { canDelete, canEdit } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Estados para el Modal de Eliminación
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast.error('Error al cargar catálogo');
    } finally {
      setLoading(false);
    }
  }

  // Nueva función conectada al Modal
  async function handleDeleteConfirm() {
    if (!productToDelete || !canDelete) return;

    try {
      setIsDeleting(true);
      await productService.delete(productToDelete.id);
      
      toast.success('Producto eliminado del catálogo permanentemente');
      setSearchTerm('');
      await fetchProducts();
      setProductToDelete(null);
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id)); // Actualiza estado local
    } catch (error: any) {
      console.error('Error al eliminar producto:', error);
      toast.error(error.message || 'Error al eliminar el producto. Por favor, intenta de nuevo.');
      setProductToDelete(null);
    } finally {
      setIsDeleting(false);
      setProductToDelete(null); // Cierra el modal
    }
  }

  const filteredProducts = products.filter((product) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      product.name?.toLowerCase().includes(searchLower) ||
      product.part_number?.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower);

    const matchesCategory = categoryFilter === 'all' || product.main_category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const renderTechnicalTags = (product: Product) => {
    const meta = product.metadata || {};

    if (product.main_category === 'PIEZAS Y BOMBAS' || product.main_category === 'FABRICACION MECANICA') {
      return (
        <>
          <span className="flex items-center gap-1 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-400">
            <Settings2 className="w-3 h-3 text-cyan-500" /> {meta.material_base || meta.material || 'Standard'}
          </span>
          {meta.diametro_succion && (
            <span className="flex items-center gap-1 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-400">
              <Ruler className="w-3 h-3 text-orange-500" /> {meta.diametro_succion}
            </span>
          )}
          {meta.fluido_compatible && (
            <span className="flex items-center gap-1 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-400">
              <Droplets className="w-3 h-3 text-blue-500" /> {meta.fluido_compatible}
            </span>
          )}
        </>
      );
    }

    return (
      <>
        <span className="flex items-center gap-1 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-400">
          <Network className="w-3 h-3 text-orange-500" /> {product.protocol || meta.protocolo || 'N/A'}
        </span>
        <span className="flex items-center gap-1 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-400">
          <Cpu className="w-3 h-3 text-cyan-500" /> {product.connectivity || meta.conectividad || 'N/A'}
        </span>
      </>
    );
  };

  if (editingProduct) {
    return (
      <div className="animate-in fade-in duration-300">
        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Editar Registro Técnico</h2>
            <p className="text-cyan-400 font-mono text-xs mt-1 uppercase tracking-tighter">
              {editingProduct.main_category} // {editingProduct.part_number}
            </p>
          </div>
          <button onClick={() => setEditingProduct(null)} className="text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase">
            Volver
          </button>
        </div>
        <ProductsForm initialData={editingProduct} onSuccess={() => { setEditingProduct(null); fetchProducts(); }} />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 bg-slate-900/40 border border-slate-800 p-4 rounded-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar en catálogo industrial..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:border-cyan-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-[11px] font-bold text-slate-400 focus:border-cyan-500 outline-none uppercase"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Todas las Líneas</option>
            {Array.from(new Set(products.map(p => p.main_category).filter(Boolean))).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-cyan-500/30 transition-all group flex flex-col h-full border-t-2 border-t-transparent hover:border-cyan-t-500">

                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase">
                      {product.main_category || 'Sin Categoría'}
                    </span>
                    <span className="text-lg font-mono font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {product.part_number}
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-slate-950 rounded-lg flex items-center justify-center overflow-hidden border border-slate-800">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-slate-800" />
                    )}
                  </div>
                </div>

                <div className="mb-4 flex-1">
                  <h3 className="text-slate-200 font-semibold text-sm leading-tight mb-3 line-clamp-2">
                    {product.name}
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {renderTechnicalTags(product)}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Precio</span>
                    <span className="text-white font-mono font-bold text-base">
                      ${product.price?.toLocaleString('es-CL')}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {canEdit && (
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="p-2 bg-slate-800 hover:bg-cyan-500/20 rounded-lg text-slate-400 hover:text-cyan-400 transition-all"
                        title="Editar producto"
                      >
                        <SettingsIcon className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => setProductToDelete(product)} // ⬅️ Abre el Modal
                        className="p-2 bg-slate-800 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-500 transition-all"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {product.datasheet_url && (
                      <a href={product.datasheet_url} target="_blank" rel="noreferrer" className="p-2 bg-slate-800 hover:bg-orange-500/20 rounded-lg text-slate-400 hover:text-orange-500 transition-all" title="Ver datasheet">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ⬅️ Renderizado del Modal Estricto */}
      <PasswordDeleteModal 
        isOpen={!!productToDelete}
        itemName={`"${productToDelete?.name}" (${productToDelete?.part_number})`}
        loading={isDeleting}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}