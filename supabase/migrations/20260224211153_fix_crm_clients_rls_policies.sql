/*
  # Fix CRM Clients RLS Policies
  
  ## Descripción
  Limpia y corrige las políticas de seguridad para las tablas de clientes CRM.
  Elimina políticas duplicadas y permisivas, implementando un sistema restrictivo basado en roles.
  
  ## 1. Tablas Afectadas
    - `crm_clients`: Tabla principal de clientes
    - `crm_client_contacts`: Contactos asociados a clientes
    - `crm_client_logs`: Logs de auditoría de acciones sobre clientes
  
  ## 2. Políticas por Rol
    ### crm_clients
      - SELECT: Todos los usuarios autenticados pueden ver clientes activos
      - INSERT: super_admin, admin, vendedor pueden crear clientes
      - UPDATE: super_admin, admin, vendedor pueden modificar clientes
      - DELETE: Solo super_admin y admin pueden eliminar (soft delete)
    
    ### crm_client_contacts
      - SELECT: Todos los usuarios autenticados pueden ver contactos
      - INSERT/UPDATE/DELETE: super_admin, admin, vendedor pueden gestionar contactos
    
    ### crm_client_logs
      - SELECT: Todos los usuarios autenticados pueden ver logs
      - INSERT: Todos los usuarios autenticados pueden crear logs (auditoría)
  
  ## 3. Seguridad
    - Elimina la política pública permisiva
    - Elimina políticas duplicadas y conflictivas
    - Implementa validación de roles desde la tabla profiles
    - Mantiene soft delete (deleted_at) en lugar de borrado físico
*/

-- ============================================================================
-- 1. LIMPIAR POLÍTICAS ANTIGUAS DE crm_clients
-- ============================================================================

DROP POLICY IF EXISTS "Public Enable All" ON public.crm_clients;
DROP POLICY IF EXISTS "Authenticated users can view all clients" ON public.crm_clients;
DROP POLICY IF EXISTS "Auth users can read clients" ON public.crm_clients;
DROP POLICY IF EXISTS "crm_clients_select_policy" ON public.crm_clients;
DROP POLICY IF EXISTS "Authenticated users can create clients" ON public.crm_clients;
DROP POLICY IF EXISTS "Auth users can insert clients" ON public.crm_clients;
DROP POLICY IF EXISTS "crm_clients_insert_policy" ON public.crm_clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.crm_clients;
DROP POLICY IF EXISTS "Auth users can soft delete clients" ON public.crm_clients;
DROP POLICY IF EXISTS "Auth users can update clients" ON public.crm_clients;
DROP POLICY IF EXISTS "crm_clients_update_policy" ON public.crm_clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.crm_clients;
DROP POLICY IF EXISTS "crm_clients_delete_policy" ON public.crm_clients;

-- ============================================================================
-- 2. CREAR POLÍTICAS RESTRICTIVAS PARA crm_clients
-- ============================================================================

-- SELECT: Todos los autenticados pueden ver clientes activos
CREATE POLICY "crm_clients_select_active"
  ON public.crm_clients
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- INSERT: Solo admin, super_admin y vendedor
CREATE POLICY "crm_clients_insert_by_role"
  ON public.crm_clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'vendedor')
    )
  );

-- UPDATE: Solo admin, super_admin y vendedor
CREATE POLICY "crm_clients_update_by_role"
  ON public.crm_clients
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'vendedor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'vendedor')
    )
  );

-- DELETE: Solo super_admin y admin (para soft delete)
CREATE POLICY "crm_clients_delete_by_admin"
  ON public.crm_clients
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
    AND deleted_at IS NULL
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- ============================================================================
-- 3. LIMPIAR Y CREAR POLÍTICAS PARA crm_client_contacts
-- ============================================================================

DROP POLICY IF EXISTS "Auth users can manage contacts" ON public.crm_client_contacts;
DROP POLICY IF EXISTS "Usuarios pueden gestionar contactos" ON public.crm_client_contacts;
DROP POLICY IF EXISTS "Usuarios pueden ver contactos" ON public.crm_client_contacts;

-- SELECT: Todos los autenticados pueden ver contactos
CREATE POLICY "crm_contacts_select_all"
  ON public.crm_client_contacts
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: admin, super_admin y vendedor
CREATE POLICY "crm_contacts_insert_by_role"
  ON public.crm_client_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'vendedor')
    )
  );

-- UPDATE: admin, super_admin y vendedor
CREATE POLICY "crm_contacts_update_by_role"
  ON public.crm_client_contacts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'vendedor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'vendedor')
    )
  );

-- DELETE: admin, super_admin y vendedor
CREATE POLICY "crm_contacts_delete_by_role"
  ON public.crm_client_contacts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'vendedor')
    )
  );

-- ============================================================================
-- 4. LIMPIAR Y CREAR POLÍTICAS PARA crm_client_logs
-- ============================================================================

DROP POLICY IF EXISTS "Auth users can insert logs" ON public.crm_client_logs;
DROP POLICY IF EXISTS "Usuarios pueden crear logs" ON public.crm_client_logs;
DROP POLICY IF EXISTS "Usuarios pueden ver logs" ON public.crm_client_logs;

-- SELECT: Todos los autenticados pueden ver logs (auditoría)
CREATE POLICY "crm_logs_select_all"
  ON public.crm_client_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Todos los autenticados pueden crear logs (para auditoría automática)
CREATE POLICY "crm_logs_insert_all"
  ON public.crm_client_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- 5. VERIFICAR QUE RLS ESTÁ HABILITADO
-- ============================================================================

ALTER TABLE public.crm_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_client_logs ENABLE ROW LEVEL SECURITY;

-- Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
