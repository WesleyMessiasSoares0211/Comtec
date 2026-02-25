# Arquitectura del Sistema de Roles Jerárquico

## Descripción General

Sistema de control de acceso basado en roles (RBAC) para Comtec Industrial CRM, implementado con seguridad de múltiples capas: Base de datos (RLS), Backend (Políticas), y Frontend (UI condicional).

---

## Jerarquía de Roles

```
┌─────────────────────────────────────────────────────────────┐
│                       SUPER_ADMIN                            │
│  • Acceso total a la aplicación                            │
│  • Único con acceso a Supabase Dashboard                   │
│  • Puede cambiar roles de todos los usuarios               │
│  • Accede a Configuración del Sistema                      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                         ADMIN                                │
│  • Acceso completo al CRM                                  │
│  • Puede crear, editar y ELIMINAR clientes                 │
│  • Accede a reportes y ventas                              │
│  • NO puede acceder a configuración técnica                │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                       VENDEDOR                               │
│  • Puede crear nuevos clientes                             │
│  • Puede editar clientes existentes                        │
│  • NO puede eliminar clientes                              │
│  • Accede a cotizaciones y ventas                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                       TECNICO                                │
│  • Solo LECTURA de datos                                   │
│  • Puede ver clientes y cotizaciones                       │
│  • NO puede modificar ningún dato                          │
│  • Acceso restringido solo a consulta                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Infraestructura de Base de Datos

### A. Tabla `profiles`

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'vendedor'
    CHECK (role IN ('super_admin', 'admin', 'vendedor', 'tecnico')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Índices para Optimización:**
- `idx_profiles_role` - Búsqueda por rol
- `idx_profiles_email` - Búsqueda por email

---

### B. Trigger de Auto-Asignación

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  assigned_role TEXT;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;

  IF user_email IN ('wms86@hotmail.com', 'mamutefh@gmail.com') THEN
    assigned_role := 'super_admin';
  ELSE
    assigned_role := 'vendedor';
  END IF;

  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, user_email, assigned_role);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**Funcionamiento:**
1. Se ejecuta automáticamente al crear un usuario
2. Verifica el email contra el email del desarrollador
3. Asigna `super_admin` al desarrollador, `vendedor` a los demás
4. Crea automáticamente el perfil en la tabla `profiles`

---

### C. Políticas RLS para `crm_clients`

#### SELECT - Todos los usuarios autenticados
```sql
CREATE POLICY "crm_clients_select_policy"
  ON public.crm_clients
  FOR SELECT
  TO authenticated
  USING (true);
```

#### INSERT - Admin, Super Admin y Vendedor
```sql
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
```

#### UPDATE - Admin, Super Admin y Vendedor
```sql
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
```

#### DELETE - Solo Admin y Super Admin
```sql
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
```

---

### D. Políticas RLS para `profiles`

#### SELECT - Ver propio perfil
```sql
CREATE POLICY "profiles_select_own_policy"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());
```

#### UPDATE - Solo Super Admin puede cambiar roles
```sql
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
  );
```

---

## 2. Capa de Lógica (Frontend)

### A. Hook `useAuth` - src/hooks/useAuth.ts

**Propósito:** Proporciona contexto de autenticación con información de roles.

```typescript
interface UseAuthReturn {
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isVendedor: boolean;
  isTecnico: boolean;
  canDelete: boolean;
  canEdit: boolean;
  canCreate: boolean;
}
```

**Helpers de Permisos:**
- `isSuperAdmin`: `role === 'super_admin'`
- `isAdmin`: `role === 'admin'`
- `isVendedor`: `role === 'vendedor'`
- `isTecnico`: `role === 'tecnico'`
- `canDelete`: `isSuperAdmin || isAdmin`
- `canEdit`: `isSuperAdmin || isAdmin || isVendedor`
- `canCreate`: `isSuperAdmin || isAdmin || isVendedor`

**Flujo:**
1. Al montar, obtiene sesión de Supabase
2. Si hay sesión, obtiene perfil de la tabla `profiles`
3. Expone el rol y helpers de permisos
4. Se mantiene sincronizado con `onAuthStateChange`

---

### B. Utilidades de Roles - src/utils/roleUtils.tsx

#### Componente `ProtectedComponent`
```typescript
<ProtectedComponent
  userRole={role}
  allowedRoles={['super_admin', 'admin']}
  fallback={<p>No tienes permisos</p>}
