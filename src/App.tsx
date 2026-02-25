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

// --- WRAPPERS ---
function CatalogWrapper({ onNavigate }: { onNavigate: (page: string, extra?: string) => void }) {
  const [searchParams] = useSearchParams();
  return <CatalogPage onNavigate={onNavigate} initialCategory={searchParams.get('category') || ''} />;
}

function ProductWrapper({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/catalog" replace />;
  return <ProductDetailPage productId={id} onNavigate={onNavigate} />;
}

// Wrapper para capturar el folio en la verificación
function VerifyWrapper() {
  const { folio } = useParams<{ folio: string }>();
  // Podrías pasar el folio como prop si VerifyQuote lo espera, o que VerifyQuote use useParams
  return <VerifyQuote folio={folio} />; 
}

function PublicLayoutWrapper({ onNavigate, currentPage, session }: any) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <Header onNavigate={onNavigate} currentPage={currentPage} session={session} />
      <main className="w-full flex-1">
        <Outlet />
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}

const FallbackLoader = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
    <Loader className="w-10 h-10 text-cyan-500 animate-spin" />
    <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">Cargando Módulo...</span>
  </div>
);

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading: authLoading } = useAuth();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' && location.pathname === '/login') navigate('/admin');
      if (event === 'SIGNED_OUT') navigate('/');
    });
    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  const handleNavigate = (page: string, extraData?: string) => {
    if (page === 'home') navigate('/');
    else if (page === 'catalog') navigate(extraData ? `/catalog?category=${extraData}` : '/catalog');
    else if (page === 'product') navigate(`/product/${extraData}`);
    else if (page === 'login') navigate('/login');
    else navigate(`/${page}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  if (authLoading) return <FallbackLoader />;

  return (
    <>
      <Toaster position="top-right" theme="dark" richColors closeButton />
      <Suspense fallback={<FallbackLoader />}>
        <Routes>
          <Route element={<PublicLayoutWrapper onNavigate={handleNavigate} currentPage={getActivePage()} session={session} />}>
            <Route path="/" element={<HomePage onNavigate={handleNavigate} />} />
            <Route path="/catalog" element={<CatalogWrapper onNavigate={handleNavigate} />} />
            <Route path="/product/:id" element={<ProductWrapper onNavigate={handleNavigate} />} />
            <Route path="/nosotros" element={<NosotrosPage onNavigate={handleNavigate} />} />
            <Route path="/solutions" element={<SolutionsPage onNavigate={handleNavigate} />} />
            <Route path="/clients" element={<ClientsPage onNavigate={handleNavigate} />} />
            
            {/* CORRECCIÓN AQUÍ: Ruta dinámica para el QR */}
            <Route path="/verify/:folio" element={<VerifyWrapper />} />
            {/* Mantener ruta antigua por compatibilidad si es necesario, o redirigir */}
            <Route path="/verify-quote" element={<Navigate to="/" replace />} />
            
            <Route path="/login" element={session ? <Navigate to="/admin" replace /> : <Login onLoginSuccess={() => navigate('/admin')} />} />
          </Route>

          <Route path="/admin/*" element={session ? <CommercialAdmin /> : <Navigate to="/login" replace />} />
          <Route path="/system" element={session ? <SystemConfig /> : <Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      {session && <RoleSimulator />}
    </>
  );
}