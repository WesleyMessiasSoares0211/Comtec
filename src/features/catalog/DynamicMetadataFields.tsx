// src/features/catalog/DynamicMetadataFields.tsx
import React from 'react';
import { CATEGORY_MODELS } from './models';

interface Props {
  category: string;
  metadata: Record<string, any>;
  onChange: (name: string, value: any) => void;
}

export const DynamicMetadataFields: React.FC<Props> = ({ category, metadata, onChange }) => {
  const fields = CATEGORY_MODELS[category.toLowerCase()] || [];

  if (fields.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-xl animate-in fade-in slide-in-from-top-2">
      <h4 className="col-span-full text-xs font-bold text-cyan-500 uppercase tracking-widest mb-2">
        Especificaciones Técnicas ({category})
      </h4>
      {fields.map((field) => (
        <div key={field.name} className="space-y-1.5">
          <label className="text-xs font-medium text-gray-400">{field.label}</label>
          {field.type === 'select' ? (
            <select
              value={metadata[field.name] || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none transition-all"
            >
              <option value="">Seleccionar...</option>
              {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : (
            <input
              type={field.type}
              value={metadata[field.name] || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none transition-all"
            />
          )}
        </div>
      ))}
    </div>
  );
};