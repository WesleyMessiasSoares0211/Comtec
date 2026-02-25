import React from 'react';
import { Edit, Trash2, Image, AlertTriangle, Layers, FileText } from 'lucide-react';
import { Product } from '../../types/product';

interface Props {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void; // Solo pasa el ID hacia arriba
}

export default function ProductTable({ products, onEdit, onDelete }: Props) {
  
  if (products.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800 animate-in fade-in">
        <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">No se encontraron productos.</p>
        <p className="text-slate-600 text-sm">Intenta ajustar los filtros de búsqueda.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl animate-in fade-in duration-500 delay-150">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-950/50 text-left">
              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Producto</th>
              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Código / Cat.</th>
              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Stock</th>
              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Precio</th>
              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {products.map((product) => {
              const isLowStock = (product.stock || 0) <= (product.min_stock || 0);
              
              return (
                <tr key={product.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                        {product.image_url ? (
                          <img src={product.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Image className="w-5 h-5 text-slate-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">
                          {product.name}
                        </div>
                        <div className="text-xs text-slate-500">{product.brand}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-xs text-cyan-300 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-500/20 w-fit">
                        {product.part_number}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Layers className="w-3 h-3" /> {product.category || product.main_category}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${
                      isLowStock 
                        ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}>
                      {isLowStock && <AlertTriangle className="w-3 h-3" />}
                      <span className="font-bold text-sm">{product.stock}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="font-mono text-slate-300 font-bold">
                      ${product.price.toLocaleString('es-CL')}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {product.datasheet_url && (
                        <a href={product.datasheet_url} target="_blank" rel="noreferrer" className="p-2 hover:bg-cyan-500/10 text-slate-500 hover:text-cyan-400 rounded-lg transition-colors">
                          <FileText className="w-4 h-4" />
                        </a>
                      )}
                      <button onClick={() => onEdit(product)} className="p-2 hover:bg-blue-500/10 text-slate-500 hover:text-blue-400 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(product.id)} className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}