import { AuthProvider } from './hooks/useAuth'; // Debe apuntar al nuevo .tsx
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);