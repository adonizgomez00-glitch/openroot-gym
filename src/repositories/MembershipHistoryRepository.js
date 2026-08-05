import { MembershipHistory } from '../models/MembershipHistory.js'

export class MembershipHistoryRepository {
  constructor(db) {
    this.db = db
    this.table = db.membershipHistory
  }

  async findAll() {
    const data = await this.table.orderBy('date').toArray()
    return data.map(MembershipHistory.fromDB)
  }

  async findById(id) {
    const data = await this.table.get(id)
    return data ? MembershipHistory.fromDB(data) : null
  }

  async findByMembershipId(membershipId) {
    const data = await this.table.where('membershipId').equals(membershipId).toArray()
    return data.map(MembershipHistory.fromDB)
  }

  async findByMemberId(memberId) {
    const data = await this.table.where('memberId').equals(memberId).toArray()
    return data.map(MembershipHistory.fromDB)
  }

  async search(query) {
    const lower = query.toLowerCase()
    const all = await this.table.toArray()
    return all
      .filter(h =>
        h.type.toLowerCase().includes(lower) ||
        h.notes.toLowerCase().includes(lower) ||
        String(h.membershipId).includes(lower) ||
        String(h.memberId).includes(lower)
      )
      .map(MembershipHistory.fromDB)
  }

  async create(historyData) {
    const history = new MembershipHistory(historyData)
    const validation = history.validate()
    if (!validation.valid) {
      throw new Error(`Datos del historial inválidos: ${validation.errors.join(', ')}`)
    }
    const { id, ...data } = history.toJSON()
    delete data.id
    const newId = await this.table.add(data)
    return this.findById(newId)
  }

  async update(id, historyData) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Registro de historial con id ${id} no encontrado`)
    }
    const updated = { ...existing.toJSON(), ...historyData, id, updatedAt: new Date().toISOString() }
    const history = new MembershipHistory(updated)
    const validation = history.validate()
    if (!validation.valid) {
      throw new Error(`Datos del historial inválidos: ${validation.errors.join(', ')}`)
    }
    await this.table.put(history.toJSON())
    return this.findById(id)
  }

  async delete(id) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Registro de historial con id ${id} no encontrado`)
    }
    await this.table.delete(id)
    return true
  }

  async count() {
    return this.table.count()
  }
}