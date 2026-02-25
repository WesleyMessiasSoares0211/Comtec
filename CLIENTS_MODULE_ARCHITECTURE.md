# Arquitectura del Módulo de Clientes CRM

## Estructura Implementada

Se implementó una arquitectura limpia de 4 capas para el módulo de Clientes, siguiendo principios SOLID y separación de responsabilidades.

```
┌─────────────────────────────────────────────────────────┐
│                   CAPA DE PRESENTACIÓN                   │
│         ClientsForm.tsx + ClientsList.tsx                │
│  (UI Components - Solo renderizado y eventos de usuario)│
└────────────────┬────────────────────────────────────────┘
                 │ usa
                 ↓
┌─────────────────────────────────────────────────────────┐
│                   CAPA DE LÓGICA                         │
│                  useClients.ts                           │
│        (Custom Hook - Estado y lógica de negocio)       │
└────────────────┬────────────────────────────────────────┘
                 │ usa
                 ↓
┌─────────────────────────────────────────────────────────┐
│                 CAPA DE SERVICIOS                        │
│                 clientService.ts                         │
│        (Abstracción de llamadas a Supabase)             │
└────────────────┬────────────────────────────────────────┘
                 │ consulta
                 ↓
┌─────────────────────────────────────────────────────────┐
│                   CAPA DE DATOS                          │
│              Supabase - Tabla crm_clients                │
│  (Base de datos con RLS - Solo usuarios autenticados)   │
└─────────────────────────────────────────────────────────┘
```

---

## 1. CAPA DE DATOS (SQL)

### Tabla: `crm_clients`

**Ubicación**: Supabase (PostgreSQL)

**Estructura**:
```sql
CREATE TABLE public.crm_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rut TEXT UNIQUE NOT NULL,
  razon_social TEXT NOT NULL,
  giro TEXT NOT NULL,
  direccion TEXT,
  comuna TEXT,
  ciudad TEXT,
  email_contacto TEXT,
  telefono TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**RLS (Row Level Security)**:
- ✅ Solo usuarios **authenticated** pueden SELECT
- ✅ Solo usuarios **authenticated** pueden INSERT
- ✅ Solo usuarios **authenticated** pueden UPDATE
- ✅ Solo usuarios **authenticated** pueden DELETE

**Índices**:
- `idx_crm_clients_rut` - Búsqueda rápida por RUT
- `idx_crm_clients_razon_social` - Ordenamiento alfabético

---

## 2. CAPA DE SERVICIOS

### Archivo: `src/services/clientService.ts`

**Propósito**: Abstrae todas las interacciones con Supabase, exponiendo una API limpia.

**Interfaces**:
```typescript
interface Client {
  id: string;
  rut: string;
  razon_social: string;
  giro: string;
  direccion?: string | null;
  comuna?: string | null;
  ciudad?: string | null;
  email_contacto?: string | null;
  telefono?: string | null;
  created_at?: string;
}

