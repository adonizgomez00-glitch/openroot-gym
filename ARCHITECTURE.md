# ARCHITECTURE — Open RootERP

**Versión:** 1.0.0  
**Estado:** Primer lanzamiento público — 14 módulos funcionales, QA completo

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| UI | HTML5 + CSS3 (Custom Properties, Grid, Flexbox) |
| Lógica | JavaScript ES Modules (sin frameworks) |
| Persistencia | IndexedDB vía Dexie.js |
| Offline | Service Worker + Cache API |
| Almacenamiento | localStorage (preferencias de usuario) |

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────┐
│                    index.html                        │
│                      (SPA)                          │
├─────────────────────────────────────────────────────┤
│                     app.js                           │
│              Router + Bootstrap                      │
├──────────┬──────────┬──────────┬────────────────────┤
│  Views   │Controllers│ Services │   Repositories     │
│ (render) │ (orquest)│(negocio) │     (datos)         │
├──────────┴──────────┴──────────┴────────────────────┤
│                    Database                           │
│              Dexie + IndexedDB                       │
├─────────────────────────────────────────────────────┤
│              Service Worker (sw.js)                  │
│               Cache API + Offline                    │
└─────────────────────────────────────────────────────┘
```

### Flujo de datos

```
Usuario interactúa
       ↓
    View (dispara evento)
       ↓
    Controller (recibe evento, llama a Service)
       ↓
    Service (valida, aplica reglas de negocio)
       ↓
    Repository (persiste/consulta en Dexie)
       ↓
    Database (IndexedDB)
       ↓
    Respuesta → Service → Controller → View (actualiza UI)
