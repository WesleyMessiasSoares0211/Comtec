import { Mail, Phone, MapPin, Linkedin, Instagram, Settings } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string, extraData?: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 border-t border-slate-800 relative z-10 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start gap-8">
          
          {/* SECCIÓN IZQUIERDA: Branding */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Settings className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-white font-black text-lg leading-none bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight">COMTEC</h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">Industrial System</p>
              </div>
            </div>
            <p className="text-slate-500 text-xs max-w-[280px]">
              Soluciones IIoT de grado industrial para optimizar tus procesos y eficiencia operativa.
            </p>
          </div>

          {/* SECCIÓN CENTRAL: Enlaces y Contacto Rápido */}
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12">
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm">
              <button onClick={() => onNavigate('home')} className="text-slate-400 hover:text-cyan-400 transition-colors font-medium">Inicio</button>
              <button onClick={() => onNavigate('catalog')} className="text-slate-400 hover:text-cyan-400 transition-colors font-medium">Catálogo</button>
              <button onClick={() => onNavigate('nosotros')} className="text-slate-400 hover:text-cyan-400 transition-colors font-medium">Empresa</button>              
            </div>

            <div className="hidden sm:block w-px h-12 bg-slate-800" />

            <div className="flex flex-col gap-2 text-xs text-slate-400">
              <a href="tel:+56912345678" className="flex items-center gap-2 hover:text-cyan-400 transition-colors">
                <Phone className="w-3.5 h-3.5 text-slate-500" /> +56 9 4252 1168
              </a>
              <a href="mailto:contacto@comtec.cl" className="flex items-center gap-2 hover:text-cyan-400 transition-colors">
                <Mail className="w-3.5 h-3.5 text-slate-500" /> contacto@comtecindustrial.com
              </a>
              <div className="flex items-center gap-2 cursor-default">
                <MapPin className="w-3.5 h-3.5 text-slate-500" /> Antofagasta, Chile
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN INFERIOR: Legal y Redes */}
        <div className="mt-8 pt-6 border-t border-slate-800/50 flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
          <p className="text-slate-600 text-[10px] uppercase tracking-widest font-bold text-center">
            &copy; {currentYear} Comtec Industrial. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <button className="hover:text-cyan-400 transition-colors">Privacidad</button>
            <button className="hover:text-cyan-400 transition-colors">Términos</button>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-800">
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}