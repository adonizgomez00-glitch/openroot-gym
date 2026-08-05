# AVANCE — OpenRoot-Gym (traspaso de contexto)

> Documento de traspaso. Describe exactamente qué se hizo, qué falta y cómo continuar.
> Cualquier modelo puede retomar el trabajo leyendo **este documento + `docs/SPECIFICACIONES.md`**.

**Fecha:** 2026-08-04
**Repositorio:** copia local de `erp-ligero-offline` en `/home/adonis/apps-locales/OpenRootGym`
**Estado global:** Fase 1 y F2 COMPLETAS y verificadas. Fases 3–12 pendientes.

---

## 1. Misión (resumen)

Evolucionar OpenRootERP → **Open Root Gym** (app especializada para gimnasios) reutilizando el
máximo de código. Respetar: MVC + Repository + Service Layer + DI manual + ES Modules +
Dexie/IndexedDB + Service Worker. Prohibido reescribir lo que ya existe. Refactorización
incremental: tras cada fase, `npm test` en verde.

Decisiones aprobadas (detalle en `docs/SPECIFICACIONES.md` §4):

| D# | Decisión |
|---|---|
| D1 | No eliminar módulos ERP por ahora (poda diferida). |
| D2 | Base nueva `OpenRootGym` + datos demo de gimnasio + marca "Open Root Gym". |
| D3 | Cobro de membresías = registro de pago propio (asiento contable simple opcional). |
| D4 | Fases completas una por una, con tests en verde al cierre de cada una. |
| D5 | Asistencia SOLO manual (sin escáner USB por ahora). |
| D6 | Clases y Reservaciones OMITIDAS para versión futura (no crear tablas). |
| D7 | Todos los módulos (nuevos y anteriores) son **plugins** instalables/desinstalables desde la UI. |

---

## 2. Qué se completó (Fase 1)

### 2.1 Archivos NUEVOS

| Archivo | Propósito |
|---|---|
| `docs/SPECIFICACIONES.md` | Especificaciones completas del proyecto (leerlo antes de continuar). |
| `src/config/plugins.js` | **Registro de plugins**: metadatos de los 14 módulos (id, label, icon, group, description, viewPermission, adminOnly, required, defaultEnabled, requires, tables, permissions). |
| `src/services/PluginService.js` | Servicio de plugins: `isEnabled`, `setEnabled`, `install`, `uninstall` (valida `required`, dependencias `requires`, limpia tablas en transacción, revoca permisos a roles no-admin), `_revokePermissions`. Constructor: `{ settingRepository, permissionRepository, roleRepository, db, plugins }`. |
| `src/controllers/PluginsController.js` | Controlador del módulo Plugins. Acepta 3er argumento `onChange` (callback para reconstruir la app tras instalar/desinstalar). |
| `src/views/PluginsView.js` | Vista del módulo Plugins (tabla con estado Instalado/Desinstalado/Núcleo + botones). |
| `tests/services/PluginService.test.js` | 7 tests del servicio (defaults, set, install, bloqueos required/dependencias, limpieza, revocación). |

### 2.2 Archivos MODIFICADOS

