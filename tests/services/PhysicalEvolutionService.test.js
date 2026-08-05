import { PhysicalEvolutionService } from '../../src/services/PhysicalEvolutionService.js'

function createMockRepository() {
  const evolutions = []
  let nextId = 1

  return {
    evolutions,

    async findAll() { return [...evolutions] },

    async findById(id) {
      const e = evolutions.find(x => x.id === id)
      return e ? { ...e } : null
    },

    async findByMemberId(memberId) {
      return evolutions.filter(e => e.memberId === memberId).map(e => ({ ...e }))
    },

    async search(query) {
      if (!query.trim()) return [...evolutions]
      const lower = query.toLowerCase()
      return evolutions.filter(e =>
        e.memberId.toString().includes(lower) ||
        (e.notes && e.notes.toLowerCase().includes(lower))
      ).map(e => ({ ...e }))
    },

    async create(data) {
      const e = { id: nextId++, ...data }
      evolutions.push(e)
      return { ...e }
    },

    async update(id, data) {
      const idx = evolutions.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Registro con id ${id} no encontrado`)
      evolutions[idx] = { ...evolutions[idx], ...data }
      return { ...evolutions[idx] }
    },

    async delete(id) {
      const idx = evolutions.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Registro con id ${id} no encontrado`)
      evolutions.splice(idx, 1)
      return true
    }
  }
}

function createMockMemberRepository() {
  return {
    async findById(id) {
      return { id, name: 'Test Member' }
    }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testGetAll() {
  const repo = createMockRepository()
  const memberRepo = createMockMemberRepository()
  const service = new PhysicalEvolutionService(repo, memberRepo)

  repo.evolutions.push({ id: 1, memberId: 1001, date: '2025-01-01', weight: 70, height: 175 })
  repo.evolutions.push({ id: 2, memberId: 1002, date: '2025-01-02', weight: 80, height: 180 })

  const result = await service.getAll()
  assert(result.length === 2, 'getAll debería retornar 2 registros')
  console.log('  ✓ testGetAll')
}

async function testGetById() {
  const repo = createMockRepository()
  const memberRepo = createMockMemberRepository()
  const service = new PhysicalEvolutionService(repo, memberRepo)

  repo.evolutions.push({ id: 1, memberId: 1001, date: '2025-01-01', weight: 70, height: 175 })

  const evolution = await service.getById(1)
  assert(evolution !== null, 'getById debería retornar el registro')
  assert(evolution.memberId === 1001, 'getById debería retornar el memberId correcto')

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
  const memberRepo = createMockMemberRepository()
  const service = new PhysicalEvolutionService(repo, memberRepo)

  repo.evolutions.push({ id: 1, memberId: 1001, date: '2025-01-01', weight: 70, height: 175, notes: 'Progreso excelente' })
  repo.evolutions.push({ id: 2, memberId: 1002, date: '2025-01-02', weight: 80, height: 180, notes: 'Mantener rutina' })

  const result1 = await service.search('Progreso')
  assert(result1.length === 1, 'search("Progreso") debería retornar 1 resultado')

  const result2 = await service.search('1001')
  assert(result2.length === 1, 'search("1001") debería retornar 1 resultado')

  const result3 = await service.search('')
  assert(result3.length === 2, 'search("") debería retornar todos')

  console.log('  ✓ testSearch')
}

async function testCreate() {
  const repo = createMockRepository()
  const memberRepo = createMockMemberRepository()
  const service = new PhysicalEvolutionService(repo, memberRepo)

  const evolution = await service.create({ memberId: 1001, date: '2025-01-01', weight: 70, height: 175, bodyFat: 15 })

  assert(evolution.id !== undefined, 'create debería asignar un ID')
  assert(evolution.memberId === 1001, 'create debería retornar el memberId correcto')
  assert(repo.evolutions.length === 1, 'create debería agregar al repositorio')

  console.log('  ✓ testCreate')
}

async function testUpdate() {
  const repo = createMockRepository()
  const memberRepo = createMockMemberRepository()
  const service = new PhysicalEvolutionService(repo, memberRepo)

  repo.evolutions.push({ id: 1, memberId: 1001, date: '2025-01-01', weight: 70, height: 175 })

  const updated = await service.update(1, { weight: 68, bodyFat: 12 })

  assert(updated.weight === 68, 'update debería cambiar el peso')
  assert(updated.bodyFat === 12, 'update debería cambiar el bodyFat')

  try {
    await service.update(999, { weight: 60 })
    assert(false, 'update debería lanzar error para ID inexistente')
  } catch { /* Expected */ }

  console.log('  ✓ testUpdate')
}

async function testDelete() {
  const repo = createMockRepository()
  const memberRepo = createMockMemberRepository()
  const service = new PhysicalEvolutionService(repo, memberRepo)

  repo.evolutions.push({ id: 1, memberId: 1001, date: '2025-01-01', weight: 70, height: 175 })

  assert(repo.evolutions.length === 1, 'debería haber 1 registro antes de eliminar')

  await service.delete(1)
  assert(repo.evolutions.length === 0, 'delete debería eliminar el registro')

  console.log('  ✓ testDelete')
}

async function testCalculateIMC() {
  const repo = createMockRepository()
  const memberRepo = createMockMemberRepository()
  const service = new PhysicalEvolutionService(repo, memberRepo)

  const evolution = await service.create({ memberId: 1001, date: '2025-01-01', weight: 70, height: 175 })

  assert(evolution.imc !== undefined, 'create debería calcular IMC')
  assert(Math.abs(evolution.imc - 22.86) < 0.1, `IMC debería ser ~22.86, got ${evolution.imc}`)

  console.log('  ✓ testCalculateIMC')
}

async function testGetByMember() {
  const repo = createMockRepository()
  const memberRepo = createMockMemberRepository()
  const service = new PhysicalEvolutionService(repo, memberRepo)

  repo.evolutions.push({ id: 1, memberId: 1001, date: '2025-01-01', weight: 70, height: 175 })
  repo.evolutions.push({ id: 2, memberId: 1001, date: '2025-01-15', weight: 69, height: 175 })
  repo.evolutions.push({ id: 3, memberId: 1002, date: '2025-01-02', weight: 80, height: 180 })

  const result = await service.findByMemberId(1001)
  assert(result.length === 2, 'findByMemberId(1001) debería retornar 2 registros')
  assert(result[0].date < result[1].date, 'findByMemberId debería ordenar por fecha ascendente')

  console.log('  ✓ testGetByMember')
}

export async function runPhysicalEvolutionServiceTests() {
  console.log('\n--- PhysicalEvolutionService Tests ---\n')

  await testGetAll()
  await testGetById()
  await testSearch()
  await testCreate()
  await testUpdate()
  await testDelete()
  await testCalculateIMC()
  await testGetByMember()

  console.log('\n✓ Todos los tests de PhysicalEvolutionService pasaron\n')
}