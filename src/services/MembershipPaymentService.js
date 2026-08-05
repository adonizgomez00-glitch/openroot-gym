import { AccountingService } from './AccountingService.js'

export class MembershipPaymentService {
  constructor(membershipPaymentRepository, membershipRepository, accountingService) {
    this._repository = membershipPaymentRepository
    this._membershipRepository = membershipRepository
    this._accountingService = accountingService
  }

  async getAll() {
    return this._repository.findAll()
  }

  async getById(id) {
    if (!id) throw new Error('El ID del pago es requerido')
    const payment = await this._repository.findById(id)
    if (!payment) throw new Error(`Pago con id ${id} no encontrado`)
    return payment
  }

  async findByMembershipId(membershipId) {
    if (!membershipId) throw new Error('El ID de la membresía es requerido')
    return this._repository.findByMembershipId(membershipId)
  }

  async findByMemberId(memberId) {
    if (!memberId) throw new Error('El ID del miembro es requerido')
    return this._repository.findByMemberId(memberId)
  }

  async search(query) {
    const trimmed = query?.trim() ?? ''
    if (!trimmed) return this.getAll()
    return this._repository.search(trimmed)
  }

  async create(data) {
    const payment = await this._repository.create(data)

    if (this._accountingService) {
      try {
        const membership = await this._membershipRepository.findById(data.membershipId)
        if (membership) {
          await this._accountingService.createMembershipEntry(payment, membership)
        }
      } catch {
        /* Accounting entry is optional */
      }
    }

    return payment
  }

  async update(id, data) {
    if (!id) throw new Error('El ID del pago es requerido')
    return this._repository.update(id, data)
  }

  async delete(id) {
    if (!id) throw new Error('El ID del pago es requerido')
    const payment = await this._repository.findById(id)
    if (!payment) throw new Error(`Pago con id ${id} no encontrado`)

    if (payment.accountingEntryId && this._accountingService) {
      await this._accountingService.deleteEntryByReference('membership', payment.accountingEntryId)
    }

    return this._repository.delete(id)
  }
}