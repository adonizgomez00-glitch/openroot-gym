import { stripTags } from '../utils/sanitizer.js'

export class ImportService {
   constructor(productRepo, memberRepo, supplierRepo, settingRepo, saleRepo, purchaseRepo, inventoryRepo, reportRepo, membershipPlanRepo, membershipRepo, membershipHistoryRepo, membershipPaymentRepo, attendanceRepo, trainerRepo, physicalEvolutionRepo, gymAssetRepo, maintenanceRepo) {
    this._productRepo = productRepo
    this._memberRepo = memberRepo
    this._supplierRepo = supplierRepo
    this._settingRepo = settingRepo
    this._saleRepo = saleRepo
    this._purchaseRepo = purchaseRepo
    this._inventoryRepo = inventoryRepo
    this._reportRepo = reportRepo
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

  static parseCSV(text) {
    if (!text || !text.trim()) return []
    const lines = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      if (ch === '"') {
        if (inQuotes && text[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
        current += ch
      } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
        if (current.trim()) {
          lines.push(current.trim())
        }
        current = ''
        if (ch === '\r' && text[i + 1] === '\n') i++
      } else {
        current += ch
      }
    }
    if (current.trim()) lines.push(current.trim())

    if (lines.length < 2) return []
    const headers = this._splitCSVLine(lines[0])
    const result = []
    for (let i = 1; i < lines.length; i++) {
      const values = this._splitCSVLine(lines[i])
      if (values.length === 0) continue
      if (values.length !== headers.length) continue
      const row = {}
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j] || ''
      }
      result.push(row)
    }
    return result
  }

  static _splitCSVLine(line) {
    const values = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (ch === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    values.push(current.trim())
    return values.map(v => v.replace(/^"(.*)"$/, '$1'))
  }

  static parseJSON(text) {
    if (!text || !text.trim()) return []
    const data = JSON.parse(text)
    if (Array.isArray(data)) return data
    if (data && typeof data === 'object') {
      const keys = Object.keys(data)
      if (keys.length === 1 && Array.isArray(data[keys[0]])) {
        return data[keys[0]]
      }
      if (keys.length > 1 && keys.every(k => Array.isArray(data[k]))) {
        return data
      }
    }
    return []
  }

  static isFullExport(data) {
    return data && typeof data === 'object' && !Array.isArray(data)
  }

  async importFullExport(data) {
    const ENTITY_ORDER = ['settings', 'products', 'members', 'suppliers', 'movements', 'sales', 'purchases', 'membershipPlans', 'memberships', 'membershipHistory', 'membershipPayments', 'attendance', 'trainers', 'physicalEvolutions', 'gymAssets', 'maintenance']

    const results = {}
    let totalImported = 0

    for (const exportKey of ENTITY_ORDER) {
      const records = data[exportKey]
      if (records && records.length > 0) {
        const entityKey = exportKey === 'movements' ? 'inventory' : exportKey
        try {
          const result = await this.importData(entityKey, records)
          results[exportKey] = result
          totalImported += result.imported
        } catch (error) {
          results[exportKey] = { imported: 0, skipped: records.length, errors: [{ row: 0, message: error.message }] }
        }
      }
    }

    return { results, totalImported, entities: Object.keys(results) }
  }

  async importProducts(records) {
    const result = { imported: 0, skipped: 0, errors: [] }
    for (let i = 0; i < records.length; i++) {
      try {
        const record = this._sanitizeRecord(records[i])
        const name = record.name || record.nombre || record.productName || record['nombre producto'] || `Producto ${i + 1}`
        if (!name.trim()) {
          result.skipped++
          result.errors.push({ row: i + 1, message: 'El campo name es requerido' })
          continue
        }
        const code = record.code || record.codigo || record.sku || await this._productRepo.generateNextCode()
        const product = {
          code,
          name: name.trim(),
          description: record.description || record.descripcion || '',
          category: record.category || record.categoria || '',
          purchasePrice: Number(record.purchasePrice) || Number(record.precioCompra) || Number(record['precio compra']) || 0,
          salePrice: Number(record.salePrice) || Number(record.precioVenta) || Number(record['precio venta']) || 0,
          stock: Number(record.stock) || Number(record.existencia) || 0,
          stockMin: Number(record.stockMin) || Number(record.stockMinimo) || Number(record['stock minimo']) || 0
        }
        await this._productRepo.create(product)
        result.imported++
      } catch (error) {
        result.skipped++
        result.errors.push({ row: i + 1, message: error.message })
      }
    }
    return result
  }

async importMembers(records) {
     const result = { imported: 0, skipped: 0, errors: [] }
     for (let i = 0; i < records.length; i++) {
       try {
         const record = this._sanitizeRecord(records[i])
         const name = record.name || record.nombre || record.miembro || record.member || record.customer || record.razonSocial || ''
         if (!name.trim()) {
           result.skipped++
           result.errors.push({ row: i + 1, message: 'El campo name es requerido' })
           continue
         }
         const documentId = record.documentId || record.documento || record.nit || record.cui || record.dpi || record.ruc || record.dni || record.cedula || await this._memberRepo.generateNextDocumentId()
         const member = {
           documentId,
           name: name.trim(),
           email: record.email || record.correo || record.mail || '',
           phone: record.phone || record.telefono || record.tel || '',
           address: record.address || record.direccion || ''
         }
         await this._memberRepo.create(member)
         result.imported++
       } catch (error) {
         result.skipped++
         result.errors.push({ row: i + 1, message: error.message })
       }
     }
     return result
   }

  async importMembershipPlans(records) {
    const result = { imported: 0, skipped: 0, errors: [] }
    for (let i = 0; i < records.length; i++) {
      try {
        const record = this._sanitizeRecord(records[i])
        const name = record.name || record.nombre || record.plan || ''
        if (!name.trim()) {
          result.skipped++
          result.errors.push({ row: i + 1, message: 'El campo name es requerido' })
          continue
        }
        const plan = {
          name: name.trim(),
          description: record.description || record.descripcion || '',
          durationDays: Number(record.durationDays || record.duracionDays || record.duration || 30),
          price: Number(record.price || record.precio || 0),
          active: record.active !== 'false' && record.active !== '0'
        }
        await this._membershipPlanRepo.create(plan)
        result.imported++
      } catch (error) {
        result.skipped++
        result.errors.push({ row: i + 1, message: error.message })
      }
    }
    return result
  }

  async importMemberships(records) {
    const result = { imported: 0, skipped: 0, errors: [] }
    for (let i = 0; i < records.length; i++) {
      try {
        const record = this._sanitizeRecord(records[i])
        const memberId = Number(record.memberId || record.member || record.miembroId || 0)
        const planId = Number(record.planId || record.plan || record.planId || 0)
        if (!memberId || !planId) {
          result.skipped++
          result.errors.push({ row: i + 1, message: 'memberId y planId son requeridos' })
          continue
        }
        const membership = {
          memberId,
          planId,
          startDate: record.startDate || record.fechaInicio || new Date().toISOString().split('T')[0],
          endDate: record.endDate || record.fechaFin || '',
          status: record.status || record.estado || 'active',
          price: Number(record.price || record.precio || 0),
          active: record.active !== 'false' && record.active !== '0'
        }
        await this._membershipRepo.create(membership)
        result.imported++
      } catch (error) {
        result.skipped++
        result.errors.push({ row: i + 1, message: error.message })
      }
    }
    return result
  }

  async importMembershipHistory(records) {
    const result = { imported: 0, skipped: 0, errors: [] }
    for (let i = 0; i < records.length; i++) {
      try {
        const record = this._sanitizeRecord(records[i])
        const membershipId = Number(record.membershipId || record.membership || 0)
        const memberId = Number(record.memberId || record.member || 0)
        if (!membershipId || !memberId) {
          result.skipped++
          result.errors.push({ row: i + 1, message: 'membershipId y memberId son requeridos' })
          continue
        }
        const history = {
          membershipId,
          memberId,
          type: record.type || record.tipo || 'payment',
          date: record.date || record.fecha || new Date().toISOString().split('T')[0],
          notes: record.notes || record.notas || ''
        }
        await this._membershipHistoryRepo.create(history)
        result.imported++
      } catch (error) {
        result.skipped++
        result.errors.push({ row: i + 1, message: error.message })
      }
    }
    return result
  }

  async importMembershipPayments(records) {
    const result = { imported: 0, skipped: 0, errors: [] }
    for (let i = 0; i < records.length; i++) {
      try {
        const record = this._sanitizeRecord(records[i])
        const membershipId = Number(record.membershipId || record.membership || 0)
        const memberId = Number(record.memberId || record.member || 0)
        const amount = Number(record.amount || record.monto || 0)
        if (!membershipId || !memberId || amount <= 0) {
          result.skipped++
          result.errors.push({ row: i + 1, message: 'membershipId, memberId y amount son requeridos' })
          continue
        }
        const payment = {
          membershipId,
          memberId,
          amount,
          method: record.method || record.metodo || 'cash',
          date: record.date || record.fecha || new Date().toISOString().split('T')[0],
          notes: record.notes || record.notas || ''
        }
        await this._membershipPaymentRepo.create(payment)
        result.imported++
      } catch (error) {
        result.skipped++
        result.errors.push({ row: i + 1, message: error.message })
      }
    }
    return result
  }

  async importTrainers(records) {
    const result = { imported: 0, skipped: 0, errors: [] }
    for (let i = 0; i < records.length; i++) {
      try {
        const record = this._sanitizeRecord(records[i])
        const name = record.name || record.nombre || record.entrenador || record.trainer || ''
        if (!name.trim()) {
          result.skipped++
          result.errors.push({ row: i + 1, message: 'El campo name es requerido' })
          continue
        }
        const documentId = record.documentId || record.documento || record.dpi || record.dni || record.cedula || await this._trainerRepo.generateNextDocumentId()
        const trainer = {
          documentId,
          name: name.trim(),
          email: record.email || record.correo || record.mail || '',
          phone: record.phone || record.telefono || record.tel || '',
          address: record.address || record.direccion || '',
          specialty: record.specialty || record.especialidad || '',
          active: record.active !== 'false' && record.active !== '0'
        }
        await this._trainerRepo.create(trainer)
        result.imported++
      } catch (error) {
        result.skipped++
        result.errors.push({ row: i + 1, message: error.message })
      }
    }
    return result
  }

  async importPhysicalEvolutions(records) {
    const result = { imported: 0, skipped: 0, errors: [] }
    for (let i = 0; i < records.length; i++) {
      try {
        const record = this._sanitizeRecord(records[i])
        const memberId = Number(record.memberId || record.member || record.miembroId || 0)
        if (!memberId) {
          result.skipped++
          result.errors.push({ row: i + 1, message: 'memberId es requerido' })
          continue
        }
        const evolution = {
          memberId,
          date: record.date || record.fecha || new Date().toISOString().split('T')[0],
          weight: Number(record.weight) || Number(record.peso) || 0,
          height: Number(record.height) || Number(record.altura) || Number(record.estatura) || 0,
          bodyFat: Number(record.bodyFat) || Number(record.grasa) || 0,
          muscle: Number(record.muscle) || Number(record.musculo) || 0,
          waist: Number(record.waist) || Number(record.cintura) || 0,
          chest: Number(record.chest) || Number(record.pecho) || 0,
          arm: Number(record.arm) || Number(record.brazo) || 0,
          leg: Number(record.leg) || Number(record.pierna) || 0,
          notes: record.notes || record.notas || '',
          photos: record.photos ? (Array.isArray(record.photos) ? record.photos : record.photos.split(',').map(p => p.trim())) : []
        }
        await this._physicalEvolutionRepo.create(evolution)
        result.imported++
      } catch (error) {
        result.skipped++
        result.errors.push({ row: i + 1, message: error.message })
      }
    }
    return result
  }

  async importMaintenance(records) {
    const result = { imported: 0, skipped: 0, errors: [] }
    for (let i = 0; i < records.length; i++) {
      try {
        const record = this._sanitizeRecord(records[i])
        const assetId = Number(record.assetId || record.activo || record.asset || 0)
        if (!assetId) {
          result.skipped++
          result.errors.push({ row: i + 1, message: 'assetId es requerido' })
          continue
        }
        const maintenance = {
          assetId,
          type: record.type || record.tipo || 'preventive',
          date: record.date || record.fecha || new Date().toISOString().split('T')[0],
          cost: Number(record.cost || record.costo || 0),
          description: record.description || record.descripcion || '',
          nextDate: record.nextDate || record.proximo || '',
          status: record.status || record.estado || 'pending',
          notes: record.notes || record.notas || ''
        }
        await this._maintenanceRepo.create(maintenance)
        result.imported++
      } catch (error) {
        result.skipped++
        result.errors.push({ row: i + 1, message: error.message })
      }
    }
    return result
  }

  async importGymAssets(records) {
    const result = { imported: 0, skipped: 0, errors: [] }
    for (let i = 0; i < records.length; i++) {
      try {
        const record = this._sanitizeRecord(records[i])
        const name = record.name || record.nombre || record.activo || record.asset || ''
        if (!name.trim()) {
          result.skipped++
          result.errors.push({ row: i + 1, message: 'El campo name es requerido' })
          continue
        }
        const code = record.code || record.codigo || record.sku || await this._gymAssetRepo.generateNextCode()
        const asset = {
          code,
          name: name.trim(),
          type: record.type || record.tipo || '',
          serial: record.serial || record.serie || '',
          brand: record.brand || record.marca || '',
          model: record.model || record.modelo || '',
          warrantyUntil: record.warrantyUntil || record.garantia || '',
          purchaseDate: record.purchaseDate || record.fechaCompra || '',
          purchasePrice: Number(record.purchasePrice) || Number(record.precioCompra) || 0,
          status: record.status || record.estado || 'active',
          location: record.location || record.ubicacion || '',
          responsible: record.responsible || record.responsable || '',
          photos: record.photos ? (Array.isArray(record.photos) ? record.photos : record.photos.split(',').map(p => p.trim())) : [],
          manual: record.manual || '',
          notes: record.notes || record.notas || '',
          active: record.active !== 'false' && record.active !== '0'
        }
        await this._gymAssetRepo.create(asset)
        result.imported++
      } catch (error) {
        result.skipped++
        result.errors.push({ row: i + 1, message: error.message })
      }
    }
    return result
  }

  async importAttendance(records) {
    const result = { imported: 0, skipped: 0, errors: [] }
    for (let i = 0; i < records.length; i++) {
      try {
        const record = this._sanitizeRecord(records[i])
        const memberId = Number(record.memberId || record.member || 0)
        if (!memberId) {
          result.skipped++
          result.errors.push({ row: i + 1, message: 'memberId es requerido' })
          continue
        }
        const attendance = {
          memberId,
          date: record.date || record.fecha || new Date().toISOString().split('T')[0],
          time: record.time || record.hora || new Date().toLocaleTime().split(' ')[0] || '08:00'
        }
        await this._attendanceRepo.create(attendance)
        result.imported++
      } catch (error) {
        result.skipped++
        result.errors.push({ row: i + 1, message: error.message })
      }
    }
    return result
  }

  async importSuppliers(records) {
    const result = { imported: 0, skipped: 0, errors: [] }
    for (let i = 0; i < records.length; i++) {
      try {
        const record = this._sanitizeRecord(records[i])
        const name = record.name || record.nombre || record.proveedor || record.supplier || record.razonSocial || ''
        if (!name.trim()) {
          result.skipped++
          result.errors.push({ row: i + 1, message: 'El campo name es requerido' })
          continue
        }
        const documentId = record.documentId || record.documento || record.nit || record.cui || record.dpi || record.ruc || record.dni || record.cedula || await this._supplierRepo.generateNextDocumentId()
        const supplier = {
          documentId,
          name: name.trim(),
          email: record.email || record.correo || record.mail || '',
          phone: record.phone || record.telefono || record.tel || '',
          address: record.address || record.direccion || ''
        }
        await this._supplierRepo.create(supplier)
        result.imported++
      } catch (error) {
        result.skipped++
        result.errors.push({ row: i + 1, message: error.message })
      }
    }
    return result
  }

  async _resolveMember(memberId) {
    if (!memberId) return null
    const numId = Number(memberId)
    if (!isNaN(numId)) {
      const byId = await this._memberRepo.findById(numId)
      if (byId) return byId
    }
    return this._memberRepo.findByDocumentId(String(memberId).trim())
  }

  async _findOrCreateMemberOcasional() {
    const memberName = 'Miembro ocasional'
    const existing = await this._memberRepo.findByDocumentId('M-OCASIONAL')
    if (existing) return existing
    return this._memberRepo.create({
      documentId: 'M-OCASIONAL',
      name: memberName,
      email: '',
      phone: '',
      address: ''
    })
  }

  async importSales(records) {
    const result = { imported: 0, skipped: 0, errors: [] }
    for (let i = 0; i < records.length; i++) {
      try {
        const record = this._sanitizeRecord(records[i])
        
        let memberRef = record.memberId || record.customerId || record.member || record.customer || record.cliente || record.documentoCliente
        let member = null
        
        if (memberRef) {
          member = await this._resolveMember(memberRef)
          if (!member) {
            result.skipped++
            result.errors.push({ row: i + 1, message: `Miembro no encontrado: ${memberRef}` })
            continue
          }
        } else if (record.memberName) {
          member = await this._findOrCreateMemberOcasional()
        } else {
          throw new Error('El campo documentoCliente o customerId es requerido para ventas')
        }
        
        const date = record.date || record.fecha || new Date().toISOString()
        const existing = await this._saleRepo.findByCustomerAndDate(member.id, date)
        if (existing) {
          result.skipped++
          result.errors.push({ row: i + 1, message: `Venta duplicada: ${memberRef || record.memberName} ${date}` })
          continue
        }
        
        const items = record.items || []
        await this._saleRepo.createWithItems({
          date,
          customerId: member.id,
          customerName: member.name,
          status: record.status || 'completed',
          total: Number(record.total) || 0,
          tax: Number(record.tax) || 0
        }, items)
        
        result.imported++
      } catch (error) {
        result.skipped++
        result.errors.push({ row: i + 1, message: error.message })
      }
    }
    return result
  }

  async _resolveSupplier(supplierId) {
    if (!supplierId) return null
    const numId = Number(supplierId)
    if (!isNaN(numId)) {
      const byId = await this._supplierRepo.findById(numId)
      if (byId) return byId
    }
    return this._supplierRepo.findByDocumentId(String(supplierId).trim())
  }

  async importPurchases(records) {
    const result = { imported: 0, skipped: 0, errors: [] }
    for (let i = 0; i < records.length; i++) {
      try {
        const record = this._sanitizeRecord(records[i])
        
        if (!record.supplierId && !record.supplier && !record.proveedor && !record.documentoProveedor) {
          throw new Error('El campo documentoProveedor o supplierId es requerido para compras')
        }
        
        const supplierRef = record.supplierId || record.supplier || record.proveedor || record.documentoProveedor
        const supplier = await this._resolveSupplier(supplierRef)
        if (!supplier) {
          result.skipped++
          result.errors.push({ row: i + 1, message: `Proveedor no encontrado: ${supplierRef}` })
          continue
        }
        
        const date = record.date || record.fecha || new Date().toISOString()
        const existing = await this._purchaseRepo.findBySupplierAndDate(supplier.id, date)
        if (existing) {
          result.skipped++
          result.errors.push({ row: i + 1, message: `Compra duplicada: ${supplierRef} ${date}` })
          continue
        }
        
        const items = record.items || []
        await this._purchaseRepo.createWithItems({
          date,
          supplierId: supplier.id,
          status: record.status || 'completed',
          total: Number(record.total) || 0
        }, items)
        
        result.imported++
      } catch (error) {
        result.skipped++
        result.errors.push({ row: i + 1, message: error.message })
      }
    }
    return result
  }

  async _resolveProduct(productRef) {
    if (!productRef) return null
    const numId = Number(productRef)
    if (!isNaN(numId)) {
      const byId = await this._productRepo.findById(numId)
      if (byId) return byId
    }
    return this._productRepo.findByCode(String(productRef).trim())
  }

  async importInventory(records) {
    const result = { imported: 0, skipped: 0, errors: [] }
    for (let i = 0; i < records.length; i++) {
      try {
        const record = this._sanitizeRecord(records[i])
        
        if (!record.productId && !record.product && !record.articulo && !record.producto) {
          throw new Error('El campo producto, code o productId es requerido para inventario')
        }
        
        const productRef = record.productId || record.product || record.articulo || record.producto
        let product = await this._resolveProduct(productRef)
        if (!product && record.productName) {
          const allProducts = await this._productRepo.findAll()
          product = allProducts.find(p => p.name.toLowerCase() === String(record.productName).toLowerCase().trim()) || null
        }
        if (!product) {
          result.skipped++
          result.errors.push({ row: i + 1, message: `Producto no encontrado: ${productRef}` })
          continue
        }
        
        const type = record.type || record.tipo || 'entry'
        const quantity = Number(record.quantity) || Number(record.cantidad) || Number(record.amount) || 1
        const date = record.date || record.fecha || new Date().toISOString()
        
        await this._inventoryRepo.create({
          productId: product.id,
          productName: product.name,
          type,
          quantity,
          stockBefore: Number(record.stockBefore) || (product.stock || 0),
          stockAfter: Number(record.stockBefore || product.stock || 0) + (type === 'entry' || type === 'purchase' ? Math.abs(quantity) : -Math.abs(quantity)),
          date,
          reference: record.reference || '',
          notes: record.notes || ''
        })
        
        if (type === 'entry' || type === 'purchase') {
          await this._productRepo.updateStock(product.id, Math.abs(quantity))
        } else if (type === 'exit' || type === 'sale') {
          await this._productRepo.updateStock(product.id, -Math.abs(quantity))
        }
        
        result.imported++
      } catch (error) {
        result.skipped++
        result.errors.push({ row: i + 1, message: error.message })
      }
    }
    return result
  }

  async importSettings(records) {
    const result = { imported: 0, skipped: 0, errors: [] }
    for (let i = 0; i < records.length; i++) {
      try {
        const record = this._sanitizeRecord(records[i])
        
        if (!record.key || !record.key.trim()) {
          throw new Error('El campo key es requerido')
        }
        
        const key = record.key.trim()
        const value = record.value || ''
        
        await this._settingRepo.set(key, value)
        result.imported++
      } catch (error) {
        result.skipped++
        result.errors.push({ row: i + 1, message: error.message })
      }
    }
    return result
  }

  async importData(entity, records) {
    if (entity === 'auto') {
      if (records.length === 0) throw new Error('No data to auto-detect')
      const headers = Object.keys(records[0]).map(h => h.toLowerCase())

      const entityPatterns = {
        products: {
          patterns: ['name', 'code', 'producto', 'sku', 'descripcion', 'existencia', 'product', 'productname', 'nombreproducto', 'product_name'],
          strong: ['preciocompra', 'precioventa', 'purchaseprice', 'saleprice', 'stock', 'stockmin', 'stockminimo', 'category', 'categoria']
        },
members: {
           patterns: ['name', 'miembro', 'member', 'razonsocial', 'nombremiembro', 'membername', 'customer'],
           strong: ['documentomiembro', 'documento', 'nit', 'cui', 'dpi', 'ruc', 'dni', 'cedula', 'phone', 'telefono', 'address', 'direccion', 'email', 'correo', 'mail', 'miembro', 'member']
         },
        suppliers: {
          patterns: ['name', 'proveedor', 'supplier', 'razonsocial', 'nombreproveedor', 'nombproveedor'],
          strong: ['documentoproveedor', 'documento', 'nit', 'cui', 'dpi', 'ruc', 'dni', 'cedula', 'phone', 'telefono', 'address', 'direccion', 'email', 'correo', 'mail']
        },
sales: {
           patterns: ['venta', 'sale', 'saleid', 'fecha', 'membername'],
           strong: ['documentomiembro', 'subtotal', 'total', 'tax', 'items', 'impuesto']
         },
        purchases: {
          patterns: ['proveedor', 'compra', 'supplier', 'purchase', 'supplierid', 'fecha', 'suppliername'],
          strong: ['documentoproveedor', 'subtotal', 'total', 'items', 'impuesto']
        },
        inventory: {
          patterns: ['tipo', 'type', 'articulo', 'cantidad', 'quantity', 'amount', 'movimiento', 'movement', 'productname', 'productid'],
          strong: ['stockbefore', 'stockafter', 'tipomovimiento', 'referencia', 'movementtype']
        },
        attendance: {
          patterns: ['memberid', 'miembro', 'member', 'fecha', 'date', 'hora', 'time', 'asistencia', 'attendance'],
          strong: ['memberid', 'fecha', 'hora', 'asistencia', 'attendance']
        },
        settings: {
          patterns: ['key', 'config', 'parametro', 'setting', 'clave'],
          strong: ['valor', 'value']
        },
        gymAssets: {
          patterns: ['code', 'codigo', 'activo', 'asset', 'nombre', 'name', 'brand', 'marca', 'location', 'ubicacion'],
          strong: ['codigo', 'activo', 'asset', 'brand', 'marca', 'ubicacion', 'garantia', 'warrantyuntil']
        },
        maintenance: {
          patterns: ['assetId', 'activo', 'asset', 'type', 'tipo', 'fecha', 'date', 'costo', 'cost', 'mantenimiento', 'maintenance'],
          strong: ['assetId', 'activo', 'tipo', 'costo', 'mantenimiento', 'preventivo', 'correctivo', 'status', 'estado']
        },
        trainers: {
          patterns: ['name', 'entrenador', 'trainer', 'documentId', 'documento', 'especialidad', 'specialty', 'email', 'telefono', 'phone'],
          strong: ['documento', 'dpi', 'dni', 'especialidad', 'specialty', 'entrenador', 'trainer']
        },
        physicalEvolutions: {
          patterns: ['memberId', 'miembro', 'member', 'fecha', 'date', 'peso', 'weight', 'altura', 'height', 'grasa', 'bodyFat'],
          strong: ['peso', 'weight', 'altura', 'height', 'grasa', 'bodyFat', 'musculo', 'muscle', 'cintura', 'waist']
        }
      }

      const scores = {}
      let maxScore = 0
      let maxEntity = null

      for (const [entityType, config] of Object.entries(entityPatterns)) {
        let score = 0
        for (const pattern of config.patterns) {
          if (headers.some(h => h.includes(pattern))) {
            score += 1
          }
        }
        for (const pattern of config.strong) {
          if (headers.some(h => h.includes(pattern))) {
            score += 3
          }
        }
        scores[entityType] = score
        if (score > maxScore) {
          maxScore = score
          maxEntity = entityType
        }
      }

if (maxEntity && maxScore > 0) {
        if (scores.members === scores.suppliers && scores.members === maxScore && maxScore > 0) {
           const hasMiembro = headers.some(h => h.includes('miembro') || h.includes('member') || h === 'customer')
           const hasProveedor = headers.some(h => h.includes('proveedor') || h === 'supplier')
           if (hasProveedor && !hasMiembro) {
             entity = 'suppliers'
           } else if (hasMiembro && !hasProveedor) {
             entity = 'members'
           } else {
             const firstRecord = records[0] || {}
             const docVal = (firstRecord.documentId || firstRecord.documento || '').toString().toUpperCase()
             if (docVal.startsWith('PROV-')) {
               entity = 'suppliers'
             } else if (docVal.startsWith('M') && !docVal.startsWith('ME')) {
               entity = 'members'
             } else {
               throw new Error('No se pudo distinguir entre Miembros y Proveedores. Los encabezados coinciden con ambas entidades. Por favor seleccione la entidad manualmente.')
             }
           }
         } else if (scores.sales === scores.purchases && scores.sales === maxScore && maxScore > 0) {
          const hasVenta = headers.some(h => h.includes('venta') || h === 'sale' || h === 'customerid')
          const hasCompra = headers.some(h => h.includes('compra') || h === 'purchase' || h === 'supplierid')
          if (hasCompra && !hasVenta) {
            entity = 'purchases'
          } else if (hasVenta && !hasCompra) {
            entity = 'sales'
          } else {
            throw new Error('No se pudo distinguir entre Ventas y Compras. Los encabezados coinciden con ambas entidades. Por favor seleccione la entidad manualmente.')
          }
        } else if (maxScore === 1 && scores.customers === 1 && scores.suppliers === 1 && scores.products === 1) {
          entity = 'products'
        } else {
          entity = maxEntity
        }
      } else {
        throw new Error('No se pudo auto-detectar la entidad. Por favor seleccione una entidad manualmente.')
      }
    }
    
    switch (entity) {
      case 'products': return this.importProducts(records)
      case 'members': return this.importMembers(records)
      case 'suppliers': return this.importSuppliers(records)
      case 'settings':
      case 'config': return this.importSettings(records)
      case 'sales': return this.importSales(records)
      case 'purchases': return this.importPurchases(records)
      case 'inventory':
      case 'movements': return this.importInventory(records)
      case 'membershipPlans': return this.importMembershipPlans(records)
      case 'memberships': return this.importMemberships(records)
      case 'membershipHistory': return this.importMembershipHistory(records)
      case 'membershipPayments': return this.importMembershipPayments(records)
      case 'attendance': return this.importAttendance(records)
      case 'trainers': return this.importTrainers(records)
      case 'physicalEvolutions': return this.importPhysicalEvolutions(records)
      case 'gymAssets': return this.importGymAssets(records)
      case 'maintenance': return this.importMaintenance(records)
      default: throw new Error(`Entidad desconocida: ${entity}`)
    }
  }

  _sanitizeRecord(record) {
    if (!record || typeof record !== 'object') return {}
    const sanitized = {}
    for (const [key, value] of Object.entries(record)) {
      if (typeof value === 'string') {
        sanitized[key] = stripTags(value.trim())
      } else {
        sanitized[key] = value
      }
    }
    return sanitized
  }
}
