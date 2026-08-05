export class MaintenanceService {
  constructor(maintenanceRepository) {
    this._repository = maintenanceRepository
  }

  async getAll() {
    return this._repository.findAll()
  }

  async getById(id) {
    if (!id) throw new Error('El ID del registro de mantenimiento es requerido')
    const maintenance = await this._repository.findById(id)
    if (!maintenance) throw new Error(`Registro de mantenimiento con id ${id} no encontrado`)
    return maintenance
  }

  async getByAssetId(assetId) {
    if (!assetId) throw new Error('El ID del activo es requerido')
    return this._repository.findByAssetId(assetId)
  }

  async getByStatus(status) {
    return this._repository.findByStatus(status)
  }

  async getPending() {
    return this._repository.findPending()
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
    return this._repository.create(data)
  }

  async update(id, data) {
    if (!id) throw new Error('El ID del registro de mantenimiento es requerido')
    return this._repository.update(id, data)
  }

  async delete(id) {
    if (!id) throw new Error('El ID del registro de mantenimiento es requerido')
    return this._repository.delete(id)
  }

  async count() {
    return this._repository.count()
  }
}