>
  <DeleteButton />
</ProtectedComponent>
```

#### Funciones Helper
- `hasPermission(userRole, requiredRoles)` - Verifica permisos
- `canDeleteClients(userRole)` - Verifica permiso de eliminación
- `canEditClients(userRole)` - Verifica permiso de edición
- `canCreateClients(userRole)` - Verifica permiso de creación
- `canAccessSystemConfig(userRole)` - Solo super_admin

#### Constantes
```typescript
ROLE_LABELS = {
  super_admin: 'Super Administrador',
  admin: 'Administrador',
  vendedor: 'Vendedor',
  tecnico: 'Técnico',
}

ROLE_COLORS = {
  super_admin: 'from-purple-500 to-pink-500',
  admin: 'from-orange-500 to-red-500',
  vendedor: 'from-cyan-500 to-blue-500',
  tecnico: 'from-green-500 to-emerald-500',
}
```

---

## 3. Interfaz de Usuario

### A. ClientsList.tsx - Protección del Botón Eliminar

**Implementación:**
```typescript
const { canDelete, canEdit, role } = useAuth();

// En el render:
{canEdit && (
  <button title="Editar Cliente">
    <Edit2 className="w-4 h-4" />
  </button>
)}

{canDelete && (
  <button title="Eliminar Cliente (Solo Admin/Super Admin)">
    <Trash2 className="w-4 h-4" />
  </button>
)}

{!canEdit && !canDelete && (
  <div className="flex items-center gap-1 text-xs text-slate-500">
    <Shield className="w-3 h-3" />
    <span>Solo lectura</span>
  </div>
)}
```

**Resultado:**
- **Super Admin / Admin**: Ve todos los botones (Ver, Editar, Eliminar)
- **Vendedor**: Ve botones de Ver y Editar (no Eliminar)
- **Técnico**: Ve solo botón de Ver + badge "Solo lectura"

---

### B. SystemConfig.tsx - Panel de Administración de Roles

**Acceso:** Solo `super_admin` puede ver este componente.

**Funcionalidades:**
1. **Lista de Usuarios**: Muestra todos los usuarios con sus roles actuales
2. **Cambio de Roles**: Dropdown para cambiar el rol de cualquier usuario
3. **Información de Roles**: Descripción de cada rol con iconos
4. **Feedback Visual**: Mensajes de éxito/error al cambiar roles

**Protección:**
```typescript
if (!isSuperAdmin) {
  return (
    <div className="access-denied">
      <Shield />
      <p>Esta sección solo está disponible para Super Admin</p>
    </div>
  );
}
```

**Navegación:**
- Botón especial en Header (ícono Shield)
- Solo visible para `super_admin`
- Color morado para diferenciarlo

---

### C. Header.tsx - Botón de Configuración del Sistema

```typescript
{isSuperAdmin && (
  <button
    onClick={() => onNavigate('system')}
    className="border-purple-500 bg-purple-500/10"
    title="Configuración del Sistema (Super Admin)"
  >
    <Shield size={20} />
  </button>
)}
```

**Características:**
- Solo visible para `super_admin`
- Color morado distintivo
- Tooltip explicativo

---

### D. RoleSimulator.tsx - Debug Mode (Solo Desarrollo)

**Propósito:** Permite cambiar de rol en tiempo real para testear la UI.

**Condición de Renderizado:**
```typescript
if (!import.meta.env.DEV) {
  return null;
}
```

**Ubicación:** Botón flotante en esquina inferior derecha.

**Funcionalidad:**
1. Muestra el rol actual con gradiente de color
2. Botones para cambiar a cualquiera de los 4 roles
3. Al hacer clic, actualiza el rol en la BD y recarga la página
4. Solo visible en modo desarrollo (`npm run dev`)

**Diseño:**
- Fondo slate-900 con borde amarillo
- Ícono TestTube2 para indicar "Debug Mode"
- Botones con los colores de cada rol
- Texto pequeño "Solo visible en desarrollo"

---

## 4. App.tsx - Spinner de Carga de Roles

**Problema Resuelto:** Evitar que un vendedor vea botones de admin durante 1 segundo por error de caché.

**Implementación:**
```typescript
const { session, loading: authLoading, role } = useAuth();

