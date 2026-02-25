import { 
  Cpu, 
  LayoutDashboard, 
  Zap, 
  Activity, 
  ArrowLeft, // Agregado para evitar error de referencia
  ArrowRight, 
  Database, 
  Layers,
  Settings
} from 'lucide-react';

interface SolutionsPageProps {
  onNavigate: (page: string) => void;
}

export default function SolutionsPage({ onNavigate }: SolutionsPageProps) {
  const solutions = [
    {
      id: 'plc-gateway',
      title: 'Integración y Recopilación de PLCs',
      description: 'Convertimos sus PLCs existentes (S7, Modbus, Ethernet/IP) en nodos inteligentes. Extraemos datos en tiempo real sin interrumpir sus procesos productivos.',
      icon: Cpu,
      image: 'https://ohjtnuezbuqnljhitdod.supabase.co/storage/v1/object/public/Imagenes%20y%20Archivos/SolutionsPage/muyjoujt7tfg1.png',
      features: ['Protocolos Industriales', 'Edge Computing', 'Seguridad de Datos', 'Configuraciones Flexibles']
    },
    {
      id: 'central-monitoring',
      title: 'Visualización Centralizada',
      description: 'Dashboards unificados para el monitoreo de múltiples plantas y equipos. Visualice el estado de sus activos críticos desde una única pantalla central con alertas inteligentes.',
      icon: LayoutDashboard,
      image: 'https://i.redd.it/eg3ib7kqayfg1.png',
      features: ['KPIs en tiempo real', 'Acceso Multiplataforma', 'Alertas Vía WhatsApp/Email', 'Multiple Usuarios']
    },
    {
      id: 'energy-efficiency',
      title: 'Eficiencia Energética',
      description: 'Monitoreo detallado de consumo eléctrico. Identifique mejoras y optimice el uso de recursos mediante análisis histórico.',
      icon: Zap,
      image: 'https://i.redd.it/83metc6d5zfg1.jpeg',
      features: ['Reportes de Huella de Carbono', 'Análisis de Costos', 'Sub-metering', 'Ahorro Energético']
    },
    {
      id: 'predictive-maint',
      title: 'Mantenimiento Predictivo',
      description: 'Centro de diagnóstico con expertos 24/7 que detectan fallas antes de que ocurran. Reduzca el tiempo de inactividad no planificado drásticamente.',
      icon: Activity,
      image: 'https://i.redd.it/2421zky39zfg1.png',
      features: ['Análisis de Tendencias', 'Análisis de Espectro (FFT)', 'Asesoria Integral', 'Asistencia en Terreno']
    }
  ];

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
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm md:text-base">Volver a Inicio</span>
              </button>
            </div>
    
            {/* Título: centrado, ocupa la columna central en md+ */}
            <div className="order-3 md:order-2 md:col-span-1 flex justify-center">
              <div>
                <h1 className="text-center text-4xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 leading-tight pb-2">
                  Soluciones de Éxito
                </h1>
                <p className="pt-2 text-center text-lg text-gray-400">
                  Soluciones avanzadas para la industria 4.0
                </p>
              </div>
            </div>        
          </div>
        </div>         
      </div>
     </section>
      

      {/* SOLUTIONS GRID */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-24">
            {solutions.map((solution, index) => (
              <div 
                key={solution.id}
                className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 items-center`}
              >
                {/* Imagen con efectos */}
                <div className="w-full lg:w-1/2 relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl blur opacity-80 group-hover:opacity-50 transition duration-1000"></div>
                  <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
                    <img 
                      src={solution.image} 
                      alt={solution.title} 
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                    />
                  </div>
                </div>

                {/* Contenido */}
                <div className="w-full lg:w-1/2 space-y-6">
                  <div className="inline-flex p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <solution.icon className="w-8 h-8 text-blue-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-white">{solution.title}</h2>
                  <p className="text-lg text-gray-400 leading-relaxed">
                    {solution.description}
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
                    {solution.features.map((feature, i) => (
                      <li key={i} className="flex items-center text-sm text-gray-300">
                        <Settings className="w-4 h-4 text-cyan-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                  onClick={() => onNavigate('clients')}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-2 rounded-lg text-base font-semibold hover:from-orange-600                      hover:to-orange-700 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/25">
                  <span>Contactar Ventas </span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TECH STACK SECTION */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-12 text-gray-400 uppercase tracking-widest">Nuestra Arquitectura</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-slate-950 rounded-2xl border border-slate-800">
              <Database className="w-10 h-10 text-cyan-500 mx-auto mb-4" />
              <h4 className="font-bold text-lg mb-2">Adquisición</h4>
              <p className="text-sm text-gray-500">Conectividad directa con sensores y PLCs industriales.</p>
            </div>
            <div className="p-8 bg-slate-950 rounded-2xl border border-slate-800">
              <Layers className="w-10 h-10 text-blue-500 mx-auto mb-4" />
              <h4 className="font-bold text-lg mb-2">Procesamiento</h4>
              <p className="text-sm text-gray-500">Filtrado de datos en el Edge para optimizar el ancho de banda.</p>
            </div>
            <div className="p-8 bg-slate-950 rounded-2xl border border-slate-800">
              <LayoutDashboard className="w-10 h-10 text-purple-500 mx-auto mb-4" />
              <h4 className="font-bold text-lg mb-2">Decisión</h4>
              <p className="text-sm text-gray-500">Visualización de alto impacto para la toma de decisiones gerenciales.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">¿Necesitas una solución personalizada?</h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Nuestro equipo de expertos puede ayudarte a diseñar la solución IIoT perfecta para tu industria
          </p>
          <button
            onClick={() => onNavigate('clients')}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-lg text-base font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/25"
          >
            Solicitar Consulta Técnica
          </button>
        </div>
      </div>
      </section>
    </main>
  );
}