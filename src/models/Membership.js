const REQUIRED_FIELDS = ['memberId', 'planId']
const VALID_STATUSES = ['active', 'expired', 'suspended', 'frozen']

export class Membership {
  constructor(data = {}) {
    this.id = data.id ?? undefined
    this.memberId = data.memberId ?? null
    this.planId = data.planId ?? null
    this.startDate = data.startDate ?? new Date().toISOString().split('T')[0]
    this.endDate = data.endDate ?? ''
    this.status = data.status ?? 'active'
    this.price = data.price ?? 0
    this.active = data.active ?? true
    this.createdAt = data.createdAt ?? new Date().toISOString()
    this.updatedAt = data.updatedAt ?? new Date().toISOString()
  }

  toJSON() {
    return { ...this }
  }

  static fromDB(data) {
    return new Membership(data)
  }

  validate() {
    const errors = []
    for (const field of REQUIRED_FIELDS) {
      if (!this[field]) {
        errors.push(`El campo ${field} es requerido`)
      }
    }
    if (this.status && !VALID_STATUSES.includes(this.status)) {
      errors.push(`El estado debe ser: ${VALID_STATUSES.join(', ')}`)
    }
    if (this.startDate && !/^\d{4}-\d{2}-\d{2}$/.test(this.startDate)) {
      errors.push('La fecha de inicio debe tener formato YYYY-MM-DD')
    }
    if (this.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(this.endDate)) {
      errors.push('La fecha de fin debe tener formato YYYY-MM-DD')
    }
    if (typeof this.price !== 'number' || this.price < 0) {
      errors.push('El precio debe ser un número no negativo')
    }
    return { valid: errors.length === 0, errors }
  }
}