export class TrainerService {
  constructor(trainerRepository) {
    this._repository = trainerRepository
  }

  async getAll() {
    return this._repository.findAll()
  }

  async getById(id) {
    if (!id) throw new Error('El ID del entrenador es requerido')
    const trainer = await this._repository.findById(id)
    if (!trainer) throw new Error(`Entrenador con id ${id} no encontrado`)
    return trainer
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
    if (!id) throw new Error('El ID del entrenador es requerido')
    return this._repository.update(id, data)
  }

  async delete(id) {
    if (!id) throw new Error('El ID del entrenador es requerido')
    return this._repository.delete(id)
  }
}