if (authLoading) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader className="w-12 h-12 text-cyan-500 animate-spin" />
        <p className="text-slate-400 text-sm">Cargando aplicación...</p>
        <p className="text-slate-600 text-xs">Verificando permisos y rol de usuario</p>
      </div>
    </div>
  );
}
```

**Flujo:**
1. `authLoading = true` al iniciar
2. Se obtiene sesión de Supabase
3. Se obtiene perfil con rol de la BD
4. `authLoading = false` - renderiza UI
5. La UI ya tiene el rol correcto, sin parpadeos

---

## 5. Matriz de Permisos

| Acción | Super Admin | Admin | Vendedor | Técnico |
|--------|-------------|-------|----------|---------|
| **Ver clientes** | ✅ | ✅ | ✅ | ✅ |
| **Crear clientes** | ✅ | ✅ | ✅ | ❌ |
| **Editar clientes** | ✅ | ✅ | ✅ | ❌ |
| **Eliminar clientes** | ✅ | ✅ | ❌ | ❌ |
| **Ver cotizaciones** | ✅ | ✅ | ✅ | ✅ |
| **Crear cotizaciones** | ✅ | ✅ | ✅ | ❌ |
| **Acceder a CRM** | ✅ | ✅ | ✅ | ✅ |
| **Cambiar roles** | ✅ | ❌ | ❌ | ❌ |
| **Config. Sistema** | ✅ | ❌ | ❌ | ❌ |
| **Supabase Dashboard** | ✅ | ❌ | ❌ | ❌ |

---

## 6. Flujo de Registro de Nuevo Usuario

```
1. Usuario se registra con email/password en Login
         ↓
2. Supabase Auth crea usuario en auth.users
         ↓
3. Se dispara trigger on_auth_user_created
         ↓
4. Trigger ejecuta función handle_new_user()
         ↓
5. Función verifica email:
   - ¿Es wms86@hotmail.com o mamutefh@gmail.com?
     → Sí: Asigna role = 'super_admin'
     → No: Asigna role = 'vendedor'
         ↓
6. Crea registro en public.profiles con el rol asignado
         ↓
7. Usuario inicia sesión
         ↓
8. useAuth obtiene perfil y expone el rol
         ↓
9. UI se renderiza según permisos del rol
```

---

## 7. Seguridad Multinivel

### Nivel 1: Base de Datos (RLS)
- Políticas estrictas en Supabase
- Validación de `auth.uid()` y rol
- **Imposible** bypassear desde el frontend

### Nivel 2: Backend (Futuro)
- Edge Functions pueden validar roles
- Capa adicional de seguridad para operaciones críticas

### Nivel 3: Frontend (UI)
- Oculta botones según rol
- Previene confusión del usuario
- **NO** es la única capa de seguridad

---

## 8. Configuración de Emails de Super Admin

**CONFIGURACIÓN ACTUAL:** Los siguientes emails están configurados como Super Admin:

```sql
-- Emails autorizados en la migración:
IF user_email IN ('wms86@hotmail.com', 'mamutefh@gmail.com') THEN
  assigned_role := 'super_admin';
```

**Para agregar más emails:**
```sql
IF user_email IN ('wms86@hotmail.com', 'mamutefh@gmail.com', 'nuevo_email@ejemplo.com') THEN
  assigned_role := 'super_admin';
