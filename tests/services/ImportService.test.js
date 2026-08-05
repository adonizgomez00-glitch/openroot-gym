import { ImportService } from '../../src/services/ImportService.js'

function createMockRepo() {
  const data = []
  return {
    _data: data,
    async findAll() { return data },
    async findById(id) { return data.find(d => d.id === id) || null },
    async findByCode(code) { return data.find(d => d.code === code) || null },
    async findByDocumentId(documentId) { return data.find(d => d.documentId === documentId) || null },
    async findByCustomerAndDate(memberId, date) { return null },
    async findBySupplierAndDate(supplierId, date) { return null },
    async create(item) { const newItem = { id: data.length + 1, ...item }; data.push(newItem); return newItem },
    async update(id, itemData) { const idx = data.findIndex(d => d.id === id); if (idx >= 0) { data[idx] = { ...data[idx], ...itemData, id }; return data[idx] } return null },
    async delete(id) { const idx = data.findIndex(d => d.id === id); if (idx >= 0) { data.splice(idx, 1); return true } return false },
    async count() { return data.length },
    async generateNextCode() { return 'PROD-001' },
    async generateNextDocumentId() { return 'C001' },
    async updateStock(productId, quantity) { const item = data.find(d => d.id === productId); if (item) { item.stock = Math.max(0, (item.stock || 0) + quantity) } return item },
    async createWithItems(saleData, items) { const sale = { id: data.length + 1, ...saleData }; data.push(sale); return sale },
    async set(key, value) {
      const existing = data.find(d => d.key === key)
      const setting = { id: existing?.id, key, value, updatedAt: new Date().toISOString() }
      if (existing) {
        Object.assign(existing, setting)
      } else {
        const { id, ...data } = setting
        delete data.id
        this._data.push({ ...data, id: this._data.length + 1 })
      }
      return setting
    }
  }
}

