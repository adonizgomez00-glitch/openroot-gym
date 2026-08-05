export class MembershipPlanService {
  constructor(membershipPlanRepository) {
    this._repository = membershipPlanRepository
  }

  async getAll() {
    return this._repository.findAll()
  }

  async getById(id) {
    if (!id) throw new Error('El ID del plan es requerido')
    const plan = await this._repository.findById(id)
    if (!plan) throw new Error(`Plan con id ${id} no encontrado`)
    return plan
  }

  async search(query) {
    const trimmed = query?.trim() ?? ''
    if (!trimmed) return this.getAll()
    return this._repository.search(trimmed)
  }

  async create(data) {
    return this._repository.create(data)
  }

  async update(id, data) {
    if (!id) throw new Error('El ID del plan es requerido')
    return this._repository.update(id, data)
  }

  async delete(id) {
    if (!id) throw new Error('El ID del plan es requerido')
    return this._repository.delete(id)
  }
}