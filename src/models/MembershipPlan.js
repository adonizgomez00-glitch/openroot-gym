const REQUIRED_FIELDS = ['name']
const TEXT_FIELDS = ['name', 'description']

export class MembershipPlan {
  constructor(data = {}) {
    this.id = data.id ?? undefined
    this.name = data.name ?? ''
    this.description = data.description ?? ''
    this.durationDays = data.durationDays ?? 30
    this.price = data.price ?? 0
    this.active = data.active ?? true
    this.createdAt = data.createdAt ?? new Date().toISOString()
    this.updatedAt = data.updatedAt ?? new Date().toISOString()
  }

  toJSON() {
    return { ...this }
  }

  static fromDB(data) {
    return new MembershipPlan(data)
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
    if (typeof this.durationDays !== 'number' || this.durationDays <= 0) {
      errors.push('La duración debe ser un número positivo')
    }
    if (typeof this.price !== 'number' || this.price < 0) {
      errors.push('El precio debe ser un número no negativo')
    }
    return { valid: errors.length === 0, errors }
  }
}