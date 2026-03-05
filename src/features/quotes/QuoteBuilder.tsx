import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Plus, Trash2, FileText, Save, 
  Calculator, Calendar, FileCheck, AlertCircle, Link as LinkIcon,
  Wand2, X, UploadCloud, ListChecks, MessageSquare, AlertTriangle, User, UserPlus
} from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import { useProducts } from '../../hooks/useProducts';
import { toast } from 'sonner';
import QuotePreview from './QuotePreview';
import { QuoteItem } from '../../types/quotes';

interface Props {
  initialData?: any | null; 
  onSuccess?: () => void;   
}

// Hook para el Debounce del Buscador
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function QuoteBuilder({ initialData, onSuccess }: Props) {
  const { clients } = useClients();
  const { products } = useProducts();

  // --- ESTADOS: CLIENTES Y BÚSQUEDA ---
  const [selectedClientId, setSelectedClientId] = useState('');
  const [attentionTo, setAttentionTo] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const debouncedClientSearch = useDebounce(clientSearch, 300);

  // --- ESTADOS: COTIZACIÓN ---
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [validityDays, setValidityDays] = useState(15);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  
  const [showPreview, setShowPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- ESTADOS: IMPORTACIÓN INTELIGENTE ---
  const [showSmartImport, setShowSmartImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importResults, setImportResults] = useState<{found: number, missing: string[]}>({ found: 0, missing: [] });

  const [isRevisionMode, setIsRevisionMode] = useState(false);
  const [parentFolio, setParentFolio] = useState('');
  const [nextVersion, setNextVersion] = useState(1);
  const [parentQuoteId, setParentQuoteId] = useState<string | undefined>(undefined);

  const GENERIC_CLIENT_ID = '00000000-0000-0000-0000-000000000000';
  const selectedClient = clients.find(c => c.id === selectedClientId);
  const requiresApproval = items.some(item => (item.margin_pct || 0) < 15);

  // Filtro de clientes asíncrono
  const filteredClients = useMemo(() => {
    if (!debouncedClientSearch) return [];
    const search = debouncedClientSearch.toLowerCase();
    return clients.filter(c => 
      c.razon_social.toLowerCase().includes(search) || 
      c.rut.includes(search)
    ).slice(0, 8);
  }, [debouncedClientSearch, clients]);

  useEffect(() => {
    if (initialData) {
      setIsRevisionMode(true);
      setSelectedClientId(initialData.client_id);
      setAttentionTo(initialData.attention_to || '');
      setItems(initialData.items || []);
      setNotes(initialData.notes || '');
      setTerms(initialData.terms || '');
      setValidityDays(initialData.validity_days || 15);
      
      setParentFolio(initialData.folio);
      setNextVersion((initialData.version || 1) + 1);
      setParentQuoteId(initialData.id);
      
      toast.info(`Cargando datos para revisión de ${initialData.folio}`);
    } else {
      setIsRevisionMode(false);
      setParentFolio('');
      setNextVersion(1);
      setParentQuoteId(undefined);
      setItems([]);
      setSelectedClientId('');
      setAttentionTo('');
      setNotes('');
      setTerms('');
    }
  }, [initialData]);

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

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + (item.total || 0), 0);
    const iva = Math.round(subtotal * 0.19);
    return { subtotal, iva, total: subtotal + iva };
  }, [items]);

  // --- LÓGICA DE ÍTEMS ---
  const handleAddItem = (product: any, qty: number = 1) => {
    const urlFicha = product.datasheet_url || product.technical_spec_url || null;
    const baseCost = product.cost || (product.price * 0.7); 
    const defaultMargin = 25; 
    const calculatedPrice = baseCost / (1 - (defaultMargin / 100));

    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing && !existing.is_generic) {
        return prev.map(item => 
          item.product_id === product.id 
            ? { ...item, quantity: item.quantity + qty, total: (item.quantity + qty) * item.unit_price }
            : item
        );
      }
      return [...prev, {
        product_id: product.id,
        part_number: product.part_number,
        name: product.name,
        quantity: qty,
        unit_price: calculatedPrice,
        total: calculatedPrice * qty,
        cost: baseCost,
        margin_pct: defaultMargin,
        datasheet_url: urlFicha,
        is_generic: false
      }];
    });
    setSearchTerm('');
  };

  const handleAddGenericItem = () => {
    setItems(prev => [...prev, {
      product_id: null,
      part_number: 'SRV-ESP',
      name: '',
      quantity: 1,
      unit_price: 0,
      total: 0,
      cost: 0,
      margin_pct: 30,
      is_generic: true,
      comment: ''
    }]);
  };

  const updateItemField = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };

    if (field === 'cost' || field === 'margin_pct' || field === 'quantity' || field === 'unit_price') {
      if (field !== 'unit_price') {
        const safeCost = Number(item.cost) || 0;
        const safeMargin = Number(item.margin_pct) || 0;
        item.unit_price = safeMargin >= 100 ? safeCost : (safeCost / (1 - (safeMargin / 100)));
      }
      item.total = item.unit_price * (Number(item.quantity) || 1);
    }

    newItems[index] = item;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSelectClient = (client: any) => {
    if (client.estado_financiero === 'bloqueado' || client.estado_financiero === 'rechazado') {
      toast.error('Este cliente se encuentra bloqueado por finanzas. No se puede cotizar.');
      return;
    }
    setSelectedClientId(client.id);
    setClientSearch('');
    setShowClientDropdown(false);
  };

  // --- LÓGICA CORE: COTIZACIÓN INTELIGENTE ---
  const processSmartImport = () => {
    if (!importText.trim() || !products) return;

    const lines = importText.split('\n');
    let addedCount = 0;
    const missing: string[] = [];

    lines.forEach(line => {
      if (!line.trim()) return;
      
      const parts = line.split(/\t|;/);
      let searchCode = '';
      let qty = 1;

      if (parts.length >= 2) {
        searchCode = parts[0].trim();
        qty = parseInt(parts[1].trim(), 10) || 1;
      } else {
        const spaceParts = line.trim().split(/\s+/);
        if (spaceParts.length >= 2) {
          qty = parseInt(spaceParts.pop() || '1', 10) || 1;
          searchCode = spaceParts.join(' ').trim();
        } else {
          searchCode = line.trim();
        }
      }

      if (!searchCode) return;
      const targetCode = searchCode.toLowerCase();

      const foundProduct = products.find(p => {
        if (p.part_number?.toLowerCase() === targetCode) return true;
        if (p.metadata?.client_part_numbers) {
          const clientCodes = Object.values(p.metadata.client_part_numbers) as string[];
          if (clientCodes.some(code => code.toLowerCase() === targetCode)) return true;
        }
        return false;
      });

      if (foundProduct) {
        handleAddItem(foundProduct, qty);
        addedCount++;
      } else {
        missing.push(searchCode);
      }
    });

    setImportResults({ found: addedCount, missing });
    
    if (addedCount > 0) toast.success(`Procesamiento exitoso: ${addedCount} ítems cruzados e integrados.`);
    if (missing.length > 0) toast.warning(`No se encontraron ${missing.length} códigos en el catálogo.`);
    if (missing.length === 0) closeSmartImport();
  };

  const closeSmartImport = () => {
    setShowSmartImport(false);
    setImportText('');
    setImportResults({ found: 0, missing: [] });
  };

  const filteredProducts = useMemo(() => {
    if (!products || !searchTerm) return [];
    return products.filter(p => {
      const searchSafe = searchTerm.toLowerCase();
      return (p.name || '').toLowerCase().includes(searchSafe) || (p.part_number || '').toLowerCase().includes(searchSafe);
    }).slice(0, 5);
  }, [products, searchTerm]);

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in relative">
      
      {/* MODAL SOBREPUESTO: COTIZACIÓN INTELIGENTE */}
      {showSmartImport && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-10">
          <div className="bg-slate-900 border border-cyan-500/30 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Importación Inteligente</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Pega desde Excel: [N° Parte] [Tabulador] [Cantidad]</p>
                </div>
              </div>
              <button onClick={closeSmartImport} className="text-slate-500 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <textarea 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none h-48 resize-none shadow-inner"
                placeholder={`SENS-100\t15\nGATE-X\t2\nCABLE-M12\t50`}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
              
              {importResults.missing.length > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl">
                  <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4" /> Códigos no reconocidos ({importResults.missing.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {importResults.missing.map((code, idx) => (
                      <span key={idx} className="bg-slate-950 border border-orange-500/30 text-orange-300 text-[10px] px-2 py-1 rounded font-mono shadow-sm">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={closeSmartImport} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">Cancelar</button>
                <button 
                  onClick={processSmartImport} 
                  disabled={!importText.trim()}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all"
                >
                  <ListChecks className="w-4 h-4" />
                  PROCESAR MATRIZ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isRevisionMode && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex items-center justify-between animate-pulse shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="text-sm font-bold">Modo Edición: Creando Revisión {nextVersion}</p>
              <p className="text-xs text-amber-500/70">Original: {parentFolio}</p>
            </div>
          </div>
          <button onClick={onSuccess} className="text-xs font-bold underline hover:text-amber-300">
            Cancelar Edición
          </button>
        </div>
      )}

      {/* SECCIÓN CLIENTE (COMBOBOX) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div className="md:col-span-2 space-y-2 relative">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <User className="w-4 h-4" /> Selección de Cliente
          </label>
          
          {selectedClientId ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between bg-slate-950 border border-cyan-500/50 rounded-xl p-3 shadow-inner">
                <div>
                  <div className="text-white font-bold text-sm">
                    {selectedClientId === GENERIC_CLIENT_ID ? 'CLIENTE GENÉRICO / CONTADO' : selectedClient?.razon_social}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {selectedClientId === GENERIC_CLIENT_ID ? 'Venta Express' : selectedClient?.rut}
                  </div>
                </div>
                {!isRevisionMode && (
                  <button onClick={() => setSelectedClientId('')} className="p-2 text-slate-500 hover:text-orange-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {selectedClientId === GENERIC_CLIENT_ID && (
                <div className="animate-in slide-in-from-top-2">
                  <input 
                    type="text" 
                    placeholder="Atención a: Ej. Juan Pérez - Fono: +569..." 
                    value={attentionTo}
                    onChange={(e) => setAttentionTo(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none shadow-sm"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Buscar por RUT o Razón Social..."
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setShowClientDropdown(true);
                }}
                onFocus={() => setShowClientDropdown(true)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-10 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all shadow-inner"
              />
              
              {showClientDropdown && clientSearch.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto custom-scrollbar">
                  <div 
                    onClick={() => handleSelectClient({ id: GENERIC_CLIENT_ID, estado_financiero: 'aprobado' })}
                    className="p-3 bg-cyan-950/20 hover:bg-cyan-900/40 cursor-pointer flex items-center gap-3 border-b border-cyan-900/50 transition-colors"
                  >
                    <UserPlus className="w-5 h-5 text-cyan-500" />
                    <div>
                      <div className="font-bold text-cyan-400 text-sm">Cotización Express (Cliente Genérico)</div>
                      <div className="text-[10px] text-slate-400">Usar para ventas rápidas sin RUT registrado</div>
                    </div>
                  </div>
                  
                  {filteredClients.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => handleSelectClient(c)}
                      className="p-3 hover:bg-slate-800 cursor-pointer flex justify-between items-center border-b border-slate-800/50 last:border-0"
                    >
                      <div>
                        <div className={`font-bold text-sm ${c.estado_financiero === 'bloqueado' ? 'text-slate-500 line-through' : 'text-white'}`}>
                          {c.razon_social}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">{c.rut}</div>
                      </div>
                      {c.estado_financiero === 'bloqueado' && (
                        <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-1 rounded border border-red-500/20">Bloqueado</span>
                      )}
                    </div>
                  ))}
                  {filteredClients.length === 0 && (
                    <div className="p-3 text-center text-slate-500 text-sm">No se encontraron clientes activos</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
             Validez Oferta (Días)
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="number" 
              value={validityDays}
              onChange={(e) => setValidityDays(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-10 text-white font-mono text-center focus:ring-2 focus:ring-cyan-500/50 outline-none shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN ÍTEMS */}
      <div className="flex-1 bg-slate-900/30 border border-slate-800 rounded-2xl p-6 min-h-[500px] flex flex-col shadow-sm">
        <div className="relative mb-6 z-20 flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar producto en catálogo..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {/* DROPDOWN PRODUCTOS RESTAURADO */}
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
                      {(product.datasheet_url || product.technical_spec_url) && (
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
          
          <button 
            onClick={() => setShowSmartImport(true)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 px-4 py-3 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg transition-all"
          >
            <UploadCloud className="w-5 h-5" /> <span className="hidden sm:inline">Pegar Excel</span>
          </button>

          <button 
            onClick={handleAddGenericItem}
            className="bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 px-4 py-3 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg shadow-orange-500/10 transition-all"
          >
            <Plus className="w-5 h-5" /> <span className="hidden sm:inline">Item Libre</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl min-h-[200px]">
              <Calculator className="w-12 h-12 mb-3 opacity-50" />
              <p className="font-medium">Cotización vacía</p>
              <button 
                onClick={() => setShowSmartImport(true)}
                className="mt-4 text-xs font-bold text-cyan-500 hover:text-cyan-400 flex items-center gap-1 transition-colors"
              >
                <Wand2 className="w-4 h-4" /> Probar importación inteligente
              </button>
            </div>
          ) : (
            items.map((item, idx) => (
              <div key={idx} className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 transition-all hover:border-slate-700 shadow-sm">
                <div className="grid grid-cols-12 gap-4 items-center">
                  
                  {/* Descripción */}
                  <div className="col-span-12 lg:col-span-4">
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-widest">Producto / Descripción</label>
                    {item.is_generic ? (
                      <input 
                        type="text" 
                        value={item.name}
                        onChange={(e) => updateItemField(idx, 'name', e.target.value)}
                        placeholder="Descripción del ítem..."
                        className="w-full bg-slate-900 border border-slate-700 rounded text-slate-200 px-3 py-2 text-sm focus:border-cyan-500 outline-none shadow-inner"
                      />
                    ) : (
                      <div>
                        <div className="font-bold text-slate-200 text-sm">{item.name}</div>
                        <div className="text-xs text-slate-500 font-mono flex gap-2 items-center">
                          {item.part_number}
                          {item.datasheet_url && (
                            <span className="flex items-center gap-1 text-[10px] text-cyan-500">
                              <FileCheck className="w-3 h-3" /> Ficha
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cantidad */}
                  <div className="col-span-3 lg:col-span-1">
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-widest">Cant.</label>
                    <input 
                      type="number" min="1" 
                      value={item.quantity}
                      onChange={(e) => updateItemField(idx, 'quantity', Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded text-slate-200 px-2 py-2 text-sm text-center focus:border-cyan-500 outline-none shadow-inner"
                    />
                  </div>

                  {/* Costo */}
                  <div className="col-span-4 lg:col-span-2">
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-widest">Costo Unit.</label>
                    <div className="relative">
                      <span className="absolute left-2 top-2 text-slate-500 text-sm">$</span>
                      <input 
                        type="number" 
                        value={item.cost || 0}
                        onChange={(e) => updateItemField(idx, 'cost', Number(e.target.value))}
                        disabled={!item.is_generic && !!item.cost} 
                        className={`w-full bg-slate-900 border border-slate-700 rounded text-slate-200 pl-6 py-2 text-sm focus:border-cyan-500 outline-none shadow-inner ${(!item.is_generic && !!item.cost) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    </div>
                  </div>

                  {/* Margen */}
                  <div className="col-span-5 lg:col-span-2">
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-widest">Margen %</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={item.margin_pct || 0}
                        onChange={(e) => updateItemField(idx, 'margin_pct', Number(e.target.value))}
                        className={`w-full bg-slate-900 border rounded text-slate-200 px-3 py-2 text-sm outline-none shadow-inner ${(item.margin_pct || 0) < 15 ? 'border-orange-500/50 focus:ring-orange-500' : 'border-slate-700 focus:border-cyan-500'}`}
                      />
                      {(item.margin_pct || 0) < 15 && (
                        <AlertTriangle className="absolute right-2 top-2.5 w-4 h-4 text-orange-500" />
                      )}
                    </div>
                  </div>

                  {/* Total Venta */}
                  <div className="col-span-9 lg:col-span-2">
                    <label className="block text-[10px] text-cyan-500 mb-1 uppercase tracking-widest">Venta Total</label>
                    <div className="bg-slate-950 border border-cyan-900/50 rounded text-cyan-400 px-3 py-2 text-sm font-semibold shadow-[0_0_10px_rgba(6,182,212,0.1)] text-right font-mono">
                      ${(item.total || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="col-span-3 lg:col-span-1 flex justify-end items-end h-full pb-1 gap-2">
                    <button onClick={() => removeItem(idx)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Comentarios por Ítem */}
                <div className="mt-3 pt-3 border-t border-slate-800/50">
                  <div className="flex gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-500 mt-2 shrink-0" />
                    <textarea 
                      placeholder="Comentarios o detalles técnicos para este ítem (visible en el PDF)..."
                      value={item.comment || ''}
                      onChange={(e) => updateItemField(idx, 'comment', e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:border-cyan-500 outline-none resize-none h-10 shadow-inner"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Resumen Totales */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col md:flex-row justify-between items-end gap-4">
          <div className="flex-1">
             {requiresApproval && (
               <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 p-3 rounded-xl flex items-center gap-3 text-sm shadow-sm">
                 <AlertTriangle className="w-5 h-5 shrink-0" />
                 <p>Uno o más ítems tienen un <b>margen inferior al 15%</b>. La cotización requerirá aprobación de Jefatura y no generará PDF automático.</p>
               </div>
             )}
          </div>
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Subtotal Neto:</span><span className="font-mono text-slate-200">${totals.subtotal.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-400">
               <span>IVA (19%):</span><span className="font-mono text-slate-200">${totals.iva.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between text-xl font-black text-cyan-400 pt-2 border-t border-slate-800 mt-2">
              <span>TOTAL:</span><span className="font-mono">${totals.total.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN NOTAS Y TÉRMINOS RESTAURADA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 shadow-sm">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <FileText className="w-3 h-3" /> Notas Internas
          </label>
          <textarea 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-300 focus:ring-1 focus:ring-cyan-500 outline-none resize-none h-24 shadow-inner"
            placeholder="Observaciones adicionales (no visibles para el cliente)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 shadow-sm">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <AlertCircle className="w-3 h-3" /> Términos y Condiciones
          </label>
          <textarea 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-300 focus:ring-1 focus:ring-cyan-500 outline-none resize-none h-24 shadow-inner"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          disabled={!selectedClientId || items.length === 0 || (selectedClientId === GENERIC_CLIENT_ID && !attentionTo.trim())}
          onClick={() => setShowPreview(true)}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 transition-all"
        >
          <Save className="w-5 h-5" />
          GENERAR VISTA PREVIA {requiresApproval && '(Sujeto a Aprobación)'}
        </button>
      </div>

      {showPreview && selectedClient && (
        <QuotePreview 
          client={selectedClientId === GENERIC_CLIENT_ID ? { ...selectedClient, razon_social: 'CLIENTE GENÉRICO / CONTADO', rut: 'Contado' } : selectedClient}
          items={items}
          totals={totals}
          onClose={() => setShowPreview(false)}
          notes={notes}
          terms={terms}
          validityDays={validityDays}
          existingFolio={isRevisionMode ? parentFolio : undefined} 
          nextVersion={nextVersion}
          parentQuoteId={parentQuoteId}
          onSuccess={onSuccess}
          attentionTo={attentionTo}
          requiresApproval={requiresApproval}
        />
      )}
    </div>
  );
}