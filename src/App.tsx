import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'sonner';
import { useAuth } from './hooks/useAuth';

// --- LAYOUTS ---
import Sidebar from './components/layout/Sidebar'; // Asegúrate de tener este componente
import Header from './components/Header'; // Header público
import Footer from './components/Footer'; // Footer público

// --- PÁGINAS PÚBLICAS (Lazy Loading) ---
const HomePage = lazy(() => import('./pages/HomePage'));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const LoginPage = lazy(() => import('./pages/Login'));
const QuoteDocsViewer = lazy(() => import('./pages/QuoteDocsViewer')); // Para ver PDFs públicos

// --- PÁGINAS PRIVADAS (App Interna) ---
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Quotes = lazy(() => import('./pages/Quotes'));
const Products = lazy(() => import('./pages/Products')); // Tu catálogo interno (ProductsList)
const Clients = lazy(() => import('./pages/Clients'));

// --- COMPONENTES AUXILIARES ---

// 1. Pantalla de Carga Global
const FallbackLoader = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
    <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
    <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">Cargando Sistema...</span>
  </div>
);

// 2. Layout para la Web Pública (Landing, Catálogo Público, Login)
const PublicLayout = () => {
  const { session } = useAuth();
  // Pasamos session al Header para mostrar botón "Ir al Sistema" si ya está logueado
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <Header session={session} />
      <main className="flex-1 w-full">
        <Suspense fallback={<FallbackLoader />}>
          <div className="w-full">
             {/* Aquí se renderizan las rutas hijas */}
             <React.Outlet /> 
          </div>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

// 3. Layout para la App Privada (Dashboard, CRM)
const PrivateLayout = () => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FallbackLoader />;

  // Si no hay sesión, guardar intento de URL y mandar al login
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* Barra Lateral Fija */}
      <Sidebar />
      
      {/* Área de Contenido Principal */}
      <main className="flex-1 ml-64 overflow-y-auto p-8 custom-scrollbar">
        <Suspense fallback={<FallbackLoader />}>
          <div className="max-w-7xl mx-auto">
             <React.Outlet />
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
        {/* === ZONA PÚBLICA === */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/quote/docs" element={<QuoteDocsViewer />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* === ZONA PRIVADA (Requiere Auth) === */}
        {/* Nota: Usamos /app como prefijo para separar claramente el backend del frontend público */}
        <Route path="/app" element={<PrivateLayout />}>
          <Route index element={<Dashboard />} /> {/* /app -> Dashboard */}
          <Route path="quotes" element={<Quotes />} />
          <Route path="products" element={<Products />} />
          <Route path="clients" element={<Clients />} />
          
          {/* Rutas para crear/editar (opcional, si no usas modales) */}
          {/* <Route path="quotes/new" element={<QuoteBuilder />} /> */}
        </Route>

        {/* === REDIRECCIONES INTELIGENTES === */}
        {/* Si entran a /admin, mandar a /app */}
        <Route path="/admin" element={<Navigate to="/app" replace />} />
        
        {/* Cualquier ruta desconocida manda al Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}