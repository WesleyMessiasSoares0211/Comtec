import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { FileText, Download, Package, AlertCircle, ShieldCheck } from 'lucide-react';
import { QuoteItem } from '../types/quotes';

export default function QuoteDocsViewer() {
  const { folio } = useParams();
  const [loading, setLoading] = useState(true);
  const [itemsWithDocs, setItemsWithDocs] = useState<QuoteItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (folio) fetchQuoteDocs();
  }, [folio]);

  const fetchQuoteDocs = async () => {
    try {
      // 1. Decodificar el folio (por si viene con caracteres especiales en URL)
      const decodedFolio = decodeURIComponent(folio || '');

      // 2. Buscar la cotización y sus ítems
      const { data, error } = await supabase
        .from('crm_quotes')
        .select('items')
        .eq('folio', decodedFolio)
        .single();

      if (error) throw error;

      if (data && data.items) {
        // 3. Filtrar solo los productos que tienen datasheet_url
        const docs = (data.items as QuoteItem[]).filter(
          item => item.datasheet_url && item.datasheet_url.length > 5
        );
        setItemsWithDocs(docs);
      }
    } catch (err) {
      console.error(err);
      setError('Documento no encontrado o expirado.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 mb-4">
            <ShieldCheck className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Documentación Técnica</h1>
          <p className="text-slate-400">Carpeta Digital para Cotización <span className="text-cyan-400 font-mono">{folio}</span></p>
        </div>

        {/* LISTA DE ARCHIVOS */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
          {error ? (
            <div className="text-center py-8 text-red-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>{error}</p>
            </div>
          ) : itemsWithDocs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Esta cotización no incluye productos con ficha técnica adjunta.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {itemsWithDocs.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-xl hover:border-cyan-500/30 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-800 rounded-lg text-red-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">{item.part_number}</p>
                    </div>
                  </div>
                  
                  <a 
                    href={item.datasheet_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors shadow-lg shadow-cyan-900/20"
                    title="Descargar Ficha"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="text-center text-xs text-slate-600">
          <p>© {new Date().getFullYear()} Comtec Industrial Solutions</p>
        </div>
      </div>
    </div>
  );
}