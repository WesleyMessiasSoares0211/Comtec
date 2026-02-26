import { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, useSearchParams, useParams, Outlet } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Loader } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { Toaster } from 'sonner';

// --- COMPONENTES COMPARTIDOS (UI) ---
import Header from './components/Header';
import Footer from './components/Footer';
import RoleSimulator from './components/RoleSimulator';

// --- PÁGINAS (Carga Diferida) ---
const HomePage = lazy(() => import('./pages/HomePage'));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const NosotrosPage = lazy(() => import('./pages/NosotrosPage'));
const SolutionsPage = lazy(() => import('./pages/SolutionsPage'));
const ClientsPage = lazy(() => import('./pages/ClientsPage'));
const Login = lazy(() => import('./pages/Login'));
const CommercialAdmin = lazy(() => import('./pages/CommercialAdmin'));
const SystemConfig = lazy(() => import('./pages/SystemConfig'));
const VerifyQuote = lazy(() => import('./pages/VerifyQuote'));
const QuoteDocsViewer = lazy(() => import('./pages/QuoteDocsViewer')); // Importación Lazy

// --- WRAPPERS INTERNOS ---

// Wrapper para pasar parámetros de búsqueda al catálogo
function CatalogWrapper() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  return <CatalogPage onNavigate={(p, e) => handleGlobalNavigate(navigate, p, e)} initialCategory={searchParams.get('category') || ''} />;
}

// Wrapper para Detalles de Producto
function ProductWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  if (!id) return <Navigate to="/catalog" replace />;
  return <ProductDetailPage productId={id} onNavigate={(p) => handleGlobalNavigate(navigate, p)} />;
}

// Wrapper para capturar el folio en la verificación
function VerifyWrapper() {
  const { folio } = useParams<{ folio: string }>();
  return <VerifyQuote folio={folio} />; 
}

// Layout Público (Con Header y Footer)
function PublicLayoutWrapper({ session }: any) {
  const location = useLocation();
  const navigate = useNavigate();

  const getActivePage = () => {
    const path = location.pathname;
    if (path.startsWith('/catalog')) return 'catalog';
    if (path.startsWith('/product')) return 'product';
    if (path.startsWith('/nosotros')) return 'nosotros';
    if (path.startsWith('/solutions')) return 'solutions';
    if (path.startsWith('/clients')) return 'clients';
    if (path.startsWith('/admin')) return 'admin';
    return 'home';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <Header 
        onNavigate={(p, e) => handleGlobalNavigate(navigate, p, e)} 
        currentPage={getActivePage()} 
        session={session} 
      />
      <main className="w-full flex-1">
        <Outlet />
      </main>
      <Footer onNavigate={(p, e) => handleGlobalNavigate(navigate, p, e)} />
    </div>
  );
}

// Función auxiliar de navegación global
const handleGlobalNavigate = (navigate: any, page: string, extraData?: string) => {
  if (page === 'home') navigate('/');
  else if (page === 'catalog') navigate(extraData ? `/catalog?category=${extraData}` : '/catalog');
  else if (page === 'product') navigate(`/product/${extraData}`);
  else if (page === 'login') navigate('/login');
  else navigate(`/${page}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const FallbackLoader = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
    <Loader className="w-10 h-10 text-cyan-500 animate-spin" />
    <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">Cargando Módulo...</span>
  </div>
);

export default function App() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();

  // Escuchar cambios de autenticación
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        // Redirigir al admin solo si estamos en login
        if (window.location.pathname === '/login') navigate('/admin');
      }
      if (event === 'SIGNED_OUT') navigate('/');
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  if (authLoading) return <FallbackLoader />;

  return (
    <>
      <Toaster position="top-right" theme="dark" richColors closeButton />
      <Suspense fallback={<FallbackLoader />}>
        <Routes>
          {/* RUTAS PÚBLICAS (Con Layout) */}
          <Route element={<PublicLayoutWrapper session={session} />}>
            <Route path="/" element={<HomePage onNavigate={(p, e) => handleGlobalNavigate(navigate, p, e)} />} />
            <Route path="/catalog" element={<CatalogWrapper />} />
            <Route path="/product/:id" element={<ProductWrapper />} />
            <Route path="/nosotros" element={<NosotrosPage onNavigate={(p) => handleGlobalNavigate(navigate, p)} />} />
            <Route path="/solutions" element={<SolutionsPage onNavigate={(p) => handleGlobalNavigate(navigate, p)} />} />
            <Route path="/clients" element={<ClientsPage onNavigate={(p) => handleGlobalNavigate(navigate, p)} />} />
            
            {/* Rutas de Negocio Públicas (QR y Docs) */}
            <Route path="/quote/docs" element={<QuoteDocsViewer />} />
            <Route path="/verify/:folio" element={<VerifyWrapper />} />
            
            {/* Login (Redirige si ya hay sesión) */}
            <Route path="/login" element={session ? <Navigate to="/admin" replace /> : <Login onLoginSuccess={() => navigate('/admin')} />} />
          </Route>

          {/* RUTAS PRIVADAS (Sin Layout Público, tienen su propio layout interno) */}
          <Route path="/admin/*" element={session ? <CommercialAdmin /> : <Navigate to="/login" replace />} />
          <Route path="/system" element={session ? <SystemConfig /> : <Navigate to="/" replace />} />

          {/* Fallback 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      
      {/* Herramienta de Debug (Solo si hay sesión) */}
      {session && <RoleSimulator />}
    </>
  );
}