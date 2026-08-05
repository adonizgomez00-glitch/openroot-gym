const REQUIRED_FIELDS = ['memberId']

export class PhysicalEvolution {
  constructor(data = {}) {
    this.id = data.id ?? undefined
    this.memberId = data.memberId ?? null
    this.date = data.date ?? new Date().toISOString().split('T')[0]
    this.weight = data.weight ?? 0
    this.height = data.height ?? 0
    this.imc = data.imc ?? this._calculateImc()
    this.bodyFat = data.bodyFat ?? 0
    this.muscle = data.muscle ?? 0
    this.waist = data.waist ?? 0
    this.chest = data.chest ?? 0
    this.arm = data.arm ?? 0
    this.leg = data.leg ?? 0
    this.notes = data.notes ?? ''
    this.photos = data.photos ?? []
    this.createdAt = data.createdAt ?? new Date().toISOString()
    this.updatedAt = data.updatedAt ?? new Date().toISOString()
  }

  _calculateImc() {
    if (this.height && this.height > 0) {
      return Math.round((this.weight / ((this.height / 100) ** 2)) * 100) / 100
    }
    return 0
  }

  toJSON() {
    return { ...this }
  }

  static fromDB(data) {
    return new PhysicalEvolution(data)
  }

  validate() {
    const errors = []
    for (const field of REQUIRED_FIELDS) {
      if (!this[field]) {
        errors.push(`El campo ${field} es requerido`)
      }
    }
    if (this.date && !/^\d{4}-\d{2}-\d{2}$/.test(this.date)) {
      errors.push('La fecha debe tener formato YYYY-MM-DD')
    }
    if (typeof this.weight !== 'number' || this.weight <= 0) {
      errors.push('El peso debe ser un número positivo')
    }
    if (typeof this.height !== 'number' || this.height <= 0) {
      errors.push('La altura debe ser un número positivo')
    }
    return { valid: errors.length === 0, errors }
  }
}