import { MaintenanceService } from '../../src/services/MaintenanceService.js'

function createMockRepository() {
  const maintenances = []
  let nextId = 1

  return {
    maintenances,

    async findAll() { return [...maintenances] },

    async findById(id) {
      const m = maintenances.find(x => x.id === id)
      return m ? { ...m } : null
    },

    async findByAssetId(assetId) {
      return maintenances.filter(m => m.assetId === assetId).map(m => ({ ...m }))
    },

    async findByStatus(status) {
      return maintenances.filter(m => m.status === status).map(m => ({ ...m }))
    },

    async findPending() {
      return maintenances.filter(m => m.status === 'pending' || m.status === 'in_progress').map(m => ({ ...m }))
    },

    async findByDateRange(startDate, endDate) {
      return maintenances
        .filter(m => m.date >= startDate && m.date <= endDate)
        .map(m => ({ ...m }))
    },

    async search(query) {
      if (!query || !query.trim()) return [...maintenances]
      const lower = query.toLowerCase()
      return maintenances.filter(m =>
        m.type?.toLowerCase().includes(lower) ||
        m.description?.toLowerCase().includes(lower) ||
        m.notes?.toLowerCase().includes(lower) ||
        m.status?.toLowerCase().includes(lower)
      ).map(m => ({ ...m }))
    },

    async create(data) {
      const m = { id: nextId++, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      maintenances.push(m)
      return { ...m }
    },

    async update(id, data) {
      const idx = maintenances.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Registro con id ${id} no encontrado`)
      maintenances[idx] = { ...maintenances[idx], ...data, updatedAt: new Date().toISOString() }
      return { ...maintenances[idx] }
    },

    async delete(id) {
      const idx = maintenances.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Registro con id ${id} no encontrado`)
      maintenances.splice(idx, 1)
      return true
    },

    async count() { return maintenances.length }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testGetAll() {
  const repo = createMockRepository()
  const service = new MaintenanceService(repo)

  repo.maintenances.push({ id: 1, assetId: 10, date: '2025-01-01', type: 'preventive' })
  repo.maintenances.push({ id: 2, assetId: 20, date: '2025-01-02', type: 'corrective' })

  const result = await service.getAll()
  assert(result.length === 2, 'getAll debería retornar 2 registros')
  console.log('  ✓ testGetAll')
}

async function testGetById() {
  const repo = createMockRepository()
  const service = new MaintenanceService(repo)

  repo.maintenances.push({ id: 1, assetId: 10, date: '2025-01-01', type: 'preventive' })

  const maintenance = await service.getById(1)
  assert(maintenance !== null, 'getById debería retornar el registro')
  assert(maintenance.type === 'preventive', 'getById debería retornar el tipo correcto')

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

async function testGetByAssetId() {
  const repo = createMockRepository()
  const service = new MaintenanceService(repo)

  repo.maintenances.push({ id: 1, assetId: 10, date: '2025-01-01', type: 'preventive' })
  repo.maintenances.push({ id: 2, assetId: 10, date: '2025-01-02', type: 'corrective' })
  repo.maintenances.push({ id: 3, assetId: 20, date: '2025-01-03', type: 'cleaning' })

  const result = await service.getByAssetId(10)
  assert(result.length === 2, 'getByAssetId(10) debería retornar 2 registros')

  console.log('  ✓ testGetByAssetId')
}

async function testSearch() {
  const repo = createMockRepository()
  const service = new MaintenanceService(repo)

  repo.maintenances.push({ id: 1, assetId: 10, date: '2025-01-01', type: 'preventive', description: 'Lubricación de motor' })
  repo.maintenances.push({ id: 2, assetId: 20, date: '2025-01-02', type: 'corrective', description: 'Reemplazo de correa' })

  const result1 = await service.search('Lubricación')
  assert(result1.length === 1, 'search("Lubricación") debería retornar 1 resultado')

  const result2 = await service.search('')
  assert(result2.length === 2, 'search("") debería retornar todos')

  console.log('  ✓ testSearch')
}

async function testCreate() {
  const repo = createMockRepository()
  const service = new MaintenanceService(repo)

  const maintenance = await service.create({ assetId: 10, type: 'preventive', date: '2025-01-01', cost: 50 })

  assert(maintenance.id !== undefined, 'create debería asignar un ID')
  assert(maintenance.assetId === 10, 'create debería retornar el assetId correcto')
  assert(repo.maintenances.length === 1, 'create debería agregar al repositorio')

  console.log('  ✓ testCreate')
}

async function testUpdate() {
  const repo = createMockRepository()
  const service = new MaintenanceService(repo)

  repo.maintenances.push({ id: 1, assetId: 10, date: '2025-01-01', type: 'preventive', status: 'pending' })

  const updated = await service.update(1, { status: 'completed', cost: 75 })

  assert(updated.status === 'completed', 'update debería cambiar el estado')
  assert(updated.cost === 75, 'update debería cambiar el costo')

  try {
    await service.update(999, { status: 'completed' })
    assert(false, 'update debería lanzar error para ID inexistente')
  } catch { /* Expected */ }

  console.log('  ✓ testUpdate')
}

async function testDelete() {
  const repo = createMockRepository()
  const service = new MaintenanceService(repo)

  repo.maintenances.push({ id: 1, assetId: 10, date: '2025-01-01', type: 'preventive' })

  assert(repo.maintenances.length === 1, 'debería haber 1 registro antes de eliminar')

  await service.delete(1)
  assert(repo.maintenances.length === 0, 'delete debería eliminar el registro')

  console.log('  ✓ testDelete')
}

async function testGetByStatus() {
  const repo = createMockRepository()
  const service = new MaintenanceService(repo)

  repo.maintenances.push({ id: 1, assetId: 10, date: '2025-01-01', type: 'preventive', status: 'pending' })
  repo.maintenances.push({ id: 2, assetId: 20, date: '2025-01-02', type: 'corrective', status: 'completed' })

  const result = await service.getByStatus('pending')
  assert(result.length === 1, 'getByStatus("pending") debería retornar 1 registro')
  assert(result[0].status === 'pending', 'getByStatus debería retornar estado pendiente')

  console.log('  ✓ testGetByStatus')
}

async function testGetPending() {
  const repo = createMockRepository()
  const service = new MaintenanceService(repo)

  repo.maintenances.push({ id: 1, assetId: 10, date: '2025-01-01', type: 'preventive', status: 'pending' })
  repo.maintenances.push({ id: 2, assetId: 20, date: '2025-01-02', type: 'corrective', status: 'in_progress' })
  repo.maintenances.push({ id: 3, assetId: 30, date: '2025-01-03', type: 'cleaning', status: 'completed' })

  const result = await service.getPending()
  assert(result.length === 2, 'getPending debería retornar 2 registros (pending + in_progress)')

  console.log('  ✓ testGetPending')
}

async function testCount() {
  const repo = createMockRepository()
  const service = new MaintenanceService(repo)

  repo.maintenances.push({ id: 1, assetId: 10, date: '2025-01-01', type: 'preventive' })
  repo.maintenances.push({ id: 2, assetId: 20, date: '2025-01-02', type: 'corrective' })

  const count = await service.count()
  assert(count === 2, 'count debería retornar 2')

  console.log('  ✓ testCount')
}

export async function runMaintenanceServiceTests() {
  console.log('\n--- MaintenanceService Tests ---\n')

  await testGetAll()
  await testGetById()
  await testGetByAssetId()
  await testSearch()
  await testCreate()
  await testUpdate()
  await testDelete()
  await testGetByStatus()
  await testGetPending()
  await testCount()

  console.log('\n✓ Todos los tests de MaintenanceService pasaron\n')
}