import { Attendance } from '../models/Attendance.js'

export class AttendanceService {
  constructor(attendanceRepository, memberRepository) {
    this._repository = attendanceRepository
    this._memberRepository = memberRepository
  }

  async getAll() {
    return this._attachMemberNames(await this._repository.findAll())
  }

  async _attachMemberNames(attendances) {
    if (!attendances || attendances.length === 0) return attendances || []
    const members = await this._memberRepository.findAll()
    const memberMap = new Map(members.map(member => [member.id, member]))
    return attendances.map(attendance => {
      const member = memberMap.get(attendance.memberId)
      return {
        ...attendance,
        memberName: member ? member.name : '—',
        memberDocumentId: member ? member.documentId : '—'
      }
    })
  }

  async getById(id) {
    if (!id) throw new Error('El ID de la asistencia es requerido')
    const attendance = await this._repository.findById(id)
    if (!attendance) throw new Error(`Asistencia con id ${id} no encontrada`)
    return attendance
  }

  async findByMemberId(memberId) {
    if (!memberId) throw new Error('El ID del miembro es requerido')
    return this._repository.findByMemberId(memberId)
  }

  async findByDateRange(startDate, endDate) {
    if (!startDate || !endDate) throw new Error('Las fechas de rango son requeridas')
    return this._repository.findByDateRange(startDate, endDate)
  }

  async countByDate(date) {
    if (!date) throw new Error('La fecha es requerida')
    return this._repository.countByDate(date)
  }

  async countByMemberId(memberId) {
    if (!memberId) throw new Error('El ID del miembro es requerido')
    return this._repository.countByMemberId(memberId)
  }

  async search(query) {
    const trimmed = query?.trim() ?? ''
    if (!trimmed) return this.getAll()
    return this._attachMemberNames(await this._repository.search(trimmed))
  }

  async create(data) {
    const member = await this._memberRepository.findById(data.memberId)
    if (!member) {
      throw new Error(`Miembro con id ${data.memberId} no encontrado`)
    }
    if (!member.active) {
      throw new Error(`El miembro ${member.name} está inactivo y no puede registrarse asistencia`)
    }
    if (member.status !== 'active') {
      throw new Error(`El miembro ${member.name} tiene estado ${member.status} y no puede registrar asistencia`)
    }

    const existing = await this._repository.findByMemberAndDate(data.memberId, data.date)
    if (existing && existing.length > 0) {
      throw new Error(`Ya existe un registro de asistencia para este miembro en esta fecha`)
    }

    return this._repository.create(data)
  }

  async update(id, data) {
    if (!id) throw new Error('El ID de la asistencia es requerido')
    return this._repository.update(id, data)
  }

  async delete(id) {
    if (!id) throw new Error('El ID de la asistencia es requerido')
    return this._repository.delete(id)
  }

  async count() {
    return this._repository.count()
  }
}