interface CreateClientData {
  rut: string;
  razon_social: string;
  giro: string;
  direccion?: string;
  comuna?: string;
  ciudad?: string;
  email_contacto?: string;
  telefono?: string;
}
```

**Métodos Exportados**:

| Método | Parámetros | Retorno | Descripción |
|--------|-----------|---------|-------------|
| `getAll()` | - | `{ data, error }` | Obtiene todos los clientes ordenados por razón social |
| `create(clientData)` | `CreateClientData` | `{ data, error }` | Crea un nuevo cliente (maneja duplicados) |
| `getById(id)` | `string` | `{ data, error }` | Obtiene un cliente por ID |
| `update(id, clientData)` | `string, Partial<CreateClientData>` | `{ data, error }` | Actualiza un cliente existente |
| `delete(id)` | `string` | `{ error }` | Elimina un cliente |

**Características Clave**:
- ✅ Manejo de errores centralizado
- ✅ Validación de duplicados (RUT único)
- ✅ Normalización de datos (trim, lowercase en emails)
- ✅ Conversión de strings vacíos a `null`

---

## 3. CAPA DE LÓGICA

### Archivo: `src/hooks/useClients.ts`

**Propósito**: Custom Hook que gestiona el estado de clientes y proporciona métodos reactivos.

**Interfaz de Retorno**:
```typescript
interface UseClientsReturn {
  clients: Client[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
```

**Flujo de Trabajo**:
1. Se ejecuta automáticamente al montar el componente (`useEffect`)
2. Establece `loading = true`
3. Llama a `clientService.getAll()`
4. Actualiza el estado con los datos o error
5. Establece `loading = false`

**Uso en Componentes**:
```typescript
const { clients, loading, error, refetch } = useClients();
```

---

## 4. CAPA DE PRESENTACIÓN

### A. `ClientsForm.tsx` - Formulario de Registro

**Características**:
- ✅ Validación de RUT con algoritmo chileno
- ✅ Formateo automático de RUT (xx.xxx.xxx-x)
- ✅ Estados de carga visuales (Loader de lucide-react)
- ✅ Feedback visual de éxito/error con backdrop-blur
- ✅ Limpieza automática del formulario tras éxito
- ✅ Callback `onSuccess` para refrescar listas

**Campos del Formulario**:
| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| `rut` | text | ✅ | Algoritmo Módulo 11 |
| `razon_social` | text | ✅ | - |
| `giro` | text | ✅ | - |
| `direccion` | text | ❌ | - |
| `comuna` | text | ❌ | - |
| `ciudad` | text | ❌ | - |
| `email_contacto` | email | ❌ | - |
| `telefono` | tel | ❌ | - |

**Estados**:
- `idle`: Formulario listo
- `loading`: Guardando en CRM
- `success`: Cliente registrado
- `error`: Error con mensaje específico

**Diseño**:
- Fondo: `bg-slate-800`
- Bordes: `border-slate-700`
- Focus: `focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20`
- Botón: `bg-gradient-to-r from-orange-500 to-orange-600`
- Sombra: `shadow-orange-500/25`

---

### B. `ClientsList.tsx` - Tabla de Clientes

**Características**:
- ✅ Búsqueda en tiempo real (RUT, Razón Social, Giro, Email)
- ✅ Contador de resultados filtrados
- ✅ Estados de carga con spinner cyan
- ✅ Manejo de errores visual
- ✅ Tabla responsiva con scroll horizontal
- ✅ Hover effects con gradientes

**Columnas de la Tabla**:
1. **Empresa / RUT**: Avatar con icono `Building2` + datos
2. **Giro**: Actividad económica
3. **Ciudad**: Ubicación
4. **Contacto**: Email
5. **Acciones**: Botones (Ver historial, Editar, Eliminar)

**Estados Visuales**:
- **Loading**: Spinner cyan con mensaje
- **Error**: Icono `AlertCircle` rojo + mensaje
- **Sin resultados**: Icono `Building2` gris + mensaje contextual
- **Datos**: Tabla con hover effects

**Diseño**:
- Fondo tabla: `bg-slate-900/50 border-slate-700/80 backdrop-blur-sm`
- Header: `bg-gradient-to-r from-slate-800/50 to-slate-900/50`
- Textos header: `text-cyan-400`
- Hover filas: `hover:bg-slate-800/30`
- Avatar hover: `group-hover:shadow-cyan-500/10`

---

## 5. APLICACIÓN PRINCIPAL

### Archivo: `src/App.tsx`

**Mejora Implementada**: Loading inicial para evitar parpadeo del login.

**Nuevo Estado**:
```typescript
const [isLoadingSession, setIsLoadingSession] = useState(true);
```

**Flujo**:
1. Al cargar la app, muestra spinner cyan fullscreen
2. Carga la sesión con `supabase.auth.getSession()`
3. Una vez cargado, oculta el spinner y muestra la interfaz

**Diseño del Spinner**:
```jsx
<div className="min-h-screen bg-slate-950 flex items-center justify-center">
  <div className="flex flex-col items-center gap-4">
    <Loader className="w-12 h-12 text-cyan-500 animate-spin" />
    <p className="text-slate-400 text-sm">Cargando aplicación...</p>
  </div>
</div>
```

---

## Guía de Estilo Implementada

### Colores (Dark Mode)
- **Fondo principal**: `bg-slate-950`
- **Fondo contenedores**: `bg-slate-900/50`
- **Bordes**: `border-slate-700/80`
- **Acentos primarios**: Gradientes cyan/blue
- **Botones principales**: `from-orange-500 to-orange-600`
- **Sombras**: `shadow-orange-500/25`, `shadow-cyan-500/10`

### Estados de Inputs
```css
- Default: bg-slate-800 border-slate-700
- Focus: border-cyan-500 ring-2 ring-cyan-500/20
- Error: border-red-500/30 bg-red-500/10
- Success: border-green-500/30 bg-green-500/10
```

### Iconos
- Librería: **lucide-react** exclusivamente
- Tamaños: `w-4 h-4` (botones), `w-5 h-5` (formularios), `w-8 h-8` (loading)

---

## Integración con ClientsPage

El componente `ClientsPage.tsx` debe integrar ambos componentes:

```typescript
import ClientsForm from './ClientsForm';
import ClientsList from './ClientsList';

export default function ClientsPage() {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="container mx-auto px-4 py-12">
      {showForm ? (
        <ClientsForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setRefreshKey(prev => prev + 1);
            setShowForm(false);
          }}
        />
      ) : (
        <>
          <button onClick={() => setShowForm(true)}>
            Nuevo Cliente
          </button>
          <ClientsList key={refreshKey} />
        </>
      )}
    </div>
  );
}
```

---

## Ventajas de esta Arquitectura

✅ **Separación de responsabilidades**: Cada capa tiene una función única
✅ **Testeable**: Los servicios y hooks son fáciles de testear unitariamente
✅ **Reusable**: El hook y servicio pueden usarse en otros componentes
✅ **Mantenible**: Cambios en la BD solo afectan la capa de servicio
✅ **Escalable**: Fácil agregar nuevas funcionalidades (ej: paginación)
✅ **Type-safe**: TypeScript en todas las capas con interfaces claras

---

## Próximos Pasos Sugeridos

1. **Implementar actualización de clientes** (modal de edición)
2. **Agregar confirmación de eliminación** (modal con Confirm)
3. **Implementar paginación** (para >100 clientes)
4. **Agregar exportación a Excel** (usando bibliotecas como xlsx)
5. **Implementar historial de cotizaciones** (integración con `crm_quotes`)

---

## Comandos de Verificación

### Verificar que el build funciona:
```bash
npm run build
```

### Verificar tipos TypeScript:
```bash
npm run typecheck
```

### Iniciar servidor de desarrollo:
```bash
npm run dev
```

---

## Archivos Modificados/Creados

### Creados:
- ✅ `src/services/clientService.ts`
- ✅ `src/hooks/useClients.ts`
- ✅ `CLIENTS_MODULE_ARCHITECTURE.md`

### Modificados:
- ✅ `src/components/ClientsForm.tsx`
- ✅ `src/components/ClientsList.tsx`
- ✅ `src/App.tsx`

### Existentes (no modificados):
- ✅ `src/utils/rutValidator.ts` (ya existía)
- ✅ Tabla `crm_clients` en Supabase (ya existía con RLS)

---

## Seguridad

Todas las operaciones CRUD están protegidas por:
- ✅ RLS habilitado en Supabase
- ✅ Políticas que validan `auth.uid()` authenticated
- ✅ Validación de RUT en frontend (no reemplaza validación backend)
- ✅ Sanitización de datos (trim, lowercase)
