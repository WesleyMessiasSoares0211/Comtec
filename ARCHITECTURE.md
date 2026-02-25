# Arquitectura del Proyecto - Comtec Industrial CRM

## Estructura General

El proyecto ha sido refactorizado siguiendo principios de arquitectura limpia y modular (MVC), separando claramente las responsabilidades entre UI, lógica de negocio y acceso a datos.

## Estructura de Carpetas

```
src/
├── components/          # Componentes compartidos y específicos
│   ├── CommercialAdmin.tsx
│   ├── ClientsForm.tsx
│   ├── ClientsList.tsx
│   ├── QuoteBuilder.tsx
│   └── ...
├── features/           # Módulos de funcionalidad específica
│   └── catalog/        # Gestión de productos/catálogo
│       ├── ProductsForm.tsx
│       └── ProductsList.tsx
├── layouts/            # Layouts de la aplicación
│   ├── AdminLayout.tsx
│   └── PublicLayout.tsx
├── services/           # Capa de servicios (Controladores)
│   ├── productService.ts
│   └── storageService.ts
├── types/              # Definiciones de tipos TypeScript
│   ├── database.ts     # Tipos de Supabase
│   └── product.ts      # Tipos de productos
└── lib/                # Utilidades y configuraciones
    └── supabase.ts
```

## Capa de Tipos (`src/types/`)

### `product.ts`
Define todos los tipos relacionados con productos:

- **Product**: Interfaz principal del producto con todos sus campos
- **ProductFormData**: Tipo derivado para formularios (sin id y created_at)
- **ProductCategory**: Tipos literales para categorías
- **CATEGORY_MODELS**: Configuración de campos dinámicos por categoría

```typescript
export interface Product {
  id?: string;
  name: string;
  part_number: string;
  description: string;
  price: number;
  metadata: Record<string, any>; // Campos dinámicos según categoría
  // ... otros campos
}
```

## Capa de Servicios (`src/services/`)

### `productService.ts`
Centraliza todas las operaciones de base de datos para productos:

- `getAll()`: Obtiene todos los productos
- `getById(id)`: Obtiene un producto específico
- `create(data)`: Crea un nuevo producto
- `update(id, data)`: Actualiza un producto existente
- `delete(id)`: Elimina un producto
- `search(term)`: Búsqueda de productos
- `filterByCategory(category)`: Filtrado por categoría

**Beneficios:**
- Separación de responsabilidades
- Facilita testing unitario
- Reutilización de código
- Punto único de cambio para lógica de negocio

### `storageService.ts`
Gestiona la subida y eliminación de archivos en Supabase Storage:

- `uploadFile(file, bucket)`: Sube un archivo
- `deleteFile(url, bucket)`: Elimina un archivo

## Capa de Features (`src/features/`)

### `catalog/ProductsForm.tsx`
Formulario de creación/edición de productos refactorizado:

- Usa `productService` en lugar de llamadas directas a Supabase
- Usa `storageService` para gestión de archivos
- Mantiene la lógica de campos dinámicos por categoría
- UI completamente desacoplada de la lógica de datos

### `catalog/ProductsList.tsx`
Lista y gestión de productos refactorizada:

- Consume `productService` para todas las operaciones
- Renderizado condicional de tags técnicos según tipo de producto
- Filtrado local optimizado
- Búsqueda en tiempo real

## Capa de Layouts (`src/layouts/`)

### `AdminLayout.tsx`
Layout compartido para todas las vistas administrativas:

- Sidebar de navegación
- Header contextual
- Gestión de sesión
- Navegación entre módulos

**Ventajas:**
- Evita duplicación de código
- UI consistente en todo el panel
- Facilita cambios globales de diseño

### `PublicLayout.tsx`
Layout preparado para futuras vistas públicas del catálogo.

## Flujo de Datos

```
Usuario → Componente → Service → Supabase → Service → Componente → Usuario
```

### Ejemplo: Crear Producto

1. **Usuario** completa el formulario en `ProductsForm`
2. **ProductsForm** llama a `productService.create(data)`
3. **productService** valida, mapea datos y llama a Supabase
4. **Supabase** inserta el registro y retorna el producto creado
5. **productService** retorna el producto al componente
6. **ProductsForm** muestra confirmación y ejecuta `onSuccess()`

