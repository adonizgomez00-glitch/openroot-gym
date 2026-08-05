import { PhysicalEvolution } from '../models/PhysicalEvolution.js'

export class PhysicalEvolutionRepository {
  constructor(db) {
    this.db = db
    this.table = db.physicalEvolutions
  }

  async findAll() {
    const data = await this.table.orderBy('date').toArray()
    return data.map(PhysicalEvolution.fromDB)
  }

  async findById(id) {
    const data = await this.table.get(id)
    return data ? PhysicalEvolution.fromDB(data) : null
  }

  async findByMemberId(memberId) {
    const data = await this.table.where('memberId').equals(memberId).toArray()
    return data.map(PhysicalEvolution.fromDB)
  }

  async findByDateRange(startDate, endDate) {
    const all = await this.table.toArray()
    return all
      .filter(e => e.date >= startDate && e.date <= endDate)
      .map(PhysicalEvolution.fromDB)
  }

  async search(query) {
    const lower = query.toLowerCase()
    const all = await this.table.toArray()
    return all
      .filter(e =>
        String(e.memberId).includes(lower) ||
        e.date.toLowerCase().includes(lower) ||
        e.notes.toLowerCase().includes(lower)
      )
      .map(PhysicalEvolution.fromDB)
  }

  async create(evolutionData) {
    const evolution = new PhysicalEvolution(evolutionData)
    evolution.imc = evolution._calculateImc()
    const validation = evolution.validate()
    if (!validation.valid) {
      throw new Error(`Datos de evolución inválidos: ${validation.errors.join(', ')}`)
    }
    const { id, ...data } = evolution.toJSON()
    delete data.id
    const newId = await this.table.add(data)
    return this.findById(newId)
  }

  async update(id, evolutionData) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Registro de evolución con id ${id} no encontrado`)
    }
    const updated = { ...existing.toJSON(), ...evolutionData, id, updatedAt: new Date().toISOString() }
    const evolution = new PhysicalEvolution(updated)
    evolution.imc = evolution._calculateImc()
    const validation = evolution.validate()
    if (!validation.valid) {
      throw new Error(`Datos de evolución inválidos: ${validation.errors.join(', ')}`)
    }
    await this.table.put(evolution.toJSON())
    return this.findById(id)
  }

  async delete(id) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Registro de evolución con id ${id} no encontrado`)
    }
    await this.table.delete(id)
    return true
  }

  async count() {
    return this.table.count()
  }
}