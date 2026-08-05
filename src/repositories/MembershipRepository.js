import { Membership } from '../models/Membership.js'

export class MembershipRepository {
  constructor(db) {
    this.db = db
    this.table = db.memberships
  }

  async findAll() {
    const data = await this.table.orderBy('startDate').toArray()
    return data.map(Membership.fromDB)
  }

  async findById(id) {
    const data = await this.table.get(id)
    return data ? Membership.fromDB(data) : null
  }

  async findByMemberId(memberId) {
    const data = await this.table.where('memberId').equals(memberId).toArray()
    return data.map(Membership.fromDB)
  }

  async findActiveByMemberId(memberId) {
    const all = await this.findByMemberId(memberId)
    return all.filter(m => m.status === 'active' && m.active)
  }

  async findExpired() {
    const today = new Date().toISOString().split('T')[0]
    const all = await this.table.toArray()
    return all
      .filter(m => (m.status === 'active' || m.status === 'frozen') && m.endDate < today)
      .map(Membership.fromDB)
  }

  async findExpiringSoon(days = 7) {
    const today = new Date()
    const cutoff = new Date(today)
    cutoff.setDate(cutoff.getDate() + days)
    const todayStr = today.toISOString().split('T')[0]
    const cutoffStr = cutoff.toISOString().split('T')[0]

    const all = await this.table.toArray()
    return all
      .filter(m => m.status === 'active' && m.endDate >= todayStr && m.endDate <= cutoffStr)
      .map(Membership.fromDB)
  }

  async search(query) {
    const lower = query.toLowerCase()
    const all = await this.table.toArray()
    return all
      .filter(m =>
        String(m.memberId).includes(lower) ||
        String(m.planId).includes(lower) ||
        m.status.toLowerCase().includes(lower)
      )
      .map(Membership.fromDB)
  }

  async create(membershipData) {
    const membership = new Membership(membershipData)
    const validation = membership.validate()
    if (!validation.valid) {
      throw new Error(`Datos de membresía inválidos: ${validation.errors.join(', ')}`)
    }
    const { id, ...data } = membership.toJSON()
    delete data.id
    const newId = await this.table.add(data)
    return this.findById(newId)
  }

  async update(id, membershipData) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Membresía con id ${id} no encontrada`)
    }
    const updated = { ...existing.toJSON(), ...membershipData, id, updatedAt: new Date().toISOString() }
    const membership = new Membership(updated)
    const validation = membership.validate()
    if (!validation.valid) {
      throw new Error(`Datos de membresía inválidos: ${validation.errors.join(', ')}`)
    }
    await this.table.put(membership.toJSON())
    return this.findById(id)
  }

  async delete(id) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Membresía con id ${id} no encontrada`)
    }
    await this.table.delete(id)
    return true
  }

  async count() {
    return this.table.count()
  }
}