# Especificaciones — Evolución OpenRootERP → OpenRoot-Gym

> Documento vivo de especificaciones. Registra las decisiones, el alcance y el plan de la
> evolución de Open RootERP hacia **Open Root Gym**, una aplicación especializada para la
> administración de gimnasios, manteniendo la misma filosofía: 100 % offline, JavaScript
> ES Modules, IndexedDB (Dexie), Service Worker y arquitectura MVC + Repository + Service Layer.

---

## 1. Misión

- **No** desarrollar una aplicación nueva.
- Evolucionar OpenRootERP hacia **OpenRoot-Gym** reutilizando la máxima cantidad de código existente.
- **No** es un fork independiente: debe mantenerse compatible con mejoras futuras de OpenRootERP.
- Prioridades: reutilizar código, reducir duplicación, mantener arquitectura y calidad,
  agregar únicamente funcionalidades específicas del gimnasio.

## 2. Reglas principales

1. **Prohibido reescribir** funcionalidades que ya existen. Antes de crear cualquier componente:
   buscar → reutilizar → extender → solo crear si no hay alternativa.
2. **Refactorización incremental y verificable**: después de cada cambio importante la
   aplicación debe compilar y las pruebas afectadas deben pasar antes de continuar.
   No se realizan cambios masivos sin validaciones intermedias.
3. **Respetar la arquitectura**: MVC, Repository Pattern, Service Layer, DI manual,
   JavaScript ES Modules, IndexedDB mediante Dexie, Service Worker, estructura de carpetas,
   convenciones y estilo.
4. **No migrar** a React, Vue, Angular, Next.js, Vite ni Svelte.
5. **No introducir patrones nuevos** sin justificación técnica clara.
6. **Nunca eliminar código compartido**. Antes de eliminar un módulo: verificar dependencias,
   pruebas y reutilización.

## 3. Base tecnológica (a preservar)

| Capa | Tecnología |
|---|---|
| Lógica | JavaScript ES Modules |
| Persistencia | IndexedDB mediante Dexie |
| App shell | HTML + CSS puro (`assets/css/main.css`) |
| Gráficas | Chart.js (`assets/lib/chart.umd.min.js`) |
| Offline | Service Worker (`sw.js`) con precache y stale-while-revalidate |
| Arquitectura | MVC + Repository + Service Layer + DI manual en `src/app.js` |
| Patrón por módulo | `Model → Repository → Service → Controller → View` |
| Testing | Asserts propios + DOM shim (`tests/run-all.js`) + mock DB (`tests/integration/helpers.js`) + Playwright E2E (`tests/e2e/`) |

## 4. Decisiones de arquitectura (aprobadas)

| # | Decisión | Opción elegida |
|---|---|---|
| D1 | Módulos ERP exclusivos (Contabilidad, Compras, Proveedores) | **No eliminar nada por ahora**. La poda queda diferida; solo se documentan candidatos. |
| D2 | Base de datos y marca | **Nueva base `OpenRootGym`** + datos demo de gimnasio. UI rebrandeada a "Open Root Gym". Los datos demo del ERP no se migran (es una app nueva). Los archivos del ERP original quedan intactos fuera de esta carpeta. |
| D3 | Cobro de membresías (el prompt menciona "Caja") | **Registro de pago propio en el módulo Membresías**: registra monto, método y fecha; genera asiento contable simple opcional vía `AccountingService` (1101 Caja / 4101 Ventas). No crea una "venta" ni toca inventario. Nota: no existe un módulo "Caja" separado; ese rol lo cumple Ventas. |
| D4 | Alcance de implementación | **Fases completas, una por una con validación** de tests al cierre de cada fase. |
| D5 | Asistencias | **Solo registro manual** (seleccionar miembro + fecha/hora). El cliente no tiene escáner USB por el momento; QR/código de barras queda anotado como roadmap futuro. |
| D6 | Clases y Reservaciones | **Omitidas en esta iteración** para una versión futura. No se crean tablas ni módulos. |
| D7 | Sistema de plugins | **Todos los módulos —nuevos y anteriores— son plugins instalables/desinstalables desde la UI de la App** (ver sección 6). |

## 5. Inventario de módulos

### 5.1 Reutilizados completamente (sin cambios funcionales)

