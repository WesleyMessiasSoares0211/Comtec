import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
}

export default function Card({ children, className = '', title }: CardProps) {
  return (
    <div className={`bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-sm overflow-hidden ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/30">
          <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
            {title}
          </h3>
        </div>
      )}
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}