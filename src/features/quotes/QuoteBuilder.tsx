import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Plus, Trash2, FileText, Save, 
  Calculator, Calendar, FileCheck, AlertCircle, Link as LinkIcon 
} from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import { useProducts } from '../../hooks/useProducts';
import { toast } from 'sonner';
import QuotePreview from './QuotePreview';
import { Client } from '../../types/client';

interface Props {
  initialData?: any | null; // Datos para cargar en modo revisión
  onSuccess?: () => void;   // Para limpiar el estado padre al terminar
}

export default function QuoteBuilder({ initialData, onSuccess }: Props) {
  const { clients } = useClients();
  const { products } = useProducts();

  // Estados del Formulario
  const [selectedClientId, setSelectedClientId] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [validityDays, setValidityDays] = useState(15);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  
  // Estado de UI
  const [showPreview, setShowPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para controlar si es revisión
  const [isRevisionMode, setIsRevisionMode] = useState(false);
  const [parentFolio, setParentFolio] = useState('');
  const [nextVersion, setNextVersion] = useState(1);
  const [parentQuoteId, setParentQuoteId] = useState<string | undefined>(undefined);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  // EFECTO: Cargar datos si vienen en initialData (Modo Revisión)
  useEffect(() => {
    if (initialData) {
      setIsRevisionMode(true);
      setSelectedClientId(initialData.client_id);
      setItems(initialData.items || []);
      setNotes(initialData.notes || '');
      setTerms(initialData.terms || '');
      setValidityDays(initialData.validity_days || 15);
      
      // Datos críticos para la revisión
      setParentFolio(initialData.folio);
      setNextVersion((initialData.version || 1) + 1);
      setParentQuoteId(initialData.id);
      
      toast.info(`Cargando datos para revisión de ${initialData.folio}`);
    } else {
      // Resetear si no hay datos (Modo Nuevo)
      setIsRevisionMode(false);
      setParentFolio('');
      setNextVersion(1);
      setParentQuoteId(undefined);
      setItems([]);
      setSelectedClientId('');
      setNotes('');
      setTerms('');
    }
  }, [initialData]);

  // EFECTO: Cargar términos predeterminados si es nueva cotización
  useEffect(() => {
    if (selectedClient && !isRevisionMode && !terms) {
      const condition = selectedClient.condicion_comercial || 'Contado / Transferencia';
      setTerms(
        `Condición de pago: ${condition}.\n` +
        `Plazo de entrega: A confirmar según disponibilidad de stock.\n` +
        `Precios válidos salvo error u omisión.`
      );
    }
  }, [selectedClientId, isRevisionMode, clients]);

  // Cálculos en tiempo real
  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + (item.total || 0), 0);
    const iva = Math.round(subtotal * 0.19);
    return { subtotal, iva, total: subtotal + iva };
  }, [items]);

  const handleAddItem = (product: any) => {
    const existing = items.find(i => i.product_id === product.id);
    if (existing) {
      toast.info("Producto ya agregado. Modifica la cantidad.");
      return;
    }
    
    setItems([...items, {
      product_id: product.id,
      part_number: product.part_number,
      name: product.name,
      description: product.description,
      unit_price: product.price,
      quantity: 1,
      total: product.price,
      datasheet_url: product.datasheet_url
    }]);
    setSearchTerm('');
  };

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const newItems = [...items];
    newItems[index].quantity = newQty;
    newItems[index].total = newItems[index].unit_price * newQty;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter(p => {
      const nameSafe = (p.name || '').toLowerCase();
      const codeSafe = (p.part_number || '').toLowerCase();
      const searchSafe = searchTerm.toLowerCase();

      return nameSafe.includes(searchSafe) || codeSafe.includes(searchSafe);
    }).slice(0, 5);
  }, [products, searchTerm]);

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in">
      
      {/* Indicador de Revisión */}
      {isRevisionMode && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="text-sm font-bold">Modo Edición: Creando Revisión {nextVersion}</p>
              <p className="text-xs text-amber-500/70">Original: {parentFolio}</p>
            </div>
          </div>
          <button 
             onClick={onSuccess} 
             className="text-xs font-bold underline hover:text-amber-300"
          >
            Cancelar Edición
          </button>
        </div>
      )}

      {/* 1. CONFIGURACIÓN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cliente</label>
          <select 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            disabled={isRevisionMode} // No cambiar cliente en revisión
          >
            <option value="">-- Seleccionar Cliente --</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.razon_social} ({c.rut})</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Validez Oferta (Días)</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="number" 
              value={validityDays}
              onChange={(e) => setValidityDays(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-10 text-white font-mono text-center focus:ring-2 focus:ring-cyan-500/50 outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. ÍTEMS */}
      <div className="flex-1 bg-slate-900/30 border border-slate-800 rounded-2xl p-6 min-h-[400px] flex flex-col">
        {/* Buscador */}
        <div className="relative mb-6 z-20">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar producto por nombre o código..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none shadow-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {searchTerm && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  onClick={() => handleAddItem(product)}
                  className="p-3 hover:bg-slate-800 cursor-pointer flex justify-between items-center border-b border-slate-800/50 last:border-0 transition-colors"
                >
                  <div>
                    <div className="font-bold text-white text-sm">{product.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{product.part_number}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    {product.datasheet_url && (
                      <span className="flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-500/20">
                        <LinkIcon className="w-3 h-3" /> Ficha Técnica
                      </span>
                    )}
                    <span className="text-cyan-400 font-bold text-sm">${product.price.toLocaleString('es-CL')}</span>
                    <Plus className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="p-3 text-center text-slate-500 text-sm">No se encontraron productos</div>
              )}
            </div>
          )}
        </div>

        {/* Tabla */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">
              <Calculator className="w-12 h-12 mb-3 opacity-50" />
              <p className="font-medium">Cotización vacía</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="text-xs text-slate-500 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="pb-3 text-left pl-4">Descripción</th>
                  <th className="pb-3 text-center">Cant.</th>
                  <th className="pb-3 text-right">Unitario</th>
                  <th className="pb-3 text-right pr-4">Total</th>
                  <th className="pb-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {items.map((item, idx) => (
                  <tr key={idx} className="group hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 pl-4">
                      <div className="font-bold text-slate-200 text-sm">{item.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{item.part_number}</div>
                      {item.datasheet_url && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-cyan-500">
                            <FileCheck className="w-3 h-3" /> Ficha Disponible
                          </div>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <input 
                        type="number" min="1" value={item.quantity}
                        onChange={(e) => updateQuantity(idx, Number(e.target.value))}
                        className="w-16 bg-slate-950 border border-slate-700 rounded-lg py-1 text-center text-white text-sm font-bold focus:border-cyan-500 outline-none"
                      />
                    </td>
                    <td className="py-3 text-right text-slate-400 text-sm font-mono">
                      ${item.unit_price.toLocaleString('es-CL')}
                    </td>
                    <td className="py-3 text-right pr-4 text-cyan-400 font-bold text-sm font-mono">
                      ${item.total.toLocaleString('es-CL')}
                    </td>
                    <td className="py-3 text-right">
                      <button onClick={() => removeItem(idx)} className="p-2 hover:bg-red-500/10 hover:text-red-500 text-slate-600 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Totales */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Subtotal Neto:</span>
              <span className="font-mono text-slate-200">${totals.subtotal.toLocaleString('es-CL')}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-400">
               <span>IVA (19%):</span>
               <span className="font-mono text-slate-200">${totals.iva.toLocaleString('es-CL')}</span>
            </div>
            <div className="flex justify-between text-xl font-black text-cyan-400 pt-2 border-t border-slate-800 mt-2">
              <span>TOTAL:</span>
              <span className="font-mono">${totals.total.toLocaleString('es-CL')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PIE: NOTAS Y TÉRMINOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block flex items-center gap-2">
            <FileText className="w-3 h-3" /> Notas Internas
          </label>
          <textarea 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-300 focus:ring-1 focus:ring-cyan-500 outline-none resize-none h-24"
            placeholder="Observaciones adicionales..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block flex items-center gap-2">
            <AlertCircle className="w-3 h-3" /> Términos y Condiciones
          </label>
          <textarea 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-300 focus:ring-1 focus:ring-cyan-500 outline-none resize-none h-24"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          disabled={!selectedClient || items.length === 0}
          onClick={() => setShowPreview(true)}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 transition-all"
        >
          <Save className="w-5 h-5" />
          GENERAR VISTA PREVIA
        </button>
      </div>

      {showPreview && selectedClient && (
        <QuotePreview 
          client={selectedClient}
          items={items}
          totals={totals}
          onClose={() => setShowPreview(false)}
          notes={notes}
          terms={terms}
          validityDays={validityDays}
          // Props para la revisión (si aplica)
          existingFolio={isRevisionMode ? parentFolio : undefined} // Ojo: QuotePreview debe aceptar esta prop
          nextVersion={nextVersion}
          parentQuoteId={parentQuoteId}
          onSuccess={onSuccess}
        />
      )}
    </div>
  );
}