| Módulo | Notas |
|---|---|
| Autenticación / Sesiones / Usuarios / Roles / Permisos | RBAC existente (`SystemService.js`, `PermissionService.js`, `AuthenticationService.js`) |
| Configuración (Settings) | Se conserva |
| Exportación / Importación | Se extienden en Fase 11 con nuevas entidades |
| Inventario comercial (suplementos, bebidas, ropa, accesorios, snacks, proteína, creatina) | Lógica sin cambios |
| Ventas | Se conserva; etiqueta de cliente pasa a "Miembro" |
| Compras / Proveedores | Se conservan |
| Contabilidad | Se conserva (no se elimina). Los pagos de membresía generan asiento opcional |
| Auditoría / Tema claro-oscuro / Utilidades / Componentes UI / Formularios / Validaciones / Helpers | Sin cambios |

### 5.2 Adaptados

| Módulo | Adaptación |
|---|---|
| **Clientes → Miembros** | Renombrar `Customer*` → `Member*`. Agregar: fotografía, objetivo físico, entrenador asignado, fecha de ingreso, membresía, estado. Mantener toda la funcionalidad existente. |
| **Dashboard** | No reescribir estructura/componentes/servicios. Cambiar únicamente los indicadores (ver 5.4). |
| **Reportes** | Extender (no crear sistema paralelo). |
| **Export/Import** | Extender con las entidades nuevas (no crear servicios nuevos). |

### 5.3 Módulos nuevos (solo los que OpenRootERP no posee)

| Módulo | Fase | Alcance |
|---|---|---|
| Sistema de Plugins | 1 | Registro, instalación/desinstalación desde la UI |
| Membresías | 3 | Planes, renovaciones, suspensión, congelamiento, historial, vencimientos, pagos |
| Asistencias | 5 | Registro manual, historial, estadísticas |
| Entrenadores | 6 | Especialidad, horario, clientes asignados |
| Evolución Física | 7 | Peso, IMC, grasa, músculo, cintura, pecho, brazo, pierna; fotografías, historial, gráficas, comparaciones |
| Activos del Gimnasio | 8 | Independiente de Inventario Comercial. Caminadoras, bicicletas, poleas, máquinas, bancos, mancuernas, barras, discos, jaulas, lockers. Registro: código, serie, marca, modelo, garantía, fecha compra, estado, ubicación, responsable, fotos, manual |
| Mantenimiento | 9 | Relacionado solo con Activos. Preventivo, correctivo, limpieza, lubricación, cambio de piezas, costos, próximo mantenimiento, historial |

### 5.4 Dashboard — indicadores nuevos

- Miembros activos
- Membresías próximas a vencer (próximos 7 días)
- Ingresos del día (ventas + pagos de membresía)
- Ingresos del mes
- Asistencia diaria
- Mantenimientos pendientes
- Productos más vendidos

Se conservan las 2 gráficas existentes (Ventas Mensuales, Productos por Categoría).

### 5.5 Omitidos (versión futura)

- **Clases** (yoga, crossfit, spinning, funcional, cardio) y **Reservaciones** (clases, entrenadores, áreas).
- **Asistencia por QR / código de barras / escáner USB** (solo manual por ahora).

### 5.6 Poda diferida (no ejecutar; solo documentar candidatos)

- Contabilidad avanzada (balance, estado de resultados) — si no aporta valor al gimnasio.
- Compras avanzadas / Proveedores — solo si el gimnasio no reabastece inventario comercial.
- Cualquier eliminación requiere verificar dependencias, pruebas y reutilización antes.

## 6. Sistema de Plugins (decisión D7)

Todos los módulos (nuevos y anteriores) se registran como **plugins** y son
**instalables / desinstalables desde la UI de la App**.

### 6.1 Concepto

- **Registro de plugins**: metadatos por módulo — `id`, `label`, `icon`, `group`,
  `defaultEnabled`, `tables` (tablas de datos que posee), `viewPermission` (permiso para
  verlo en el menú), `requires` (dependencias), `required` (si no se puede desinstalar).
- **Estado habilitado**: se guarda en la tabla `settings` con clave `module.<id>.enabled`
  (`'1'`/`'0'`). Ausencia → `defaultEnabled`.
- **Desinstalar** = ocultar del menú + eliminar las filas de sus tablas propias (dentro de una
  transacción Dexie) + revocar sus permisos de rol. **Reinstalar** = habilitar de nuevo.
- **Dependencias**: no se permite desinstalar un módulo que otro módulo habilitado requiere.
  Ejemplo: `products` es requerido por `sales`, `inventory`, `purchases`, `reports`.
- **Núcleo no desinstalable** (`required: true`): `dashboard`, `settings`, `plugins`,
  `exports`, `imports`, `reports`.

### 6.2 Permisos nuevos