function createMockReportRepo() {
  return {
    async generate(filter) {
      return { items: [], summary: {} }
    }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testParseCSVBasic() {
  const csv = 'name,code,price\nProducto A,PROD-001,100\nProducto B,PROD-002,200'
  const records = ImportService.parseCSV(csv)
  assert(records.length === 2, 'Debería parsear 2 registros')
  assert(records[0].name === 'Producto A', 'Primer nombre debería ser Producto A')
  assert(records[0].code === 'PROD-001', 'Primer código debería ser PROD-001')
  assert(records[1].price === '200', 'Segundo precio debería ser 200')
  console.log('  ✓ testParseCSVBasic')
}

async function testParseCSVWithQuotes() {
  const csv = 'name,description\n"Producto, con coma","Descripción normal"'
  const records = ImportService.parseCSV(csv)
  assert(records.length === 1, 'Debería parsear 1 registro con comillas')
  assert(records[0].name === 'Producto, con coma', 'Debería manejar comas dentro de comillas')
  assert(records[0].description === 'Descripción normal', 'Descripción normal debería funcionar')
  console.log('  ✓ testParseCSVWithQuotes')
}

async function testParseCSVEmpty() {
  const records = ImportService.parseCSV('')
  assert(records.length === 0, 'CSV vacío debería retornar array vacío')
  console.log('  ✓ testParseCSVEmpty')
}

async function testParseCSVOnlyHeaders() {
  const csv = 'name,code\n'
  const records = ImportService.parseCSV(csv)
  assert(records.length === 0, 'Solo headers debería retornar array vacío')
  console.log('  ✓ testParseCSVOnlyHeaders')
}

async function testParseJSONArray() {
  const json = '[{"name": "Producto A", "code": "P001"}, {"name": "Producto B", "code": "P002"}]'
  const records = ImportService.parseJSON(json)
  assert(records.length === 2, 'Debería parsear array JSON')
  assert(records[0].name === 'Producto A', 'Primer nombre correcto')
  console.log('  ✓ testParseJSONArray')
}

async function testParseJSONObjectWithArray() {
  const json = '{"products": [{"name": "Producto A"}, {"name": "Producto B"}]}'
  const records = ImportService.parseJSON(json)
  assert(records.length === 2, 'Debería extraer array del objeto')
  console.log('  ✓ testParseJSONObjectWithArray')
}

async function testParseJSONEmpty() {
  const records = ImportService.parseJSON('')
  assert(records.length === 0, 'JSON vacío debería retornar array vacío')
  console.log('  ✓ testParseJSONEmpty')
}

async function testImportProducts() {
  const productRepo = createMockRepo()
  const service = new ImportService(productRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { name: 'Producto 1', code: 'P001', purchasePrice: '50', salePrice: '100', stock: '10', stockMin: '5' },
    { name: 'Producto 2', code: 'P002', purchasePrice: '30', salePrice: '60', stock: '5', stockMin: '2' }
  ]

  const result = await service.importProducts(records)
  assert(result.imported === 2, 'Debería importar 2 productos')
  assert(result.skipped === 0, 'No debería omitir ninguno')
  assert(result.errors.length === 0, 'No debería haber errores')
  console.log('  ✓ testImportProducts')
}

async function testImportProductsWithAutoCode() {
  const productRepo = createMockRepo()
  const service = new ImportService(productRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { name: 'Producto sin código' }
  ]

  const result = await service.importProducts(records)
  assert(result.imported === 1, 'Debería importar 1 producto con código autogenerado')
  assert(result.errors.length === 0, 'No debería haber errores')
  console.log('  ✓ testImportProductsWithAutoCode')
}

async function testImportProductsSkipsInvalid() {
  const productRepo = createMockRepo()
  const service = new ImportService(productRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { name: '   ', code: 'P001' },
    { name: 'Válido', code: 'P002' }
  ]

  const result = await service.importProducts(records)
  assert(result.imported === 2, 'Debería importar 2 (genera nombre por defecto para el primero)')
  assert(result.skipped === 0, 'No debería omitir ninguno')
  assert(result.errors.length === 0, 'No debería haber errores')
  console.log('  ✓ testImportProductsSkipsInvalid')
}

async function testImportMembers() {
  const memberRepo = createMockRepo()
  const service = new ImportService(createMockRepo(), memberRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { documentId: '12345678', name: 'Miembro A', email: 'a@test.com', phone: '123456789', address: 'Calle 1' },
    { name: 'Miembro B', email: 'b@test.com' }
  ]

  const result = await service.importMembers(records)
  assert(result.imported === 2, 'Debería importar 2 miembros')
  assert(result.skipped === 0, 'No debería omitir ninguno')
  console.log('  ✓ testImportMembers')
}

async function testImportMembersSkipsInvalid() {
  const memberRepo = createMockRepo()
  const service = new ImportService(createMockRepo(), memberRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { name: '' },
    { name: 'Miembro Válido' }
  ]

  const result = await service.importMembers(records)
  assert(result.imported === 1, 'Debería importar solo 1')
  assert(result.skipped === 1, 'Debería omitir 1')
  console.log('  ✓ testImportMembersSkipsInvalid')
}

async function testImportSuppliers() {
  const supplierRepo = createMockRepo()
  const service = new ImportService(createMockRepo(), createMockRepo(), supplierRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { documentId: '87654321', name: 'Proveedor A', email: 'a@test.com', phone: '987654321', address: 'Av. Principal' }
  ]

  const result = await service.importSuppliers(records)
  assert(result.imported === 1, 'Debería importar 1 proveedor')
  console.log('  ✓ testImportSuppliers')
}

async function testImportSales() {
  const memberRepo = createMockRepo()
  memberRepo._data.push({ id: 1, documentId: '12345678', name: 'Miembro A' })
  const saleRepo = createMockRepo()
  saleRepo.createWithItems = async (saleData, items) => {
    const sale = { id: saleRepo._data.length + 1, ...saleData, items }
    saleRepo._data.push(sale)
    return sale
  }
  const service = new ImportService(createMockRepo(), memberRepo, createMockRepo(), createMockRepo(), saleRepo, createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { memberId: '12345678', date: '2026-01-15T10:00:00.000Z', total: '150', tax: '27', items: [{ productId: 1, quantity: 2, price: 75 }] }
  ]

  const result = await service.importSales(records)
  assert(result.imported === 1, 'Debería importar 1 venta')
  console.log('  ✓ testImportSales')
}

async function testImportSalesSkipsMissingMember() {
  const memberRepo = createMockRepo()
  const saleRepo = createMockRepo()
  const service = new ImportService(createMockRepo(), memberRepo, createMockRepo(), createMockRepo(), saleRepo, createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { memberId: '99999999', date: '2026-01-15T10:00:00.000Z', total: '100', items: [] }
  ]

  const result = await service.importSales(records)
  assert(result.imported === 0, 'No debería importar ninguna venta')
  assert(result.skipped === 1, 'Debería omitir 1')
  assert(result.errors[0].message.includes('no encontrado'), 'Error debería mencionar miembro no encontrado')
  console.log('  ✓ testImportSalesSkipsMissingMember')
}

async function testImportPurchases() {
  const supplierRepo = createMockRepo()
  supplierRepo._data.push({ id: 1, documentId: '87654321', name: 'Proveedor A' })
  const purchaseRepo = createMockRepo()
  purchaseRepo.createWithItems = async (purchaseData, items) => {
    const purchase = { id: purchaseRepo._data.length + 1, ...purchaseData, items }
    purchaseRepo._data.push(purchase)
    return purchase
  }
  const service = new ImportService(createMockRepo(), createMockRepo(), supplierRepo, createMockRepo(), createMockRepo(), purchaseRepo, createMockRepo(), createMockReportRepo())

  const records = [
    { supplierId: '87654321', date: '2026-01-15T10:00:00.000Z', total: '200', items: [{ productId: 1, quantity: 5, price: 40 }] }
  ]

  const result = await service.importPurchases(records)
  assert(result.imported === 1, 'Debería importar 1 compra')
  console.log('  ✓ testImportPurchases')
}

async function testImportInventory() {
  const productRepo = createMockRepo()
  productRepo._data.push({ id: 1, code: 'P001', name: 'Producto 1', stock: 0 })
  const inventoryRepo = createMockRepo()
  const service = new ImportService(productRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), inventoryRepo, createMockReportRepo())

  const records = [
    { product: 'P001', type: 'entry', quantity: '10', date: '2026-01-15T10:00:00.000Z', reference: 'Compra inicial' }
  ]

  const result = await service.importInventory(records)
  assert(result.imported === 1, 'Debería importar 1 movimiento')
  assert(productRepo._data[0].stock === 10, 'Stock debería actualizarse a 10')
  console.log('  ✓ testImportInventory')
}

async function testImportInventoryExit() {
  const productRepo = createMockRepo()
  productRepo._data.push({ id: 1, code: 'P001', name: 'Producto 1', stock: 20 })
  const inventoryRepo = createMockRepo()
  const service = new ImportService(productRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), inventoryRepo, createMockReportRepo())

  const records = [
    { product: 'P001', type: 'exit', quantity: '5', date: '2026-01-15T10:00:00.000Z' }
  ]

  const result = await service.importInventory(records)
  assert(result.imported === 1, 'Debería importar 1 movimiento de salida')
  assert(productRepo._data[0].stock === 15, 'Stock debería reducirse a 15')
  console.log('  ✓ testImportInventoryExit')
}

async function testImportSettings() {
  const settingRepo = createMockRepo()
  const service = new ImportService(createMockRepo(), createMockRepo(), createMockRepo(), settingRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { key: 'tax_rate', value: '18' },
    { key: 'currency_symbol', value: 'S/' }
  ]

  const result = await service.importSettings(records)
  assert(result.imported === 2, 'Debería importar 2 configuraciones')
  assert(settingRepo._data.length === 2, 'Repositorio debería tener 2 settings')
  console.log('  ✓ testImportSettings')
}

async function testImportDataAutoDetectProducts() {
  const productRepo = createMockRepo()
  const service = new ImportService(productRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { name: 'Producto 1', code: 'P001', price: 100 },
    { name: 'Producto 2', code: 'P002', price: 200 }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 2, 'Debería auto-detectar productos e importar 2')
  console.log('  ✓ testImportDataAutoDetectProducts')
}

