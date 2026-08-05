const REQUIRED_FIELDS = ['membershipId', 'memberId', 'amount', 'method']
const VALID_METHODS = ['cash', 'transfer', 'card', 'digital', 'other']

export class MembershipPayment {
  constructor(data = {}) {
    this.id = data.id ?? undefined
    this.membershipId = data.membershipId ?? null
    this.memberId = data.memberId ?? null
    this.amount = data.amount ?? 0
    this.method = data.method ?? 'cash'
    this.date = data.date ?? new Date().toISOString().split('T')[0]
    this.notes = data.notes ?? ''
    this.accountingEntryId = data.accountingEntryId ?? null
    this.createdAt = data.createdAt ?? new Date().toISOString()
  }

  toJSON() {
    return { ...this }
  }

  static fromDB(data) {
    return new MembershipPayment(data)
  }

  validate() {
    const errors = []
    for (const field of REQUIRED_FIELDS) {
      if (!this[field] && this[field] !== 0) {
        errors.push(`El campo ${field} es requerido`)
      }
    }
    if (this.method && !VALID_METHODS.includes(this.method)) {
      errors.push(`El método debe ser: ${VALID_METHODS.join(', ')}`)
    }
    if (typeof this.amount !== 'number' || this.amount <= 0) {
      errors.push('El monto debe ser un número positivo')
    }
    if (this.date && !/^\d{4}-\d{2}-\d{2}$/.test(this.date)) {
      errors.push('La fecha debe tener formato YYYY-MM-DD')
    }
    return { valid: errors.length === 0, errors }
  }
}