```
memberships.view|create|edit|delete|payments.create
attendance.view|create|delete
trainers.view|create|edit|delete
evolution.view|create|edit|delete
assets.view|create|edit|delete
maintenance.view|create|edit|delete
plugins.manage
```

- Rol **Administrador**: recibe todos los permisos (ya asignado por construcción).
- Rol **Vendedor**: recibe solo `memberships.view`, `attendance.view|create`,
  `trainers.view`, `evolution.view`, `assets.view`, `maintenance.view`.

### 6.3 Visibilidad en menú

- El ítem del sidebar se muestra si: plugin **habilitado** AND (sin `viewPermission` OR el rol
  tiene el permiso). Esto usa `PermissionService.getPermissionsForRole(roleId)` cargado una vez.
- `plugins` solo visible para el rol Administrador.

## 7. Esquema de base de datos — `OpenRootGym` (v1)

Base Dexie nueva. Se conservan todas las tablas del ERP (renombrando `customers` → `members`).
Las tablas de los módulos nuevos existen desde la v1 aunque el módulo esté desinstalado.

```js
db.version(1).stores({
  // --- ERP (conservado) ---
  products:            '++id, &code, name, category, active, stock, createdAt, updatedAt',
  members:             '++id, &documentId, name, email, phone, photo, physicalGoal, assignedTrainerId, joinDate, membershipId, status, active, createdAt, updatedAt',
  suppliers:           '++id, &documentId, name, email, phone, active, createdAt, updatedAt',
  sales:               '++id, date, customerId, status, createdAt, updatedAt, [customerId+date]',
  saleItems:           '++id, saleId, productId, [saleId+productId]',
  purchases:           '++id, date, supplierId, status, createdAt, updatedAt, [supplierId+date]',
  purchaseItems:       '++id, purchaseId, productId, [purchaseId+productId]',
  inventoryMovements:  '++id, productId, date, type, reference, referenceId, [productId+date]',
  settings:            '++id, &key',
  users:               '++id, &username, roleId, active, createdAt, updatedAt',
  roles:               '++id, &name, active, createdAt, updatedAt',
  permissions:         '++id, &name, description, createdAt',
  rolePermissions:     '++id, roleId, permissionId, [roleId+permissionId]',
  sessions:            '++id, userId, &token, createdAt, expiresAt, lastAccess',
  accounts:            '++id, &code, name, type, active, createdAt, updatedAt',
  accountingEntries:   '++id, date, description, referenceType, referenceId, createdAt, [referenceType+referenceId]',

  // --- Membresías ---
  membershipPlans:     '++id, &name, active, createdAt, updatedAt',
  memberships:         '++id, memberId, planId, startDate, endDate, status, active, createdAt, updatedAt, [status+endDate]',
  membershipHistory:   '++id, membershipId, memberId, type, date, notes, createdAt',
  membershipPayments:  '++id, membershipId, memberId, amount, method, date, notes, accountingEntryId, createdAt, [memberId+date]',

  // --- Asistencias ---
  attendance:          '++id, memberId, date, [memberId+date], createdAt',

  // --- Entrenadores ---
  trainers:            '++id, &documentId, name, email, phone, specialty, schedule, active, createdAt, updatedAt',

  // --- Evolución física ---
  physicalEvolutions:  '++id, memberId, date, [memberId+date], createdAt',

  // --- Activos y mantenimiento ---
  gymAssets:           '++id, &code, name, type, serial, brand, model, warrantyUntil, purchaseDate, purchasePrice, status, location, responsible, photos, manual, notes, createdAt, updatedAt',
  maintenance:         '++id, assetId, type, date, cost, description, nextDate, status, createdAt, updatedAt, [assetId+date]'
})
```

> Notas:
> - `sales.customerId` y `saleItems` se conservan tal cual; la UI etiqueta "Miembro".
> - No se crean tablas de `classes` ni `reservations` (versión futura).

## 8. Seed de datos demo (gimnasio)

Sustituir el seed de ERP por datos de gimnasio conservando el mismo patrón e idempotencia:

- **Productos** (10): suplementos, proteína, creatina, bebidas, ropa deportiva, accesorios,
  snacks (con `purchasePrice`, `salePrice`, `stock`, `stockMin`).
- **Miembros** (5–6): con `documentId`, `name`, `email`, `phone`, `status`, `joinDate`,
  `physicalGoal`, `assignedTrainerId` (nullable), `membershipId` (nullable).
