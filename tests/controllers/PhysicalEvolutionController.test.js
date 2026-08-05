import { PhysicalEvolutionController } from '../../src/controllers/PhysicalEvolutionController.js'

function createMockService() {
  let evolutions = []
  let nextId = 1

  return {
    async getAll() { return [...evolutions] },

    async getById(id) {
      const e = evolutions.find(x => x.id === id)
      if (!e) throw new Error(`Registro con id ${id} no encontrado`)
      return { ...e }
    },

    async search(query) {
      if (!query.trim()) return [...evolutions]
      const lower = query.toLowerCase()
      return evolutions.filter(e => e.memberId.toString().includes(lower)).map(e => ({ ...e }))
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

function createMockView() {
  return {
    rendered: false,
    evolutionsData: null,
    errorMessage: null,
    successMessage: null,
    formOpened: false,
    formClosed: false,
    formEntity: null,
    savingState: false,
    loadingState: false,
    confirmed: true,

    reset() {
      this.rendered = false
      this.evolutionsData = null
      this.errorMessage = null
      this.successMessage = null
      this.formOpened = false
      this.formClosed = false
      this.formEntity = null
      this.savingState = false
      this.loadingState = false
    },

    render(container) {
      this.rendered = true
      this._container = container
    },

    renderEvolutions(evolutions) {
      this.evolutionsData = evolutions
    },

    showForm(evolution, onSubmit, onCancel) {
      this.formOpened = true
      this._evolution = evolution
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

async function testInitLoadsEvolutions() {
  const service = createMockService()
  const view = createMockView()
  const controller = new PhysicalEvolutionController(service, view)

  await service.create({ memberId: 1001, date: '2025-01-01', weight: 70, height: 175 })
  await service.create({ memberId: 1002, date: '2025-01-02', weight: 80, height: 180 })

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.rendered, 'init debería llamar a view.render')
  assert(view.evolutionsData !== null, 'init debería cargar evoluciones')
  assert(view.evolutionsData.length === 2, 'init debería cargar 2 registros')

  console.log('  ✓ testInitLoadsEvolutions')
}

async function testHandleSearch() {
  const service = createMockService()
  const view = createMockView()
  const controller = new PhysicalEvolutionController(service, view)

  await service.create({ memberId: 1001, date: '2025-01-01', weight: 70, height: 175 })
  await service.create({ memberId: 1002, date: '2025-01-02', weight: 80, height: 180 })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleSearch('1001')
  assert(view.evolutionsData.length === 1, 'búsqueda debería filtrar a 1 registro')

  await controller.handleSearch('')
  assert(view.evolutionsData.length === 2, 'búsqueda vacía debería retornar todos')

  console.log('  ✓ testHandleSearch')
}

async function testHandleCreate() {
  const service = createMockService()
  const view = createMockView()
  const controller = new PhysicalEvolutionController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showCreateForm()
  assert(view.formOpened, 'showCreateForm debería abrir formulario')
  assert(view._evolution === null, 'showCreateForm debería pasar null')

  await view._formSubmit({ memberId: 1001, date: '2025-01-01', weight: 70, height: 175 })

  assert(view.successMessage !== null, 'handleSave debería mostrar éxito')
  assert(view.formClosed, 'handleSave debería cerrar formulario')
  assert(view.evolutionsData.length === 1, 'handleSave debería recargar lista')

  console.log('  ✓ testHandleCreate')
}

async function testHandleUpdate() {
  const service = createMockService()
  const view = createMockView()
  const controller = new PhysicalEvolutionController(service, view)

  await service.create({ memberId: 1001, date: '2025-01-01', weight: 70, height: 175 })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showEditForm(1)
  assert(view.formOpened, 'showEditForm debería abrir formulario')
  assert(view._evolution !== null, 'showEditForm debería pasar la evolución')

  await view._formSubmit({ memberId: 1002, date: '2025-01-02', weight: 71, height: 176 })

  assert(view.successMessage !== null, 'update debería mostrar éxito')
  const updated = await service.getById(1)
  assert(updated.weight === 71, 'update debería cambiar el peso')

  console.log('  ✓ testHandleUpdate')
}

async function testHandleDelete() {
  const service = createMockService()
  const view = createMockView()
  const controller = new PhysicalEvolutionController(service, view)

  await service.create({ memberId: 1001, date: '2025-01-01', weight: 70, height: 175 })

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
  const controller = new PhysicalEvolutionController(service, view)

  await service.create({ memberId: 1001, date: '2025-01-01', weight: 70, height: 175 })

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
  const controller = new PhysicalEvolutionController(service, view)

  service.getAll = async () => { throw new Error('Error al cargar evoluciones') }

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.errorMessage === 'Error al cargar evoluciones', 'init debería mostrar error si falla carga')

  console.log('  ✓ testInitLoadError')
}

async function testShowEditFormError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new PhysicalEvolutionController(service, view)

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
  const controller = new PhysicalEvolutionController(service, view)

  service.create = async () => { throw new Error('Error al crear registro') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showCreateForm()
  await view._formSubmit({ memberId: 1001, weight: 70, height: 175 })

  assert(view.errorMessage === 'Error al crear registro', 'handleSave create debería mostrar error')

  console.log('  ✓ testHandleSaveCreateError')
}

async function testHandleSaveUpdateError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new PhysicalEvolutionController(service, view)

  await service.create({ memberId: 1001, date: '2025-01-01', weight: 70, height: 175 })
  service.update = async () => { throw new Error('Error al actualizar registro') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showEditForm(1)
  view.reset()
  await view._formSubmit({ memberId: 1002, weight: 71 })

  assert(view.errorMessage === 'Error al actualizar registro', 'handleSave update debería mostrar error')

  console.log('  ✓ testHandleSaveUpdateError')
}

async function testHandleDeleteError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new PhysicalEvolutionController(service, view)

  await service.create({ memberId: 1001, date: '2025-01-01', weight: 70, height: 175 })
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
  const controller = new PhysicalEvolutionController(service, view)

  service.search = async () => { throw new Error('Error de búsqueda') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleSearch('algo')

  assert(view.errorMessage === 'Error de búsqueda', 'handleSearch debería mostrar error')

  console.log('  ✓ testHandleSearchError')
}

export async function runPhysicalEvolutionControllerTests() {
  console.log('\n--- PhysicalEvolutionController Tests ---\n')

  await testInitLoadsEvolutions()
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

  console.log('\n✓ Todos los tests de PhysicalEvolutionController pasaron\n')
}