import { Maintenance } from '../models/Maintenance.js'

export class MaintenanceRepository {
  constructor(db) {
    this.db = db
    this.table = db.maintenance
  }

  async findAll() {
    const data = await this.table.orderBy('date').reverse().toArray()
    return data.map(Maintenance.fromDB)
  }

  async findById(id) {
    const data = await this.table.get(id)
    return data ? Maintenance.fromDB(data) : null
  }

  async findByAssetId(assetId) {
    const data = await this.table.where('assetId').equals(assetId).toArray()
    return data.map(Maintenance.fromDB)
  }

  async findByStatus(status) {
    const data = await this.table.where('status').equals(status).toArray()
    return data.map(Maintenance.fromDB)
  }

  async findPending() {
    const data = await this.table.where('status').anyOf(['pending', 'in_progress']).toArray()
    return data.map(Maintenance.fromDB)
  }

  async findByDateRange(startDate, endDate) {
    const all = await this.table.toArray()
    return all
      .filter(m => m.date >= startDate && m.date <= endDate)
      .map(Maintenance.fromDB)
  }

  async search(query) {
    const lower = query.toLowerCase()
    const all = await this.table.toArray()
    return all
      .filter(m =>
        m.type?.toLowerCase().includes(lower) ||
        m.description?.toLowerCase().includes(lower) ||
        m.notes?.toLowerCase().includes(lower) ||
        m.status?.toLowerCase().includes(lower)
      )
      .map(Maintenance.fromDB)
  }

  async create(maintenanceData) {
    const maintenance = new Maintenance(maintenanceData)
    const validation = maintenance.validate()
    if (!validation.valid) {
      throw new Error(`Datos de mantenimiento inválidos: ${validation.errors.join(', ')}`)
    }
    const { id, ...data } = maintenance.toJSON()
    delete data.id
    const newId = await this.table.add(data)
    return this.findById(newId)
  }

  async update(id, maintenanceData) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Registro de mantenimiento con id ${id} no encontrado`)
    }
    const updated = { ...existing.toJSON(), ...maintenanceData, id, updatedAt: new Date().toISOString() }
    const maintenance = new Maintenance(updated)
    const validation = maintenance.validate()
    if (!validation.valid) {
      throw new Error(`Datos de mantenimiento inválidos: ${validation.errors.join(', ')}`)
    }
    await this.table.put(maintenance.toJSON())
    return this.findById(id)
  }

  async delete(id) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Registro de mantenimiento con id ${id} no encontrado`)
    }
    await this.table.delete(id)
    return true
  }

  async count() {
    return this.table.count()
  }
}