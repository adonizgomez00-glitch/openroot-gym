import { MaintenanceController } from '../../src/controllers/MaintenanceController.js'

function createMockService() {
  let maintenances = []
  let nextId = 1

  return {
    async getAll() { return [...maintenances] },

    async getById(id) {
      const m = maintenances.find(x => x.id === id)
      if (!m) throw new Error(`Registro con id ${id} no encontrado`)
      return { ...m }
    },

    async search(query) {
      if (!query || !query.trim()) return [...maintenances]
      const lower = query.toLowerCase()
      return maintenances.filter(m =>
        m.type?.toLowerCase().includes(lower) ||
        m.description?.toLowerCase().includes(lower)
      ).map(m => ({ ...m }))
    },

    async create(data) {
      const m = { id: nextId++, ...data }
      maintenances.push(m)
      return { ...m }
    },

    async update(id, data) {
      const idx = maintenances.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Registro con id ${id} no encontrado`)
      maintenances[idx] = { ...maintenances[idx], ...data }
      return { ...maintenances[idx] }
    },

    async delete(id) {
      const idx = maintenances.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Registro con id ${id} no encontrado`)
      maintenances.splice(idx, 1)
      return true
    }
  }
}

function createMockView() {
  return {
    rendered: false,
    maintenancesData: null,
    errorMessage: null,
    successMessage: null,
    formOpened: false,
    formClosed: false,
    savingState: false,
    loadingState: false,
    confirmed: true,

    reset() {
      this.rendered = false
      this.maintenancesData = null
      this.errorMessage = null
      this.successMessage = null
      this.formOpened = false
      this.formClosed = false
      this.savingState = false
      this.loadingState = false
    },

    render(container) {
      this.rendered = true
      this._container = container
    },

    renderMaintenances(maintenances) {
      this.maintenancesData = maintenances
    },

    showForm(maintenance, onSubmit, onCancel) {
      this.formOpened = true
      this._maintenance = maintenance
      this._formSubmit = onSubmit
      this._formCancel = onCancel
    },

    closeForm() { this.formClosed = true },

    showLoading() { this.loadingState = true },
    hideLoading() { this.loadingState = false },
    showSaving() { this.savingState = true },
    hideSaving() { this.savingState = false },

    showSuccess(msg) { this.successMessage = msg },
    showError(msg) { this.errorMessage = msg },

    async confirmDelete() { return this.confirmed },

    onSearch(cb) { this._searchCb = cb },
    onCreate(cb) { this._createCb = cb },
    onEdit(cb) { this._editCb = cb },
    onDelete(cb) { this._deleteCb = cb }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testInitLoadsMaintenances() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MaintenanceController(service, view)

  await service.create({ id: 1, assetId: 10, date: '2025-01-01', type: 'preventive' })
  await service.create({ id: 2, assetId: 20, date: '2025-01-02', type: 'corrective' })

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.rendered, 'init debería llamar a view.render')
  assert(view.maintenancesData !== null, 'init debería cargar mantenimientos')
  assert(view.maintenancesData.length === 2, 'init debería cargar 2 registros')

  console.log('  ✓ testInitLoadsMaintenances')
}

async function testHandleSearch() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MaintenanceController(service, view)

  await service.create({ id: 1, assetId: 10, date: '2025-01-01', type: 'preventive', description: 'Lubricación' })
  await service.create({ id: 2, assetId: 20, date: '2025-01-02', type: 'corrective', description: 'Reparación' })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleSearch('Lubric')
  assert(view.maintenancesData.length === 1, 'búsqueda debería filtrar a 1 registro')

  await controller.handleSearch('')
  assert(view.maintenancesData.length === 2, 'búsqueda vacía debería retornar todos')

  console.log('  ✓ testHandleSearch')
}

async function testHandleCreate() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MaintenanceController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showCreateForm()
  assert(view.formOpened, 'showCreateForm debería abrir formulario')

  await view._formSubmit({ assetId: 10, type: 'preventive', date: '2025-01-01', cost: 50 })

  assert(view.successMessage !== null, 'handleSave debería mostrar éxito')
  assert(view.formClosed, 'handleSave debería cerrar formulario')
  assert(view.maintenancesData.length === 1, 'handleSave debería recargar lista')

  console.log('  ✓ testHandleCreate')
}

