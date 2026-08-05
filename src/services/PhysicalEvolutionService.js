export class PhysicalEvolutionService {
  constructor(physicalEvolutionRepository, memberRepository) {
    this._repository = physicalEvolutionRepository
    this._memberRepository = memberRepository
  }

  async getAll() {
    return this._repository.findAll()
  }

  async getById(id) {
    if (!id) throw new Error('El ID del registro es requerido')
    const evolution = await this._repository.findById(id)
    if (!evolution) throw new Error(`Registro con id ${id} no encontrado`)
    return evolution
  }

  async findByMemberId(memberId) {
    if (!memberId) throw new Error('El ID del miembro es requerido')
    return this._repository.findByMemberId(memberId)
  }

  async findByDateRange(startDate, endDate) {
    if (!startDate || !endDate) throw new Error('Las fechas de rango son requeridas')
    return this._repository.findByDateRange(startDate, endDate)
  }

  async search(query) {
    const trimmed = query?.trim() ?? ''
    if (!trimmed) return this.getAll()
    return this._repository.search(trimmed)
  }

  async create(data) {
    const member = await this._memberRepository.findById(data.memberId)
    if (!member) {
      throw new Error(`Miembro con id ${data.memberId} no encontrado`)
    }

    const evolution = await this._repository.create(data)
    evolution.imc = Math.round((data.weight / ((data.height / 100) ** 2)) * 100) / 100
    return evolution
  }

  async update(id, data) {
    if (!id) throw new Error('El ID del registro es requerido')
    const updated = await this._repository.update(id, data)
    if (data.weight && data.height) {
      updated.imc = Math.round((data.weight / ((data.height / 100) ** 2)) * 100) / 100
    }
    return updated
  }

  async delete(id) {
    if (!id) throw new Error('El ID del registro es requerido')
    return this._repository.delete(id)
  }
}