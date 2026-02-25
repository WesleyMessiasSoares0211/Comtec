import { Target, Eye, Users2, Trophy, Building2, ShieldCheck, ArrowLeft, Boxes, TrendingUp } from 'lucide-react';

interface NosotrosPageProps {
  onNavigate: (page: string) => void;
}

export default function NosotrosPage({ onNavigate }: NosotrosPageProps) {
  return (
    <main className="relative flex-grow bg-slate-950 text-white z-10">      
      <section className="relative  bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-4">
            {/* Botón: aparece primero en móvil, izquierda en md+ */}
            <div className="order-1 md:order-1 flex items-start md:items-center">
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center text-gray-300 hover:text-cyan-300 transition-colors space-x-2"
                aria-label="Volver a inicio">
                <ArrowLeft className="h-4 w-4"/>
                <span className="text-sm md:text-base">Volver a Inicio</span>
              </button>
            </div>
    
            {/* Título: centrado, ocupa la columna central en md+ */}
            <div className="order-3 md:order-2 md:col-span-1 flex justify-center">
              <div>
                <h1 className="text-center text-4xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 leading-tight pb-2">
                  Sobre Nosotros
                </h1>
                <p className="mt-2 text-center text-lg text-gray-400">
                  Soluciones avanzadas para la industria 4.0
                </p>
              </div>
            </div>        
          </div>
        </div>         
      </div>
     </section>

      {/* SECCIÓN SOBRE NOSOTROS */}
      <section className="py-8 relative z-20">
         <div className="text-center pb-4 ">
            <h1 className="text-5xl text-white sm:text-3xl font-extrabold mb-4 tracking-tight">
              La Revolución Industrial</h1>
            <p className="text-justify hyphen-auto text-xl text-gray-400 max-w-5xl mx-auto leading-relaxed px-6">
              En Comtec Industrial, transformamos datos en decisiones. Somos arquitectos de soluciones IIoT diseñadas para la robustez y precisión que exige la industria moderna.
            </p>
          </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-square bg-slate-900 rounded-3xl overflow-hidden border border-slate-800">
              <img 
                src="https://i.redd.it/sgmba95ebzfg1.png" 
                alt="Equipo Comtec" 
                className="w-full h-full object-cover"
              />              
            </div>
            
            <div className="space-y-4">
              <h2 className="pt-4 text-4xl sm:text-3xl font-bold text-white">Nuestra Identidad</h2>
              <p className="text-justify hyphen-auto text-gray-400 text-lg leading-relaxed">
                En Comtec Industrial creemos que el futuro se construye hoy; por eso, nos dedicamos a hacer realidad la Industria 4.0, transformando operaciones críticas en datos tangibles. Nuestra esencia radica en el despliegue de tecnología de vanguardia y soluciones que construyen ecosistemas inteligentes, seguros y flexibles para los sectores de minería, energía y manufactura.</p>
              <p className="text-justify hyphen-auto text-gray-400 text-lg leading-relaxed">                
Nos dedicamos a optimizar la productividad y a asegurar la continuidad operacional a través de la digitalización avanzada de procesos y el análisis de datos. Pero nuestro compromiso va más allá: estamos profundamente arraigados en la protección. Con cada solución, garantizamos la seguridad de sus colaboradores, el cuidado de sus activos, el uso eficiente de los recursos y la preservación del medio ambiente.</p>
              <p className="text-justify hyphen-auto text-gray-400 text-lg leading-relaxed">                
Estamos comprometidos con un soporte local experto porque entendemos que en la industria no hay margen para las interrupciones. Por ello, nuestra presencia cercana asegura una respuesta rápida y soluciones efectivas, consolidando una alianza estratégica de confianza y eficiencia. En Comtec Industrial, somos su socio para un futuro más inteligente, seguro y sostenible.
              </p>
              
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN MISIÓN Y VISIÓN */}
      <section className="py-20 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="group p-10 bg-slate-950 border border-slate-800 rounded-3xl hover:border-cyan-500/40 transition-all duration-300">
              <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-8">
                <Target className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-2xl text-white font-bold mb-4">Nuestra Misión</h3>
              <p className="text-justify hyphen-auto text-gray-400 leading-relaxed">
               Impulsar la evolución digital de la industria mediante ecosistemas inteligentes y flexibles que garanticen la seguridad de los colaboradores y la continuidad operacional; optimizando la productividad, el cuidado de activos y la protección del medio ambiente con tecnología de vanguardia y soporte local.
              </p>
            </div>

            <div className="group p-10 bg-slate-950 border border-slate-800 rounded-3xl hover:border-blue-500/40 transition-all duration-300">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-8">
                <Eye className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-2xl text-white font-bold mb-4">Nuestra Visión</h3>
              <p className="text-justify hyphen-auto text-gray-400 leading-relaxed">
                Ser el referente en la transformación hacia una industria autónoma y predictiva, donde nuestra tecnología sea el estándar para operaciones seguras, eficientes y sostenibles en todo el espectro de la producción y gestión de activos.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-20 grid sm:grid-cols-4 gap-6">
              <div className="flex items-start space-x-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                  <div className="p-2 bg-cyan-500/10 rounded-lg">
                    <ShieldCheck className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Calidad Certificada</h4>
                    <p className="text-sm text-gray-500">Equipos de grado industrial IP67+.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Users2 className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Soporte Local</h4>
                    <p className="text-sm text-gray-500">Acompañamiento técnico experto.</p>
                  </div>                  
                </div>
            <div className="flex items-start space-x-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                  <div className="p-2 bg-cyan-500/10 rounded-lg">
                    <Boxes className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Soluciones Integrales</h4>
                    <p className="text-sm text-gray-500">Desarrollo de sistemas e interfaces.</p>
                  </div>
                </div>
            <div className="flex items-start space-x-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                  <div className="p-2 bg-cyan-500/10 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Análisis de Dados</h4>
                    <p className="text-sm text-gray-500">Acciones con base en datos.</p>
                  </div>
                </div>
              </div>
          
        </div>  
      </section>
    </main>
  );
}