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
const QuoteDocsViewer = lazy(() => import('./pages/QuoteDocsViewer'));
const DocumentAccess = lazy(() => import('./pages/DocumentAccess')); // NUEVO COMPONENTE

// --- WRAPPERS INTERNOS ---
function CatalogWrapper() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  return <CatalogPage onNavigate={(p, e) => handleGlobalNavigate(navigate, p, e)} initialCategory={searchParams.get('category') || ''} />;
}

function ProductWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  if (!id) return <Navigate to="/catalog" replace />;
  return <ProductDetailPage productId={id} onNavigate={(p) => handleGlobalNavigate(navigate, p)} />;
}

function VerifyWrapper() {
  const { folio } = useParams<{ folio: string }>();
  return <VerifyQuote folio={folio} />; 
}

// Wrapper Inteligente para Login (Administrativo)
function LoginWrapper({ session }: { session: any }) {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/admin';

  useEffect(() => {
    if (session) {
      navigate(from, { replace: true });
    }
  }, [session, navigate, from]);

  if (session) return null; 
  return <Login onLoginSuccess={() => navigate(from, { replace: true })} />;
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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      
      // CAPTURA DE MAGIC LINKS: Cuando el usuario hace clic en el link de su correo
      if (event === 'SIGNED_IN') {
        const pendingUrl = localStorage.getItem('pending_document_url');
        if (pendingUrl) {
          // Si venía buscando un documento, lo enviamos allá directamente
          localStorage.removeItem('pending_document_url');
          navigate(pendingUrl, { replace: true });
        }
      }

      if (event === 'SIGNED_OUT') {
        const currentPath = window.location.pathname;
        if (
          currentPath.startsWith('/admin') || 
          currentPath.startsWith('/system') ||
          currentPath.startsWith('/quote') ||
          currentPath.startsWith('/verify')
        ) {
          navigate('/');
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  if (authLoading) return <FallbackLoader />;

  return (
    <>
      <Toaster position="top-right" theme="dark" richColors closeButton />
      <Suspense fallback={<FallbackLoader />}>
        <Routes>
          <Route element={<PublicLayoutWrapper session={session} />}>
            <Route path="/" element={<HomePage onNavigate={(p, e) => handleGlobalNavigate(navigate, p, e)} />} />
            <Route path="/catalog" element={<CatalogWrapper />} />
            <Route path="/product/:id" element={<ProductWrapper />} />
            <Route path="/nosotros" element={<NosotrosPage onNavigate={(p) => handleGlobalNavigate(navigate, p)} />} />
            <Route path="/solutions" element={<SolutionsPage onNavigate={(p) => handleGlobalNavigate(navigate, p)} />} />
            <Route path="/clients" element={<ClientsPage onNavigate={(p) => handleGlobalNavigate(navigate, p)} />} />
            
            {/* Rutas de Documentos Públicos Seguros */}
            <Route path="/quote/docs" element={<QuoteDocsViewer />} />
            <Route path="/verify/:folio" element={<VerifyWrapper />} />
            
            {/* Rutas de Autenticación Segregadas */}
            <Route path="/acceso-documento" element={<DocumentAccess />} />
            <Route path="/login" element={<LoginWrapper session={session} />} />
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