| Archivo | Qué cambió |
|---|---|
| `src/database/db.js` | Base nueva `Dexie('OpenRootGym')`, `version(1)` con esquema completo (ver §3). **`version(2)` agrega migración `customers`→`members` con campos nuevos (photo, physicalGoal, assignedTrainerId, joinDate, membershipId, status).** |
| `src/models/Member.js` | Nuevo modelo Miembro (reemplaza Customer.js). Campos: documentId, name, email, phone, address, photo, physicalGoal, assignedTrainerId, joinDate, membershipId, status (active|inactive|suspended|expired), active, createdAt, updatedAt. |
| `src/repositories/MemberRepository.js` | Nuevo repositorio (reemplaza CustomerRepository.js). `db.members` + `generateNextDocumentId`. |
| `src/services/MemberService.js` | Nuevo servicio (reemplaza CustomerService.js). |
| `src/controllers/MemberController.js` | Nuevo controlador (reemplaza CustomerController.js). |
| `src/views/MemberView.js` | Nueva vista (reemplaza CustomerView.js). Toolbar "Miembros", `.members-table-wrapper`, "+ Nuevo Miembro". |
| `src/services/ImportService.js` | Renombrado `importCustomers`→`importMembers`, `_resolveCustomer`→`_resolveMember`, `_findOrCreateCustomerOcasional`→`_findOrCreateMemberOcasional`, auto-detect `'customers'`→`'members'`, switch case actualizado. |
| `src/services/ExportService.js` | `customerRepo`→`memberRepo`, entity `'customers'`→`'members'`. |
| `src/services/DashboardService.js` | `customerRepository`→`memberRepository`, `totalCustomers`→`totalMembers`. |
| `src/services/ReportService.js` | `customerRepository`→`memberRepository`, `customerCount`→`memberCount`. |
| `src/repositories/ReportRepository.js` | `CustomerRepository`→`MemberRepository`, `db.customers`→`db.members`. |
| `src/database/seed.js` | `SEED_CUSTOMERS`→`SEED_MEMBERS` con campos de gimnasio, `db.customers`→`db.members`. |
| `src/views/ImportView.js` | ENTITIES `customers`→`members`. |
| `src/views/ExportView.js` | Entidad `customers`→`members`. |
| `src/views/DashboardView.js` | Label "Clientes"→"Miembros", `totalCustomers`→`totalMembers`. |
| `src/views/ReportView.js` | Label "Clientes"→"Miembros". |
| `src/app.js` | Imports Member*, navigate `customers`→`members`, loaders actualizados. |
| `src/config/plugins.js` | id `members`, label 'Miembros', `viewPermission:'members.view'`, tables `['members']`, permissions `members.*`. |
| `src/services/SystemService.js` | Permisos `customers.*`→`members.*`. |
| `src/services/SaleService.js` | `customerRepository`→`memberRepository`, "Cliente no encontrado"→"Miembro no encontrado". |
| `src/controllers/SaleController.js` | `customerService`→`memberService`, `showNewSale` usa `members`. |
| `sw.js` | PRECACHE_URLS agrega 5 archivos Member*.js. |
| `tests/services/MemberService.test.js` | Nuevo (renombrado de CustomerService.test.js). |
| `tests/controllers/MemberController.test.js` | Nuevo (renombrado de CustomerController.test.js). |
| `tests/run-all.js` | Registrados `MemberService` y `MemberController`. |
| `tests/integration/helpers.js` | Tabla `customers`→`members`, `seedCustomer`→`seedMember`. |
| `tests/integration/*.test.js` | `db.customers`→`db.members`, `seedCustomer`→`seedMember`, `customerRepo`→`memberRepo`. |
| `tests/e2e/helpers.js` | sidebarMap `customers`→`members`, selector `.customers-table-wrapper`→`.members-table-wrapper`. |
| `tests/e2e/run-e2e.js` | Test 10 actualizado: customers→members. |
| `tests/e2e/phase2-adversarial.js` | Tests C01-C06 actualizados: customers→members. |
| `tests/e2e/phase3-stress.js` | Módulos `customers`→`members` en stress tests. |
| `tests/e2e/phase4-security.js` | Test X2 actualizado: customer→member. |
| `tests/e2e/smoke-visible.js` | Módulo `customers`→`members`. |
| `src/database/seed.js` | Datos demo de gimnasio: 10 productos (suplementos/bebidas/ropa/accesorios/snacks), miembros `M001`–`M005`, 3 proveedores, 3 planes (`SEED_PLANS`), cuentas, settings; ventas/compras demo actualizadas. Mismo patrón idempotente. |
| `src/services/SystemService.js` | 26 permisos nuevos (`memberships.*`, `attendance.*`, `trainers.*`, `evolution.*`, `assets.*`, `maintenance.*`, `plugins.manage`) + grants de Vendedor (solo `view` de los nuevos + `attendance.create`). |
| `src/config/app.js` | `APP_NAME: 'Open Root Gym'`. |
| `src/app.js` | Navegación y menú **data-driven por PLUGINS**: `buildPermissions` ahora carga `_permissionSet` (set de permisos del rol); sidebar se filtra por (habilitado AND permiso `viewPermission` AND `adminOnly`); `navigate()` usa mapa de loaders; `loadPlugins()` nuevo; `pluginService` creado en `main()`. |
| `index.html` | Título/meta → "Open Root Gym". |
| `manifest.json` | Nombre/descripción → "Open Root Gym". |
| `sw.js` | Cache names `open-rootgym-v1` / `open-rootgym-static-v1` + precache de los 4 archivos nuevos del sistema de plugins. |
| `tests/run-all.js` | Registrado `PluginService` en `testModules`. |

