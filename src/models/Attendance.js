const REQUIRED_FIELDS = ['memberId', 'date']

export class Attendance {
  constructor(data = {}) {
    this.id = data.id ?? undefined
    this.memberId = data.memberId ?? null
    this.date = data.date ?? new Date().toISOString().split('T')[0]
    this.time = data.time ?? (new Date().toLocaleTime().split(' ')[0] || '08:00')
    this.createdAt = data.createdAt ?? new Date().toISOString()
  }

  toJSON() {
    return { ...this }
  }

  static fromDB(data) {
    return new Attendance(data)
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
    return { valid: errors.length === 0, errors }
  }
}