import { Trainer } from '../models/Trainer.js'

export class TrainerRepository {
  constructor(db) {
    this.db = db
    this.table = db.trainers
  }

  async findAll() {
    const data = await this.table.orderBy('name').toArray()
    return data.map(Trainer.fromDB)
  }

  async findById(id) {
    const data = await this.table.get(id)
    return data ? Trainer.fromDB(data) : null
  }

  async findByDocumentId(documentId) {
    const data = await this.table.where('documentId').equals(documentId).first()
    return data ? Trainer.fromDB(data) : null
  }

  async search(query) {
    const lower = query.toLowerCase()
    const all = await this.table.toArray()
    return all
      .filter(t =>
        t.name.toLowerCase().includes(lower) ||
        t.documentId.toLowerCase().includes(lower) ||
        t.specialty.toLowerCase().includes(lower)
      )
      .map(Trainer.fromDB)
  }

  async create(trainerData) {
    const trainer = new Trainer(trainerData)
    const validation = trainer.validate()
    if (!validation.valid) {
      throw new Error(`Datos del entrenador inválidos: ${validation.errors.join(', ')}`)
    }
    const existing = await this.findByDocumentId(trainer.documentId)
    if (existing) {
      throw new Error(`Ya existe un entrenador con el documento ${trainer.documentId}`)
    }
    const { id, ...data } = trainer.toJSON()
    delete data.id
    const newId = await this.table.add(data)
    return this.findById(newId)
  }

  async update(id, trainerData) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Entrenador con id ${id} no encontrado`)
    }
    const updated = { ...existing.toJSON(), ...trainerData, id, updatedAt: new Date().toISOString() }
    const trainer = new Trainer(updated)
    const validation = trainer.validate()
    if (!validation.valid) {
      throw new Error(`Datos del entrenador inválidos: ${validation.errors.join(', ')}`)
    }
    if (trainerData.documentId && trainerData.documentId !== existing.documentId) {
      const duplicate = await this.findByDocumentId(trainerData.documentId)
      if (duplicate && duplicate.id !== id) {
        throw new Error(`Ya existe otro entrenador con el documento ${trainerData.documentId}`)
      }
    }
    await this.table.put(trainer.toJSON())
    return this.findById(id)
  }

  async delete(id) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Entrenador con id ${id} no encontrado`)
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
    for (const t of all) {
      const match = t.documentId?.match(/^ENT-(\d+)$/)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxNum) maxNum = num
      }
    }
    return `ENT-${String(maxNum + 1).padStart(3, '0')}`
  }
}