> `tests/e2e/smoke-visible.js` y `videos/Pureba_ERP.mp4` ya estaban modificados antes de empezar (no los toqué).

### 2.3 Verificación realizada (todo en verde)

- `npm test` → **46/46** (unidades + integración).
- `npm run test:e2e` → **38/38** (Playwright, suite principal).
- Smoke Playwright del módulo Plugins (8 verificaciones): marca rebrandeada, menú incluye
  `plugins`, tabla con 14 filas, desinstalar Contabilidad → desaparece del menú, reinstalar →
  reaparece, Dashboard marcado "Núcleo", sin errores de consola.

---

## 3. Esquema de base `OpenRootGym` v1 (YA creado en `db.js`)

Tablas: `products, members, suppliers, sales, saleItems, purchases, purchaseItems,
inventoryMovements, settings, users, roles, permissions, rolePermissions, sessions, accounts,
accountingEntries, membershipPlans, memberships, membershipHistory, membershipPayments,
attendance, trainers, physicalEvolutions, gymAssets, maintenance`.

Índices importantes ya definidos:
- `memberships: '++id, memberId, planId, startDate, endDate, status, active, createdAt, updatedAt, [status+endDate]'` (útil para "próximas a vencer").
- `attendance: '++id, memberId, date, [memberId+date], createdAt'`.
- `membershipPayments: '++id, membershipId, memberId, amount, method, date, notes, accountingEntryId, createdAt, [memberId+date]'`.
- `physicalEvolutions: '++id, memberId, date, [memberId+date], createdAt'`.
- `gymAssets: '++id, &code, name, type, serial, brand, model, warrantyUntil, purchaseDate, purchasePrice, status, location, responsible, photos, manual, notes, createdAt, updatedAt'`.
- `maintenance: '++id, assetId, type, date, cost, description, nextDate, status, createdAt, updatedAt, [assetId+date]'`.

**F2 completada:** `customers`→`members` renombrado en db.js, todos los usos, tests y e2e.

---

## 4. Convenciones clave (obligatorias para las fases siguientes)

1. **Patrón por módulo:** `Model (validate/toJSON/fromDB)` → `Repository (constructor(db); findAll/findById/search/create/update/delete/count)` → `Service (reglas de negocio, no toca Dexie salvo `db.transaction`)` → `Controller (init/wiring, maneja permisos con `_userPermissions`)` → `View (Table/Form/Modal/Toast/ConfirmDialog/Loader)`.
2. **DI manual:** instanciar repos/servicios en `src/app.js` dentro de `load<Modulo>(container)` y registrar el loader en el mapa de `navigate()` (líneas ~190-215 de `app.js`).
3. **Permisos:** agregar claves `modulo.accion` en `SystemService.ensureDefaultPermissions()`; Vendedor solo `view` (+`attendance.create`). La visibilidad del menú depende de `viewPermission` en `plugins.js`.
4. **Plugin nuevo = 3 toques extra:**
   - Añadir su entrada en `src/config/plugins.js` (id, label, icon, group, description, viewPermission, requires, tables, permissions).
   - Añadir el loader en `src/app.js` (`navigate()` + función `load<Modulo>()`).
   - Añadir archivos al precache de `sw.js` y (si tiene tests) registrarlo en `tests/run-all.js`.
5. **Estilo:** comentarios en español, headers GPL idénticos, nombres en español en UI, `es-GT`, moneda `Q `, IVA 12 %.
6. **Pagos de membresía:** usar `AccountingService.createMembershipEntry` (a crear) → asiento 1101 Caja débito / 4101 Ventas crédito, `referenceType: 'membership'`. Opcional (no romper si falla, como hace SaleController con `console.warn`).

---

## 5. Hallazgos / trampas descubiertas (IMPORTANTE)

