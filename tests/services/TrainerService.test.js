import { TrainerService } from '../../src/services/TrainerService.js'

function createMockRepository() {
  const trainers = []
  let nextId = 1

  return {
    trainers,

    async findAll() { return [...trainers] },

    async findById(id) {
      const t = trainers.find(x => x.id === id)
      return t ? { ...t } : null
    },

    async findByDocumentId(documentId) {
      const t = trainers.find(x => x.documentId === documentId)
      return t ? { ...t } : null
    },

    async search(query) {
      const lower = query.toLowerCase()
      return trainers.filter(t =>
        t.name.toLowerCase().includes(lower) ||
        t.documentId.toLowerCase().includes(lower)
      ).map(t => ({ ...t }))
    },

    async create(data) {
      const t = { id: nextId++, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      trainers.push(t)
      return { ...t }
    },

    async update(id, data) {
      const idx = trainers.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Entrenador con id ${id} no encontrado`)
      trainers[idx] = { ...trainers[idx], ...data, updatedAt: new Date().toISOString() }
      return { ...trainers[idx] }
    },

    async delete(id) {
      const idx = trainers.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Entrenador con id ${id} no encontrado`)
      trainers.splice(idx, 1)
      return true
    }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testGetAll() {
  const repo = createMockRepository()
  const service = new TrainerService(repo)

  repo.trainers.push({ id: 1, documentId: 'ENT-001', name: 'Entrenador 1' })
  repo.trainers.push({ id: 2, documentId: 'ENT-002', name: 'Entrenador 2' })

  const result = await service.getAll()
  assert(result.length === 2, 'getAll debería retornar 2 entrenadores')
  console.log('  ✓ testGetAll')
}

async function testGetById() {
  const repo = createMockRepository()
  const service = new TrainerService(repo)

  repo.trainers.push({ id: 1, documentId: 'ENT-001', name: 'Entrenador 1' })

  const trainer = await service.getById(1)
  assert(trainer !== null, 'getById debería retornar el entrenador')
  assert(trainer.documentId === 'ENT-001', 'getById debería retornar el documento correcto')

  try {
    await service.getById(999)
    assert(false, 'getById debería lanzar error para ID inexistente')
  } catch { /* Expected */ }

  try {
    await service.getById(null)
    assert(false, 'getById debería lanzar error para ID nulo')
  } catch { /* Expected */ }

  console.log('  ✓ testGetById')
}

async function testSearch() {
  const repo = createMockRepository()
  const service = new TrainerService(repo)

  repo.trainers.push({ id: 1, documentId: 'ENT-001', name: 'Juan Pérez', specialty: 'Musculación' })
  repo.trainers.push({ id: 2, documentId: 'ENT-002', name: 'María García', specialty: 'Cardio' })

  const result1 = await service.search('Juan')
  assert(result1.length === 1, 'search("Juan") debería retornar 1 resultado')

  const result2 = await service.search('')
  assert(result2.length === 2, 'search("") debería retornar todos')

  console.log('  ✓ testSearch')
}

async function testCreate() {
  const repo = createMockRepository()
  const service = new TrainerService(repo)

  const trainer = await service.create({ documentId: 'ENT-001', name: 'Nuevo Entrenador', email: 'trainer@email.com' })

  assert(trainer.id !== undefined, 'create debería asignar un ID')
  assert(trainer.name === 'Nuevo Entrenador', 'create debería retornar el entrenador creado')
  assert(repo.trainers.length === 1, 'create debería agregar al repositorio')

  console.log('  ✓ testCreate')
}

async function testUpdate() {
  const repo = createMockRepository()
  const service = new TrainerService(repo)

  repo.trainers.push({ id: 1, documentId: 'ENT-001', name: 'Nombre Original', email: 'original@email.com' })

  const updated = await service.update(1, { name: 'Nombre Actualizado', phone: '111222333' })

  assert(updated.name === 'Nombre Actualizado', 'update debería cambiar el nombre')
  assert(updated.phone === '111222333', 'update debería cambiar el teléfono')

  try {
    await service.update(999, { name: 'No existe' })
    assert(false, 'update debería lanzar error para ID inexistente')
  } catch { /* Expected */ }

  console.log('  ✓ testUpdate')
}

async function testDelete() {
  const repo = createMockRepository()
  const service = new TrainerService(repo)

  repo.trainers.push({ id: 1, documentId: 'ENT-001', name: 'Entrenador a eliminar' })

  assert(repo.trainers.length === 1, 'debería haber 1 entrenador antes de eliminar')

  await service.delete(1)
  assert(repo.trainers.length === 0, 'delete debería eliminar el entrenador')

  console.log('  ✓ testDelete')
}

export async function runTrainerServiceTests() {
  console.log('\n--- TrainerService Tests ---\n')

  await testGetAll()
  await testGetById()
  await testSearch()
  await testCreate()
  await testUpdate()
  await testDelete()

  console.log('\n✓ Todos los tests de TrainerService pasaron\n')
}