async function testHandleUpdate() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MaintenanceController(service, view)

  await service.create({ id: 1, assetId: 10, date: '2025-01-01', type: 'preventive', status: 'pending' })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showEditForm(1)
  assert(view.formOpened, 'showEditForm debería abrir formulario')

  await view._formSubmit({ assetId: 10, type: 'corrective', status: 'completed', cost: 75 })

  assert(view.successMessage !== null, 'update debería mostrar éxito')
  const updated = await service.getById(1)
  assert(updated.status === 'completed', 'update debería cambiar el estado')

  console.log('  ✓ testHandleUpdate')
}

async function testHandleDelete() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MaintenanceController(service, view)

  await service.create({ id: 1, assetId: 10, date: '2025-01-01', type: 'preventive' })

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = true
  await controller.handleDelete(1)

  assert(view.successMessage !== null, 'delete debería mostrar éxito')
  const all = await service.getAll()
  assert(all.length === 0, 'delete debería eliminar el registro')

  console.log('  ✓ testHandleDelete')
}

async function testHandleDeleteCancelled() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MaintenanceController(service, view)

  await service.create({ id: 1, assetId: 10, date: '2025-01-01', type: 'preventive' })

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = false
  view.reset()

  await controller.handleDelete(1)

  const all = await service.getAll()
  assert(all.length === 1, 'delete cancelado no debería eliminar')
  assert(view.successMessage === null, 'delete cancelado no debería mostrar éxito')

  console.log('  ✓ testHandleDeleteCancelled')
}

async function testInitLoadError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MaintenanceController(service, view)

  service.getAll = async () => { throw new Error('Error al cargar mantenimientos') }

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.errorMessage === 'Error al cargar mantenimientos', 'init debería mostrar error si falla carga')

  console.log('  ✓ testInitLoadError')
}

async function testShowEditFormError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MaintenanceController(service, view)

  service.getById = async () => { throw new Error('Error al obtener registro') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showEditForm(999)
  assert(view.errorMessage === 'Error al obtener registro', 'showEditForm debería mostrar error')

  console.log('  ✓ testShowEditFormError')
}

async function testHandleSaveCreateError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MaintenanceController(service, view)

  service.create = async () => { throw new Error('Error al crear registro') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showCreateForm()
  await view._formSubmit({ assetId: 10, type: 'preventive' })

  assert(view.errorMessage === 'Error al crear registro', 'handleSave create debería mostrar error')

  console.log('  ✓ testHandleSaveCreateError')
}

async function testHandleSaveUpdateError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MaintenanceController(service, view)

  await service.create({ id: 1, assetId: 10, type: 'preventive' })
  service.update = async () => { throw new Error('Error al actualizar registro') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showEditForm(1)
  view.reset()
  await view._formSubmit({ assetId: 10, type: 'corrective' })

  assert(view.errorMessage === 'Error al actualizar registro', 'handleSave update debería mostrar error')

  console.log('  ✓ testHandleSaveUpdateError')
}

async function testHandleDeleteError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MaintenanceController(service, view)

  await service.create({ id: 1, assetId: 10, type: 'preventive' })
  service.delete = async () => { throw new Error('Error al eliminar registro') }

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = true
  await controller.handleDelete(1)

  assert(view.errorMessage === 'Error al eliminar registro', 'handleDelete debería mostrar error')

  console.log('  ✓ testHandleDeleteError')
}

async function testHandleSearchError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MaintenanceController(service, view)

  service.search = async () => { throw new Error('Error de búsqueda') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleSearch('algo')

  assert(view.errorMessage === 'Error de búsqueda', 'handleSearch debería mostrar error')

  console.log('  ✓ testHandleSearchError')
}

export async function runMaintenanceControllerTests() {
  console.log('\n--- MaintenanceController Tests ---\n')

  await testInitLoadsMaintenances()
  await testHandleSearch()
  await testHandleCreate()
  await testHandleUpdate()
  await testHandleDelete()
  await testHandleDeleteCancelled()
  await testInitLoadError()
  await testShowEditFormError()
  await testHandleSaveCreateError()
  await testHandleSaveUpdateError()
  await testHandleDeleteError()
  await testHandleSearchError()

  console.log('\n✓ Todos los tests de MaintenanceController pasaron\n')
}