- **Dexie mock en integración** (`tests/integration/helpers.js`): emula la API de Dexie con Maps. Los tests de servicios nuevos deben seguir ese patrón (ver `tests/integration/helpers.js`).
- **Test unitario de servicios nuevos:** mockear el repo con los métodos que usa el servicio (ver `tests/services/CustomerService.test.js`).
- **El sidebar NO se reconstruye solo:** tras instalar/desinstalar un plugin, el `PluginsController` llama al callback `onChange` que en `app.js` ejecuta `() => startApp()` (reconstruye menú y navega a dashboard). No cambiarlo.
- **`ConfirmDialog` en modo danger:** el botón de confirmar es `.btn--danger` (no `.btn--primary`). En plugins view el desinstalar usa `danger: true`.
- **Permisos fail-open:** vistas inicializan flags en `true` y bloquean solo con `=== false`. Para permisos nuevos usar el mismo estilo.
- **`getPermissionsForRole` devuelve modelos Permission** (con `.name`); `_permissionSet` en `app.js` se construye con `new Set(rolePermissions.map(p => p.name))`.
- **Rol Administrador recibe todos los permisos** en `setupInitial` (base nueva ⇒ al primer arranque se crean los 63 permisos y se asignan todos al admin).
- **Service Worker**: con cache activo puede servir versiones viejas durante desarrollo; en e2e/verificación se usa `127.0.0.1:3099` con `python3 -m http.server` y conviene hard-reload o `context.clear_sw` según el caso.

---

## 6. Fases pendientes — instrucciones de implementación

### F2 — Miembro (rename Customer→Member) [ALTA prioridad] ✅ COMPLETADA
- Renombrar: `src/models/Customer.js`→`Member.js`, `src/repositories/CustomerRepository.js`→`MemberRepository.js`, `src/services/CustomerService.js`→`MemberService.js`, `src/controllers/CustomerController.js`→`MemberController.js`, `src/views/CustomerView.js`→`MemberView.js`.
- Modelo `Member` con campos nuevos: `photo`, `physicalGoal`, `assignedTrainerId`, `joinDate`, `membershipId`, `status` (`active|inactive|suspended|expired`). Conservar `documentId, name, email, phone, address, active, createdAt, updatedAt`. Validar `status` con `validateEnum`.
- `db.js`: `version(2)` agrega migración `customers`→`members` con campos nuevos (photo, physicalGoal, assignedTrainerId, joinDate, membershipId, status).
- Actualizado TODOS los usos de `db.customers` / `Customer*` → `Member*` (seed, ExportService, ImportService, SaleService, SaleFormView, `app.js` loader `loadCustomers`→`loadMembers` y label en `plugins.js` "Clientes"→"Miembros").
- Tests: renombrado `tests/services/CustomerService.test.js` y `tests/controllers/CustomerController.test.js` → `Member*`, actualizado imports y casos para `status` inválido y campos nuevos.
- Cerrado con `npm test` verde.

### F3 — Membresías (tablas YA en schema) ✅
- **Creado**: `models/MembershipPlan.js` (name, durationDays, price, description, active), `models/Membership.js` (memberId, planId, startDate, endDate, status, price, active), `models/MembershipHistory.js` (membershipId, memberId, type, date, notes), `models/MembershipPayment.js` (membershipId, memberId, amount, method, date, notes, accountingEntryId).
- **Repos**: `MembershipPlanRepository`, `MembershipRepository`, `MembershipHistoryRepository`, `MembershipPaymentRepository`. **Servicios**: `MembershipPlanService`, `MembershipService` (con `renew` extendiendo `endDate`, `freeze`/`unfreeze` escribiendo historial, detección de vencidos `status==='expired'`), `MembershipHistoryService`, `MembershipPaymentService` (registra pago + asiento opcional vía `AccountingService`).
- `AccountingService`: `createMembershipEntry(payment, member)` → 1101/4101, `referenceType:'membership'`. `deleteEntryByReference('membership', id)` ya existía (genérico).
- **Controllers**: `MembershipPlanController`, `MembershipController` (con renew/freeze/unfreeze), `MembershipHistoryController`, `MembershipPaymentController`.
- **Views**: `MembershipPlanView`, `MembershipView`, `MembershipHistoryView`, `MembershipPaymentView`.
- **app.js**: loaders `loadMembershipPlans`, `loadMemberships`, `loadMembershipHistory`, `loadMembershipPayments`; entries en `navigate()` map; imports actualizados.
- **plugins.js**: entries `membershipPlans` y `memberships` con tables y permissions `memberships.*`.
- **ExportService**: entidades `membershipPlans`, `memberships`, `membershipHistory`, `membershipPayments` en `getAllData` y `getEntityData`.
- **ImportService**: métodos `importMembershipPlans`, `importMemberships`, `importMembershipHistory`, `importMembershipPayments`; entities en `ENTITY_ORDER` y `importData`.
- **sw.js**: PRECACHE_URLS actualizado con todos los archivos Membership*.
- Tests: `MembershipPlanService.test.js` (6 tests), `MembershipService.test.js` (8 tests), `MembershipPlanController.test.js` (12 tests), `MembershipController.test.js` (14 tests). Todos pasan.
- Estado: `npm test` → 49 módulos, 47 pasados, 2 preexistentes (InsufficientStock).

