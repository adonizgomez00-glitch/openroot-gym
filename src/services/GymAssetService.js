export class GymAssetService {
  constructor(gymAssetRepository) {
    this._repository = gymAssetRepository
  }

  async getAll() {
    return this._repository.findAll()
  }

  async getById(id) {
    if (!id) throw new Error('El ID del activo es requerido')
    const asset = await this._repository.findById(id)
    if (!asset) throw new Error(`Activo con id ${id} no encontrado`)
    return asset
  }

  async getByCode(code) {
    if (!code) throw new Error('El código del activo es requerido')
    const asset = await this._repository.findByCode(code)
    if (!asset) throw new Error(`Activo con código ${code} no encontrado`)
    return asset
  }

  async getByStatus(status) {
    return this._repository.findByStatus(status)
  }

  async getExpiringWarranty(days = 30) {
    return this._repository.findExpiringWarranty(days)
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
    if (!id) throw new Error('El ID del activo es requerido')
    return this._repository.update(id, data)
  }

  async delete(id) {
    if (!id) throw new Error('El ID del activo es requerido')
    return this._repository.delete(id)
  }

  async count() {
    return this._repository.count()
  }
}