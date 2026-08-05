export class MemberService {
  constructor(memberRepository) {
    this._repository = memberRepository
  }

  async getAll() {
    return this._repository.findAll()
  }

  async getById(id) {
    if (!id) throw new Error('El ID del miembro es requerido')
    const member = await this._repository.findById(id)
    if (!member) throw new Error(`Miembro con id ${id} no encontrado`)
    return member
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
    if (!id) throw new Error('El ID del miembro es requerido')
    return this._repository.update(id, data)
  }

  async delete(id) {
    if (!id) throw new Error('El ID del miembro es requerido')
    return this._repository.delete(id)
  }
}