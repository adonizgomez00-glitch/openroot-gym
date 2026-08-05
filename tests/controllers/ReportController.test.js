import { ReportController } from '../../src/controllers/ReportController.js'

function createMockService() {
  return {
    async getSummary() {
      return { products: 10, customers: 5, suppliers: 3, sales: 20, purchases: 8 }
    },

    async getSalesReport(start, end) {
      return {
        items: [{ id: 1, date: '2026-07-01', customerName: 'Test', total: 118, status: 'completed' }],
        summary: { total: 1, completed: 1, cancelled: 0, totalAmount: 118, totalTax: 18 }
      }
    },

    async getPurchasesReport(start, end) {
      return {
        items: [{ id: 1, date: '2026-07-02', supplierName: 'Prov', total: 354, status: 'completed' }],
        summary: { total: 1, completed: 1, cancelled: 0, totalAmount: 354, totalTax: 54 }
      }
    },

    async getStockReport() {
      return {
        items: [
          { id: 1, code: 'P001', name: 'Producto 1', category: 'A', stock: 10, stockMin: 5, status: 'ok' }
        ],
        summary: { total: 1, ok: 1, low: 0, critical: 0 }
      }
    },

    async getMembershipsReport(start, end) {
      return {
        items: [{ id: 1, startDate: '2026-07-01', endDate: '2026-08-01', status: 'active', price: 5000 }],
        summary: { total: 1, active: 1, expired: 0, frozen: 0, totalPayments: 1 }
      }
    },

    async getAttendanceReport(start, end) {
      return {
        items: [{ id: 1, memberId: 'M001', date: '2026-07-01', time: '08:00' }],
        summary: { total: 1 }
      }
    },

    async getTrainersReport() {
      return {
        items: [{ documentId: 'D001', name: 'Trainer 1', email: 't1@test.com', specialty: 'Fuerza', active: true }],
        summary: { total: 1, active: 1, inactive: 0, bySpecialty: { Fuerza: 1 } }
      }
    },

    async getGymAssetsReport() {
      return {
        items: [{ code: 'A001', name: 'Asset 1', type: 'Cardio', brand: 'Brand', model: 'M1', purchasePrice: 1000, status: 'activo', location: 'Sala A' }],
        summary: { total: 1, active: 1, maintenance: 0, retired: 0, totalValue: 1000 }
      }
    },

    async getMaintenanceReport(start, end) {
      return {
        items: [{ assetId: 1, date: '2026-07-01', type: 'Preventivo', cost: 500, description: 'Test', nextDate: '2026-08-01', status: 'completado' }],
        summary: { total: 1, pending: 0, inProgress: 0, completed: 1, cancelled: 0, totalCost: 500 }
      }
    }
  }
}

function createMockView() {
  return {
    summaryData: null,
    activeTab: null,
    dateInputsVisible: true,
    resultsCleared: false,
    lastRendered: null,
    loadingState: false,
    errorMessage: null,

    reset() {
      this.summaryData = null
      this.activeTab = null
      this.dateInputsVisible = true
      this.resultsCleared = false
      this.lastRendered = null
      this.loadingState = false
      this.errorMessage = null
    },

    render(container) { this._container = container },

    updateSummary(summary) { this.summaryData = summary },

    updateActiveTab(tab) { this.activeTab = tab },

    showDateInputs(show) { this.dateInputsVisible = show },

    clearResults() { this.resultsCleared = true },

    getDateRange() { return { startDate: '2026-07-01', endDate: '2026-07-31' } },

    renderSalesReport(report) { this.lastRendered = 'sales' },
    renderPurchasesReport(report) { this.lastRendered = 'purchases' },
    renderStockReport(report) { this.lastRendered = 'stock' },
    renderMembershipsReport(report) { this.lastRendered = 'memberships' },
    renderAttendanceReport(report) { this.lastRendered = 'attendance' },
    renderTrainersReport(report) { this.lastRendered = 'trainers' },
    renderGymAssetsReport(report) { this.lastRendered = 'gymAssets' },
    renderMaintenanceReport(report) { this.lastRendered = 'maintenance' },

    showLoading() { this.loadingState = true },
    hideLoading() { this.loadingState = false },

    showError(msg) { this.errorMessage = msg },

    onTabChange(cb) { this._tabCb = cb },
    onGenerateReport(cb) { this._generateCb = cb }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testInitLoadsSalesTab() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ReportController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.summaryData !== null, 'init debería cargar summary')
  assert(view.summaryData.products === 10, 'summary debería tener products')
  assert(view.activeTab === 'sales', 'init debería activar tab de ventas')

  console.log('  ✓ testInitLoadsSalesTab')
}