```

**Regla fundamental:** La View NUNCA accede directamente al Repository o Database. Todo pasa por Controller → Service → Repository.

---

## Estructura de Directorios

```
OpenRoot-ERP/
│
├── index.html                 # Entry point SPA
├── manifest.json              # PWA manifest
├── sw.js                      # Service Worker
│
├── assets/
│   ├── css/
│   │   ├── main.css           # Estilos generales
│   │   ├── variables.css      # Custom properties + tema oscuro
│   │   ├── reset.css          # Normalize / reset
│   │   ├── layout.css         # Grid, sidebar, header
│   │   ├── components.css     # Componentes reutilizables
│   │   └── utilities.css      # Clases de utilidad
│   ├── icons/                 # SVG icons
│   └── lib/                   # Librerías (Chart.js)
│
├── src/
│   ├── app.js                 # Bootstrap, router, init
│   │
│   ├── config/
│   │   └── app.js             # Constantes, configuración global
│   │
│   ├── database/
│   │   ├── db.js              # Instancia Dexie + schema v8
│   │   └── seed.js            # Datos de inicialización + cuentas contables
│   │
│   ├── models/
│   │   ├── Account.js         # Cuenta contable
│   │   ├── AccountingEntry.js # Asiento contable
│   │   ├── Attendance.js      # Asistencia de miembro
│   │   ├── Customer.js        # Cliente (legacy alias)
│   │   ├── GymAsset.js        # Activo del gimnasio
│   │   ├── InventoryMovement.js
│   │   ├── Maintenance.js     # Mantenimiento de activo
│   │   ├── Member.js          # Miembro del gimnasio
│   │   ├── Membership.js      # Membresía de miembro
│   │   ├── MembershipHistory.js # Historial de cambios de membresía
│   │   ├── MembershipPayment.js # Pago de membresía
│   │   ├── MembershipPlan.js  # Plan de membresía
│   │   ├── Permission.js      # Permiso RBAC
│   │   ├── PhysicalEvolution.js # Evolución física de miembro
│   │   ├── Product.js         # Producto
│   │   ├── Purchase.js        # Compra
│   │   ├── PurchaseItem.js    # Ítem de compra
│   │   ├── Role.js            # Rol RBAC
│   │   ├── RolePermission.js  # Relación rol-permiso
│   │   ├── Sale.js            # Venta
│   │   ├── SaleItem.js        # Ítem de venta
│   │   ├── Session.js         # Sesión de usuario
│   │   ├── Setting.js         # Configuración del sistema
│   │   ├── Supplier.js        # Proveedor
│   │   ├── Trainer.js         # Entrenador del gimnasio
│   │   └── User.js            # Usuario del sistema
│   │
│   ├── repositories/
│   │   ├── AccountingRepository.js
│   │   ├── AttendanceRepository.js
│   │   ├── CustomerRepository.js
│   │   ├── GymAssetRepository.js
│   │   ├── InventoryRepository.js
│   │   ├── MaintenanceRepository.js
│   │   ├── MemberRepository.js
│   │   ├── MembershipHistoryRepository.js
│   │   ├── MembershipPaymentRepository.js
│   │   ├── MembershipPlanRepository.js
│   │   ├── MembershipRepository.js
│   │   ├── PermissionRepository.js
│   │   ├── PhysicalEvolutionRepository.js
│   │   ├── ProductRepository.js
│   │   ├── PurchaseRepository.js
│   │   ├── ReportRepository.js
│   │   ├── RoleRepository.js
│   │   ├── SaleRepository.js
│   │   ├── SessionRepository.js
│   │   ├── SettingRepository.js
│   │   ├── SupplierRepository.js
│   │   ├── TrainerRepository.js
│   │   └── UserRepository.js
│   │
│   ├── services/
│   │   ├── AccountingService.js
│   │   ├── AttendanceService.js
│   │   ├── AuthenticationService.js
│   │   ├── CustomerService.js
│   │   ├── DashboardService.js
│   │   ├── ExportService.js
│   │   ├── GymAssetService.js
│   │   ├── ImportService.js
│   │   ├── InventoryService.js
│   │   ├── MaintenanceService.js
│   │   ├── MemberService.js
│   │   ├── MembershipHistoryService.js
│   │   ├── MembershipPaymentService.js
│   │   ├── MembershipPlanService.js
│   │   ├── MembershipService.js
│   │   ├── PasswordService.js
│   │   ├── PaymentService.js
│   │   ├── PermissionService.js
│   │   ├── PhysicalEvolutionService.js
│   │   ├── PluginService.js
│   │   ├── ProductService.js
│   │   ├── PurchaseService.js
│   │   ├── ReportService.js
│   │   ├── SaleService.js
│   │   ├── SessionService.js
│   │   ├── SettingService.js
│   │   ├── SupplierService.js
│   │   ├── SystemService.js
│   │   ├── TrainerService.js
│   │   └── UserService.js
│   │
│   ├── controllers/
│   │   ├── AccountingController.js
│   │   ├── AttendanceController.js
│   │   ├── CustomerController.js
│   │   ├── DashboardController.js
│   │   ├── ExportController.js
│   │   ├── GymAssetController.js
│   │   ├── ImportController.js
│   │   ├── InventoryController.js
│   │   ├── LoginController.js
│   │   ├── MaintenanceController.js
│   │   ├── MemberController.js
│   │   ├── MembershipController.js
│   │   ├── MembershipHistoryController.js
│   │   ├── MembershipPaymentController.js
│   │   ├── MembershipPlanController.js
│   │   ├── PhysicalEvolutionController.js
│   │   ├── PluginsController.js
│   │   ├── ProductController.js
│   │   ├── PurchaseController.js
│   │   ├── ReportController.js
│   │   ├── SaleController.js
│   │   ├── SettingsController.js
│   │   ├── SetupController.js
│   │   ├── SupplierController.js
│   │   ├── TrainerController.js
│   │   └── UserController.js
│   │
│   ├── views/
│   │   ├── AccountingView.js
│   │   ├── AttendanceView.js
│   │   ├── CustomerView.js
│   │   ├── DashboardView.js
│   │   ├── ExportView.js
│   │   ├── GymAssetView.js
│   │   ├── ImportView.js
│   │   ├── InventoryView.js
│   │   ├── LoginView.js
│   │   ├── MaintenanceView.js
│   │   ├── MemberView.js
│   │   ├── MembershipView.js
│   │   ├── MembershipHistoryView.js
│   │   ├── MembershipPaymentView.js
│   │   ├── MembershipPlanView.js
│   │   ├── PhysicalEvolutionView.js
│   │   ├── PluginsView.js
│   │   ├── ProductView.js
│   │   ├── PurchaseFormView.js
│   │   ├── PurchaseView.js
│   │   ├── ReportView.js
│   │   ├── ReportSalesView.js
│   │   ├── ReportPurchasesView.js
│   │   ├── ReportStockView.js
│   │   ├── ReportTrainersView.js
│   │   ├── ReportGymAssetsView.js
│   │   ├── ReportMaintenanceView.js
│   │   ├── SaleFormView.js
│   │   ├── SaleView.js
│   │   ├── SettingsView.js
│   │   ├── SetupView.js
│   │   ├── SupplierView.js
│   │   ├── TrainerView.js
│   │   └── UserView.js
│   │
│   ├── components/
│   │   ├── ConfirmDialog.js   # Confirmación (con ARIA)
│   │   ├── Form.js            # Formulario genérico (con ARIA)
│   │   ├── Header.js          # Barra superior
│   │   ├── Loader.js          # Indicador de carga
│   │   ├── Modal.js           # Modal reutilizable (focus trap)
│   │   ├── Pagination.js      # Paginación (con ARIA)
│   │   ├── SearchBar.js       # Búsqueda (role search)
│   │   ├── Sidebar.js         # Navegación lateral (arrow keys)
│   │   ├── Table.js           # Tabla genérica (con ARIA)
│   │   └── Toast.js           # Notificaciones (role alert)
│   │
│   ├── store/
│   │   └── AppState.js        # Estado global de la aplicación
│   │
│   └── utils/
│       ├── errors.js          # Manejo de errores
│       ├── formatters.js      # Formatos (moneda, fecha, etc.)
│       ├── helpers.js         # Funciones auxiliares
│       ├── sanitizer.js       # Sanitización de entradas (XSS)
│       ├── ThemeManager.js    # Gestor de tema claro/oscuro
│       └── validators.js      # Validaciones de datos
│
├── tests/
│   ├── run-all.js             # Test runner custom
│   ├── runner.html            # Test runner HTML
│   ├── components/
│   │   └── Form.test.js
│   ├── controllers/           # 17 suites de controladores
│   ├── integration/           # 9 suites de integración
│   ├── repositories/          # Tests con mock de Dexie
│   ├── services/              # 24 suites de servicios
│   └── utils/                 # 5 suites de utilidades
│
├── ROADMAP.md
├── ARCHITECTURE.md
├── TODO.md
└── package.json
```

---

## Patrones Arquitectónicos

### MVC (Model-View-Controller)

| Capa | Responsabilidad |
|------|----------------|
| **Model** | Define la estructura de datos (archivos en `models/`) |
| **View** | Renderiza HTML, maneja eventos del DOM, delega en Controller |
| **Controller** | Orquesta la comunicación entre View y Service |

### Repository Pattern

Los repositorios encapsulan el acceso a datos. Solo ellos conocen Dexie.

```js
// Ejemplo conceptual
class ProductRepository {
  async findAll() { /* Dexie query */ }
  async findById(id) { /* Dexie query */ }
  async create(data) { /* Dexie transaction */ }
  async update(id, data) { /* Dexie transaction */ }
  async delete(id) { /* Dexie transaction */ }
}
```

### Service Pattern

Los servicios contienen la lógica de negocio. Operan sobre repositorios.

```js
// Ejemplo conceptual
class SaleService {
  constructor(productRepo, saleRepo, inventoryRepo) { /* DI */ }
  async createSale(saleData) {
    // Validar negocio
    // Calcular totales
    // Actualizar inventario
    // Persistir venta
  }
}
```

### Inyección de Dependencias (manual)

No hay framework DI. Las dependencias se inyectan manualmente en el constructor.

```js
const productRepo = new ProductRepository(db);
const inventoryRepo = new InventoryRepository(db);
const saleRepo = new SaleRepository(db);
const saleService = new SaleService(productRepo, saleRepo, inventoryRepo);
const saleController = new SaleController(saleService, saleView);
```

---

## Base de Datos (Dexie Schema)

### Colecciones

| Tabla | Key | Índices |
|-------|-----|---------|
| `products` | `++id` | `code`, `name`, `category`, `active` |
| `customers` | `++id` | `documentId`, `name`, `email`, `active` |
| `suppliers` | `++id` | `documentId`, `name`, `email`, `active` |
| `sales` | `++id` | `date`, `customerId`, `status` |
   | `saleItems` | `++id` | `saleId`, `productId` |
   | `purchases` | `++id` | `date`, `supplierId`, `status` |
   | `purchaseItems` | `++id` | `purchaseId`, `productId` |
   | `inventoryMovements` | `++id` | `productId`, `date`, `type` |
   | `settings` | `++id` | `key` |
   | `accounts` | `++id` | `code`, `name`, `type`, `active` |
   | `accountingEntries` | `++id` | `date`, `description`, `referenceType`, `referenceId` |
   | `members` | `++id` | `documentId`, `name`, `email`, `active` |
   | `membershipPlans` | `++id` | `name`, `active` |
   | `memberships` | `++id` | `memberId`, `startDate`, `endDate`, `status`, `active` |
   | `membershipHistory` | `++id` | `membershipId`, `type`, `date` |
   | `membershipPayments` | `++id` | `membershipId`, `amount`, `method`, `date` |
   | `attendance` | `++id` | `memberId`, `date`, `time` |
   | `trainers` | `++id` | `documentId`, `name`, `specialty`, `active` |
   | `physicalEvolutions` | `++id` | `memberId`, `date` |
   | `gymAssets` | `++id` | `code`, `name`, `type`, `status` |
   | `maintenance` | `++id` | `assetId`, `date`, `type`, `status` |
    | `plugins` | `++id` | `name`, `active` |
    | `users` | `++id` | `username`, `email`, `roleId`, `active` |
    | `roles` | `++id` | `name`, `active` |
    | `permissions` | `++id` | `name`, `description`, `module` |
    | `rolePermissions` | `++id` | `roleId`, `permissionId` |
    | `sessions` | `++id` | `token`, `userId`, `expiresAt` |

### Relaciones lógicas

```
products 1──N saleItems N──1 sales
products 1──N purchaseItems N──1 purchases
products 1──N inventoryMovements
sales N──1 customers
purchases N──1 suppliers
accounts 1──N accountingEntries (via items[])
sales 1──1 accountingEntries (auto-generated)
purchases 1──1 accountingEntries (auto-generated)
members 1──N memberships
membershipPlans 1──N memberships
memberships 1──N membershipHistory
memberships 1──N membershipPayments
members 1──N attendance
members 1──N physicalEvolutions
gymAssets 1──N maintenance
users N──1 roles
roles N──N permissions (via rolePermissions)
```

---

## Seguridad (OWASP)

| Medida | Aplicación |
|--------|-----------|
| Sanitización de entradas | `sanitizer.js` — escapar HTML, validar tipos |
| Sin innerHTML | Usar `textContent`, `createElement`, templates |
| Sin eval() | Prohibido explícitamente |
| Validación en capas | View valida formato, Service valida negocio, Repository valida integridad |
| Logs seguros | No registrar datos sensibles |
| Principio mínimo privilegio | Cada servicio solo accede a sus repositorios |

---

## Offline Strategy

1. **Service Worker** intercepta requests y sirve desde Cache API
2. **Primera carga**: se cachean todos los assets (App Shell pattern)
3. **Datos**: IndexedDB es offline por naturaleza
4. **Estrategia cache**: Cache First para assets, Network First solo si hay conectividad futura

---

## Testing Strategy

| Tipo | Herramienta | Objetivo |
|------|-------------|----------|
| Unitarios | Custom runner (`tests/run-all.js`) | Services, Controllers, Repositories, Components, Utils |
| Integración | Custom runner | Flujos completos (venta/compra/contabilidad/import-export) |
| Seguridad | Revisión manual | Validar OWASP Top 10 |

**Total actual: 59 suites · 440+ tests · 0 fallos**

Cada función debe ser:
- Determinística
- Pequeña (< 40 líneas)
- Independiente
- Fácil de mockear