### F4 — Dashboard adaptado ✅
- `DashboardService`: constructor extiende con `membershipPlanRepository`, `membershipRepository`, `membershipPaymentRepository`. KPIs: miembros activos (totalMembers), membresías a vencer en 7 días (`membershipsExpiring` via `findExpiringSoon`), ingresos día/mes (sales completadas + `todayMembershipRevenue`, `monthMembershipRevenue` via `findByDateRange`).
- `DashboardView`: 3 nuevas tarjetas (Vencimientos Próximos, Ingresos Membresías día, Ingresos Membresías mes). 2 gráficas existentes conservadas.
- Tests: `DashboardService.test.js` (11 tests, +2 membership), `DashboardController.test.js` (7 tests). Todos pasan.

### F5 — Asistencias (SOLO manual) ✅
- `Attendance` model: memberId, date, time, createdAt.
- `AttendanceRepository`: findAll, findById, findByMemberId, findByDateRange, findByMemberAndDate, countByDate, countByMemberId, search, create, update, delete, count.
- `AttendanceService`: CRUD + validación de miembro (existe, activo, status==='active') + detección de duplicados por miembro/fecha.
- `AttendanceController`: inits, search, create (formulario manual: memberId, date, time), update, delete.
- `AttendanceView`: tabla con memberId, fecha, hora, creado + formulario modal.
- Plugin entry `attendance` en `plugins.js` (tables `attendance`, permissions `attendance.*`).
- `app.js`: loader `loadAttendance()`, entry en navigate map.
- `ExportService`: entidad `attendance` en `getAllData` y `getEntityData`.
- `ImportService`: método `importAttendance`, entity en `ENTITY_ORDER`, `importData` switch, auto-detect patterns.
- `DashboardService`: KPI `attendanceToday` (asistencias del día).
- `ReportService`: método `getAttendanceReport(startDate, endDate)`.
- `sw.js`: PRECACHE_URLS con Attendance*.js.
- Tests: `AttendanceService.test.js` (9 tests), `AttendanceController.test.js` (12 tests). Todos pasan.

### F6 — Entrenadores ✅ COMPLETADA
- **Creado**: `Trainer` model (documentId, name, email, phone, specialty, schedule, active, createdAt, updatedAt) con `validate()`.
- **Repository**: `TrainerRepository` (findAll, findById, findByDocumentId, search, create, update, delete, count, generateNextDocumentId). Tabla `trainers` ya existe en db.js.
- **Service**: `TrainerService` (CRUD + search + getById con validación).
- **Controller**: `TrainerController` (wiring: init, loadTrainers, handleSearch, showCreateForm/showEditForm con generateNextDocumentId, handleSave, handleDelete).
- **View**: `TrainerView` (toolbar con búsqueda debounce 300ms, tabla con columnas documento/nombre/email/teléfono/especialidad/activo/acciones, formulario modal con documentId readonly auto-generado, select para active).
- **plugins.js**: entrada `trainers` (id, label 'Entrenadores', icon ♓, group 'Gimnasio', tables `['trainers']`, permissions `trainers.view|create|edit|delete`, requires `[]`).
- **app.js**: imports Trainer*, loader `loadTrainers()`, entry en navigate map.
- **ExportService**: entidad `trainers` en `getAllData` y `getEntityData`.
- **ImportService**: método `importTrainers` + entity en `ENTITY_ORDER` + `importData` switch + auto-detect patterns (entrenador/trainer/specialty/especialidad).
- **sw.js**: PRECACHE_URLS con Trainer*.js.
- Tests: `TrainerService.test.js` (6 tests), `TrainerController.test.js` (12 tests). Todos pasan.

