import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AdminLayout from '../layouts/AdminLayout';
import ForcePasswordChange from '../features/auth/ForcePasswordChange';

// Vistas Principales (Routers de Segundo Nivel)
import DashboardView from '../features/dashboard/DashboardView';
import UserProfile from '../features/profile/UserProfile';
import UsersManagement from '../features/users/UsersManagement';
// Importaremos estas "Views" en el Paso 2
import ClientView from '../features/clients/ClientView';
import CatalogView from '../features/catalog/CatalogView';
import QuotesView from '../features/quotes/QuotesView';

export type TabType = 'dashboard' | 'clientes' | 'productos' | 'ofertas' | 'usuarios' | 'perfil';

export default function CommercialAdmin() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  // Estados Globales Críticos (Seguridad)
  const [checkingSecurity, setCheckingSecurity] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');

  // 1. Efecto de Seguridad: Esto SÍ pertenece al nivel superior
  useEffect(() => {
    const checkSecurityRequirements = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserEmail(user.email || '');
          const { data } = await supabase
            .from('profiles')
            .select('requires_password_change')
            .eq('id', user.id)
            .single();
            
          if (data?.requires_password_change) {
            setMustChangePassword(true);
          }
        }
      } catch (err) {
        console.error("Error verificando seguridad:", err);
      } finally {
        setCheckingSecurity(false);
      }
    };
    checkSecurityRequirements();
  }, []);

  // 2. Control de Carga y Seguridad Activa
  if (checkingSecurity) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
        <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Verificando credenciales...</span>
      </div>
    );
  }

  if (mustChangePassword) {
    return <ForcePasswordChange onSuccess={() => setMustChangePassword(false)} userEmail={currentUserEmail} />;
  }

  // 3. El Renderizado: Ultra Limpio y Delegado
  return (
    <AdminLayout activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as TabType)}>
      <div className="animate-in fade-in duration-300">
        
        {/* Las vistas deciden qué renderizar en su interior */}
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'perfil' && <UserProfile />}
        {activeTab === 'usuarios' && <UsersManagement />}
        
        {/* Vistas refactorizadas para autogestión */}
        {activeTab === 'clientes' && <ClientView onNavigateToQuotes={() => setActiveTab('ofertas')} />}
        {activeTab === 'productos' && <CatalogView />}
        {activeTab === 'ofertas' && <QuotesView />}

      </div>
    </AdminLayout>
  );
}