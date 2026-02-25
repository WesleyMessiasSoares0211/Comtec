import { ReactNode } from 'react';
import { UserRole } from '../hooks/useAuth';

interface ProtectedComponentProps {
  children: ReactNode;
  userRole: UserRole;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
}

export function ProtectedComponent({
  children,
  userRole,
  allowedRoles,
  fallback = null,
}: ProtectedComponentProps) {
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function hasPermission(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

export function canDeleteClients(userRole: UserRole): boolean {
  return hasPermission(userRole, ['super_admin', 'admin']);
}

export function canEditClients(userRole: UserRole): boolean {
  return hasPermission(userRole, ['super_admin', 'admin', 'vendedor']);
}

export function canCreateClients(userRole: UserRole): boolean {
  return hasPermission(userRole, ['super_admin', 'admin', 'vendedor']);
}

export function canAccessSystemConfig(userRole: UserRole): boolean {
  return hasPermission(userRole, ['super_admin']);
}

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Administrador',
  admin: 'Administrador',
  vendedor: 'Vendedor',
  tecnico: 'Técnico',
};

export const ROLE_COLORS: Record<string, string> = {
  super_admin: 'from-purple-500 to-pink-500',
  admin: 'from-orange-500 to-red-500',
  vendedor: 'from-cyan-500 to-blue-500',
  tecnico: 'from-green-500 to-emerald-500',
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  super_admin: 'Acceso total (incluido configuración técnica)',
  admin: 'Acceso completo al CRM (gestión de clientes y ventas)',
  vendedor: 'Crear y editar clientes (sin eliminar)',
  tecnico: 'Solo lectura de datos',
};
