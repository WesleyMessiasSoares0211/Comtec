import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Asegúrate de que tus estilos globales estén aquí
import { AuthProvider } from './hooks/useAuth'; 
// IMPORTANTE: Si tu AuthProvider no está en ./hooks/useAuth, 
// ajusta esta ruta a donde tengas tu contexto (ej: ./context/AuthContext)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);