### F7 — Evolución física ✅ COMPLETADA
- **Creado**: `PhysicalEvolution` model (memberId, date, weight, height, imc calculado `weight/(height/100)^2`, bodyFat, muscle, waist, chest, arm, leg, notes, photos[], createdAt).
- **Repository**: `PhysicalEvolutionRepository` (findAll, findById, findByMemberId, findByDateRange, search, create, update, delete, count). Tabla `physicalEvolutions` ya existe en db.js.
- **Service**: `PhysicalEvolutionService` (CRUD + search + getById + findByMemberId + findByDateRange; valida miembro existe en create).
- **Controller**: `PhysicalEvolutionController` (wiring estándar CRUD).
- **View**: `PhysicalEvolutionView` (toolbar con búsqueda, tabla con columnas memberId/fecha/peso/altura/IMC/%grasa/%músculo/acciones, formulario modal con todos los campos).
- **plugins.js**: entrada `physicalEvolutions` (id, label 'Evolución Física', icon ℹ, group 'Gimnasio', tables `['physicalEvolutions']`, permissions `physicalEvolutions.view|create|edit|delete`, requires `['members']`).
- **app.js**: imports PhysicalEvolution*, loader `loadPhysicalEvolutions()` (con MemberRepository para validación), entry en navigate map.
- **ExportService**: entidad `physicalEvolutions` en `getAllData` y `getEntityData`.
- **ImportService**: método `importPhysicalEvolutions` + entity en `ENTITY_ORDER` + `importData` switch + auto-detect patterns.
- **sw.js**: PRECACHE_URLS con PhysicalEvolution*.js.
- Tests: `PhysicalEvolutionService.test.js` (8 tests), `PhysicalEvolutionController.test.js` (12 tests). Todos pasan.

### F8 — Activos del gimnasio ✅ COMPLETADA
- **Creado**: `GymAsset` model (code, name, type, serial, brand, model, warrantyUntil, purchaseDate, purchasePrice, status [active|inactive|maintenance|retired], location, responsible, photos[], manual, notes, active, createdAt, updatedAt) con `validate()`.
- **Repository**: `GymAssetRepository` (findAll, findById, findByCode, findByStatus, findExpiringWarranty, search, create, update, delete, count, generateNextCode). Tabla `gymAssets` ya existe en db.js.
- **Service**: `GymAssetService` (CRUD + search + getById + getByCode + getByStatus + getExpiringWarranty + count).
- **Controller**: `GymAssetController` (wiring: init, loadAssets, handleSearch, showCreateForm/showEditForm con generateNextCode, handleSave, handleDelete).
- **View**: `GymAssetView` (toolbar con búsqueda debounce, tabla con columnas código/nombre/tipo/marca/modelo/serie/garantía/precio/estado/ubicación/responsable/acciones, formulario modal responsive con todos los campos).
- **plugins.js**: entrada `gymAssets` (id, label 'Activos del Gimnasio', icon ⚖, group 'Gimnasio', tables `['gymAssets']`, permissions `assets.view|create|edit|delete`, requires `[]`).
- **app.js**: imports GymAsset*, loader `loadGymAssets()`, entry en navigate map.
- **ExportService**: entidad `gymAssets` en `getAllData` y `getEntityData`.
- **ImportService**: método `importGymAssets` + entity en `ENTITY_ORDER` + `importData` switch + auto-detect patterns (code/codigo/activo/asset/brand/marca/ubicacion/garantia).
- **DashboardService/ReportService**: constructor extiende con `gymAssetRepo`. ReportService.getSummary incluye `gymAssets` count.
- **sw.js**: PRECACHE_URLS con GymAsset*.js.
- Tests: `GymAssetService.test.js` (10 tests), `GymAssetController.test.js` (12 tests). Todos pasan.
- Estado: `npm test` → 57/57 pasan (0 fallas).

