import { Member } from '../models/Member.js'

export class MemberRepository {
  constructor(db) {
    this.db = db
    this.table = db.members
  }

  async findAll() {
    const data = await this.table.orderBy('name').toArray()
    return data.map(Member.fromDB)
  }

  async findById(id) {
    const data = await this.table.get(id)
    return data ? Member.fromDB(data) : null
  }

  async findByDocumentId(documentId) {
    const data = await this.table.where('documentId').equals(documentId).first()
    return data ? Member.fromDB(data) : null
  }

  async search(query) {
    const lower = query.toLowerCase()
    const all = await this.table.toArray()
    return all
      .filter(m =>
        m.name.toLowerCase().includes(lower) ||
        m.documentId.toLowerCase().includes(lower) ||
        m.email.toLowerCase().includes(lower) ||
        m.phone.toLowerCase().includes(lower)
      )
      .map(Member.fromDB)
  }

  async create(memberData) {
    const member = new Member(memberData)
    const validation = member.validate()
    if (!validation.valid) {
      throw new Error(`Datos de miembro inválidos: ${validation.errors.join(', ')}`)
    }
    const existing = await this.findByDocumentId(member.documentId)
    if (existing) {
      throw new Error(`Ya existe un miembro con el documento ${member.documentId}`)
    }
    const { id, ...data } = member.toJSON()
    delete data.id
    const newId = await this.table.add(data)
    return this.findById(newId)
  }

  async update(id, memberData) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Miembro con id ${id} no encontrado`)
    }
    const updated = { ...existing.toJSON(), ...memberData, id, updatedAt: new Date().toISOString() }
    const member = new Member(updated)
    const validation = member.validate()
    if (!validation.valid) {
      throw new Error(`Datos de miembro inválidos: ${validation.errors.join(', ')}`)
    }
    if (memberData.documentId && memberData.documentId !== existing.documentId) {
      const duplicate = await this.findByDocumentId(memberData.documentId)
      if (duplicate && duplicate.id !== id) {
        throw new Error(`Ya existe otro miembro con el documento ${memberData.documentId}`)
      }
    }
    await this.table.put(member.toJSON())
    return this.findById(id)
  }

  async delete(id) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Miembro con id ${id} no encontrado`)
    }
    await this.table.delete(id)
    return true
  }

  async count() {
    return this.table.count()
  }

  async generateNextDocumentId() {
    const all = await this.table.toArray()
    let maxNum = 0
    for (const m of all) {
      const match = m.documentId?.match(/^M(\d+)$/)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxNum) maxNum = num
      }
    }
    return `M${String(maxNum + 1).padStart(3, '0')}`
  }
}