## Características del Sistema

### Campos Dinámicos por Categoría

El sistema soporta campos técnicos específicos según la categoría del producto:

```typescript
const CATEGORY_MODELS = {
  'PIEZAS Y BOMBAS': ['material_base', 'diametro_succion', 'tipo_sello', 'fluido_compatible'],
  'FABRICACION MECANICA': ['material', 'tolerancia_mm', 'tratamiento_termico', 'nro_plano'],
  'SENSORES IOT': ['protocolo', 'frecuencia', 'rango_medicion', 'precision'],
  // ...
};
```

Estos campos se almacenan en el campo JSONB `metadata` de la base de datos.

### Renderizado Condicional de Tags

En `ProductsList`, los tags técnicos se renderizan dinámicamente según la categoría:

- **Bombas/Mecánica**: Material, diámetro, fluido compatible
- **Electrónica/IoT**: Protocolo, conectividad

## Seguridad

- Todas las operaciones de base de datos pasan por RLS (Row Level Security)
- Las subidas de archivos están limitadas a buckets específicos
- Validación de datos en el servicio antes de enviar a Supabase

## Próximos Pasos Recomendados

1. **Testing**: Agregar tests unitarios para services
2. **Validación**: Implementar esquemas de validación (Zod/Yup)
3. **Error Handling**: Sistema centralizado de manejo de errores
4. **Caché**: Implementar caché local para reducir llamadas a BD
5. **Optimización**: Code splitting y lazy loading de módulos

## Mantenimiento

### Para agregar una nueva categoría de producto:

1. Agregar el tipo a `ProductCategory` en `src/types/product.ts`
2. Agregar los campos específicos en `CATEGORY_MODELS`
3. (Opcional) Agregar renderizado específico en `ProductsList.tsx`

### Para agregar un nuevo módulo de negocio:

1. Crear carpeta en `src/features/nombre-modulo/`
2. Crear servicio en `src/services/nombreModuloService.ts`
3. Crear tipos en `src/types/nombre-modulo.ts`
4. Integrar en `AdminLayout` o layout correspondiente

## Tecnologías Utilizadas

- **React 18**: Biblioteca de UI
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos
- **Supabase**: Backend as a Service (Base de datos, Auth, Storage)
- **Lucide React**: Iconos
- **Vite**: Build tool

## Convenciones de Código

- **Naming**: PascalCase para componentes, camelCase para funciones/variables
- **Files**: Cada componente en su propio archivo
- **Exports**: Export por defecto para componentes principales
- **Tipos**: Siempre tipar props y estados
- **Async**: Usar async/await, no promises con .then()

1. Gestión de Dependencias
Nueva Dependencia Core
Se ha integrado Sonner como librería principal para el manejo de notificaciones tipo "toast".

2. Configuración Global de Notificaciones (App.tsx)
El componente <Toaster /> de Sonner debe estar presente en la raíz de la aplicación para asegurar que las notificaciones se rendericen sobre el resto del contenido y funcionen globalmente.

3. Patrón de Diseño para Formularios de Edición/Creación
Para asegurar que los formularios se inicialicen correctamente con datos existentes (en modo edición) y mantengan la consistencia visual y funcional, se ha establecido el siguiente patrón:

A. Inicialización y Sincronización del Estado del Formulario
No se debe depender únicamente de la inicialización de useState en la primera renderización. En su lugar, se utiliza useEffect para sincronizar el estado interno del formulario con los datos initialData proporcionados como props.
B. Feedback al Usuario mediante Notificaciones Toast
Los alert() nativos del navegador se han reemplazado por notificaciones "toast" de Sonner, proporcionando una experiencia de usuario más fluida y menos intrusiva.

4. Archivos Afectados y Estandarizados
Los siguientes archivos clave han sido modificados para adherirse a este nuevo estándar y no deben revertirse sin considerar estos patrones:

src/App.tsx: Se ha integrado el componente <Toaster /> globalmente.
src/features/catalog/ProductsForm.tsx: Implementación completa de la inicialización de estado mediante useEffect y el uso de toast para el feedback del usuario en operaciones de creación, edición y subida de archivos.