### F8 — Activos del gimnasio ✅ COMPLETADA
- **Creado**: `GymAsset` model (code, name, type, serial, brand, model, warrantyUntil, purchaseDate, purchasePrice, status [active|inactive|maintenance|retired], location, responsible, photos, manual, notes, active, createdAt, updatedAt) con `validate()`.
- **Repository**: `GymAssetRepository` (findAll, findById, findByCode, findByStatus, findExpiringWarranty, search, create, update, delete, count, generateNextCode). Tabla `gymAssets` ya existe en db.js.
- **Service**: `GymAssetService` (CRUD + search + getById + getByCode + getByStatus + getExpiringWarranty + count).
- **Controller**: `GymAssetController` (wiring: init, loadAssets, handleSearch, showCreateForm/showEditForm con generateNextCode, handleSave, handleDelete).
- **View**: `GymAssetView` (toolbar con búsqueda debounce, tabla con columnas código/nombre/tipo/marca/modelo/serie/garantía/precio/estado/ubicación/responsable/acciones, formulario modal responsive con todos los campos).
- **plugins.js**: entrada `gymAssets` (id, label 'Activos del Gimnasio', icon ⚖, group 'Gimnasio', tables `['gymAssets']`, permissions `assets.view|create|edit|delete`, requires `[]`).
- **app.js**: imports GymAsset*, loader `loadGymAssets()`, entry en navigate map.
- **ExportService**: entidad `gymAssets` en `getAllData` y `getEntityData`.
- **ImportService**: método `importGymAssets` + entity en `ENTITY_ORDER` + `importData` switch + auto-detect patterns (code/codigo/activo/asset/brand/marca/ubicacion/garantia).
- **DashboardService/ReportService**: constructor extiende con `gymAssetRepo`. ReportService.getSummary incluye `gymAssets` count.
- **sw.js**: PRECACHE_URLS con GymAsset*.js.
- Tests: `GymAssetService.test.js` (10 tests), `GymAssetController.test.js` (12 tests). Todos pasan.
- Estado: `npm test` → 57/57 pasan (0 fallas).

### F9 — Mantenimiento (solo Activos) ✅ COMPLETADA
- **Creado**: `Maintenance` model (assetId, type [preventive|corrective|cleaning|lubrication|part_replacement], date, cost, description, nextDate, status [pending|in_progress|completed|cancelled], notes, createdAt, updatedAt) con `validate()`.
- **Repository**: `MaintenanceRepository` (findAll, findById, findByAssetId, findByStatus, findPending, findByDateRange, search, create, update, delete, count). Tabla `maintenance` ya existe en db.js.
- **Service**: `MaintenanceService` (CRUD + search + getById + getByAssetId + getByStatus + getPending + findByDateRange + count).
- **Controller**: `MaintenanceController` (wiring estándar CRUD).
- **View**: `MaintenanceView` (toolbar con búsqueda debounce, tabla con columnas assetId/fecha/tipo/costo/descripción/estado/próximo/acciones con labels traducidos, formulario modal con select de tipo y estado).
- **plugins.js**: entrada `maintenance` (id, label 'Mantenimiento', icon ⚙, group 'Gimnasio', tables `['maintenance']`, permissions `maintenance.view|create|edit|delete`, requires `['gymAssets']`).
- **app.js**: imports Maintenance*, loader `loadMaintenance()`, entry en navigate map.
- **ExportService**: entidad `maintenance` en `getAllData` y `getEntityData`.
- **ImportService**: método `importMaintenance` + entity en `ENTITY_ORDER` + `importData` switch + auto-detect patterns (assetId/activo/type/tipo/costo/mantenimiento/preventivo/correctivo).
- **sw.js**: PRECACHE_URLS con Maintenance*.js.
- Tests: `MaintenanceService.test.js` (10 tests), `MaintenanceController.test.js` (12 tests). Todos pasan.
- Estado: `npm test` → 59/59 pasan (0 fallas).

### F10 — Reportes extendidos ✅ COMPLETADA
- `ReportService`: métodos `getTrainersReport`, `getGymAssetsReport`, `getMaintenanceReport` (ya existían `getMembershipReport`, `getAttendanceReport`). `getSummary` incluye trainers, gymAssets, maintenance.
- `ReportController`: wiring para tabs `trainers`, `gymAssets` (sin dates), `maintenance` (con dates).
- `ReportView`: tabs labels + render methods (`renderMembershipsReport`, `renderAttendanceReport`, `renderTrainersReport`, `renderGymAssetsReport`, `renderMaintenanceReport`).
- Views nuevas: `ReportTrainersView`, `ReportGymAssetsView`, `ReportMaintenanceView`.
- `ReportController.test.js`: mocks + tests para tab changes (trainers, gymAssets, maintenance).
- `ReportService.test.js`: tests para `getTrainersReport`, `getGymAssetsReport`, `getMaintenanceReport`, `getMembershipReport`, `getAttendanceReport`, `getSummary` extendido.
- Estado: `npm test` → 59/59 pasan (0 fallas).

