import { Attendance } from '../models/Attendance.js'

export class AttendanceRepository {
  constructor(db) {
    this.db = db
    this.table = db.attendance
  }

  async findAll() {
    const data = await this.table.orderBy('date').toArray()
    return data.map(Attendance.fromDB)
  }

  async findById(id) {
    const data = await this.table.get(id)
    return data ? Attendance.fromDB(data) : null
  }

  async findByMemberId(memberId) {
    const data = await this.table.where('memberId').equals(memberId).toArray()
    return data.map(Attendance.fromDB)
  }

  async findByDateRange(startDate, endDate) {
    const all = await this.table.toArray()
    return all
      .filter(a => a.date >= startDate && a.date <= endDate)
      .map(Attendance.fromDB)
  }

  async findByMemberAndDate(memberId, date) {
    const data = await this.table
      .where('memberId')
      .equals(memberId)
      .and(a => a.date === date)
      .toArray()
    return data.map(Attendance.fromDB)
  }

  async countByDate(date) {
    return this.table.where('date').equals(date).count()
  }

  async countByMemberId(memberId) {
    return this.table.where('memberId').equals(memberId).count()
  }

  async search(query) {
    const lower = query.toLowerCase()
    const all = await this.table.toArray()
    return all
      .filter(a =>
        String(a.memberId).includes(lower) ||
        a.date.toLowerCase().includes(lower) ||
        a.time.toLowerCase().includes(lower)
      )
      .map(Attendance.fromDB)
  }

  async create(attendanceData) {
    const attendance = new Attendance(attendanceData)
    const validation = attendance.validate()
    if (!validation.valid) {
      throw new Error(`Datos de asistencia inválidos: ${validation.errors.join(', ')}`)
    }
    const { id, ...data } = attendance.toJSON()
    delete data.id
    const newId = await this.table.add(data)
    return this.findById(newId)
  }

  async update(id, attendanceData) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Asistencia con id ${id} no encontrada`)
    }
    const updated = { ...existing.toJSON(), ...attendanceData, id, updatedAt: new Date().toISOString() }
    const attendance = new Attendance(updated)
    const validation = attendance.validate()
    if (!validation.valid) {
      throw new Error(`Datos de asistencia inválidos: ${validation.errors.join(', ')}`)
    }
    await this.table.put(attendance.toJSON())
    return this.findById(id)
  }

  async delete(id) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Asistencia con id ${id} no encontrada`)
    }
    await this.table.delete(id)
    return true
  }

  async count() {
    return this.table.count()
  }
}