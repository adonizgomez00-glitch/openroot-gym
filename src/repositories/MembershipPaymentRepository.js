import { MembershipPayment } from '../models/MembershipPayment.js'

export class MembershipPaymentRepository {
  constructor(db) {
    this.db = db
    this.table = db.membershipPayments
  }

  async findAll() {
    const data = await this.table.orderBy('date').toArray()
    return data.map(MembershipPayment.fromDB)
  }

  async findById(id) {
    const data = await this.table.get(id)
    return data ? MembershipPayment.fromDB(data) : null
  }

  async findByMembershipId(membershipId) {
    const data = await this.table.where('membershipId').equals(membershipId).toArray()
    return data.map(MembershipPayment.fromDB)
  }

  async findByMemberId(memberId) {
    const data = await this.table.where('memberId').equals(memberId).toArray()
    return data.map(MembershipPayment.fromDB)
  }

  async search(query) {
    const lower = query.toLowerCase()
    const all = await this.table.toArray()
    return all
      .filter(p =>
        String(p.membershipId).includes(lower) ||
        String(p.memberId).includes(lower) ||
        p.method.toLowerCase().includes(lower) ||
        String(p.amount).includes(lower) ||
        p.notes.toLowerCase().includes(lower)
      )
      .map(MembershipPayment.fromDB)
  }

  async create(paymentData) {
    const payment = new MembershipPayment(paymentData)
    const validation = payment.validate()
    if (!validation.valid) {
      throw new Error(`Datos del pago inválidos: ${validation.errors.join(', ')}`)
    }
    const { id, ...data } = payment.toJSON()
    delete data.id
    const newId = await this.table.add(data)
    return this.findById(newId)
  }

  async update(id, paymentData) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Pago con id ${id} no encontrado`)
    }
    const updated = { ...existing.toJSON(), ...paymentData, id, updatedAt: new Date().toISOString() }
    const payment = new MembershipPayment(updated)
    const validation = payment.validate()
    if (!validation.valid) {
      throw new Error(`Datos del pago inválidos: ${validation.errors.join(', ')}`)
    }
    await this.table.put(payment.toJSON())
    return this.findById(id)
  }

  async delete(id) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Pago con id ${id} no encontrado`)
    }
    await this.table.delete(id)
    return true
  }

  async findByDateRange(startDate, endDate) {
    const all = await this.table.toArray()
    return all
      .filter(p => p.date >= startDate && p.date <= endDate)
      .map(MembershipPayment.fromDB)
  }

  async count() {
    return this.table.count()
  }
}