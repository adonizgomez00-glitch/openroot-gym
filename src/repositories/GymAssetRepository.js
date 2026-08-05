import { GymAsset } from '../models/GymAsset.js'

export class GymAssetRepository {
  constructor(db) {
    this.db = db
    this.table = db.gymAssets
  }

  async findAll() {
    const data = await this.table.orderBy('name').toArray()
    return data.map(GymAsset.fromDB)
  }

  async findById(id) {
    const data = await this.table.get(id)
    return data ? GymAsset.fromDB(data) : null
  }

  async findByCode(code) {
    const data = await this.table.where('code').equals(code).first()
    return data ? GymAsset.fromDB(data) : null
  }

  async findByStatus(status) {
    const data = await this.table.where('status').equals(status).toArray()
    return data.map(GymAsset.fromDB)
  }

  async findExpiringWarranty(days = 30) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const threshold = new Date(today)
    threshold.setDate(threshold.getDate() + days)
    threshold.toISOString()

    const all = await this.table.toArray()
    return all.filter(a => {
      if (!a.warrantyUntil) return false
      const warrantyDate = new Date(a.warrantyUntil)
      warrantyDate.setHours(0, 0, 0, 0)
      return warrantyDate >= today && warrantyDate <= threshold
    }).map(GymAsset.fromDB)
  }

  async search(query) {
    const lower = query.toLowerCase()
    const all = await this.table.toArray()
    return all
      .filter(a =>
        a.code?.toLowerCase().includes(lower) ||
        a.name?.toLowerCase().includes(lower) ||
        a.brand?.toLowerCase().includes(lower) ||
        a.model?.toLowerCase().includes(lower) ||
        a.serial?.toLowerCase().includes(lower) ||
        a.location?.toLowerCase().includes(lower)
      )
      .map(GymAsset.fromDB)
  }

  async create(assetData) {
    const asset = new GymAsset(assetData)
    const validation = asset.validate()
    if (!validation.valid) {
      throw new Error(`Datos del activo inválidos: ${validation.errors.join(', ')}`)
    }
    const code = asset.code || await this.generateNextCode()
    const existing = await this.findByCode(code)
    if (existing) {
      throw new Error(`Ya existe un activo con el código ${code}`)
    }
    const { id, ...data } = asset.toJSON()
    delete data.id
    data.code = code
    const newId = await this.table.add(data)
    return this.findById(newId)
  }

  async update(id, assetData) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Activo con id ${id} no encontrado`)
    }
    const updated = { ...existing.toJSON(), ...assetData, id, updatedAt: new Date().toISOString() }
    const asset = new GymAsset(updated)
    const validation = asset.validate()
    if (!validation.valid) {
      throw new Error(`Datos del activo inválidos: ${validation.errors.join(', ')}`)
    }
    if (assetData.code && assetData.code !== existing.code) {
      const duplicate = await this.findByCode(assetData.code)
      if (duplicate && duplicate.id !== id) {
        throw new Error(`Ya existe otro activo con el código ${assetData.code}`)
      }
    }
    await this.table.put(asset.toJSON())
    return this.findById(id)
  }

  async delete(id) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Activo con id ${id} no encontrado`)
    }
    await this.table.delete(id)
    return true
  }

  async count() {
    return this.table.count()
  }

  async generateNextCode() {
    const all = await this.table.orderBy('id').reverse().limit(1).toArray()
    const lastCode = all[0]?.code || ''
    const match = lastCode.match(/Gym-(\d+)/)
    let nextNum = match ? parseInt(match[1], 10) + 1 : 1
    return `Gym-${String(nextNum).padStart(4, '0')}`
  }
}