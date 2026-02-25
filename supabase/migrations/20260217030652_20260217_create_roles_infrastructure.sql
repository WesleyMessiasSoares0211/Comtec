/*
  # Sistema de Roles Jerárquico para Comtec Industrial CRM

  ## Descripción
  Implementa un sistema de roles con 4 niveles de acceso:
  - super_admin: Acceso total (incluido Supabase Dashboard)
  - admin: Acceso completo al CRM (clientes, ventas, reportes, eliminar)
  - vendedor: Crear/editar clientes (sin eliminar)
  - tecnico: Solo lectura

  ## 1. Nueva Tabla
  ### `profiles`
    - `id` (uuid, FK a auth.users): Identificador único del usuario
    - `email` (text): Email del usuario (copiado de auth)
    - `role` (text): Rol asignado (super_admin, admin, vendedor, tecnico)
    - `created_at` (timestamptz): Fecha de creación del perfil

  ## 2. Trigger Automático
  ### `handle_new_user()`
    - Se ejecuta automáticamente al crear un usuario
    - Asigna rol 'super_admin' si el email es del desarrollador
    - Asigna rol 'vendedor' por defecto para todos los demás

  ## 3. Políticas RLS - crm_clients
    - SELECT: Todos los usuarios autenticados
    - INSERT: Solo admin, super_admin y vendedor
    - UPDATE: Solo admin, super_admin y vendedor
    - DELETE: Solo admin y super_admin

  ## 4. Políticas RLS - profiles
    - SELECT: Usuarios pueden ver su propio perfil
    - UPDATE: Solo super_admin puede cambiar roles

  ## Notas Importantes
  - Los roles son case-sensitive
  - El email del desarrollador debe configurarse en la función
  - RLS está habilitado en todas las tablas
*/

-- ============================================================================
-- 1. CREAR TABLA PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'vendedor' CHECK (role IN ('super_admin', 'admin', 'vendedor', 'tecnico')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. FUNCIÓN Y TRIGGER PARA AUTO-ASIGNACIÓN DE ROLES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  assigned_role TEXT;
BEGIN
  -- Obtener el email del usuario desde auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.id;

  -- Asignar rol según el email
  -- Emails autorizados como Super Admin
  IF user_email IN ('wms86@hotmail.com', 'mamutefh@gmail.com') THEN
    assigned_role := 'super_admin';
  ELSE
    assigned_role := 'vendedor';
  END IF;

  -- Insertar el perfil con el rol asignado
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, user_email, assigned_role);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger que se ejecuta al crear un usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 3. POLÍTICAS RLS PARA crm_clients (Basadas en Roles)
-- ============================================================================

-- Eliminar políticas anteriores si existen
DROP POLICY IF EXISTS "crm_clients_select_policy" ON public.crm_clients;
DROP POLICY IF EXISTS "crm_clients_insert_policy" ON public.crm_clients;
DROP POLICY IF EXISTS "crm_clients_update_policy" ON public.crm_clients;
DROP POLICY IF EXISTS "crm_clients_delete_policy" ON public.crm_clients;

-- Política SELECT: Todos los usuarios autenticados pueden ver clientes
CREATE POLICY "crm_clients_select_policy"
  ON public.crm_clients
  FOR SELECT
  TO authenticated
  USING (true);

-- Política INSERT: Solo admin, super_admin y vendedor pueden crear
CREATE POLICY "crm_clients_insert_policy"
  ON public.crm_clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'vendedor')
    )
  );

-- Política UPDATE: Solo admin, super_admin y vendedor pueden editar
CREATE POLICY "crm_clients_update_policy"
  ON public.crm_clients
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'vendedor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'vendedor')
    )
  );

-- Política DELETE: Solo admin y super_admin pueden eliminar
CREATE POLICY "crm_clients_delete_policy"
  ON public.crm_clients
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- 4. POLÍTICAS RLS PARA profiles
-- ============================================================================

-- Política SELECT: Los usuarios pueden ver su propio perfil
CREATE POLICY "profiles_select_own_policy"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Política UPDATE: Solo super_admin puede cambiar roles
CREATE POLICY "profiles_update_policy"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- ============================================================================
-- 5. MIGRAR USUARIOS EXISTENTES (Si los hay)
-- ============================================================================

-- Crear perfiles para usuarios existentes en auth.users que no tengan perfil
INSERT INTO public.profiles (id, email, role)
SELECT
  au.id,
  au.email,
  CASE
    WHEN au.email IN ('wms86@hotmail.com', 'mamutefh@gmail.com') THEN 'super_admin'
    ELSE 'vendedor'
  END as role
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- ============================================================================
-- 6. COMENTARIOS EN LAS TABLAS
-- ============================================================================

COMMENT ON TABLE public.profiles IS 'Perfiles de usuario con roles jerárquicos';
COMMENT ON COLUMN public.profiles.role IS 'Rol del usuario: super_admin, admin, vendedor, tecnico';

-- Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
