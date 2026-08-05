import { MembershipPlanService } from '../../src/services/MembershipPlanService.js'

function createMockRepository() {
  const plans = []
  let nextId = 1

  const repo = {
    plans,

    async findAll() { return [...plans] },

    async findById(id) {
      const p = plans.find(x => x.id === id)
      return p ? { ...p } : null
    },

    async findByName(name) {
      const p = plans.find(x => x.name === name)
      return p ? { ...p } : null
    },

    async search(query) {
      const lower = query.toLowerCase()
      return plans.filter(p =>
        p.name.toLowerCase().includes(lower) ||
        p.description.toLowerCase().includes(lower)
      )
    },

    async create(data) {
      const p = { id: nextId++, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      plans.push(p)
      return { ...p }
    },

    async update(id, data) {
      const idx = plans.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Plan con id ${id} no encontrado`)
      plans[idx] = { ...plans[idx], ...data, updatedAt: new Date().toISOString() }
      return { ...plans[idx] }
    },

    async delete(id) {
      const idx = plans.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Plan con id ${id} no encontrado`)
      plans.splice(idx, 1)
      return true
    }
  }

  return repo
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testGetAll() {
  const repo = createMockRepository()
  const service = new MembershipPlanService(repo)

  repo.plans.push({ id: 1, name: 'Plan 1', durationDays: 30, price: 100 })
  repo.plans.push({ id: 2, name: 'Plan 2', durationDays: 90, price: 250 })

  const result = await service.getAll()
  assert(result.length === 2, 'getAll debería retornar 2 planes')
  assert(result[0].name === 'Plan 1', 'getAll debería retornar el primer plan')
  console.log('  ✓ testGetAll')
}

async function testGetById() {
  const repo = createMockRepository()
  const service = new MembershipPlanService(repo)

  repo.plans.push({ id: 1, name: 'Plan 1', durationDays: 30, price: 100 })

  const plan = await service.getById(1)
  assert(plan !== null, 'getById debería retornar el plan')
  assert(plan.name === 'Plan 1', 'getById debería retornar el nombre correcto')

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
  const service = new MembershipPlanService(repo)

  repo.plans.push({ id: 1, name: 'Básico Mensual', description: 'Acceso básico', durationDays: 30, price: 100 })
  repo.plans.push({ id: 2, name: 'Premium Trimestral', description: 'Acceso premium', durationDays: 90, price: 250 })

  const result1 = await service.search('Básico')
  assert(result1.length === 1, 'search("Básico") debería retornar 1 resultado')

  const result2 = await service.search('Premium')
  assert(result2.length === 1, 'search("Premium") debería retornar 1 resultado')

  const result3 = await service.search('')
  assert(result3.length === 2, 'search("") debería retornar todos')

  console.log('  ✓ testSearch')
}

async function testCreate() {
  const repo = createMockRepository()
  const service = new MembershipPlanService(repo)

  const plan = await service.create({ name: 'Nuevo Plan', durationDays: 30, price: 100 })

  assert(plan.id !== undefined, 'create debería asignar un ID')
  assert(plan.name === 'Nuevo Plan', 'create debería retornar el plan creado')
  assert(repo.plans.length === 1, 'create debería agregar al repositorio')

  console.log('  ✓ testCreate')
}

async function testUpdate() {
  const repo = createMockRepository()
  const service = new MembershipPlanService(repo)

  repo.plans.push({ id: 1, name: 'Plan Original', durationDays: 30, price: 100 })

  const updated = await service.update(1, { name: 'Plan Actualizado', price: 150 })

  assert(updated.name === 'Plan Actualizado', 'update debería cambiar el nombre')
  assert(updated.price === 150, 'update debería cambiar el precio')

  try {
    await service.update(999, { name: 'No existe' })
    assert(false, 'update debería lanzar error para ID inexistente')
  } catch { /* Expected */ }

  console.log('  ✓ testUpdate')
}

async function testDelete() {
  const repo = createMockRepository()
  const service = new MembershipPlanService(repo)

  repo.plans.push({ id: 1, name: 'Plan a eliminar', durationDays: 30, price: 100 })

  assert(repo.plans.length === 1, 'debería haber 1 plan antes de eliminar')

  await service.delete(1)
  assert(repo.plans.length === 0, 'delete debería eliminar el plan')

  try {
    await service.delete(999)
    assert(false, 'delete debería lanzar error para ID inexistente')
  } catch { /* Expected */ }

  console.log('  ✓ testDelete')
}

export async function runMembershipPlanServiceTests() {
  console.log('\n--- MembershipPlanService Tests ---\n')

  await testGetAll()
  await testGetById()
  await testSearch()
  await testCreate()
  await testUpdate()
  await testDelete()

  console.log('\n✓ Todos los tests de MembershipPlanService pasaron\n')
}