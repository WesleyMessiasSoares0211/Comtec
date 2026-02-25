import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'sonner';
import { useAuth } from './hooks/useAuth';

// --- LAYOUTS ---
import Sidebar from './components/layout/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';

// --- PÁGINAS PÚBLICAS (Lazy Loading) ---
const HomePage = lazy(() => import('./pages/HomePage'));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const LoginPage = lazy(() => import('./pages/Login')); // Renombrado para claridad
const QuoteDocsViewer = lazy(() => import('./pages/QuoteDocsViewer'));

// --- PÁGINAS PRIVADAS (App Interna) ---
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Quotes = lazy(() => import('./pages/Quotes'));
const Products = lazy(() => import('./pages/Products'));
const Clients = lazy(() => import('./pages/Clients'));

// --- COMPONENTES AUXILIARES ---
const FallbackLoader = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
    <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
    <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">Cargando Sistema...</span>
  </div>
);

// Layout Público
const PublicLayout = () => {
  const { session } = useAuth();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <Header session={session} />
      <main className="flex-1 w-full">
        <Suspense fallback={<FallbackLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

// Layout Privado
const PrivateLayout = () => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FallbackLoader />;

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-y-auto p-8 custom-scrollbar">
        <Suspense fallback={<FallbackLoader />}>
          <div className="max-w-7xl mx-auto">
             <Outlet />
          </div>
        </Suspense>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <>
      <Toaster position="top-right" theme="dark" richColors closeButton />
      
      <Routes>
        {/* ZONA PÚBLICA */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/quote/docs" element={<QuoteDocsViewer />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* ZONA PRIVADA */}
        <Route path="/app" element={<PrivateLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="quotes" element={<Quotes />} />
          <Route path="products" element={<Products />} />
          <Route path="clients" element={<Clients />} />
        </Route>

        {/* REDIRECCIONES */}
        <Route path="/admin" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}