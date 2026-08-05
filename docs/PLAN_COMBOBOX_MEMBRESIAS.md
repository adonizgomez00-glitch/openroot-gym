# Plan — Lista desplegable filtrable (combobox) en Membresías, Asistencias, Ventas y Compras

Fecha: 2026-08-05 · Estado: **APROBADO**

## Objetivo

Reemplazar los inputs libres y los `<select>` estáticos por un **combobox filtrable**:
una lista desplegable que se filtra al escribir (por nombre/documentId) y que **solo
permite confirmar elementos existentes**. Garantiza que solo se puedan crear membresías
(o asistencias/ventas/compras) asociadas a miembros, planes, clientes y proveedores ya
registrados.

## Contexto confirmado

- `MembershipView.showForm()` y `AttendanceView.showForm()` usan `Form.js` con
  `memberId`/`planId` de `type:'number'` (input libre → admite IDs inexistentes).
- `MembershipService.create()` **no valida** existencia de miembro/plan
  (`MembershipService.js:45`); `AttendanceService.create()` sí valida el miembro.
- `SaleFormView.js:30-50` y `PurchaseFormView.js:36-61` usan `<select>` nativo estático
  para cliente/proveedor. No existe componente de lista filtrable en el proyecto.
- Las tablas de Membresías/Asistencias muestran IDs crudos (no hay join en
  `getAll()`/`search()` de `MembershipService` ni `AttendanceService`).
- Bug en `seed.js:128-132`: `planMap['Plan Mensual']` pero el plan se llama
  `'Básico Mensual'` (línea 29) → `planId: undefined`. Además `endDate: makeDate(25-30)`
  calcula fechas futuras (resta negativa de días).

## Cambios propuestos

### 1. Nuevo componente `src/components/Combobox.js`
- Input de texto + lista desplegable (position absolute) que filtra al escribir por
  nombre/documentId (case-insensitive).
- Solo permite confirmar opciones existentes (`{ id, label }`), p. ej.
  `"Juan Pérez (M001)"`, vía click o teclado ↑/↓ + Enter. Texto libre no es válido.
- Expone campo oculto `input[type=hidden]` con el `value = id` seleccionado.
- API: `setOptions(options)`, `setSelection(id, label)`, `getValue() → { id, label } | null`,
  manejo de clic fuera y Escape.

### 2. `src/components/Form.js` — soporte `type: 'combobox'`
- Nueva rama en `_createInput(field)` que renderiza el Combobox usando `field.options`
  (mismo patrón que `select`).
- `getValues()`: para `combobox` devuelve `Number(input.value)` o `null`.
- `_validateField()`: si `required` y sin selección válida → error
  "Seleccione un elemento de la lista".
- No altera el comportamiento de los tipos existentes (text/number/select/date/email…).

### 3. Vistas — formularios de creación y columnas
- `src/views/MembershipView.js`
  - `showForm()`: `memberId` y `planId` → `type:'combobox'` con opciones (miembros y planes).
  - `_getColumns()`: `memberId` → `memberName` (label 'Miembro'), `planId` → `planName` (label 'Plan').
- `src/views/AttendanceView.js`
  - `showForm()`: `memberId` → `type:'combobox'` con lista de miembros.
  - `_getColumns()`: `memberId` → `memberName` (label 'Miembro').
- `src/views/SaleFormView.js`
  - `_createCustomerSection()` (30-50): `<select>` cliente → Combobox (mantener la opción
    "Cliente ocasional" como opción válida).
  - Ajustar lectura de `customerId`/`customerName` en `_submit` (212-214).
- `src/views/PurchaseFormView.js`
  - `_createSupplierSection()` (36-61): `<select>` proveedor → Combobox.
  - Ajustar lectura de `supplierId`/`supplierName` en `_submit` (278-281).
- `src/views/MembershipPlanView.js`
  - Insertar columna `{ key: 'id', label: 'ID', width: '60px' }` antes de "Acciones".

### 4. Servicios — enriquecer listados y validar creación
- `src/services/MembershipService.js`
  - Añadir `memberRepository` al constructor.
  - `getAll()`/`search()`: adjuntar `memberName`, `memberDocumentId`, `planName`.
  - `create()`: validar que `memberId` y `planId` existan (`findById`).
- `src/services/AttendanceService.js`
  - `getAll()`/`search()`: adjuntar `memberName` y `memberDocumentId`.

### 5. Controllers — cargar opciones
- `src/controllers/MembershipController.js`: añadir `memberRepo` y `membershipPlanRepo`
  al constructor; cargar miembros/planes y pasarlos como `options` a `showForm`
  (crear y editar).
- `src/controllers/AttendanceController.js`: añadir `memberRepo` al constructor y pasar
  opciones a `showForm`.

### 6. Wiring en `src/app.js`
- `loadMemberships()` (465-473): pasar `memberRepo` al service y `memberRepo` +
  `membershipPlanRepo` al controller.
- `loadAttendance()` (494-501): pasar `memberRepo` al controller.

### 7. Corregir seed (`src/database/seed.js:127-133`)
- `planMap['Plan Mensual']` → `planMap['Básico Mensual']`.
- Corregir `endDate` para que sea posterior a `startDate` (rangos coherentes).

### 8. CSS y Service Worker
- Estilos `.form__combobox`, `.sale-form__combobox` y `.purchase-form__combobox`
  (wrapper, lista desplegable, item hover/activo) en `assets/css/`.
- Añadir `src/components/Combobox.js` a `PRECACHE_URLS` en `sw.js`.

### 9. Tests
- `tests/services/MembershipService.test.js`: nuevo arg `memberRepository` (mock) +
  cobertura de enriquecimiento y validación de `create()`.
- `tests/services/AttendanceService.test.js`: cobertura de enriquecimiento `getAll/search`.
- Test para `type:'combobox'` en `tests/components/Form.test.js`.
- Verificar `npm test` (59+ suites, 0 fallos).

## Verificación
- `npm test` — no romper tests existentes.
- Prueba manual en el servidor local (puerto de `.openroot-port`): crear membresía y
  asistencia eligiendo de la lista filtrable (no admite texto libre).

## Archivos a tocar
| Archivo | Cambio |
|---------|--------|
| `src/components/Combobox.js` | **NUEVO** — lista desplegable filtrable |
| `src/components/Form.js` | Soporte `type:'combobox'` |
| `src/services/MembershipService.js` | Enriquecer getAll/search + validar create |
| `src/services/AttendanceService.js` | Enriquecer getAll/search |
| `src/views/MembershipView.js` | Columnas + formulario combobox |
| `src/views/AttendanceView.js` | Columna + formulario combobox |
| `src/views/SaleFormView.js` | Select cliente → Combobox |
| `src/views/PurchaseFormView.js` | Select proveedor → Combobox |
| `src/views/MembershipPlanView.js` | Columna `id` |
| `src/controllers/MembershipController.js` | Repos + opciones de formulario |
| `src/controllers/AttendanceController.js` | Repo + opciones de formulario |
| `src/app.js` | Wiring de repos |
| `src/database/seed.js` | Fix `'Básico Mensual'` + fechas |
| `assets/css/*.css` | Estilos combobox |
| `sw.js` | Precache Combobox.js |
| `tests/services/MembershipService.test.js` | Constructor + nuevos casos |
| `tests/services/AttendanceService.test.js` | Nuevos casos |
| `tests/components/Form.test.js` | Caso combobox |
