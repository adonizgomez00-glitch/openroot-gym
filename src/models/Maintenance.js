const REQUIRED_FIELDS = ['assetId', 'type', 'date']
const TEXT_FIELDS = ['type', 'description', 'notes']

export class Maintenance {
  constructor(data = {}) {
    this.id = data.id ?? undefined
    this.assetId = data.assetId ?? null
    this.type = data.type ?? ''
    this.date = data.date ?? new Date().toISOString().split('T')[0]
    this.cost = data.cost ?? 0
    this.description = data.description ?? ''
    this.nextDate = data.nextDate ?? ''
    this.status = data.status ?? 'pending'
    this.notes = data.notes ?? ''
    this.createdAt = data.createdAt ?? new Date().toISOString()
    this.updatedAt = data.updatedAt ?? new Date().toISOString()
  }

  toJSON() {
    return { ...this }
  }

  static fromDB(data) {
    return new Maintenance(data)
  }

  validate() {
    const errors = []
    for (const field of REQUIRED_FIELDS) {
      if (this[field] === null || this[field] === undefined || !this[field].toString().trim()) {
        errors.push(`El campo ${field} es requerido`)
      }
    }
    for (const field of TEXT_FIELDS) {
      if (typeof this[field] !== 'string') {
        errors.push(`El campo ${field} debe ser texto`)
      }
    }
    const validTypes = ['preventive', 'corrective', 'cleaning', 'lubrication', 'part_replacement']
    if (!validTypes.includes(this.type)) {
      errors.push(`Tipo inválido: ${this.type}`)
    }
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled']
    if (!validStatuses.includes(this.status)) {
      errors.push(`Status inválido: ${this.status}`)
    }
    if (typeof this.cost !== 'number' || this.cost < 0) {
      errors.push('El costo debe ser un número no negativo')
    }
    return { valid: errors.length === 0, errors }
  }
}