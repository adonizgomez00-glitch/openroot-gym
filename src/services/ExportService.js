export class ExportService {
   constructor(productRepo, memberRepo, supplierRepo, saleRepo, purchaseRepo, inventoryRepo, settingRepo, membershipPlanRepo, membershipRepo, membershipHistoryRepo, membershipPaymentRepo, attendanceRepo, trainerRepo, physicalEvolutionRepo, gymAssetRepo, maintenanceRepo) {
    this._productRepo = productRepo
    this._memberRepo = memberRepo
    this._supplierRepo = supplierRepo
    this._saleRepo = saleRepo
    this._purchaseRepo = purchaseRepo
    this._inventoryRepo = inventoryRepo
    this._settingRepo = settingRepo
    this._membershipPlanRepo = membershipPlanRepo
    this._membershipRepo = membershipRepo
    this._membershipHistoryRepo = membershipHistoryRepo
    this._membershipPaymentRepo = membershipPaymentRepo
    this._attendanceRepo = attendanceRepo
    this._trainerRepo = trainerRepo
    this._physicalEvolutionRepo = physicalEvolutionRepo
    this._gymAssetRepo = gymAssetRepo
    this._maintenanceRepo = maintenanceRepo
  }

  async getAllData() {
    const [products, members, suppliers, sales, purchases, movements, settings, membershipPlans, memberships, membershipHistory, membershipPayments, attendance, trainers, physicalEvolutions, gymAssets, maintenance] = await Promise.all([
      this._productRepo.findAll(),
      this._memberRepo.findAll(),
      this._supplierRepo.findAll(),
      this._saleRepo.findAll(),
      this._purchaseRepo.findAll(),
      this._inventoryRepo.findAll(),
      this._settingRepo.findAll(),
      this._membershipPlanRepo?.findAll() || [],
      this._membershipRepo?.findAll() || [],
      this._membershipHistoryRepo?.findAll() || [],
      this._membershipPaymentRepo?.findAll() || [],
      this._attendanceRepo?.findAll() || [],
      this._trainerRepo?.findAll() || [],
      this._physicalEvolutionRepo?.findAll() || [],
      this._gymAssetRepo?.findAll() || [],
      this._maintenanceRepo?.findAll() || [],
    ])

    return { products, members, suppliers, sales, purchases, movements, settings, membershipPlans, memberships, membershipHistory, membershipPayments, attendance, trainers, physicalEvolutions, gymAssets, maintenance }
  }

  async getEntityData(entity) {
    switch (entity) {
      case 'products': return this._productRepo.findAll()
      case 'members': return this._memberRepo.findAll()
      case 'suppliers': return this._supplierRepo.findAll()
      case 'sales': return this._saleRepo.findAll()
      case 'purchases': return this._purchaseRepo.findAll()
      case 'movements': return this._inventoryRepo.findAll()
      case 'settings': return this._settingRepo.findAll()
      case 'membershipPlans': return this._membershipPlanRepo.findAll()
      case 'memberships': return this._membershipRepo.findAll()
      case 'membershipHistory': return this._membershipHistoryRepo.findAll()
      case 'membershipPayments': return this._membershipPaymentRepo.findAll()
      case 'attendance': return this._attendanceRepo.findAll()
      case 'trainers': return this._trainerRepo?.findAll() || []
      case 'physicalEvolutions': return this._physicalEvolutionRepo?.findAll() || []
      case 'gymAssets': return this._gymAssetRepo?.findAll() || []
      case 'maintenance': return this._maintenanceRepo?.findAll() || []
      default: throw new Error(`Entidad desconocida: ${entity}`)
    }
  }

  static toCSV(data) {
    if (!data || data.length === 0) return ''
    const headers = Object.keys(data[0])
    const lines = [headers.join(',')]
    for (const item of data) {
      const values = headers.map(h => {
        const val = item[h]
        if (val === null || val === undefined) return ''
        const str = String(val)
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          return '"' + str.replace(/"/g, '""') + '"'
        }
        return str
      })
      lines.push(values.join(','))
    }
    return lines.join('\n')
  }

  static toJSON(data) {
    return JSON.stringify(data, null, 2)
  }

  static download(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}
