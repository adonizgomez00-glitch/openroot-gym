const REQUIRED_FIELDS = ['documentId', 'name']
const TEXT_FIELDS = ['documentId', 'name', 'email', 'phone', 'address']

export class Member {
  constructor(data = {}) {
    this.id = data.id ?? undefined
    this.documentId = data.documentId ?? ''
    this.name = data.name ?? ''
    this.email = data.email ?? ''
    this.phone = data.phone ?? ''
    this.address = data.address ?? ''
    this.photo = data.photo ?? ''
    this.physicalGoal = data.physicalGoal ?? ''
    this.assignedTrainerId = data.assignedTrainerId ?? null
    this.joinDate = data.joinDate ?? new Date().toISOString().split('T')[0]
    this.membershipId = data.membershipId ?? null
    this.status = data.status ?? 'active'
    this.active = data.active ?? true
    this.createdAt = data.createdAt ?? new Date().toISOString()
    this.updatedAt = data.updatedAt ?? new Date().toISOString()
  }

  toJSON() {
    return { ...this }
  }

  static fromDB(data) {
    return new Member(data)
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
    if (this.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      errors.push('El email no tiene un formato válido')
    }
    if (this.status && !['active', 'inactive', 'suspended', 'expired'].includes(this.status)) {
      errors.push('El estado debe ser: active, inactive, suspended o expired')
    }
    return { valid: errors.length === 0, errors }
  }
}