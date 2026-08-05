import { ExportService } from '../../src/services/ExportService.js'

function createMockRepo(data) {
  return {
    async findAll() { return data }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testGetEntityDataProducts() {
  const products = [
    { id: 1, code: 'P001', name: 'Producto 1', price: 100, stock: 10 },
    { id: 2, code: 'P002', name: 'Producto 2', price: 200, stock: 5 }
  ]
  const service = new ExportService(
    createMockRepo(products), createMockRepo([]), createMockRepo([]),
    createMockRepo([]), createMockRepo([]), createMockRepo([]), createMockRepo([])
  )

  const result = await service.getEntityData('products')
  assert(result.length === 2, 'Debería devolver 2 productos')
  assert(result[0].code === 'P001', 'Primer producto debería ser P001')

  console.log('  ✓ testGetEntityDataProducts')
}

async function testGetEntityDataCustomers() {
  const customers = [
    { id: 1, name: 'Miembro A', documentId: '12345678' }
  ]
  const service = new ExportService(
    createMockRepo([]), createMockRepo(customers), createMockRepo([]),
    createMockRepo([]), createMockRepo([]), createMockRepo([]), createMockRepo([])
  )

  const result = await service.getEntityData('members')
  assert(result.length === 1, 'Debería devolver 1 miembro')
  assert(result[0].name === 'Miembro A', 'Nombre debería ser Miembro A')

  console.log('  ✓ testGetEntityDataCustomers')
}

async function testGetAllData() {
  const products = [{ id: 1, name: 'Prod' }]
  const customers = [{ id: 1, name: 'Miembro' }]
  const suppliers = [{ id: 1, name: 'Proveedor' }]
  const sales = [{ id: 1, total: 100 }]
  const purchases = [{ id: 1, total: 50 }]
  const movements = [{ id: 1, productId: 1, type: 'entry', quantity: 10 }]
  const settings = [{ key: 'tax', value: '18' }]
  const trainers = [{ id: 1, name: 'Trainer 1' }]
  const gymAssets = [{ id: 1, name: 'Asset 1' }]
  const maintenance = [{ id: 1, assetId: 1 }]

  const service = new ExportService(
    createMockRepo(products), createMockRepo(customers), createMockRepo(suppliers),
    createMockRepo(sales), createMockRepo(purchases), createMockRepo(movements),
    createMockRepo(settings), createMockRepo([]), createMockRepo([]),
    createMockRepo([]), createMockRepo([]), createMockRepo([]),
    createMockRepo(trainers), createMockRepo([]),
    createMockRepo(gymAssets), createMockRepo(maintenance)
  )

  const result = await service.getAllData()
  assert(result.products.length === 1, 'Debería tener products')
  assert(result.members.length === 1, 'Debería tener customers')
  assert(result.suppliers.length === 1, 'Debería tener suppliers')
  assert(result.sales.length === 1, 'Debería tener sales')
  assert(result.purchases.length === 1, 'Debería tener purchases')
  assert(result.movements.length === 1, 'Debería tener movements')
  assert(result.settings.length === 1, 'Debería tener settings')
  assert(result.trainers.length === 1, 'Debería tener trainers')
  assert(result.gymAssets.length === 1, 'Debería tener gymAssets')
  assert(result.maintenance.length === 1, 'Debería tener maintenance')

  console.log('  ✓ testGetAllData')
}

async function testGetEntityDataTrainers() {
  const trainers = [{ id: 1, name: 'Trainer 1', specialty: 'Fuerza' }]
  const service = new ExportService(
    createMockRepo([]), createMockRepo([]), createMockRepo([]),
    createMockRepo([]), createMockRepo([]), createMockRepo([]),
    createMockRepo([]), createMockRepo([]), createMockRepo([]),
    createMockRepo([]), createMockRepo([]), createMockRepo([]),
    createMockRepo(trainers), createMockRepo([]),
    createMockRepo([]), createMockRepo([])
  )

  const result = await service.getEntityData('trainers')
  assert(result.length === 1, 'Debería devolver 1 entrenador')
  assert(result[0].name === 'Trainer 1', 'Nombre correcto')

  console.log('  ✓ testGetEntityDataTrainers')
}

async function testGetEntityDataGymAssets() {
  const gymAssets = [{ id: 1, name: 'Asset 1', type: 'Cardio' }]
  const service = new ExportService(
    createMockRepo([]), createMockRepo([]), createMockRepo([]),
    createMockRepo([]), createMockRepo([]), createMockRepo([]),
    createMockRepo([]), createMockRepo([]), createMockRepo([]),
    createMockRepo([]), createMockRepo([]), createMockRepo([]),
    createMockRepo([]), createMockRepo([]),
    createMockRepo(gymAssets), createMockRepo([])
  )

  const result = await service.getEntityData('gymAssets')
  assert(result.length === 1, 'Debería devolver 1 activo')
  assert(result[0].name === 'Asset 1', 'Nombre correcto')

  console.log('  ✓ testGetEntityDataGymAssets')
}

async function testGetEntityDataMaintenance() {
  const maintenance = [{ id: 1, assetId: 1, cost: 500 }]
  const service = new ExportService(
    createMockRepo([]), createMockRepo([]), createMockRepo([]),
    createMockRepo([]), createMockRepo([]), createMockRepo([]),
    createMockRepo([]), createMockRepo([]), createMockRepo([]),
    createMockRepo([]), createMockRepo([]), createMockRepo([]),
    createMockRepo([]), createMockRepo([]),
    createMockRepo([]), createMockRepo(maintenance)
  )

  const result = await service.getEntityData('maintenance')
  assert(result.length === 1, 'Debería devolver 1 mantenimiento')
  assert(result[0].assetId === 1, 'assetId correcto')

  console.log('  ✓ testGetEntityDataMaintenance')
}

async function testGetEntityDataAttendance() {
  const attendance = [{ id: 1, memberId: 1, date: '2026-07-01' }]
  const service = new ExportService(
    createMockRepo([]), createMockRepo([]), createMockRepo([]),
    createMockRepo([]), createMockRepo([]), createMockRepo([]),
    createMockRepo([]), createMockRepo([]), createMockRepo([]),
    createMockRepo([]), createMockRepo([]), createMockRepo(attendance),
    createMockRepo([]), createMockRepo([]),
    createMockRepo([]), createMockRepo([])
  )

  const result = await service.getEntityData('attendance')
  assert(result.length === 1, 'Debería devolver 1 asistencia')
  assert(result[0].memberId === 1, 'memberId correcto')

  console.log('  ✓ testGetEntityDataAttendance')
}

async function testGetEntityDataMembershipPlans() {
  const plans = [{ id: 1, name: 'Plan Mensual', price: 5000 }]
  const service = new ExportService(
    createMockRepo([]), createMockRepo([]), createMockRepo([]),
    createMockRepo([]), createMockRepo([]), createMockRepo([]),
    createMockRepo([]), createMockRepo(plans), createMockRepo([]),
    createMockRepo([]), createMockRepo([]), createMockRepo([]),
    createMockRepo([]), createMockRepo([]),
    createMockRepo([]), createMockRepo([])
  )

  const result = await service.getEntityData('membershipPlans')
  assert(result.length === 1, 'Debería devolver 1 plan de membresía')
  assert(result[0].name === 'Plan Mensual', 'Nombre correcto')

  console.log('  ✓ testGetEntityDataMembershipPlans')
}

async function testToCSV() {
  const data = [
    { id: 1, name: 'Juan', email: 'juan@test.com' },
    { id: 2, name: 'María', email: 'maria@test.com' }
  ]

  const csv = ExportService.toCSV(data)
  const lines = csv.split('\n')

  assert(lines.length === 3, 'CSV debería tener 3 líneas (header + 2 datos)')
  assert(lines[0] === 'id,name,email', 'Header debería ser id,name,email')
  assert(lines[1] === '1,Juan,juan@test.com', 'Primera fila de datos incorrecta')

  console.log('  ✓ testToCSV')
}

async function testToCSVEscapesCommas() {
  const data = [
    { name: 'Smith, John', note: 'test' }
  ]

  const csv = ExportService.toCSV(data)
  const lines = csv.split('\n')

  assert(lines[1] === '"Smith, John",test', 'CSV debería escapar comas con quotes')

  console.log('  ✓ testToCSVEscapesCommas')
}

async function testToCSVEmptyData() {
  const csv = ExportService.toCSV([])
  assert(csv === '', 'CSV vacío debería retornar cadena vacía')

  console.log('  ✓ testToCSVEmptyData')
}

async function testToJSON() {
  const data = [
    { id: 1, name: 'Test' }
  ]

  const json = ExportService.toJSON(data)
  const parsed = JSON.parse(json)

  assert(parsed.length === 1, 'JSON debería tener 1 elemento')
  assert(parsed[0].name === 'Test', 'JSON debería tener name Test')

  console.log('  ✓ testToJSON')
}

export async function runExportServiceTests() {
  console.log('\n--- ExportService Tests ---\n')

  await testGetEntityDataProducts()
  await testGetEntityDataCustomers()
  await testGetAllData()
  await testGetEntityDataTrainers()
  await testGetEntityDataGymAssets()
  await testGetEntityDataMaintenance()
  await testGetEntityDataAttendance()
  await testGetEntityDataMembershipPlans()
  await testToCSV()
  await testToCSVEscapesCommas()
  await testToCSVEmptyData()
  await testToJSON()

  console.log('\n✓ Todos los tests de ExportService pasaron\n')
}
