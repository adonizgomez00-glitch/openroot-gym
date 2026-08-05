import { DashboardService } from '../../src/services/DashboardService.js'

function createMockRepo(overrides = {}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return {
    products: [],

    async findAll() { return [...this.products] },

    async count() {
      if (overrides.countThrow) throw new Error('Error de conteo')
      return this.products.length || 5
    },

    findByDateRange: overrides.findByDateRange || (async (start, end) => {
      return []
    }),

    getStockByProduct: overrides.getStockByProduct || (async () => 10),

    ...overrides
  }
}

function createMockMembershipRepo(overrides = {}) {
  return {
    findExpiringSoon: overrides.findExpiringSoon || (async (days) => []),
    findByDateRange: overrides.findByDateRange || (async (start, end) => []),

    ...overrides
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testGetKPIsReturnsAllKeys() {
  const saleRepo = createMockRepo()
  const purchaseRepo = createMockRepo()
  const productRepo = createMockRepo()
  const customerRepo = createMockRepo()
  const supplierRepo = createMockRepo()
  const inventoryRepo = createMockRepo()

  const membershipPlanRepo = createMockMembershipRepo()
  const membershipRepo = createMockMembershipRepo()
  const membershipPaymentRepo = createMockMembershipRepo({
    findByDateRange: async () => []
  })
  const attendanceRepo = createMockMembershipRepo({
    findByDateRange: async () => []
  })

  const service = new DashboardService(saleRepo, purchaseRepo, productRepo, customerRepo, supplierRepo, inventoryRepo, membershipPlanRepo, membershipRepo, membershipPaymentRepo, attendanceRepo)

  const kpis = await service.getKPIs()

  assert(typeof kpis.todaySales === 'number', 'todaySales debería ser número')
  assert(typeof kpis.todayRevenue === 'number', 'todayRevenue debería ser número')
  assert(typeof kpis.monthPurchases === 'number', 'monthPurchases debería ser número')
  assert(typeof kpis.monthPurchasesTotal === 'number', 'monthPurchasesTotal debería ser número')
  assert(typeof kpis.totalProducts === 'number', 'totalProducts debería ser número')
  assert(typeof kpis.totalMembers === 'number', 'totalMembers debería ser número')
  assert(typeof kpis.totalSuppliers === 'number', 'totalSuppliers debería ser número')
  assert(typeof kpis.lowStock === 'number', 'lowStock debería ser número')
  assert(typeof kpis.criticalStock === 'number', 'criticalStock debería ser número')
  assert(typeof kpis.membershipsExpiring === 'number', 'membershipsExpiring debería ser número')
  assert(typeof kpis.todayMembershipRevenue === 'number', 'todayMembershipRevenue debería ser número')
  assert(typeof kpis.monthMembershipRevenue === 'number', 'monthMembershipRevenue debería ser número')
  assert(typeof kpis.attendanceToday === 'number', 'attendanceToday debería ser número')

  console.log('  ✓ testGetKPIsReturnsAllKeys')
}

async function testGetKPIsWithSalesToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const saleRepo = createMockRepo({
    findByDateRange: async (start, end) => {
      return [
        { status: 'completed', total: 150 },
        { status: 'completed', total: 200 },
        { status: 'cancelled', total: 50 }
      ]
    }
  })

  const purchaseRepo = createMockRepo({
    findByDateRange: async () => []
  })

  const productRepo = createMockRepo({
    findAll: async () => [
      { id: 1, code: 'P001', name: 'Prod 1', stock: 10, stockMin: 5 },
      { id: 2, code: 'P002', name: 'Prod 2', stock: 0, stockMin: 3 }
    ]
  })

  const customerRepo = createMockRepo()
  const supplierRepo = createMockRepo()

  const inventoryRepo = createMockRepo({
    getStockByProduct: async () => 10
  })

  const membershipPlanRepo = createMockMembershipRepo()
  const membershipRepo = createMockMembershipRepo()
  const membershipPaymentRepo = createMockMembershipRepo({
    findByDateRange: async () => []
  })
  const attendanceRepo = createMockMembershipRepo({
    findByDateRange: async () => []
  })

  const service = new DashboardService(saleRepo, purchaseRepo, productRepo, customerRepo, supplierRepo, inventoryRepo, membershipPlanRepo, membershipRepo, membershipPaymentRepo, attendanceRepo)

  const kpis = await service.getKPIs()

  assert(kpis.todaySales === 2, 'todaySales debería ser 2 (completadas)')
  assert(kpis.todayRevenue === 350, 'todayRevenue debería ser 350')

  console.log('  ✓ testGetKPIsWithSalesToday')
}

async function testGetKPIsWithMonthPurchases() {
  const saleRepo = createMockRepo({
    findByDateRange: async () => []
  })

  const purchaseRepo = createMockRepo({
    findByDateRange: async () => [
      { status: 'completed', total: 500 },
      { status: 'completed', total: 300 },
      { status: 'cancelled', total: 100 }
    ]
  })

  const productRepo = createMockRepo({
    findAll: async () => []
  })

  const customerRepo = createMockRepo()
  const supplierRepo = createMockRepo()
  const inventoryRepo = createMockRepo()

  const membershipPlanRepo = createMockMembershipRepo()
  const membershipRepo = createMockMembershipRepo()
  const membershipPaymentRepo = createMockMembershipRepo({
    findByDateRange: async () => []
  })
  const attendanceRepo = createMockMembershipRepo({
    findByDateRange: async () => []
  })

  const service = new DashboardService(saleRepo, purchaseRepo, productRepo, customerRepo, supplierRepo, inventoryRepo, membershipPlanRepo, membershipRepo, membershipPaymentRepo, attendanceRepo)

  const kpis = await service.getKPIs()

  assert(kpis.monthPurchases === 2, 'monthPurchases debería ser 2 (completadas)')
  assert(kpis.monthPurchasesTotal === 800, 'monthPurchasesTotal debería ser 800')

  console.log('  ✓ testGetKPIsWithMonthPurchases')
}

async function testGetKPIsCounts() {
  const saleRepo = createMockRepo({ findByDateRange: async () => [] })
  const purchaseRepo = createMockRepo({ findByDateRange: async () => [] })

  const productRepo = createMockRepo({
    findAll: async () => [
      { id: 1, code: 'P001', name: 'A', stock: 10, stockMin: 5 },
      { id: 2, code: 'P002', name: 'B', stock: 2, stockMin: 5 }
    ]
  })

  const customerRepo = createMockRepo()
  const supplierRepo = createMockRepo()

  const inventoryRepo = createMockRepo({
    getStockByProduct: async (id) => id === 2 ? 2 : 10
  })

  const membershipPlanRepo = createMockMembershipRepo()
  const membershipRepo = createMockMembershipRepo()
  const membershipPaymentRepo = createMockMembershipRepo({
    findByDateRange: async () => []
  })
  const attendanceRepo = createMockMembershipRepo({
    findByDateRange: async () => []
  })

  const service = new DashboardService(saleRepo, purchaseRepo, productRepo, customerRepo, supplierRepo, inventoryRepo, membershipPlanRepo, membershipRepo, membershipPaymentRepo, attendanceRepo)

  const kpis = await service.getKPIs()

  assert(kpis.totalProducts === 2, 'totalProducts debería ser 2')
  assert(kpis.lowStock === 1, 'lowStock debería ser 1 (producto B está en mínimo)')

  console.log('  ✓ testGetKPIsCounts')
}

async function testGetKPIsAllCounts() {
  const saleRepo = createMockRepo({ findByDateRange: async () => [] })
  const purchaseRepo = createMockRepo({ findByDateRange: async () => [] })
  const productRepo = createMockRepo({ findAll: async () => [] })
  const customerRepo = createMockRepo()
  const supplierRepo = createMockRepo()
  const inventoryRepo = createMockRepo()

  const membershipPlanRepo = createMockMembershipRepo()
  const membershipRepo = createMockMembershipRepo()
  const membershipPaymentRepo = createMockMembershipRepo({
    findByDateRange: async () => []
  })
  const attendanceRepo = createMockMembershipRepo({
    findByDateRange: async () => []
  })

  const service = new DashboardService(saleRepo, purchaseRepo, productRepo, customerRepo, supplierRepo, inventoryRepo, membershipPlanRepo, membershipRepo, membershipPaymentRepo, attendanceRepo)

  const kpis = await service.getKPIs()
  assert(kpis.totalMembers === 5, 'totalMembers debería ser 5')
  assert(kpis.totalSuppliers === 5, 'totalSuppliers debería ser 5')

  console.log('  \u2713 testGetKPIsAllCounts')
}

async function testGetKPIsCriticalStock() {
  const saleRepo = createMockRepo({ findByDateRange: async () => [] })
  const purchaseRepo = createMockRepo({ findByDateRange: async () => [] })
  const productRepo = createMockRepo({
    findAll: async () => [
      { id: 1, stock: 0, stockMin: 3 },
      { id: 2, stock: 5, stockMin: 5 },
      { id: 3, stock: 10, stockMin: 0 }
    ]
  })
  const customerRepo = createMockRepo()
  const supplierRepo = createMockRepo()
  const inventoryRepo = createMockRepo({
    getStockByProduct: async (id) => {
      const stocks = { 1: 0, 2: 5, 3: 10 }
      return stocks[id]
    }
  })

  const membershipPlanRepo = createMockMembershipRepo()
  const membershipRepo = createMockMembershipRepo()
  const membershipPaymentRepo = createMockMembershipRepo({
    findByDateRange: async () => []
  })
  const attendanceRepo = createMockMembershipRepo({
    findByDateRange: async () => []
  })

  const service = new DashboardService(saleRepo, purchaseRepo, productRepo, customerRepo, supplierRepo, inventoryRepo, membershipPlanRepo, membershipRepo, membershipPaymentRepo, attendanceRepo)

  const kpis = await service.getKPIs()
  assert(kpis.criticalStock === 1, 'criticalStock debería ser 1 (producto 1 con stock 0 y stockMin > 0)')
  assert(kpis.totalProducts === 3, 'totalProducts debería ser 3')

  console.log('  \u2713 testGetKPIsCriticalStock')
}

async function testGetKPIsNoCompletedSales() {
  const saleRepo = createMockRepo({
    findByDateRange: async () => [
      { status: 'cancelled', total: 100 },
      { status: 'cancelled', total: 200 }
    ]
  })
  const purchaseRepo = createMockRepo({ findByDateRange: async () => [] })
  const productRepo = createMockRepo({ findAll: async () => [] })
  const customerRepo = createMockRepo()
  const supplierRepo = createMockRepo()
  const inventoryRepo = createMockRepo()

  const membershipPlanRepo = createMockMembershipRepo()
  const membershipRepo = createMockMembershipRepo()
  const membershipPaymentRepo = createMockMembershipRepo({
    findByDateRange: async () => []
  })
  const attendanceRepo = createMockMembershipRepo({
    findByDateRange: async () => []
  })

  const service = new DashboardService(saleRepo, purchaseRepo, productRepo, customerRepo, supplierRepo, inventoryRepo, membershipPlanRepo, membershipRepo, membershipPaymentRepo, attendanceRepo)

  const kpis = await service.getKPIs()
  assert(kpis.todaySales === 0, 'todaySales debería ser 0 si todas están canceladas')
  assert(kpis.todayRevenue === 0, 'todayRevenue debería ser 0 si todas están canceladas')

  console.log('  \u2713 testGetKPIsNoCompletedSales')
}

async function testGetKPIsNoCompletedPurchases() {
  const saleRepo = createMockRepo({ findByDateRange: async () => [] })
  const purchaseRepo = createMockRepo({
    findByDateRange: async () => [
      { status: 'cancelled', total: 500 }
    ]
  })
  const productRepo = createMockRepo({ findAll: async () => [] })
  const customerRepo = createMockRepo()
  const supplierRepo = createMockRepo()
  const inventoryRepo = createMockRepo()

  const membershipPlanRepo = createMockMembershipRepo()
  const membershipRepo = createMockMembershipRepo()
  const membershipPaymentRepo = createMockMembershipRepo({
    findByDateRange: async () => []
  })
  const attendanceRepo = createMockMembershipRepo({
    findByDateRange: async () => []
  })

  const service = new DashboardService(saleRepo, purchaseRepo, productRepo, customerRepo, supplierRepo, inventoryRepo, membershipPlanRepo, membershipRepo, membershipPaymentRepo, attendanceRepo)

  const kpis = await service.getKPIs()
  assert(kpis.monthPurchases === 0, 'monthPurchases debería ser 0 si todas están canceladas')
  assert(kpis.monthPurchasesTotal === 0, 'monthPurchasesTotal debería ser 0 si todas están canceladas')

  console.log('  \u2713 testGetKPIsNoCompletedPurchases')
}

async function testGetKPIsWithNoProducts() {
  const saleRepo = createMockRepo({ findByDateRange: async () => [] })
  const purchaseRepo = createMockRepo({ findByDateRange: async () => [] })
  const productRepo = createMockRepo({ findAll: async () => [] })
  const customerRepo = createMockRepo()
  const supplierRepo = createMockRepo()
  const inventoryRepo = createMockRepo()

  const membershipPlanRepo = createMockMembershipRepo()
  const membershipRepo = createMockMembershipRepo()
  const membershipPaymentRepo = createMockMembershipRepo({
    findByDateRange: async () => []
  })
  const attendanceRepo = createMockMembershipRepo({
    findByDateRange: async () => []
  })

  const service = new DashboardService(saleRepo, purchaseRepo, productRepo, customerRepo, supplierRepo, inventoryRepo, membershipPlanRepo, membershipRepo, membershipPaymentRepo, attendanceRepo)

  const kpis = await service.getKPIs()
  assert(kpis.totalProducts === 0, 'totalProducts debería ser 0')
  assert(kpis.lowStock === 0, 'lowStock debería ser 0')
  assert(kpis.criticalStock === 0, 'criticalStock debería ser 0')

  console.log('  \u2713 testGetKPIsWithNoProducts')
}

async function testGetKPIsLowStockBoundary() {
  const saleRepo = createMockRepo({ findByDateRange: async () => [] })
  const purchaseRepo = createMockRepo({ findByDateRange: async () => [] })
  const productRepo = createMockRepo({
    findAll: async () => [
      { id: 1, stock: 3, stockMin: 3 },
      { id: 2, stock: 4, stockMin: 3 }
    ]
  })
  const customerRepo = createMockRepo()
  const supplierRepo = createMockRepo()
  const inventoryRepo = createMockRepo({
    getStockByProduct: async (id) => {
      const stocks = { 1: 3, 2: 4 }
      return stocks[id]
    }
  })

  const membershipPlanRepo = createMockMembershipRepo()
  const membershipRepo = createMockMembershipRepo()
  const membershipPaymentRepo = createMockMembershipRepo({
    findByDateRange: async () => []
  })
  const attendanceRepo = createMockMembershipRepo({
    findByDateRange: async () => []
  })

  const service = new DashboardService(saleRepo, purchaseRepo, productRepo, customerRepo, supplierRepo, inventoryRepo, membershipPlanRepo, membershipRepo, membershipPaymentRepo, attendanceRepo)

  const kpis = await service.getKPIs()
  assert(kpis.lowStock === 1, 'lowStock debería ser 1 (producto 1 con stock === stockMin)')
  assert(kpis.totalProducts === 2, 'totalProducts debería ser 2')

  console.log('  \u2713 testGetKPIsLowStockBoundary')
}

async function testGetKPIsMembershipExpiring() {
  const saleRepo = createMockRepo({ findByDateRange: async () => [] })
  const purchaseRepo = createMockRepo({ findByDateRange: async () => [] })
  const productRepo = createMockRepo({ findAll: async () => [] })
  const customerRepo = createMockRepo()
  const supplierRepo = createMockRepo()
  const inventoryRepo = createMockRepo()

  const membershipPlanRepo = createMockMembershipRepo()
  const membershipRepo = createMockMembershipRepo({
    findExpiringSoon: async (days) => [
      { id: 1, memberId: 1, planId: 1, endDate: '2026-08-10', status: 'active' },
      { id: 2, memberId: 2, planId: 1, endDate: '2026-08-05', status: 'active' }
    ]
  })
  const membershipPaymentRepo = createMockMembershipRepo({ findByDateRange: async () => [] })
  const attendanceRepo = createMockMembershipRepo({ findByDateRange: async () => [] })

  const service = new DashboardService(saleRepo, purchaseRepo, productRepo, customerRepo, supplierRepo, inventoryRepo, membershipPlanRepo, membershipRepo, membershipPaymentRepo, attendanceRepo)

  const kpis = await service.getKPIs()
  assert(kpis.membershipsExpiring === 2, 'membershipsExpiring debería ser 2')

  console.log('  ✓ testGetKPIsMembershipExpiring')
}

async function testGetKPIsMembershipRevenue() {
  const saleRepo = createMockRepo({ findByDateRange: async () => [] })
  const purchaseRepo = createMockRepo({ findByDateRange: async () => [] })
  const productRepo = createMockRepo({ findAll: async () => [] })
  const customerRepo = createMockRepo()
  const supplierRepo = createMockRepo()
  const inventoryRepo = createMockRepo()

  const membershipPlanRepo = createMockMembershipRepo()
  const membershipRepo = createMockMembershipRepo()
  const membershipPaymentRepo = createMockMembershipRepo({
    findByDateRange: async (start, end) => [
      { amount: 150, method: 'cash', date: '2026-08-04' },
      { amount: 200, method: 'card', date: '2026-08-04' }
    ]
  })
  const attendanceRepo = createMockMembershipRepo({ findByDateRange: async () => [] })

  const service = new DashboardService(saleRepo, purchaseRepo, productRepo, customerRepo, supplierRepo, inventoryRepo, membershipPlanRepo, membershipRepo, membershipPaymentRepo, attendanceRepo)

  const kpis = await service.getKPIs()
  assert(kpis.todayMembershipRevenue === 350, 'todayMembershipRevenue debería ser 350 (150+200)')
  assert(kpis.monthMembershipRevenue === 350, 'monthMembershipRevenue debería ser 350 (misma data mock)')

  console.log('  ✓ testGetKPIsMembershipRevenue')
}

export async function runDashboardServiceTests() {
  console.log('\n--- DashboardService Tests ---\n')

  await testGetKPIsReturnsAllKeys()
  await testGetKPIsWithSalesToday()
  await testGetKPIsWithMonthPurchases()
  await testGetKPIsCounts()
  await testGetKPIsAllCounts()
  await testGetKPIsCriticalStock()
  await testGetKPIsNoCompletedSales()
  await testGetKPIsNoCompletedPurchases()
  await testGetKPIsWithNoProducts()
  await testGetKPIsLowStockBoundary()
  await testGetKPIsMembershipExpiring()
  await testGetKPIsMembershipRevenue()

  console.log('\n\u2713 Todos los tests de DashboardService pasaron\n')
}