import { MembershipPlan } from '../models/MembershipPlan.js'

export class MembershipPlanRepository {
  constructor(db) {
    this.db = db
    this.table = db.membershipPlans
  }

  async findAll() {
    const data = await this.table.orderBy('name').toArray()
    return data.map(MembershipPlan.fromDB)
  }

  async findById(id) {
    const data = await this.table.get(id)
    return data ? MembershipPlan.fromDB(data) : null
  }

  async findByName(name) {
    const data = await this.table.where('name').equals(name).first()
    return data ? MembershipPlan.fromDB(data) : null
  }

  async search(query) {
    const lower = query.toLowerCase()
    const all = await this.table.toArray()
    return all
      .filter(p =>
        p.name.toLowerCase().includes(lower) ||
        p.description.toLowerCase().includes(lower)
      )
      .map(MembershipPlan.fromDB)
  }

  async create(planData) {
    const plan = new MembershipPlan(planData)
    const validation = plan.validate()
    if (!validation.valid) {
      throw new Error(`Datos del plan inválidos: ${validation.errors.join(', ')}`)
    }
    const existing = await this.findByName(plan.name)
    if (existing) {
      throw new Error(`Ya existe un plan con el nombre ${plan.name}`)
    }
    const { id, ...data } = plan.toJSON()
    delete data.id
    const newId = await this.table.add(data)
    return this.findById(newId)
  }

  async update(id, planData) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Plan con id ${id} no encontrado`)
    }
    const updated = { ...existing.toJSON(), ...planData, id, updatedAt: new Date().toISOString() }
    const plan = new MembershipPlan(updated)
    const validation = plan.validate()
    if (!validation.valid) {
      throw new Error(`Datos del plan inválidos: ${validation.errors.join(', ')}`)
    }
    if (planData.name && planData.name !== existing.name) {
      const duplicate = await this.findByName(planData.name)
      if (duplicate && duplicate.id !== id) {
        throw new Error(`Ya existe otro plan con el nombre ${planData.name}`)
      }
    }
    await this.table.put(plan.toJSON())
    return this.findById(id)
  }

  async delete(id) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Plan con id ${id} no encontrado`)
    }
    await this.table.delete(id)
    return true
  }

  async count() {
    return this.table.count()
  }
}