- **Proveedores** (3), **Settings** (misma estructura), **Cuentas contables** (misma estructura).
- **Planes de membresía** (3): p. ej. Básico 30 días, Premium 90 días, Anual 365 días.
- **Entrenadores** (2–3) y **Activos** (4–6): caminadora, bicicleta, polea, banco, mancuernas, barra.
- Transacciones demo (ventas, compras) y asientos contables como el seed actual, pero con
  productos de gimnasio y miembros.

## 9. Plan por fases (incremental y verificable)

Cada fase cierra con `npm test` en verde (unitarias + integración). Las fases que tocan UI
también corren `npm run test:e2e`. Cada módulo nuevo se registra en `sw.js` (precache) y en
`tests/run-all.js`.

| Fase | Contenido | Estado |
|---|---|---|
| **F1** | Rebranding + base `OpenRootGym` (schema v1) + sistema de plugins + permisos + seed gimnasio | ✅ Completada (2026-08-04). `npm test` 46/46, `test:e2e` 38/38, smoke plugins 8/8 |
| **F2** | Miembro: rename `Customer→Member` + campos nuevos + tests | ✅ Completada (2026-08-04) |
| **F3** | Membresías: planes, membresías, historial, pagos, vencimientos + tests | ✅ Completada (2026-08-04). `npm test` 47/49 (2 preexistentes), `test:e2e` pendiente |
| **F4** | Dashboard adaptado (KPIs de gimnasio) + tests | ⬜ Pendiente |
| **F5** | Asistencias (solo manual) + tests | ✅ Completada (2026-08-04) |
| **F6** | Entrenadores + tests | ✅ Completada (2026-08-04) |
| **F7** | Evolución física + tests | ✅ Completada (2026-08-04) |
| **F8** | Activos del gimnasio + tests | ✅ Completada (2026-08-04) |
| **F9** | Mantenimiento (solo activos) + tests | ✅ Completada (2026-08-04) |
| **F10** | Reportes extendidos (membresías, asistencia, entrenadores, evolución, mantenimiento) + tests | ✅ Completada (2026-08-04) |
| **F11** | Export/Import extendidos (nuevas entidades) + tests | ✅ Completada (2026-08-04) |
| **F12** | Docs (README, ROADMAP, ARCHITECTURE, PROJECT_STATE, CONTEXT, NEXT_CHAT, QA, CHANGELOG) + candidatos a OpenRoot Core + validación final completa | ⬜ Pendiente |

## 10. Registro de cambios por fase

Para cada fase se documenta:

- **Archivos reutilizados** — por qué.
- **Archivos modificados** — qué cambió.
- **Archivos eliminados** — justificación (ninguno en esta iteración).
- **Archivos nuevos** — justificación.

## 11. Compatibilidad futura — candidatos a "OpenRoot Core"

Identificar y documentar (no implementar) componentes reutilizables por el ecosistema
(OpenRootERP, OpenRootSchool, OpenRootClinic, OpenRootPOS):

- Autenticación + RBAC + sesiones (`AuthenticationService`, `PermissionService`, `SessionService`).
- Componentes UI: `Form`, `Table`, `Modal`, `Pagination`, `SearchBar`, `Sidebar`, `Header`,
  `Toast`, `ConfirmDialog`, `Loader`.
- Utilidades: `helpers`, `validators`, `sanitizer`, `errors`, `formatters`, `ThemeManager`.
- Patrón `Model → Repository → Service → Controller → View` + DI manual en `app.js`.
- Exportación/Importación CSV/JSON con auto-detección y round-trip.
- Sistema de Plugins (sección 6) y gestor de temas claro/oscuro.
- Service Worker con precache y estrategias offline.

## 12. Riesgos y notas

- **Rename `Customer→Member`**: cambio de mayor superficie; se ejecuta en una fase propia
  con tests en verde antes de continuar.
- **Fotos / base64 en IndexedDB**: sin problema de tamaño para uso local; documentar límite.
- **`customers → members`**: Ventas sigue usando `customerId`; se conserva la columna y la UI
  etiqueta "Miembro".
- **Escáner QR/código de barras**: el input manual aceptará el código escaneado; el escáner
  USB queda en roadmap.
- **Clases / Reservaciones**: omitidas; registradas como futuros plugins en el roadmap.

## 13. Glosario

- **Plugin**: módulo registrado en el sistema de plugins, instalable/desinstalable desde la UI.
- **Asiento simple**: asiento contable de doble partida opcional para pagos de membresía.
- **Estado de membresía**: `active | frozen | suspended | expired | cancelled`.
- **Estado de miembro**: `active | inactive | suspended | expired`.
