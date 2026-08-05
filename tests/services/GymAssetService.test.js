import { GymAssetService } from '../../src/services/GymAssetService.js'

function createMockRepository() {
  const assets = []
  let nextId = 1

  return {
    assets,

    async findAll() { return [...assets] },

    async findById(id) {
      const a = assets.find(x => x.id === id)
      return a ? { ...a } : null
    },

    async findByCode(code) {
      const a = assets.find(x => x.code === code)
      return a ? { ...a } : null
    },

    async findByStatus(status) {
      return assets.filter(a => a.status === status).map(a => ({ ...a }))
    },

    async findExpiringWarranty(days) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const threshold = new Date(today)
      threshold.setDate(threshold.getDate() + days)
      return assets.filter(a => {
        if (!a.warrantyUntil) return false
        const warrantyDate = new Date(a.warrantyUntil)
        warrantyDate.setHours(0, 0, 0, 0)
        return warrantyDate >= today && warrantyDate <= threshold
      }).map(a => ({ ...a }))
    },

    async search(query) {
      if (!query || !query.trim()) return [...assets]
      const lower = query.toLowerCase()
      return assets.filter(a =>
        a.code?.toLowerCase().includes(lower) ||
        a.name?.toLowerCase().includes(lower) ||
        a.brand?.toLowerCase().includes(lower) ||
        a.model?.toLowerCase().includes(lower) ||
        a.serial?.toLowerCase().includes(lower)
      ).map(a => ({ ...a }))
    },

    async create(data) {
      const a = { id: nextId++, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      assets.push(a)
      return { ...a }
    },

    async update(id, data) {
      const idx = assets.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Activo con id ${id} no encontrado`)
      assets[idx] = { ...assets[idx], ...data, updatedAt: new Date().toISOString() }
      return { ...assets[idx] }
    },

    async delete(id) {
      const idx = assets.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Activo con id ${id} no encontrado`)
      assets.splice(idx, 1)
      return true
    },

    async count() { return assets.length },
    async generateNextCode() { return 'Gym-0001' }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testGetAll() {
  const repo = createMockRepository()
  const service = new GymAssetService(repo)

  repo.assets.push({ id: 1, code: 'Gym-0001', name: 'Caminadora 1' })
  repo.assets.push({ id: 2, code: 'Gym-0002', name: 'Bicicleta 1' })

  const result = await service.getAll()
  assert(result.length === 2, 'getAll debería retornar 2 activos')
  console.log('  ✓ testGetAll')
}

async function testGetById() {
  const repo = createMockRepository()
  const service = new GymAssetService(repo)

  repo.assets.push({ id: 1, code: 'Gym-0001', name: 'Caminadora 1' })

  const asset = await service.getById(1)
  assert(asset !== null, 'getById debería retornar el activo')
  assert(asset.code === 'Gym-0001', 'getById debería retornar el código correcto')

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

async function testGetByCode() {
  const repo = createMockRepository()
  const service = new GymAssetService(repo)

  repo.assets.push({ id: 1, code: 'Gym-0001', name: 'Caminadora 1' })

  const asset = await service.getByCode('Gym-0001')
  assert(asset !== null, 'getByCode debería retornar el activo')
  assert(asset.name === 'Caminadora 1', 'getByCode debería retornar el nombre correcto')

  try {
    await service.getByCode('NO-EXISTE')
    assert(false, 'getByCode debería lanzar error para código inexistente')
  } catch { /* Expected */ }

  try {
    await service.getByCode(null)
    assert(false, 'getByCode debería lanzar error para código nulo')
  } catch { /* Expected */ }

  console.log('  ✓ testGetByCode')
}

async function testSearch() {
  const repo = createMockRepository()
  const service = new GymAssetService(repo)

  repo.assets.push({ id: 1, code: 'Gym-0001', name: 'Caminadora', brand: 'NordicTrack' })
  repo.assets.push({ id: 2, code: 'Gym-0002', name: 'Bicicleta', brand: 'Peloton' })

  const result1 = await service.search('Caminadora')
  assert(result1.length === 1, 'search("Caminadora") debería retornar 1 resultado')

  const result2 = await service.search('Nordic')
  assert(result2.length === 1, 'search("Nordic") debería retornar 1 resultado')

  const result3 = await service.search('')
  assert(result3.length === 2, 'search("") debería retornar todos')

  console.log('  ✓ testSearch')
}

async function testCreate() {
  const repo = createMockRepository()
  const service = new GymAssetService(repo)

  const asset = await service.create({ code: 'Gym-0001', name: 'Nuevo Activo', type: 'Cardio' })

  assert(asset.id !== undefined, 'create debería asignar un ID')
  assert(asset.code === 'Gym-0001', 'create debería retornar el código correcto')
  assert(repo.assets.length === 1, 'create debería agregar al repositorio')

  console.log('  ✓ testCreate')
}

async function testUpdate() {
  const repo = createMockRepository()
  const service = new GymAssetService(repo)

  repo.assets.push({ id: 1, code: 'Gym-0001', name: 'Original', type: 'Cardio' })

  const updated = await service.update(1, { name: 'Actualizado', type: 'Fuerza' })

  assert(updated.name === 'Actualizado', 'update debería cambiar el nombre')
  assert(updated.type === 'Fuerza', 'update debería cambiar el tipo')

  try {
    await service.update(999, { name: 'No existe' })
    assert(false, 'update debería lanzar error para ID inexistente')
  } catch { /* Expected */ }

  try {
    await service.update(null, { name: 'No existe' })
    assert(false, 'update debería lanzar error para ID nulo')
  } catch { /* Expected */ }

  console.log('  ✓ testUpdate')
}

async function testDelete() {
  const repo = createMockRepository()
  const service = new GymAssetService(repo)

  repo.assets.push({ id: 1, code: 'Gym-0001', name: 'Activo a eliminar' })

  assert(repo.assets.length === 1, 'debería haber 1 activo antes de eliminar')

  await service.delete(1)
  assert(repo.assets.length === 0, 'delete debería eliminar el activo')

  console.log('  ✓ testDelete')
}

async function testGetByStatus() {
  const repo = createMockRepository()
  const service = new GymAssetService(repo)

  repo.assets.push({ id: 1, code: 'Gym-0001', name: 'Activo 1', status: 'active' })
  repo.assets.push({ id: 2, code: 'Gym-0002', name: 'Activo 2', status: 'maintenance' })

  const result = await service.getByStatus('active')
  assert(result.length === 1, 'getByStatus("active") debería retornar 1 activo')
  assert(result[0].status === 'active', 'getByStatus debería retornar activo activo')

  console.log('  ✓ testGetByStatus')
}

async function testGetExpiringWarranty() {
  const repo = createMockRepository()
  const service = new GymAssetService(repo)

  const today = new Date()
  const futureDate = new Date(today)
  futureDate.setDate(today.getDate() + 15)

  const farDate = new Date(today)
  farDate.setFullYear(today.getFullYear() + 2)

  repo.assets.push({ id: 1, code: 'Gym-0001', name: 'Con garantía próxima', warrantyUntil: futureDate.toISOString() })
  repo.assets.push({ id: 2, code: 'Gym-0002', name: 'Sin garantía próxima', warrantyUntil: farDate.toISOString() })

  const result = await service.getExpiringWarranty(30)
  assert(result.length === 1, 'getExpiringWarranty(30) debería retornar 1 activo')
  assert(result[0].name === 'Con garantía próxima', 'debería retornar el activo con garantía próxima')

  console.log('  ✓ testGetExpiringWarranty')
}

async function testCount() {
  const repo = createMockRepository()
  const service = new GymAssetService(repo)

  repo.assets.push({ id: 1, code: 'Gym-0001', name: 'Activo 1' })
  repo.assets.push({ id: 2, code: 'Gym-0002', name: 'Activo 2' })

  const count = await service.count()
  assert(count === 2, 'count debería retornar 2')

  console.log('  ✓ testCount')
}

export async function runGymAssetServiceTests() {
  console.log('\n--- GymAssetService Tests ---\n')

  await testGetAll()
  await testGetById()
  await testGetByCode()
  await testSearch()
  await testCreate()
  await testUpdate()
  await testDelete()
  await testGetByStatus()
  await testGetExpiringWarranty()
  await testCount()

  console.log('\n✓ Todos los tests de GymAssetService pasaron\n')
}