async function testTabChangeToStock() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ReportController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  view.reset()
  await controller.handleTabChange('stock')

  assert(view.activeTab === 'stock', 'handleTabChange debería activar tab stock')
  assert(view.dateInputsVisible === false, 'stock tab debería ocultar date inputs')
  assert(view.lastRendered === 'stock', 'stock tab debería cargar reporte de stock')

  console.log('  ✓ testTabChangeToStock')
}

async function testGenerateSalesReport() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ReportController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  view.reset()
  await controller.handleGenerateReport('sales', { startDate: '2026-07-01', endDate: '2026-07-31' })

  assert(view.lastRendered === 'sales', 'generate sales debería renderizar reporte de ventas')

  console.log('  ✓ testGenerateSalesReport')
}

async function testGeneratePurchasesReport() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ReportController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  view.reset()
  await controller.handleGenerateReport('purchases', { startDate: '2026-07-01', endDate: '2026-07-31' })

  assert(view.lastRendered === 'purchases', 'generate purchases debería renderizar reporte de compras')

  console.log('  ✓ testGeneratePurchasesReport')
}

async function testGenerateStockReport() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ReportController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  view.reset()
  await controller.handleGenerateReport('stock', {})

  assert(view.lastRendered === 'stock', 'generate stock debería renderizar reporte de stock')

  console.log('  ✓ testGenerateStockReport')
}

async function testTabChangeToTrainers() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ReportController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  view.reset()
  await controller.handleTabChange('trainers')

  assert(view.activeTab === 'trainers', 'handleTabChange debería activar tab trainers')
  assert(view.dateInputsVisible === false, 'trainers tab debería ocultar date inputs')
  assert(view.lastRendered === 'trainers', 'trainers tab debería cargar reporte de entrenadores')

  console.log('  ✓ testTabChangeToTrainers')
}

async function testTabChangeToGymAssets() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ReportController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  view.reset()
  await controller.handleTabChange('gymAssets')

  assert(view.activeTab === 'gymAssets', 'handleTabChange debería activar tab gymAssets')
  assert(view.dateInputsVisible === false, 'gymAssets tab debería ocultar date inputs')
  assert(view.lastRendered === 'gymAssets', 'gymAssets tab debería cargar reporte de activos')

  console.log('  ✓ testTabChangeToGymAssets')
}

async function testTabChangeToMaintenance() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ReportController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  view.reset()
  await controller.handleTabChange('maintenance')

  assert(view.activeTab === 'maintenance', 'handleTabChange debería activar tab maintenance')
  assert(view.dateInputsVisible === true, 'maintenance tab debería mostrar date inputs')
  assert(view.lastRendered === 'maintenance', 'maintenance tab debería cargar reporte de mantenimiento')

  console.log('  ✓ testTabChangeToMaintenance')
}

async function testHandleTabChangeError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ReportController(service, view)

  service.getSummary = async () => { throw new Error('Error al cargar resumen') }

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.errorMessage === 'Error al cargar resumen', 'handleTabChange debería mostrar error')

  console.log('  ✓ testHandleTabChangeError')
}

async function testHandleGenerateReportError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ReportController(service, view)

  service.getSalesReport = async () => { throw new Error('Error al generar reporte') }

  const container = document.createElement('div')
  await controller.init(container)

  view.reset()
  await controller.handleGenerateReport('sales', { startDate: '2026-07-01', endDate: '2026-07-31' })

  assert(view.errorMessage === 'Error al generar reporte', 'handleGenerateReport debería mostrar error')

  console.log('  ✓ testHandleGenerateReportError')
}

export async function runReportControllerTests() {
  console.log('\n--- ReportController Tests ---\n')

  await testInitLoadsSalesTab()
  await testTabChangeToStock()
  await testGenerateSalesReport()
  await testGeneratePurchasesReport()
  await testGenerateStockReport()
  await testTabChangeToTrainers()
  await testTabChangeToGymAssets()
  await testTabChangeToMaintenance()
  await testHandleTabChangeError()
  await testHandleGenerateReportError()

  console.log('\n✓ Todos los tests de ReportController pasaron\n')
}
