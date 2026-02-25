import { ReactNode } from 'react';
import Footer from '../components/Footer';

interface PublicLayoutProps {
  children: ReactNode;
  onNavigate?: (page: string, extraData?: string) => void;
}

export default function PublicLayout({ children, onNavigate }: PublicLayoutProps) {
  // Función por defecto por si no se provee navegación desde el padre
  const handleNavigate = onNavigate || ((page) => console.log('Navegando a:', page));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* HEADER PÚBLICO IRÍA AQUÍ SI LO TIENES */}
      
      {/* Contenido Principal */}
      <main className="flex-1 w-full flex flex-col">
        {children}
      </main>

      {/* Footer Industrial */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}