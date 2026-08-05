export class MembershipHistoryService {
  constructor(membershipHistoryRepository) {
    this._repository = membershipHistoryRepository
  }

  async getAll() {
    return this._repository.findAll()
  }

  async getById(id) {
    if (!id) throw new Error('El ID del registro de historial es requerido')
    const history = await this._repository.findById(id)
    if (!history) throw new Error(`Registro de historial con id ${id} no encontrado`)
    return history
  }

  async findByMembershipId(membershipId) {
    if (!membershipId) throw new Error('El ID de la membresía es requerido')
    return this._repository.findByMembershipId(membershipId)
  }

  async findByMemberId(memberId) {
    if (!memberId) throw new Error('El ID del miembro es requerido')
    return this._repository.findByMemberId(memberId)
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
    if (!id) throw new Error('El ID del registro de historial es requerido')
    return this._repository.update(id, data)
  }

  async delete(id) {
    if (!id) throw new Error('El ID del registro de historial es requerido')
    return this._repository.delete(id)
  }
}