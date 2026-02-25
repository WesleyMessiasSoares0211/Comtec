# Esquema de Base de Datos - Comtec Industrial CRM

## Tablas Creadas en Supabase

### 1. `crm_clients` - Clientes del CRM
**Propósito**: Gestión de clientes corporativos con información tributaria (Chile)

**Columnas**:
- `id` (UUID) - Primary Key
- `rut` (TEXT, UNIQUE) - RUT chileno
- `razon_social` (TEXT) - Nombre legal de la empresa
- `giro` (TEXT) - Actividad económica
- `direccion` (TEXT, nullable) - Dirección fiscal
- `comuna` (TEXT, nullable) - Municipalidad
- `ciudad` (TEXT, nullable) - Ciudad
- `email_contacto` (TEXT) - Email de contacto
- `telefono` (TEXT, nullable) - Teléfono
- `created_at` (TIMESTAMP) - Fecha de creación

**Índices**:
- `idx_crm_clients_rut` - Para búsquedas por RUT
- `idx_crm_clients_razon_social` - Para ordenamiento alfabético

**Políticas RLS**:
- ✅ Solo usuarios autenticados pueden SELECT
- ✅ Solo usuarios autenticados pueden INSERT
- ✅ Solo usuarios autenticados pueden UPDATE
- ✅ Solo usuarios autenticados pueden DELETE

---

### 2. `crm_quotes` - Cotizaciones/Ofertas
**Propósito**: Gestión de cotizaciones comerciales generadas por el sistema

**Columnas**:
- `id` (UUID) - Primary Key
- `folio` (TEXT, UNIQUE) - Número de oferta (ej: OCT-1234)
- `client_id` (UUID, FK) - Referencia a `crm_clients`
- `items` (JSONB) - Array de productos cotizados
- `subtotal_neto` (NUMERIC) - Subtotal sin IVA
- `iva` (NUMERIC) - Monto de IVA (19%)
- `total_bruto` (NUMERIC) - Total con IVA
- `total` (NUMERIC, GENERATED) - Alias para total_bruto
- `estado` (TEXT) - Estado: Pendiente, Aceptada, Rechazada, Facturada
- `created_at` (TIMESTAMP) - Fecha de creación

**Índices**:
- `idx_crm_quotes_folio` - Búsqueda por número de oferta
- `idx_crm_quotes_client_id` - Joins con clientes
- `idx_crm_quotes_estado` - Filtrado por estado
- `idx_crm_quotes_created_at` - Ordenamiento por fecha

**Políticas RLS**:
- ✅ Solo usuarios autenticados pueden SELECT
- ✅ Solo usuarios autenticados pueden INSERT
- ✅ Solo usuarios autenticados pueden UPDATE
- ✅ Solo usuarios autenticados pueden DELETE

**Constraint**:
- `valid_estado` CHECK - Estado solo puede ser: Pendiente, Aceptada, Rechazada, Facturada

---

### 3. `clients` - Formulario Público de Contacto
**Propósito**: Captura de leads desde el sitio web público

**Columnas**:
- `id` (UUID) - Primary Key
- `nombre` (TEXT) - Nombre del contacto
- `email` (TEXT) - Email del contacto
- `empresa` (TEXT, nullable) - Nombre de la empresa
- `rut` (TEXT, nullable) - RUT (opcional)
- `telefono` (TEXT, nullable) - Teléfono
- `solicitud` (TEXT, nullable) - Tipo de solicitud
- `comentarios` (TEXT, nullable) - Comentarios adicionales
- `estado` (TEXT) - Estado: Nuevo, Contactado, Calificado, Convertido
- `created_at` (TIMESTAMP) - Fecha de envío

**Índices**:
- `idx_clients_email` - Búsqueda por email
- `idx_clients_estado` - Filtrado por estado
- `idx_clients_created_at` - Ordenamiento por fecha

**Políticas RLS**:
- ✅ Usuarios anónimos pueden INSERT (formulario público)
- ✅ Usuarios autenticados pueden INSERT
- ✅ Solo usuarios autenticados pueden SELECT
- ✅ Solo usuarios autenticados pueden UPDATE
- ✅ Solo usuarios autenticados pueden DELETE

