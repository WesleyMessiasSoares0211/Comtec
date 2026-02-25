import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Layouts
import Layout from './components/layout/Layout';

// Pages
import Dashboard from './pages/Dashboard'; // <--- IMPORTAR DASHBOARD
import Quotes from './pages/Quotes';
import Products from './pages/Products';
import Clients from './pages/Clients';
import Login from './pages/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" theme="dark" />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Rutas Protegidas */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          
          {/* CAMBIO: Dashboard es ahora la página principal (index) */}
          <Route index element={<Dashboard />} />
          
          <Route path="quotes" element={<Quotes />} />
          <Route path="products" element={<Products />} />
          <Route path="clients" element={<Clients />} />
        </Route>

        {/* Captura cualquier ruta desconocida y manda al inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;