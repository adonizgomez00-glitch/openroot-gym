const REQUIRED_FIELDS = ['membershipId', 'memberId', 'type']
const VALID_HISTORY_TYPES = ['renewal', 'freeze', 'unfreeze', 'expiration', 'payment', 'suspension', 'reactivation']

export class MembershipHistory {
  constructor(data = {}) {
    this.id = data.id ?? undefined
    this.membershipId = data.membershipId ?? null
    this.memberId = data.memberId ?? null
    this.type = data.type ?? ''
    this.date = data.date ?? new Date().toISOString().split('T')[0]
    this.notes = data.notes ?? ''
    this.createdAt = data.createdAt ?? new Date().toISOString()
  }

  toJSON() {
    return { ...this }
  }

  static fromDB(data) {
    return new MembershipHistory(data)
  }

  validate() {
    const errors = []
    for (const field of REQUIRED_FIELDS) {
      if (!this[field]) {
        errors.push(`El campo ${field} es requerido`)
      }
    }
    if (this.type && !VALID_HISTORY_TYPES.includes(this.type)) {
      errors.push(`El tipo debe ser: ${VALID_HISTORY_TYPES.join(', ')}`)
    }
    if (this.date && !/^\d{4}-\d{2}-\d{2}$/.test(this.date)) {
      errors.push('La fecha debe tener formato YYYY-MM-DD')
    }
    return { valid: errors.length === 0, errors }
  }
}