**Constraint**:
- `valid_estado` CHECK - Estado solo puede ser: Nuevo, Contactado, Calificado, Convertido

---

### 4. `products` - Catálogo de Productos
**Propósito**: Productos industriales del catálogo técnico

**Columnas**:
- `id` (UUID) - Primary Key
- `name` (TEXT) - Nombre comercial
- `part_number` (TEXT) - Número de parte
- `description` (TEXT) - Descripción técnica
- `price` (NUMERIC) - Precio neto lista
- `image_url` (TEXT) - URL de imagen del producto
- `datasheet_url` (TEXT) - URL de ficha técnica PDF
- `main_category` (TEXT) - Categoría principal
- `sensor_category` (TEXT, nullable) - Subcategoría
- `protocol` (TEXT) - Protocolo de comunicación
- `connectivity` (TEXT) - Tipo de conectividad
- `sensor_type` (TEXT, nullable) - Tipo de sensor
- `featured` (BOOLEAN) - Producto destacado
- `ej_uso` (TEXT, nullable) - Ejemplo de uso
- `metadata` (JSONB) - Campos técnicos dinámicos
- `created_at` (TIMESTAMP) - Fecha de creación

**Políticas RLS**:
- ✅ Solo usuarios autenticados pueden realizar operaciones CRUD

---

## Relaciones entre Tablas

```
crm_clients (1) ----< (N) crm_quotes
    │
    │ (Un cliente puede tener muchas cotizaciones)
    │
    └─> FK: crm_quotes.client_id → crm_clients.id
```

## Estructura de Datos JSONB

### `crm_quotes.items` (Array de objetos)
```json
[
  {
    "id": "uuid",
    "name": "Sensor de Temperatura IoT",
    "part_number": "TEMP-001",
    "quantity": 5,
    "unit_price": 150000,
    "total": 750000
  }
]
```

### `products.metadata` (Objeto dinámico según categoría)

**Para PIEZAS Y BOMBAS**:
```json
{
  "material_base": "Acero inoxidable 316L",
  "diametro_succion": "4 pulgadas",
  "tipo_sello": "Mecánico",
  "fluido_compatible": "Agua de mar"
}
```

**Para SENSORES IOT**:
```json
{
  "protocolo": "LoRaWAN",
  "frecuencia": "915 MHz",
  "rango_medicion": "-40°C a 85°C",
  "precision": "±0.5°C"
}
```

## Seguridad (RLS)

### Principios de Seguridad Implementados:

1. **Separación Público/Privado**:
   - Tabla `clients`: Permite INSERT anónimo para formularios públicos
   - Tabla `crm_clients`: Solo accesible para usuarios autenticados

2. **Control Total Autenticado**:
   - Usuarios autenticados tienen CRUD completo en todas las tablas del CRM
   - No hay restricciones por roles (todos los usuarios auth tienen mismo nivel)

3. **Prevención de Pérdida de Datos**:
   - Foreign Keys con `ON DELETE SET NULL` para preservar histórico
   - Constraints para validar estados permitidos

4. **Índices de Performance**:
   - Todos los campos usados en búsquedas tienen índices
   - Índices en claves foráneas para optimizar joins

## Comandos de Verificación

### Ver todas las tablas:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

### Ver políticas RLS:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

### Verificar índices:
```sql
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public';
```

## Migraciones Aplicadas

1. ✅ `20250217_create_crm_clients_table.sql` - Tabla de clientes CRM
2. ✅ `20250217_create_crm_quotes_table.sql` - Tabla de cotizaciones
3. ✅ `20250217_create_public_clients_table.sql` - Formulario público

## Notas Técnicas

- Todas las tablas usan UUID como primary key
- Timestamps con zona horaria para compatibilidad internacional
- JSONB para flexibilidad en campos dinámicos
- CHECK constraints para validar estados
- RLS habilitado en todas las tablas
- Cache de PostgREST refrescado con NOTIFY pgrst