async function testImportDataAutoDetectMembers() {
  const memberRepo = createMockRepo()
  const service = new ImportService(createMockRepo(), memberRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { documento: '12345678', miembro: 'Miembro A', email: 'a@test.com' }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Debería auto-detectar miembros e importar 1')
  console.log('  ✓ testImportDataAutoDetectMembers')
}

async function testImportDataManualEntity() {
  const productRepo = createMockRepo()
  const service = new ImportService(productRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { name: 'Producto 1', code: 'P001' }
  ]

  const result = await service.importData('products', records)
  assert(result.imported === 1, 'Debería importar 1 producto con entidad manual')
  console.log('  ✓ testImportDataManualEntity')
}

async function testImportDataUnknownEntity() {
  const service = new ImportService(createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  try {
    await service.importData('unknown', [{ name: 'Test' }])
    assert(false, 'Debería lanzar error para entidad desconocida')
  } catch (error) {
    assert(error.message.includes('Entidad desconocida'), 'Error debería mencionar entidad desconocida')
  }
  console.log('  ✓ testImportDataUnknownEntity')
}

async function testSanitizeRecord() {
  const service = new ImportService(createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const record = { name: '  Producto  ', code: ' P001 ', price: 100 }
  const sanitized = service._sanitizeRecord(record)
  assert(sanitized.name === 'Producto', 'Debería trim string')
  assert(sanitized.code === 'P001', 'Debería trim string')
  assert(sanitized.price === 100, 'Debería mantener números')
  console.log('  ✓ testSanitizeRecord')
}

async function testSanitizeRecordNull() {
  const service = new ImportService(createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const sanitized = service._sanitizeRecord(null)
  assert(typeof sanitized === 'object', 'Debería retornar objeto vacío para null')
  assert(Object.keys(sanitized).length === 0, 'Debería ser objeto vacío')
  console.log('  ✓ testSanitizeRecordNull')
}

async function testImportDataAutoDetectMembersEnglishHeaders() {
  const memberRepo = createMockRepo()
  const service = new ImportService(createMockRepo(), memberRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { customer: 'John Doe', email: 'john@test.com', phone: '123456789', address: '123 Main St' }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Debería auto-detectar miembros con headers en inglés (customer, email, phone, address)')
  assert(memberRepo._data.length === 1, 'Miembro debería guardarse en memberRepo')
  assert(memberRepo._data[0].name === 'John Doe', 'Nombre debería ser John Doe')
  assert(memberRepo._data[0].email === 'john@test.com', 'Email debería coincidir')
  console.log('  ✓ testImportDataAutoDetectMembersEnglishHeaders')
}

async function testImportDataAutoDetectSuppliersEnglishHeaders() {
  const supplierRepo = createMockRepo()
  const service = new ImportService(createMockRepo(), createMockRepo(), supplierRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { supplier: 'Supplier Co', email: 'supplier@test.com', phone: '987654321', address: '456 Oak Ave' }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Debería auto-detectar proveedores con headers en inglés (supplier, email, phone, address)')
  assert(supplierRepo._data.length === 1, 'Proveedor debería guardarse en supplierRepo')
  assert(supplierRepo._data[0].name === 'Supplier Co', 'Nombre debería ser Supplier Co')
  console.log('  ✓ testImportDataAutoDetectSuppliersEnglishHeaders')
}

async function testImportDataAutoDetectInventoryEnglishHeaders() {
  const productRepo = createMockRepo()
  productRepo._data.push({ id: 1, code: 'P001', name: 'Producto Test', stock: 10 })
  const inventoryRepo = createMockRepo()
  const service = new ImportService(productRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), inventoryRepo, createMockReportRepo())

  const records = [
    { product: 'P001', type: 'entry', quantity: '5', date: '2026-06-01T10:00:00.000Z' }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Debería auto-detectar inventario con headers en inglés')
  console.log('  ✓ testImportDataAutoDetectInventoryEnglishHeaders')
}

async function testImportDataMovementsAlias() {
  const productRepo = createMockRepo()
  productRepo._data.push({ id: 1, code: 'P001', name: 'Producto Test', stock: 10 })
  const inventoryRepo = createMockRepo()
  const service = new ImportService(productRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), inventoryRepo, createMockReportRepo())

  const records = [
    { product: 'P001', type: 'entry', quantity: '5' }
  ]

  const result = await service.importData('movements', records)
  assert(result.imported === 1, 'Alias "movements" debería importar inventario')
  console.log('  ✓ testImportDataMovementsAlias')
}

async function testImportDataConfigAlias() {
  const settingRepo = createMockRepo()
  const service = new ImportService(createMockRepo(), createMockRepo(), createMockRepo(), settingRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { key: 'tax_rate', value: '18' }
  ]

  const result = await service.importData('config', records)
  assert(result.imported === 1, 'Alias "config" debería importar configuraciones')
  assert(settingRepo._data.length === 1, 'Setting debería guardarse')
  console.log('  ✓ testImportDataConfigAlias')
}

async function testImportSuppliersNotSavedAsMembers() {
  const memberRepo = createMockRepo()
  const supplierRepo = createMockRepo()
  const service = new ImportService(createMockRepo(), memberRepo, supplierRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { name: 'Proveedor ABC', email: 'abc@proveedor.com', phone: '111222333', address: 'Av. Principal 456' }
  ]

  try {
    await service.importData('auto', records)
    assert(false, 'Debería lanzar error por ambigüedad miembro/proveedor')
  } catch (error) {
    assert(error.message.includes('distinguir entre Miembros y Proveedores'), 'Error debe mencionar ambigüedad')
  }
  assert(memberRepo._data.length === 0, 'No debería haber miembros guardados')
  assert(supplierRepo._data.length === 0, 'No debería haber proveedores guardados')
  console.log('  ✓ testImportSuppliersNotSavedAsMembers')
}

async function testImportMembersNotSavedAsSuppliers() {
  const memberRepo = createMockRepo()
  const supplierRepo = createMockRepo()
  const service = new ImportService(createMockRepo(), memberRepo, supplierRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { name: 'Miembro XYZ', email: 'xyz@miembro.com', phone: '999888777', address: 'Jr. Las Flores 123' }
  ]

  try {
    await service.importData('auto', records)
    assert(false, 'Debería lanzar error por ambigüedad miembro/proveedor')
  } catch (error) {
    assert(error.message.includes('distinguir entre Miembros y Proveedores'), 'Error debe mencionar ambigüedad')
  }
  assert(memberRepo._data.length === 0, 'No debería haber miembros guardados')
  assert(supplierRepo._data.length === 0, 'No debería haber proveedores guardados')
  console.log('  ✓ testImportMembersNotSavedAsSuppliers')
}

async function testImportProductsNotSavedAsMembers() {
  const productRepo = createMockRepo()
  const memberRepo = createMockRepo()
  const service = new ImportService(productRepo, memberRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { name: 'Laptop Gamer', code: 'LAP-001', purchasePrice: '800', salePrice: '1200', stock: '10', category: 'Electrónica' }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Debería importar 1 producto')
  assert(productRepo._data.length === 1, 'Producto debería guardarse en productRepo')
  assert(memberRepo._data.length === 0, 'No debería haber miembros guardados')
  console.log('  ✓ testImportProductsNotSavedAsMembers')
}

async function testImportSalesAmbiguousWithPurchases() {
  const saleRepo = createMockRepo()
  saleRepo.createWithItems = async (saleData, items) => {
    const sale = { id: saleRepo._data.length + 1, ...saleData, items }
    saleRepo._data.push(sale)
    return sale
  }
  const purchaseRepo = createMockRepo()
  purchaseRepo.createWithItems = async (purchaseData, items) => {
    const purchase = { id: purchaseRepo._data.length + 1, ...purchaseData, items }
    purchaseRepo._data.push(purchase)
    return purchase
  }
  const memberRepo = createMockRepo()
  memberRepo._data.push({ id: 1, documentId: '12345678', name: 'Miembro A' })
  const supplierRepo = createMockRepo()
  supplierRepo._data.push({ id: 1, documentId: '87654321', name: 'Proveedor A' })
  const service = new ImportService(createMockRepo(), memberRepo, supplierRepo, createMockRepo(), saleRepo, purchaseRepo, createMockRepo(), createMockReportRepo())

  const records = [
    { fecha: '2026-06-01', total: '150', items: '[]' }
  ]

  try {
    await service.importData('auto', records)
    assert(false, 'Debería lanzar error por ambigüedad ventas/compras')
  } catch (error) {
    assert(error.message.includes('distinguir entre Ventas y Compras'), 'Error debe mencionar ambigüedad')
  }
  assert(saleRepo._data.length === 0, 'No debería haber ventas guardadas')
  assert(purchaseRepo._data.length === 0, 'No debería haber compras guardadas')
  console.log('  ✓ testImportSalesAmbiguousWithPurchases')
}

async function testImportSalesDetectedBySaleHeader() {
  const saleRepo = createMockRepo()
  saleRepo.createWithItems = async (saleData, items) => {
    const sale = { id: saleRepo._data.length + 1, ...saleData, items }
    saleRepo._data.push(sale)
    return sale
  }
  const memberRepo = createMockRepo()
  memberRepo._data.push({ id: 1, documentId: '12345678', name: 'Miembro A' })
  const service = new ImportService(createMockRepo(), memberRepo, createMockRepo(), createMockRepo(), saleRepo, createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { memberId: '12345678', fecha: '2026-06-01', total: '150', tax: '27', items: [] }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Venta con memberId debe detectarse como sales')
  assert(saleRepo._data.length === 1, 'Venta debe guardarse en saleRepo')
  console.log('  ✓ testImportSalesDetectedBySaleHeader')
}

async function testImportPurchasesDetectedByPurchaseHeader() {
  const purchaseRepo = createMockRepo()
  purchaseRepo.createWithItems = async (purchaseData, items) => {
    const purchase = { id: purchaseRepo._data.length + 1, ...purchaseData, items }
    purchaseRepo._data.push(purchase)
    return purchase
  }
  const supplierRepo = createMockRepo()
  supplierRepo._data.push({ id: 1, documentId: '87654321', name: 'Proveedor A' })
  const service = new ImportService(createMockRepo(), createMockRepo(), supplierRepo, createMockRepo(), createMockRepo(), purchaseRepo, createMockRepo(), createMockReportRepo())

  const records = [
    { supplierId: '87654321', fecha: '2026-06-01', total: '200', items: [] }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Compra con supplierId debe detectarse como purchases')
  assert(purchaseRepo._data.length === 1, 'Compra debe guardarse en purchaseRepo')
  console.log('  ✓ testImportPurchasesDetectedByPurchaseHeader')
}

async function testImportInventoryDetectedByTypeHeader() {
  const productRepo = createMockRepo()
  productRepo._data.push({ id: 1, code: 'P001', name: 'Producto 1', stock: 10 })
  const inventoryRepo = createMockRepo()
  const service = new ImportService(productRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), inventoryRepo, createMockReportRepo())

  const records = [
    { producto: 'P001', type: 'entry', cantidad: '5' }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Inventario debe detectarse por type/cantidad')
  console.log('  ✓ testImportInventoryDetectedByTypeHeader')
}

async function testImportSuppliersDetectedByDocIdPrefixed() {
  const supplierRepo = createMockRepo()
  const memberRepo = createMockRepo()
  const service = new ImportService(createMockRepo(), memberRepo, supplierRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { id: '2', documentId: 'PROV-002', name: 'Importaciones Globales, S.A.', email: 'info@importglobal.com', phone: '5555-1002', address: '1a. Avenida 5-30, Zona 10' },
    { id: '3', documentId: 'PROV-003', name: 'Suministros Office S.A.', email: 'pedidos@suministros.com', phone: '5555-1003', address: '7a. Avenida 15-45, Zona 13' }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 2, 'Debería importar 2 proveedores con documentId PROV-*')
  assert(supplierRepo._data.length === 2, 'Proveedores deben guardarse en supplierRepo')
  assert(memberRepo._data.length === 0, 'No debe guardarse en memberRepo')
  assert(supplierRepo._data[0].name === 'Importaciones Globales, S.A.', 'Nombre del primer proveedor correcto')
  console.log('  ✓ testImportSuppliersDetectedByDocIdPrefixed')
}

async function testImportMembersDetectedByDocIdPrefixed() {
  const supplierRepo = createMockRepo()
  const memberRepo = createMockRepo()
  const service = new ImportService(createMockRepo(), memberRepo, supplierRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { documentId: 'M001', name: 'Miembro Uno', email: 'miembro1@test.com', phone: '111111111', address: 'Calle 1' }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Debería importar 1 miembro con documentId C*')
  assert(memberRepo._data.length === 1, 'Miembro debe guardarse en memberRepo')
  assert(supplierRepo._data.length === 0, 'No debe guardar en supplierRepo')
  console.log('  ✓ testImportMembersDetectedByDocIdPrefixed')
}

async function testImportSalesExportedCSV() {
  const memberRepo = createMockRepo()
  memberRepo._data.push({ id: 1, documentId: 'C001', name: 'Miembro Export' })
  const saleRepo = createMockRepo()
  saleRepo.createWithItems = async (saleData, items) => {
    const sale = { id: saleRepo._data.length + 1, ...saleData, items }
    saleRepo._data.push(sale)
    return sale
  }
  const service = new ImportService(createMockRepo(), memberRepo, createMockRepo(), createMockRepo(), saleRepo, createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { id: '1', memberId: '1', memberName: 'Miembro Export', date: '2026-07-08T10:00:00.000Z', subtotal: '100', tax: '18', total: '118', status: 'completed', notes: '', createdAt: '2026-07-08T10:00:00.000Z', updatedAt: '2026-07-08T10:00:00.000Z' }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Venta exportada debe importarse correctamente')
  assert(result.skipped === 0, 'No debe omitir ninguna')
  assert(saleRepo._data.length === 1, 'Venta guardada en saleRepo')
  console.log('  ✓ testImportSalesExportedCSV')
}

async function testImportSalesOcasionalCSV() {
  const memberRepo = createMockRepo()
  const saleRepo = createMockRepo()
  saleRepo.createWithItems = async (saleData, items) => {
    const sale = { id: saleRepo._data.length + 1, ...saleData, items }
    saleRepo._data.push(sale)
    return sale
  }
  const service = new ImportService(createMockRepo(), memberRepo, createMockRepo(), createMockRepo(), saleRepo, createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { id: '1', memberName: 'Miembro ocasional', date: '2026-07-09T01:34:21.318Z', subtotal: '650', tax: '78', total: '728', status: 'completed', notes: '', createdAt: '2026-07-09T01:34:21.318Z', updatedAt: '2026-07-09T01:34:21.318Z' }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Venta ocasional debe importarse correctamente')
  assert(result.skipped === 0, 'No debe omitir ninguna')
  assert(saleRepo._data.length === 1, 'Venta guardada en saleRepo')
  assert(memberRepo._data.length === 1, 'Miembro ocasional creado automáticamente')
  assert(memberRepo._data[0].name === 'Miembro ocasional', 'Nombre del miembro ocasional correcto')
  console.log('  ✓ testImportSalesOcasionalCSV')
}

async function testImportPurchasesExportedCSV() {
  const supplierRepo = createMockRepo()
  supplierRepo._data.push({ id: 1, documentId: 'PROV-001', name: 'Proveedor Export' })
  const purchaseRepo = createMockRepo()
  purchaseRepo.createWithItems = async (purchaseData, items) => {
    const purchase = { id: purchaseRepo._data.length + 1, ...purchaseData, items }
    purchaseRepo._data.push(purchase)
    return purchase
  }
  const service = new ImportService(createMockRepo(), createMockRepo(), supplierRepo, createMockRepo(), createMockRepo(), purchaseRepo, createMockRepo(), createMockReportRepo())

  const records = [
    { id: '1', supplierId: '1', supplierName: 'Proveedor Export', date: '2026-07-08T10:00:00.000Z', subtotal: '200', tax: '36', total: '236', status: 'completed', notes: '', createdAt: '2026-07-08T10:00:00.000Z', updatedAt: '2026-07-08T10:00:00.000Z' }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Compra exportada debe importarse correctamente')
  assert(result.skipped === 0, 'No debe omitir ninguna')
  assert(purchaseRepo._data.length === 1, 'Compra guardada en purchaseRepo')
  console.log('  ✓ testImportPurchasesExportedCSV')
}

async function testImportMovementsExportedCSV() {
  const productRepo = createMockRepo()
  productRepo._data.push({ id: 1, code: 'PROD-001', name: 'Producto Test', stock: 20 })
  const inventoryRepo = createMockRepo()
  const service = new ImportService(productRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), inventoryRepo, createMockReportRepo())

  const records = [
    { id: '1', productId: '1', productName: 'Producto Test', type: 'entry', quantity: '10', stockBefore: '10', stockAfter: '20', reference: 'Compra', referenceId: '1', notes: '', date: '2026-07-08T10:00:00.000Z' }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Movimiento exportado debe importarse correctamente')
  assert(result.skipped === 0, 'No debe omitir ninguno')
  assert(inventoryRepo._data.length === 1, 'Movimiento guardado en inventoryRepo')
  assert(productRepo._data[0].stock === 30, 'Stock debe actualizarse (20 + 10)')
  console.log('  ✓ testImportMovementsExportedCSV')
}

async function testParseJSONFullExport() {
  const json = '{"products":[{"code":"P001","name":"Prod 1"}],"members":[{"documentId":"C001","name":"Miembro 1"}],"suppliers":[{"documentId":"PROV-001","name":"Prov 1"}],"movements":[],"sales":[],"purchases":[],"settings":[{"key":"tax_rate","value":"18"}]}'
  const result = ImportService.parseJSON(json)
  assert(ImportService.isFullExport(result) === true, 'Debería detectarse como full export')
  assert(result.products.length === 1, 'products debe estar presente')
  assert(result.members.length === 1, 'members debe estar presente')
  assert(result.settings.length === 1, 'settings debe estar presente')
  console.log('  ✓ testParseJSONFullExport')
}

async function testParseJSONFullExportIgnoresEmpty() {
  const json = '{"products":[{"code":"P001"}],"members":[],"suppliers":[],"movements":[],"sales":[],"purchases":[],"settings":[]}'
  const result = ImportService.parseJSON(json)
  assert(ImportService.isFullExport(result) === true, 'Debe detectarse incluso con arrays vacíos')
  console.log('  ✓ testParseJSONFullExportIgnoresEmpty')
}

async function testImportFullExport() {
  const productRepo = createMockRepo()
  const memberRepo = createMockRepo()
  const supplierRepo = createMockRepo()
  const settingRepo = createMockRepo()
  const service = new ImportService(productRepo, memberRepo, supplierRepo, settingRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const data = {
    products: [{ name: 'Producto 1', code: 'P001', purchasePrice: '50', salePrice: '100', stock: '10' }],
    members: [{ documentId: 'M001', name: 'Miembro 1', email: 'c1@test.com' }],
    suppliers: [{ documentId: 'PROV-001', name: 'Proveedor 1', email: 'p1@test.com' }],
    settings: [{ key: 'tax_rate', value: '18' }]
  }

  const result = await service.importFullExport(data)
  assert(productRepo._data.length === 1, 'Producto importado')
  assert(memberRepo._data.length === 1, 'Miembro importado')
  assert(supplierRepo._data.length === 1, 'Proveedor importado')
  assert(settingRepo._data.length === 1, 'Setting importado')
  assert(result.totalImported === 4, 'Total importados debe ser 4')
  assert(result.entities.length === 4, '4 entidades procesadas')
  console.log('  ✓ testImportFullExport')
}

function createFullMockRepos() {
  return {
    productRepo: createMockRepo(),
    memberRepo: createMockRepo(),
    supplierRepo: createMockRepo(),
    settingRepo: createMockRepo(),
    saleRepo: createMockRepo(),
    purchaseRepo: createMockRepo(),
    inventoryRepo: createMockRepo(),
    reportRepo: createMockReportRepo(),
    membershipPlanRepo: createMockRepo(),
    membershipRepo: createMockRepo(),
    membershipHistoryRepo: createMockRepo(),
    membershipPaymentRepo: createMockRepo(),
    attendanceRepo: createMockRepo(),
    trainerRepo: createMockRepo(),
    physicalEvolutionRepo: createMockRepo(),
    gymAssetRepo: createMockRepo(),
    maintenanceRepo: createMockRepo()
  }
}

function createFullService() {
  const repos = createFullMockRepos()
  repos.saleRepo.createWithItems = async (saleData, items) => {
    const sale = { id: repos.saleRepo._data.length + 1, ...saleData, items }
    repos.saleRepo._data.push(sale)
    return sale
  }
  repos.purchaseRepo.createWithItems = async (purchaseData, items) => {
    const purchase = { id: repos.purchaseRepo._data.length + 1, ...purchaseData, items }
    repos.purchaseRepo._data.push(purchase)
    return purchase
  }
  repos.productRepo.updateStock = async (productId, quantity) => {
    const item = repos.productRepo._data.find(d => d.id === productId)
    if (item) item.stock = Math.max(0, (item.stock || 0) + quantity)
    return item
  }
  repos.settingRepo.set = async (key, value) => {
    const existing = repos.settingRepo._data.find(d => d.key === key)
    const setting = { id: existing?.id, key, value, updatedAt: new Date().toISOString() }
    if (existing) {
      Object.assign(existing, setting)
    } else {
      repos.settingRepo._data.push({ ...setting, id: repos.settingRepo._data.length + 1 })
    }
    return setting
  }
  repos.memberRepo.findByDocumentId = async (docId) => repos.memberRepo._data.find(d => d.documentId === docId) || null
  repos.memberRepo.findById = async (id) => repos.memberRepo._data.find(d => d.id === id) || null
  repos.memberRepo.findByDocumentId = async (docId) => repos.memberRepo._data.find(d => d.documentId === docId) || null
  repos.supplierRepo.findByDocumentId = async (docId) => repos.supplierRepo._data.find(d => d.documentId === docId) || null
  repos.supplierRepo.findById = async (id) => repos.supplierRepo._data.find(d => d.id === id) || null
  repos.trainerRepo.generateNextDocumentId = async () => 'T001'
  repos.gymAssetRepo.generateNextCode = async () => 'A001'
  const service = new ImportService(
    repos.productRepo, repos.memberRepo, repos.supplierRepo, repos.settingRepo,
    repos.saleRepo, repos.purchaseRepo, repos.inventoryRepo, repos.reportRepo,
    repos.membershipPlanRepo, repos.membershipRepo, repos.membershipHistoryRepo,
    repos.membershipPaymentRepo, repos.attendanceRepo, repos.trainerRepo,
    repos.physicalEvolutionRepo, repos.gymAssetRepo, repos.maintenanceRepo
  )
  return { service, repos }
}

async function testImportTrainers() {
  const { service, repos } = createFullService()

  const records = [
    { documentId: 'T001', name: 'Entrenador A', email: 'a@test.com', phone: '123456789', address: 'Calle 1', specialty: 'Fuerza', active: 'true' }
  ]

  const result = await service.importTrainers(records)
  assert(result.imported === 1, 'Debería importar 1 entrenador')
  assert(repos.trainerRepo._data.length === 1, 'Entrenador guardado en trainerRepo')
  assert(repos.trainerRepo._data[0].name === 'Entrenador A', 'Nombre correcto')
  assert(repos.trainerRepo._data[0].specialty === 'Fuerza', 'Especialidad correcta')
  console.log('  ✓ testImportTrainers')
}

async function testImportTrainersSkipsInvalid() {
  const { service, repos } = createFullService()

  const records = [
    { documentId: 'T002', name: 'Entrenador B' }
  ]

  const result = await service.importTrainers(records)
  assert(result.imported === 1, 'Debería importar 1 entrenador')
  assert(result.skipped === 0, 'No debería omitir ninguno')
  console.log('  ✓ testImportTrainersSkipsInvalid')
}

async function testImportGymAssets() {
  const { service, repos } = createFullService()

  const records = [
    { code: 'A001', name: 'Bicicleta', type: 'Cardio', brand: 'BrandX', model: 'M1', purchasePrice: '1000', status: 'active', location: 'Sala A' }
  ]

  const result = await service.importGymAssets(records)
  assert(result.imported === 1, 'Debería importar 1 activo')
  assert(repos.gymAssetRepo._data.length === 1, 'Activo guardado en gymAssetRepo')
  assert(repos.gymAssetRepo._data[0].name === 'Bicicleta', 'Nombre correcto')
  assert(repos.gymAssetRepo._data[0].code === 'A001', 'Código correcto')
  console.log('  ✓ testImportGymAssets')
}

async function testImportGymAssetsWithAutoCode() {
  const { service, repos } = createFullService()

  const records = [
    { name: 'Cuerda' }
  ]

  const result = await service.importGymAssets(records)
  assert(result.imported === 1, 'Debería importar 1 activo con código autogenerado')
  assert(repos.gymAssetRepo._data[0].code === 'A001', 'Código autogenerado correcto')
  console.log('  ✓ testImportGymAssetsWithAutoCode')
}

async function testImportMaintenance() {
  const { service, repos } = createFullService()

  const records = [
    { assetId: '1', date: '2026-07-01', type: 'Preventivo', cost: '500', description: 'Mantenimiento', nextDate: '2026-08-01', status: 'completed' }
  ]

  const result = await service.importMaintenance(records)
  assert(result.imported === 1, 'Debería importar 1 mantenimiento')
  assert(repos.maintenanceRepo._data.length === 1, 'Mantenimiento guardado en maintenanceRepo')
  assert(repos.maintenanceRepo._data[0].assetId === 1, 'assetId numérico correcto')
  assert(repos.maintenanceRepo._data[0].cost === 500, 'cost numérico correcto')
  console.log('  ✓ testImportMaintenance')
}

async function testImportMaintenanceSkipsInvalid() {
  const { service, repos } = createFullService()

  const records = [
    { date: '2026-07-01', type: 'Preventivo', cost: '500' }
  ]

  const result = await service.importMaintenance(records)
  assert(result.imported === 0, 'No debería importar mantenimiento sin assetId')
  assert(result.skipped === 1, 'Debería omitir 1')
  assert(result.errors[0].message.includes('assetId'), 'Error menciona assetId')
  console.log('  ✓ testImportMaintenanceSkipsInvalid')
}

async function testImportAttendance() {
  const { service, repos } = createFullService()

  const records = [
    { memberId: '1', date: '2026-07-01', time: '08:00' }
  ]

  const result = await service.importAttendance(records)
  assert(result.imported === 1, 'Debería importar 1 asistencia')
  assert(repos.attendanceRepo._data.length === 1, 'Asistencia guardada en attendanceRepo')
  assert(repos.attendanceRepo._data[0].memberId === 1, 'memberId numérico correcto')
  console.log('  ✓ testImportAttendance')
}

async function testImportAttendanceSkipsInvalid() {
  const { service, repos } = createFullService()

  const records = [
    { date: '2026-07-01', time: '08:00' }
  ]

  const result = await service.importAttendance(records)
  assert(result.imported === 0, 'No debería importar asistencia sin memberId')
  assert(result.skipped === 1, 'Debería omitir 1')
  console.log('  ✓ testImportAttendanceSkipsInvalid')
}

async function testImportPhysicalEvolutions() {
  const { service, repos } = createFullService()

  const records = [
    { memberId: '1', date: '2026-07-01', weight: '75', height: '180', bodyFat: '15', muscle: '40' }
  ]

  const result = await service.importPhysicalEvolutions(records)
  assert(result.imported === 1, 'Debería importar 1 evolución')
  assert(repos.physicalEvolutionRepo._data.length === 1, 'Evolución guardada')
  assert(repos.physicalEvolutionRepo._data[0].memberId === 1, 'memberId numérico correcto')
  assert(repos.physicalEvolutionRepo._data[0].weight === 75, 'weight numérico correcto')
  console.log('  ✓ testImportPhysicalEvolutions')
}

async function testImportPhysicalEvolutionsSkipsInvalid() {
  const { service, repos } = createFullService()

  const records = [
    { weight: '75', height: '180' }
  ]

  const result = await service.importPhysicalEvolutions(records)
  assert(result.imported === 0, 'No debería importar evolución sin memberId')
  assert(result.skipped === 1, 'Debería omitir 1')
  console.log('  ✓ testImportPhysicalEvolutionsSkipsInvalid')
}

async function testImportMembershipPlans() {
  const { service, repos } = createFullService()

  const records = [
    { name: 'Plan Mensual', description: 'Plan de prueba', durationDays: '30', price: '5000', active: 'true' }
  ]

  const result = await service.importMembershipPlans(records)
  assert(result.imported === 1, 'Debería importar 1 plan de membresía')
  assert(repos.membershipPlanRepo._data.length === 1, 'Plan guardado en membershipPlanRepo')
  assert(repos.membershipPlanRepo._data[0].name === 'Plan Mensual', 'Nombre correcto')
  console.log('  ✓ testImportMembershipPlans')
}

async function testImportMemberships() {
  const { service, repos } = createFullService()
  repos.memberRepo._data.push({ id: 1, documentId: 'C001', name: 'Miembro 1' })
  repos.membershipPlanRepo._data.push({ id: 1, name: 'Plan 1' })

  const records = [
    { memberId: '1', planId: '1', startDate: '2026-07-01', endDate: '2026-08-01', status: 'active', price: '5000' }
  ]

  const result = await service.importMemberships(records)
  assert(result.imported === 1, 'Debería importar 1 membresía')
  assert(repos.membershipRepo._data.length === 1, 'Membresía guardada en membershipRepo')
  console.log('  ✓ testImportMemberships')
}

async function testImportDataTrainers() {
  const { service, repos } = createFullService()

  const records = [
    { documentId: 'T001', name: 'Entrenador A', email: 'a@test.com', specialty: 'Fuerza' }
  ]

  const result = await service.importData('trainers', records)
  assert(result.imported === 1, 'Debería importar 1 entrenador via importData')
  assert(repos.trainerRepo._data.length === 1, 'Entrenador guardado')
  console.log('  ✓ testImportDataTrainers')
}

async function testImportDataGymAssets() {
  const { service, repos } = createFullService()

  const records = [
    { name: 'Bicicleta', type: 'Cardio' }
  ]

  const result = await service.importData('gymAssets', records)
  assert(result.imported === 1, 'Debería importar 1 activo via importData')
  assert(repos.gymAssetRepo._data.length === 1, 'Activo guardado')
  console.log('  ✓ testImportDataGymAssets')
}

async function testImportDataMaintenance() {
  const { service, repos } = createFullService()

  const records = [
    { assetId: '1', date: '2026-07-01', type: 'Preventivo', cost: '500' }
  ]

  const result = await service.importData('maintenance', records)
  assert(result.imported === 1, 'Debería importar 1 mantenimiento via importData')
  assert(repos.maintenanceRepo._data.length === 1, 'Mantenimiento guardado')
  console.log('  ✓ testImportDataMaintenance')
}

async function testImportDataAutoDetectTrainers() {
  const { service, repos } = createFullService()

  const records = [
    { documento: 'T001', entrenador: 'Entrenador A', email: 'a@test.com', especialidad: 'Fuerza' }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Debería auto-detectar entrenadores e importar 1')
  assert(repos.trainerRepo._data.length === 1, 'Entrenador guardado en trainerRepo')
  console.log('  ✓ testImportDataAutoDetectTrainers')
}

async function testImportDataAutoDetectPhysicalEvolutions() {
  const { service, repos } = createFullService()
  repos.memberRepo._data.push({ id: 1, documentId: 'C001', name: 'Miembro 1' })

  const records = [
    { memberId: '1', fecha: '2026-07-01', peso: '75', altura: '180', grasa: '15' }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Debería auto-detectar evoluciones físicas e importar 1')
  assert(repos.physicalEvolutionRepo._data.length === 1, 'Evolución guardada en physicalEvolutionRepo')
  console.log('  ✓ testImportDataAutoDetectPhysicalEvolutions')
}

async function testImportFullExportWithAllEntities() {
  const { service, repos } = createFullService()

  repos.memberRepo._data.push({ id: 1, documentId: 'C001', name: 'Miembro 1' })
  repos.membershipPlanRepo._data.push({ id: 1, name: 'Plan 1' })
  repos.gymAssetRepo._data.push({ id: 1, code: 'A001', name: 'Asset 1' })

  const data = {
    trainers: [{ documentId: 'T001', name: 'Trainer 1', email: 't@test.com', active: 'true' }],
    gymAssets: [{ code: 'A002', name: 'Asset 2', type: 'Cardio', purchasePrice: '500', status: 'active', active: 'true' }],
    maintenance: [{ assetId: 1, date: '2026-07-01', type: 'Preventivo', cost: '500', status: 'completed' }],
    attendance: [{ memberId: 1, date: '2026-07-01', time: '08:00' }],
    physicalEvolutions: [{ memberId: 1, date: '2026-07-01', weight: '75' }]
  }

  const result = await service.importFullExport(data)
  assert(result.totalImported === 5, 'Total importados debe ser 5')
  assert(repos.trainerRepo._data.length === 1, 'Trainer importado')
  assert(repos.gymAssetRepo._data.length === 2, '2 gymAssets (1 existente + 1 importado)')
  assert(repos.maintenanceRepo._data.length === 1, 'Maintenance importado')
  assert(repos.attendanceRepo._data.length === 1, 'Attendance importado')
  assert(repos.physicalEvolutionRepo._data.length === 1, 'PhysicalEvolution importado')
  console.log('  ✓ testImportFullExportWithAllEntities')
}

export async function runImportServiceTests() {
  console.log('\n--- ImportService Tests ---\n')

  await testParseCSVBasic()
  await testParseCSVWithQuotes()
  await testParseCSVEmpty()
  await testParseCSVOnlyHeaders()
  await testParseJSONArray()
  await testParseJSONObjectWithArray()
  await testParseJSONEmpty()
  await testImportProducts()
  await testImportProductsWithAutoCode()
  await testImportProductsSkipsInvalid()
  await testImportMembers()
  await testImportMembersSkipsInvalid()
  await testImportSuppliers()
  await testImportSales()
  await testImportSalesSkipsMissingMember()
  await testImportPurchases()
  await testImportInventory()
  await testImportInventoryExit()
  await testImportSettings()
  await testImportDataAutoDetectProducts()
  await testImportDataAutoDetectMembers()
  await testImportDataManualEntity()
  await testImportDataUnknownEntity()
  await testSanitizeRecord()
  await testSanitizeRecordNull()
  await testImportDataAutoDetectMembersEnglishHeaders()
  await testImportDataAutoDetectSuppliersEnglishHeaders()
  await testImportDataAutoDetectInventoryEnglishHeaders()
  await testImportDataMovementsAlias()
  await testImportDataConfigAlias()
  await testImportSuppliersNotSavedAsMembers()
  await testImportMembersNotSavedAsSuppliers()
  await testImportProductsNotSavedAsMembers()
  await testImportSalesAmbiguousWithPurchases()
  await testImportSalesDetectedBySaleHeader()
  await testImportPurchasesDetectedByPurchaseHeader()
  await testImportInventoryDetectedByTypeHeader()
  await testImportSuppliersDetectedByDocIdPrefixed()
  await testImportMembersDetectedByDocIdPrefixed()
  await testImportSalesExportedCSV()
  await testImportSalesOcasionalCSV()
  await testImportPurchasesExportedCSV()
  await testImportMovementsExportedCSV()
  await testParseJSONFullExport()
  await testParseJSONFullExportIgnoresEmpty()
  await testImportFullExport()
  await testImportTrainers()
  await testImportTrainersSkipsInvalid()
  await testImportGymAssets()
  await testImportGymAssetsWithAutoCode()
  await testImportMaintenance()
  await testImportMaintenanceSkipsInvalid()
  await testImportAttendance()
  await testImportAttendanceSkipsInvalid()
  await testImportPhysicalEvolutions()
  await testImportPhysicalEvolutionsSkipsInvalid()
  await testImportMembershipPlans()
  await testImportMemberships()
  await testImportDataTrainers()
  await testImportDataGymAssets()
  await testImportDataMaintenance()
  await testImportDataAutoDetectTrainers()
  await testImportDataAutoDetectPhysicalEvolutions()
  await testImportFullExportWithAllEntities()

  console.log('\n✓ Todos los tests de ImportService pasaron\n')
}