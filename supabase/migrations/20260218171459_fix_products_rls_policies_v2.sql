/*
  # Fix Products Table RLS Policies
  
  ## Descripción
  Corrige las políticas de seguridad de la tabla products para permitir que solo
  super_admin y admin puedan crear, modificar y eliminar productos.
  
  ## 1. Cambios en Políticas RLS
    - SELECT: Acceso público (anon) y autenticados pueden ver productos
    - INSERT: Solo super_admin y admin pueden crear productos
    - UPDATE: Solo super_admin y admin pueden modificar productos
    - DELETE: Solo super_admin y admin pueden eliminar productos
  
  ## 2. Seguridad
    - Elimina políticas permisivas antiguas
    - Implementa políticas basadas en roles del sistema profiles
    - Usa validación directa contra la tabla profiles
  
  ## Notas Importantes
  - Los roles super_admin y admin están definidos en la tabla profiles
  - El acceso público de lectura se mantiene para el catálogo web
*/

-- ============================================================================
-- 1. ELIMINAR POLÍTICAS ANTIGUAS DE PRODUCTS
-- ============================================================================

DROP POLICY IF EXISTS "Acceso catálogo público" ON public.products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.products;
DROP POLICY IF EXISTS "Lectura pública dashboard" ON public.products;
DROP POLICY IF EXISTS "Gestión administrativa" ON public.products;
DROP POLICY IF EXISTS "Products are publicly readable" ON public.products;

-- ============================================================================
-- 2. CREAR POLÍTICAS RESTRICTIVAS BASADAS EN ROLES PARA PRODUCTS
-- ============================================================================

-- Política SELECT: Acceso público para el catálogo web
CREATE POLICY "products_public_select_policy"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Política INSERT: Solo super_admin y admin
CREATE POLICY "products_admin_insert_policy"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Política UPDATE: Solo super_admin y admin
CREATE POLICY "products_admin_update_policy"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Política DELETE: Solo super_admin y admin
CREATE POLICY "products_admin_delete_policy"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- ============================================================================
-- 3. VERIFICAR QUE RLS ESTÁ HABILITADO
-- ============================================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
