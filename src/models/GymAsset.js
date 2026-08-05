const REQUIRED_FIELDS = ['name']
const TEXT_FIELDS = ['name', 'type', 'serial', 'brand', 'model', 'location', 'responsible', 'notes', 'manual']

export class GymAsset {
  constructor(data = {}) {
    this.id = data.id ?? undefined
    this.code = data.code ?? ''
    this.name = data.name ?? ''
    this.type = data.type ?? ''
    this.serial = data.serial ?? ''
    this.brand = data.brand ?? ''
    this.model = data.model ?? ''
    this.warrantyUntil = data.warrantyUntil ?? ''
    this.purchaseDate = data.purchaseDate ?? ''
    this.purchasePrice = data.purchasePrice ?? 0
    this.status = data.status ?? 'active'
    this.location = data.location ?? ''
    this.responsible = data.responsible ?? ''
    this.photos = data.photos ?? []
    this.manual = data.manual ?? ''
    this.notes = data.notes ?? ''
    this.active = data.active ?? true
    this.createdAt = data.createdAt ?? new Date().toISOString()
    this.updatedAt = data.updatedAt ?? new Date().toISOString()
  }

  toJSON() {
    return { ...this }
  }

  static fromDB(data) {
    const asset = new GymAsset(data)
    if (Array.isArray(asset.photos)) {
      asset.photos = [...asset.photos]
    } else if (typeof asset.photos === 'string') {
      try {
        asset.photos = JSON.parse(asset.photos) || []
      } catch {
        asset.photos = []
      }
    } else {
      asset.photos = []
    }
    return asset
  }

  validate() {
    const errors = []
    for (const field of REQUIRED_FIELDS) {
      if (!this[field]?.toString().trim()) {
        errors.push(`El campo ${field} es requerido`)
      }
    }
    for (const field of TEXT_FIELDS) {
      if (typeof this[field] !== 'string') {
        errors.push(`El campo ${field} debe ser texto`)
      }
    }
    if (this.code && typeof this.code !== 'string') {
      errors.push('El campo code debe ser texto')
    }
    const validStatuses = ['active', 'inactive', 'maintenance', 'retired']
    if (!validStatuses.includes(this.status)) {
      errors.push(`Status inválido: ${this.status}`)
    }
    if (typeof this.purchasePrice !== 'number' || this.purchasePrice < 0) {
      errors.push('El precio de compra debe ser un número no negativo')
    }
    return { valid: errors.length === 0, errors }
  }
}