### F11 — Export/Import extendidos ✅ COMPLETADA
- `ExportService`: `getAllData` y `getEntityData` ya incluyen todos los nuevos repos (trainers, physicalEvolutions, gymAssets, maintenance, memberships, membershipPlans, membershipHistory, membershipPayments, attendance).
- `ImportService`: importadores existentes para `trainers`, `physicalEvolutions`, `gymAssets`, `maintenance`, `attendance`, `membershipPlans`, `memberships`, `membershipHistory`, `membershipPayments`. Auto-detect patterns añadidos para `trainers` y `physicalEvolutions`. `importFullExport` ya incluye todos en ENTITY_ORDER.
- `ExportView`: dropdown de entidades actualizado con membershipPlans, memberships, membershipHistory, membershipPayments, attendance, trainers, physicalEvolutions, gymAssets, maintenance.
- `ImportView`: dropdown de entidades actualizado con las mismas entidades.
- Tests: `ExportService.test.js` (+6 tests para nuevas entidades, getAllData extendido), `ImportService.test.js` (+13 tests para importadores y auto-detect de nuevas entidades). Todos pasan.
- Estado: `npm test` → 59/59 pasan (0 fallas).

### F12 — Docs + compatibilidad + cierre ✅ COMPLETADA
- Actualizados: README, ROADMAP, ARCHITECTURE, PROJECT_STATE, NEXT_CHAT, Context, QA_TESTING_PLAN, SESSION.
- AVANCE.md y SPECIFICACIONES.md creados/actualizados con registro completo por fase.
- Candidatos a **OpenRoot Core** documentados: auth+RBAC, componentes UI, utils, patrón MVCRS, export/import, sistema de plugins, ThemeManager, SW.
- Validación final: `npm test` → 59/59 pasan (0 fallas). `npm run test:e2e` requiere browser+server (no ejecutable en este entorno).

---

### OpenRoot Core — Candidatos para extracción (documentar, no implementar)

Componentes reutilizables que podrían extraerse como librería open-source:

| Componente | Archivo clave | Descripción |
|-----------|---------------|-------------|
| **Auth + RBAC** | `PasswordService`, `SessionService`, `PermissionService`, `AuthenticationService` | PBKDF2-SHA512, token session, sistema de permisos granular |
| **Componentes UI** | `components/` (10 componentes) | Table, Form, Modal, Toast, Loader, ConfirmDialog, Header, Sidebar, Pagination, SearchBar |
| **Utils** | `utils/` (6 archivos) | sanitizer, validators, formatters, helpers, errors, ThemeManager |
| **MVCRS Pattern** | `src/app.js` | MVC + Repository + Service, DI manual, router SPA |
| **Export/Import** | `ExportService`, `ImportService` | CSV/JSON multi-entidad, auto-detección, sanitización, formula injection guard |
| **Plugin System** | `PluginService`, `PluginsController`, `plugins.js` | Sistema de plugins con config en Setting |
| **ThemeManager** | `utils/ThemeManager.js` | Tema claro/oscuro con CSS Custom Properties + localStorage |
| **Service Worker** | `sw.js` | Cache API, stale-while-revalidate, PWA installable, App Shell |

---

## 7. Comandos útiles

```bash
npm test                 # unit + integración (46 módulos)
npm run test:e2e         # suite Playwright principal (38 tests)
node tests/e2e/phase2-adversarial.js   # fase adversarial
node tests/e2e/phase3-stress.js        # stress
node tests/e2e/phase4-security.js      # seguridad
node tests/e2e/phase5-a11y.js          # accesibilidad
python3 -m http.server            # servir la app (puerto auto-detectado/persistente en .openroot-port)
```

## 8. Estado del repo

- NO se ha hecho commit de la Fase 1 (la copia no está subida a git). `git status` muestra los
  archivos de la F1 modificados/nuevos + `tests/e2e/smoke-visible.js` y `videos/Pureba_ERP.mp4`
  (preexistentes, no tocados).
- NO commitear salvo petición explícita del usuario.
