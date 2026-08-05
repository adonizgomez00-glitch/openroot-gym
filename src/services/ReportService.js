export class ReportService {
  constructor(saleRepository, purchaseRepository, productRepository, memberRepository, supplierRepository, inventoryRepository, membershipRepository, membershipPaymentRepository, attendanceRepository, trainerRepo, physicalEvolutionRepo, gymAssetRepo, maintenanceRepo) {
      this._saleRepo = saleRepository
      this._purchaseRepo = purchaseRepository
      this._productRepo = productRepository
      this._memberRepo = memberRepository
      this._supplierRepo = supplierRepository
      this._inventoryRepo = inventoryRepository
      this._membershipRepo = membershipRepository
      this._membershipPaymentRepo = membershipPaymentRepository
      this._attendanceRepo = attendanceRepository
      this._trainerRepo = trainerRepo
      this._physicalEvolutionRepo = physicalEvolutionRepo
      this._gymAssetRepo = gymAssetRepo
      this._maintenanceRepo = maintenanceRepo
    }

  async getSalesReport(startDate, endDate) {
    const sales = await this._saleRepo.findByDateRange(startDate, endDate)
    const completed = sales.filter(s => s.status === 'completed')
    const totalAmount = completed.reduce((sum, s) => sum + s.total, 0)
    const totalTax = completed.reduce((sum, s) => sum + s.tax, 0)

    return {
      items: sales,
      summary: {
        total: sales.length,
        completed: completed.length,
        cancelled: sales.filter(s => s.status === 'cancelled').length,
        totalAmount,
        totalTax
      }
    }
  }

  async getPurchasesReport(startDate, endDate) {
    const purchases = await this._purchaseRepo.findByDateRange(startDate, endDate)
    const completed = purchases.filter(p => p.status === 'completed')
    const totalAmount = completed.reduce((sum, p) => sum + p.total, 0)
    const totalTax = completed.reduce((sum, p) => sum + p.tax, 0)

    return {
      items: purchases,
      summary: {
        total: purchases.length,
        completed: completed.length,
        cancelled: purchases.filter(p => p.status === 'cancelled').length,
        totalAmount,
        totalTax
      }
    }
  }

  async getMembershipReport(startDate, endDate) {
    const memberships = await this._membershipRepo.findAll()
    const filtered = memberships.filter(m => m.startDate >= startDate && m.startDate <= endDate)
    const active = filtered.filter(m => m.status === 'active')
    const expired = filtered.filter(m => m.status === 'expired')
    const frozen = filtered.filter(m => m.status === 'frozen')

    const payments = await this._membershipPaymentRepo.findByDateRange(startDate, endDate)
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0)

    return {
      items: filtered,
      payments,
      summary: {
        total: filtered.length,
        active: active.length,
        expired: expired.length,
        frozen: frozen.length,
        totalPayments,
        averagePayment: filtered.length > 0 ? totalPayments / filtered.length : 0
      }
    }
  }

  async getMembershipPaymentsReport(startDate, endDate) {
    const payments = await this._membershipPaymentRepo.findByDateRange(startDate, endDate)
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)
    const byMethod = {}
    for (const p of payments) {
      byMethod[p.method] = (byMethod[p.method] || 0) + p.amount
    }

    return {
      items: payments,
      summary: {
        total: payments.length,
        totalAmount,
        byMethod
      }
    }
  }

  async getAttendanceReport(startDate, endDate) {
    const attendances = await this._attendanceRepo.findByDateRange(startDate, endDate)
    const byDay = {}
    for (const a of attendances) {
      byDay[a.date] = (byDay[a.date] || 0) + 1
    }
    const byMember = {}
    for (const a of attendances) {
      const key = a.memberId
      byMember[key] = (byMember[key] || 0) + 1
    }

    return {
      items: attendances,
      summary: {
        total: attendances.length,
        byMember,
        byDay
      }
    }
  }

  async getTrainersReport() {
    const trainers = await this._trainerRepo.findAll()
    const active = trainers.filter(t => t.active)
    const bySpecialty = {}
    for (const t of trainers) {
      const spec = t.specialty || 'Sin especialidad'
      bySpecialty[spec] = (bySpecialty[spec] || 0) + 1
    }

    return {
      items: trainers,
      summary: {
        total: trainers.length,
        active: active.length,
        inactive: trainers.length - active.length,
        bySpecialty
      }
    }
  }

  async getGymAssetsReport() {
    const assets = await this._gymAssetRepo.findAll()
    const byStatus = { active: 0, inactive: 0, maintenance: 0, retired: 0 }
    let totalValue = 0
    for (const a of assets) {
      if (byStatus.hasOwnProperty(a.status)) {
        byStatus[a.status]++
      } else {
        byStatus[a.status] = 1
      }
      totalValue += a.purchasePrice || 0
    }

    const byType = {}
    for (const a of assets) {
      const type = a.type || 'Sin tipo'
      if (!byType[type]) {
        byType[type] = { count: 0, value: 0 }
      }
      byType[type].count++
      byType[type].value += a.purchasePrice || 0
    }

    return {
      items: assets,
      summary: {
        total: assets.length,
        active: byStatus.active,
        inactive: byStatus.inactive,
        maintenance: byStatus.maintenance,
        retired: byStatus.retired,
        totalValue
      }
    }
  }

  async getMaintenanceReport(startDate, endDate) {
    const maintenances = await this._maintenanceRepo.findByDateRange(startDate, endDate)
    const byStatus = { pending: 0, in_progress: 0, completed: 0, cancelled: 0 }
    let totalCost = 0
    for (const m of maintenances) {
      if (byStatus.hasOwnProperty(m.status)) {
        byStatus[m.status]++
      } else {
        byStatus[m.status] = 1
      }
      totalCost += m.cost || 0
    }

    const byType = {}
    for (const m of maintenances) {
      const type = m.type || 'Sin tipo'
      if (!byType[type]) {
        byType[type] = { count: 0, totalCost: 0 }
      }
      byType[type].count++
      byType[type].totalCost += m.cost || 0
    }

    return {
      items: maintenances,
      summary: {
        total: maintenances.length,
        pending: byStatus.pending,
        inProgress: byStatus.in_progress,
        completed: byStatus.completed,
        cancelled: byStatus.cancelled,
        totalCost
      }
    }
  }

  async getStockReport() {
    const products = await this._productRepo.findAll()
    const items = []

    for (const product of products) {
      const calculatedStock = await this._inventoryRepo.getStockByProduct(product.id)
      items.push({
        id: product.id,
        code: product.code,
        name: product.name,
        category: product.category,
        stock: calculatedStock,
        stockMin: product.stockMin,
        status: this._getStockStatus(calculatedStock, product.stockMin)
      })
    }

    items.sort((a, b) => a.name.localeCompare(b.name))

    const critical = items.filter(i => i.status === 'critical').length
    const low = items.filter(i => i.status === 'low').length
    const ok = items.filter(i => i.status === 'ok').length

    return {
      items,
      summary: { total: items.length, ok, low, critical }
    }
  }

  async getSummary() {
    const [productCount, memberCount, supplierCount, saleCount, purchaseCount, trainerCount, physicalEvolutionCount, gymAssetCount, maintenanceCount] = await Promise.all([
      this._productRepo.count(),
      this._memberRepo.count(),
      this._supplierRepo.count(),
      this._saleRepo.count(),
      this._purchaseRepo.count(),
      this._trainerRepo?.count() || 0,
      this._physicalEvolutionRepo?.count() || 0,
      this._gymAssetRepo?.count() || 0,
      this._maintenanceRepo?.count() || 0
    ])

    return {
      products: productCount,
      members: memberCount,
      suppliers: supplierCount,
      sales: saleCount,
      purchases: purchaseCount,
      trainers: trainerCount,
      physicalEvolutions: physicalEvolutionCount,
      gymAssets: gymAssetCount,
      maintenance: maintenanceCount
    }
  }

  _getStockStatus(stock, stockMin) {
    if (stockMin <= 0) return 'ok'
    if (stock <= 0) return 'critical'
    if (stock <= stockMin) return 'low'
    return 'ok'
  }
}
