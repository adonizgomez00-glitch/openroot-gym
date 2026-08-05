# Plan — Nombres de Miembro/Plan visibles + Autocompletado en Membresías y Asistencias

Fecha: 2026-08-04 · Estado: **APROBADO — pendiente de implementar**

## Objetivo
Que en los módulos de **Membresías**, **Asistencias** y **Planes** se muestren
nombres legibles en lugar de IDs numéricos crudos, que al crear/editar una
membresía o asistencia el miembro (y el plan) se elijan de una lista filtrable
por nombre (como ventas/compras lo hacen con clientes/proveedores), y que el
ID del plan sea visible en su tabla.

## Contexto del modelo de datos (confirmado)
- `Member.id` (autoincremental) es la clave real; `documentId` ("M001") es solo
  el identificador visible para el usuario.
- `Membership.memberId` y `Attendance.memberId` → `Member.id` (numérico). Ahí
  está el vínculo correcto; "M-XX" y los números de membresía NO se contradicen.
- Los listados muestran `memberId`/`planId` crudos porque **no hay ningún join**:
  - `MembershipService.getAll()/search()` → devuelve filas brutas
    (`MembershipRepository.findAll/search`), sin `member.name` ni `plan.name`.
  - `AttendanceService.getAll()/search()` → brutas (el `memberRepository` que ya
    recibe solo se usa para validar en `create()`).
- `MembershipService.create()` **no valida** existencia del miembro ni del plan;
  `AttendanceService.create()` sí valida al miembro.
- Ventas/Compras usan un `<select>` nativo estático poblado con
  `option.value = id` y `option.textContent = "${name} (${documentId})"`
  (`SaleFormView.js:30-50`, `PurchaseFormView.js:36-61`). **No existe** un
  componente de autocompletado reutilizable en el proyecto.
- Los formularios de Membership y Attendance usan `Form.js` genérico con campos
  `memberId`/`planId` de `type:'number'` (input libre, sin selector).

## Cambios propuestos

### 1. Nuevo componente `src/components/Autocomplete.js`
- Input de texto + lista desplegable que filtra al escribir por
  nombre/documentId.
- Solo se puede elegir una opción existente (click, o teclado ↑/↓ + Enter).
- API: `getValue() → { id, label } | null`, `setValue({ id, label })`,
  `setOptions(options)`, `validate()`, `clear()`.
- Opciones: `[{ id, label }]` (label p. ej. `"Juan Pérez (M001)"`).

### 2. Integrar type `'autocomplete'` en `src/components/Form.js`
- Nueva rama en `_createInput(field)` que renderiza el widget `Autocomplete` +
  un `<input type="hidden">` con el id numérico seleccionado.
- `getValues()`: para `type:'autocomplete'` devuelve `Number(hidden.value)` o
  `null`.
- `_validateField()`: si `required` y sin selección válida → error
  "Seleccione un elemento de la lista".
- No debe alterar el comportamiento de los tipos existentes (text/number/select/
  date/email…). Tests de Form deben seguir pasando.

### 3. Enriquecer listados con nombres (join en Service)
- `src/services/MembershipService.js`:
  - Añadir `memberRepository` al constructor (hoy recibe
    `membershipRepository, membershipPlanRepository, membershipHistoryRepository`).
  - En `getAll()` y `search()` construir mapas `id → member` y `id → plan`
    (mediante `toArray()`) y devolver cada membresía con `memberName`,
    `memberDocumentId` y `planName` (conservando `memberId`/`planId`).
- `src/services/AttendanceService.js`:
  - En `getAll()` y `search()` (ya tiene `memberRepository`) añadir `memberName`
    y `memberDocumentId` a cada fila.

### 4. Columnas legibles en las vistas
- `src/views/MembershipView.js` `_getColumns()` (líneas 88-89):
  - `{ key: 'memberId', label: 'ID Miembro' }` → `{ key: 'memberName', label: 'Miembro' }`
  - `{ key: 'planId', label: 'ID Plan' }` → `{ key: 'planName', label: 'Plan' }`
- `src/views/AttendanceView.js` `_getColumns()` (línea 85):
  - `{ key: 'memberId', label: 'ID Miembro' }` → `{ key: 'memberName', label: 'Miembro' }`

### 5. Mostrar el ID del plan
- `src/views/MembershipPlanView.js` `_getColumns()` (antes de la línea 89):
  insertar `{ key: 'id', label: 'ID', width: '60px' }`. No hace falta renombrar
  la columna "Acciones" (su `render` ya usa `row.id`; Table.js renderiza ambas).

### 6. Formularios con lista por nombre (membresía y asistencia)
- `src/views/MembershipView.js` `showForm()` (líneas 158-159): cambiar
  `memberId` y `planId` de `type:'number'` a `type:'autocomplete'` con
  `options` (miembros y planes). En edición, precargar el label según
  `membership.memberId`/`planId`.
- `src/views/AttendanceView.js` `showForm()` (línea 130): `memberId` →
  `type:'autocomplete'` con lista de miembros.
- `src/controllers/MembershipController.js`: añadir `memberRepo` y
  `membershipPlanRepo` al constructor; en `showCreateForm()`/`showEditForm()`
  cargar miembros + planes (`toArray()`) y pasarlos como `options` a
  `this._view.showForm(...)`.
- `src/controllers/AttendanceController.js`: añadir `memberRepo` al constructor
  y pasar opciones a `showForm`.

### 7. Wiring en `src/app.js`
- `loadMemberships()` (líneas 465-473): pasar `memberRepo` a `MembershipService`
  (enriquecimiento) y `memberRepo` + `membershipPlanRepo` a
  `MembershipController` (opciones del formulario).
- `loadAttendance()` (líneas 494-501): pasar `memberRepo` a
  `AttendanceController`.

### 8. Validación de existencia (robustez)
- `MembershipService.create()`: validar que `memberId` y `planId` existan antes
  de guardar (usar `memberRepository.findById` y `planRepository.findById`).

### 9. Corregir bug de seed
- `src/database/seed.js` (líneas 128-132): `planMap['Plan Mensual']` →
  `planMap['Básico Mensual']` (nombre real del plan en la línea 29). Afecta solo
  bases nuevas.

### 10. CSS
- Añadir estilos en `assets/css/` para `.form__autocomplete` (wrapper, lista
  desplegable, item activo/hover), coherentes con la paleta actual.

## Verificación
- `npm test` (59 suites) — no romper tests existentes.
- Prueba manual en `http://localhost:3002` (servidor local).

## Archivos a tocar
| Archivo | Cambio |
|---------|--------|
| `src/components/Autocomplete.js` | **NUEVO** — componente reutilizable |
| `src/components/Form.js` | Soporte `type:'autocomplete'` |
| `src/services/MembershipService.js` | Enriquecer getAll/search + validar create |
| `src/services/AttendanceService.js` | Enriquecer getAll/search |
| `src/views/MembershipView.js` | Columnas Miembro/Plan + formulario autocomplete |
| `src/views/AttendanceView.js` | Columna Miembro + formulario autocomplete |
| `src/views/MembershipPlanView.js` | Columna `id` |
| `src/controllers/MembershipController.js` | Repos + opciones de formulario |
| `src/controllers/AttendanceController.js` | Repo + opciones de formulario |
| `src/app.js` | Wiring de repos |
| `src/database/seed.js` | Fix `'Básico Mensual'` |
| `assets/css/*.css` | Estilos autocomplete |
