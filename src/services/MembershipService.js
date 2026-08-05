import { Membership } from '../models/Membership.js'

export class MembershipService {
  constructor(membershipRepository, membershipPlanRepository, membershipHistoryRepository, memberRepository) {
    this._repository = membershipRepository
    this._planRepository = membershipPlanRepository
    this._historyRepository = membershipHistoryRepository
    this._memberRepository = memberRepository || null
  }

  async getAll() {
    return this._attachNames(await this._repository.findAll())
  }

  async _attachNames(memberships) {
    if (!memberships || memberships.length === 0) return memberships || []
    const members = this._memberRepository ? await this._memberRepository.findAll() : []
    const plans = this._planRepository ? await this._planRepository.findAll() : []
    const memberMap = new Map(members.map(member => [member.id, member]))
    const planMap = new Map(plans.map(plan => [plan.id, plan]))
    return memberships.map(membership => {
      const member = memberMap.get(membership.memberId)
      const plan = planMap.get(membership.planId)
      return {
        ...membership,
        memberName: member ? member.name : '—',
        memberDocumentId: member ? member.documentId : '—',
        planName: plan ? plan.name : '—'
      }
    })
  }

  async getById(id) {
    if (!id) throw new Error('El ID de la membresía es requerido')
    const membership = await this._repository.findById(id)
    if (!membership) throw new Error(`Membresía con id ${id} no encontrada`)
    return membership
  }

  async findByMemberId(memberId) {
    if (!memberId) throw new Error('El ID del miembro es requerido')
    return this._repository.findByMemberId(memberId)
  }

  async findActiveByMemberId(memberId) {
    if (!memberId) throw new Error('El ID del miembro es requerido')
    return this._repository.findActiveByMemberId(memberId)
  }

  async findExpired() {
    return this._repository.findExpired()
  }

  async findExpiringSoon(days = 7) {
    return this._repository.findExpiringSoon(days)
  }

  async search(query) {
    const trimmed = query?.trim() ?? ''
    if (!trimmed) return this.getAll()
    return this._attachNames(await this._repository.search(trimmed))
  }

  async create(data) {
    if (!data.memberId) throw new Error('El ID del miembro es requerido')
    if (!data.planId) throw new Error('El ID del plan es requerido')

    const member = await this._memberRepository.findById(data.memberId)
    if (!member) throw new Error(`Miembro con id ${data.memberId} no encontrado`)

    const plan = await this._planRepository.findById(data.planId)
    if (!plan) throw new Error(`Plan con id ${data.planId} no encontrado`)

    return this._repository.create(data)
  }

  async update(id, data) {
    if (!id) throw new Error('El ID de la membresía es requerido')
    return this._repository.update(id, data)
  }

  async delete(id) {
    if (!id) throw new Error('El ID de la membresía es requerido')
    return this._repository.delete(id)
  }

  async renew(id, additionalDays) {
    if (!id) throw new Error('El ID de la membresía es requerido')
    const membership = await this._repository.findById(id)
    if (!membership) throw new Error(`Membresía con id ${id} no encontrada`)

    const currentEndDate = new Date(membership.endDate || membership.startDate)
    const newEndDate = new Date(currentEndDate)
    newEndDate.setDate(newEndDate.getDate() + additionalDays)

    const updated = await this._repository.update(id, {
      endDate: newEndDate.toISOString().split('T')[0],
      status: 'active'
    })

    await this._historyRepository.create({
      membershipId: id,
      memberId: membership.memberId,
      type: 'renewal',
      date: new Date().toISOString().split('T')[0],
      notes: `Renovación por ${additionalDays} días. Nueva fecha de fin: ${updated.endDate}`
    })

    return updated
  }

  async freeze(id) {
    if (!id) throw new Error('El ID de la membresía es requerido')
    const membership = await this._repository.findById(id)
    if (!membership) throw new Error(`Membresía con id ${id} no encontrada`)

    await this._repository.update(id, { status: 'frozen' })

    await this._historyRepository.create({
      membershipId: id,
      memberId: membership.memberId,
      type: 'freeze',
      date: new Date().toISOString().split('T')[0],
      notes: 'Membresía congelada'
    })

    return await this._repository.findById(id)
  }

  async unfreeze(id) {
    if (!id) throw new Error('El ID de la membresía es requerido')
    const membership = await this._repository.findById(id)
    if (!membership) throw new Error(`Membresía con id ${id} no encontrada`)

    await this._repository.update(id, { status: 'active' })

    await this._historyRepository.create({
      membershipId: id,
      memberId: membership.memberId,
      type: 'unfreeze',
      date: new Date().toISOString().split('T')[0],
      notes: 'Membresía descongelada'
    })

    return await this._repository.findById(id)
  }

  async expire(id) {
    if (!id) throw new Error('El ID de la membresía es requerido')
    const membership = await this._repository.findById(id)
    if (!membership) throw new Error(`Membresía con id ${id} no encontrada`)

    await this._repository.update(id, { status: 'expired' })

    await this._historyRepository.create({
      membershipId: id,
      memberId: membership.memberId,
      type: 'expiration',
      date: new Date().toISOString().split('T')[0],
      notes: 'Membresía vencida automáticamente'
    })

    return await this._repository.findById(id)
  }

  async checkExpiredMemberships() {
    const expired = await this._repository.findExpired()
    const results = []
    for (const membership of expired) {
      const updated = await this.expire(membership.id)
      results.push(updated)
    }
    return results
  }

  async getMemberStatus(memberId) {
    if (!memberId) throw new Error('El ID del miembro es requerido')
    const memberships = await this.findByMemberId(memberId)
    if (memberships.length === 0) return { hasMembership: false, status: 'none' }
    const active = memberships.find(m => m.status === 'active' && m.active)
    const today = new Date().toISOString().split('T')[0]
    const pastExpired = memberships.find(m => (m.status === 'active' || m.status === 'frozen') && m.endDate < today)
    if (pastExpired) return { hasMembership: true, status: 'moroso', membership: pastExpired }
    if (active) {
      const expiringSoon = active.endDate && new Date(active.endDate) <= new Date(today) ? false : 
        (active.endDate && (new Date(active.endDate) - new Date(today)) / (1000 * 60 * 60 * 24) <= 7)
      return { hasMembership: true, status: expiringSoon ? 'expiring' : 'active', membership: active }
    }
    return { hasMembership: true, status: memberships[0].status, membership: memberships[0] }
  }

  async findMembersWithoutMembership() {
    const allMemberships = await this._repository.findAll()
    return null
  }
}