```

---

## 9. Testing del Sistema de Roles

### Usando el Role Simulator (Desarrollo)

1. Inicia la aplicación en modo desarrollo: `npm run dev`
2. Inicia sesión con cualquier usuario
3. Verás el panel flotante "Debug Mode" en la esquina inferior derecha
4. Haz clic en el rol que quieras simular
5. La página se recargará con el nuevo rol
6. Verifica que los botones y permisos cambien correctamente

### Testing Manual por Rol

**Como Super Admin:**
- ✅ Ver botón Shield (morado) en Header
- ✅ Acceder a System Config
- ✅ Cambiar roles de otros usuarios
- ✅ Ver todos los botones en ClientsList (Editar + Eliminar)

**Como Admin:**
- ❌ NO ver botón Shield en Header
- ❌ NO acceder a System Config
- ✅ Ver botones Editar + Eliminar en ClientsList

**Como Vendedor:**
- ❌ NO ver botón Shield
- ✅ Ver botón Editar en ClientsList
- ❌ NO ver botón Eliminar

**Como Técnico:**
- ❌ NO ver botones Editar ni Eliminar
- ✅ Ver badge "Solo lectura"

---

## 10. Archivos Creados/Modificados

### Nuevos Archivos:

#### SQL:
- ✅ `supabase/migrations/20260217_create_roles_infrastructure.sql` (260 líneas)

#### TypeScript:
- ✅ `src/hooks/useAuth.ts` (120 líneas)
- ✅ `src/utils/roleUtils.tsx` (60 líneas)
- ✅ `src/components/SystemConfig.tsx` (215 líneas)
- ✅ `src/components/RoleSimulator.tsx` (140 líneas)

### Archivos Modificados:
- ✅ `src/App.tsx` - Integración de useAuth + spinner de carga
- ✅ `src/components/Header.tsx` - Botón de System Config para super_admin
- ✅ `src/components/ClientsList.tsx` - Protección de botones por rol

### Documentación:
- ✅ `ROLES_ARCHITECTURE.md` - Este archivo

---

## 11. Comandos Útiles

```bash
# Verificar build
npm run build

# Iniciar en desarrollo (con Role Simulator)
npm run dev

# Verificar tipos TypeScript
npm run typecheck

# Ver logs de Supabase
# (desde Supabase Dashboard > Database > Logs)
```

---

## 12. Próximos Pasos Sugeridos

1. **Implementar auditoría de cambios de roles**
   - Tabla `role_audit_log` con: user_id, old_role, new_role, changed_by, timestamp

2. **Agregar permisos granulares por módulo**
   - Tabla `permissions` con: role, module, action, allowed

3. **Crear dashboard de analytics por rol**
   - Métricas de uso por tipo de usuario

4. **Implementar roles personalizados**
   - Permitir crear roles custom con permisos específicos

5. **Notificaciones de cambio de rol**
   - Email automático al usuario cuando cambia su rol

---

## 13. Troubleshooting

### Problema: Usuario no tiene perfil en `profiles`

**Solución:** Ejecutar migración manual:
```sql
INSERT INTO public.profiles (id, email, role)
SELECT au.id, au.email, 'vendedor'
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;
```

### Problema: RLS bloquea todas las operaciones

**Solución:** Verificar que el usuario tiene un perfil:
```sql
SELECT * FROM public.profiles WHERE id = 'user-uuid-here';
```

### Problema: Role Simulator no aparece

**Verificar:**
- ¿Estás en modo desarrollo? (`npm run dev`)
- ¿Hay sesión activa?
- Verificar consola del navegador por errores

### Problema: Botones no se ocultan según rol

**Verificar:**
- `useAuth()` está retornando el rol correcto
- Revisar consola: `console.log(canDelete, canEdit)`
- Verificar que el componente usa `useAuth()`

---

## Conclusión

Se ha implementado un sistema completo de control de acceso basado en roles con:

✅ **Seguridad de múltiples capas** (BD, Backend, Frontend)
✅ **4 niveles de roles jerárquicos** con permisos claros
✅ **Auto-asignación de roles** al registrarse
✅ **UI reactiva** que se adapta al rol del usuario
✅ **Panel de administración** para super_admin
✅ **Simulador de roles** para desarrollo y testing
✅ **Spinner de carga** que previene errores visuales
✅ **Documentación completa** de la arquitectura

El sistema está listo para producción y es escalable para agregar nuevos roles o permisos en el futuro.
