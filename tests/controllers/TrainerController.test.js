import { TrainerController } from '../../src/controllers/TrainerController.js'

function createMockRepo() {
  return {
    async generateNextDocumentId() { return 'ENT-006' }
  }
}

function createMockService() {
  let trainers = []
  let nextId = 1

  return {
    async getAll() { return [...trainers] },

    async getById(id) {
      const t = trainers.find(x => x.id === id)
      if (!t) throw new Error(`Entrenador con id ${id} no encontrado`)
      return { ...t }
    },

    async search(query) {
      if (!query.trim()) return [...trainers]
      const lower = query.toLowerCase()
      return trainers.filter(t => t.name.toLowerCase().includes(lower))
    },

    async create(data) {
      const t = { id: nextId++, ...data }
      trainers.push(t)
      return { ...t }
    },

    async update(id, data) {
      const idx = trainers.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Entrenador con id ${id} no encontrado`)
      trainers[idx] = { ...trainers[idx], ...data }
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

function createMockView() {
  return {
    rendered: false,
    trainersData: null,
    errorMessage: null,
    successMessage: null,
    formOpened: false,
    formClosed: false,
    formEntity: null,
    savingState: false,
    loadingState: false,
    confirmed: true,
    nextDocId: '',

    reset() {
      this.rendered = false
      this.trainersData = null
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

    renderTrainers(trainers) {
      this.trainersData = trainers
    },

    showForm(trainer, onSubmit, onCancel) {
      this.formOpened = true
      this._trainer = trainer
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

async function testInitLoadsTrainers() {
  const service = createMockService()
  const view = createMockView()
  const controller = new TrainerController(service, view, createMockRepo())

  await service.create({ documentId: 'ENT-001', name: 'Entrenador 1' })
  await service.create({ documentId: 'ENT-002', name: 'Entrenador 2' })

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.rendered, 'init debería llamar a view.render')
  assert(view.trainersData !== null, 'init debería cargar entrenadores')
  assert(view.trainersData.length === 2, 'init debería cargar 2 entrenadores')

  console.log('  ✓ testInitLoadsTrainers')
}

async function testHandleSearch() {
  const service = createMockService()
  const view = createMockView()
  const controller = new TrainerController(service, view, createMockRepo())

  await service.create({ documentId: 'ENT-001', name: 'Juan Pérez' })
  await service.create({ documentId: 'ENT-002', name: 'María García' })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleSearch('Juan')
  assert(view.trainersData.length === 1, 'búsqueda debería filtrar a 1 entrenador')
  assert(view.trainersData[0].name === 'Juan Pérez', 'búsqueda debería encontrar Juan')

  await controller.handleSearch('')
  assert(view.trainersData.length === 2, 'búsqueda vacía debería retornar todos')

  console.log('  ✓ testHandleSearch')
}

async function testHandleCreate() {
  const service = createMockService()
  const view = createMockView()
  const controller = new TrainerController(service, view, createMockRepo())

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showCreateForm()
  assert(view.formOpened, 'showCreateForm debería abrir formulario')
  assert(view._trainer === null, 'showCreateForm debería pasar null')

  await view._formSubmit({ name: 'Nuevo Entrenador', email: 'trainer@email.com' })

  assert(view.successMessage !== null, 'handleSave debería mostrar éxito')
  assert(view.formClosed, 'handleSave debería cerrar formulario')
  assert(view.trainersData.length === 1, 'handleSave debería recargar lista')

  console.log('  ✓ testHandleCreate')
}

async function testHandleUpdate() {
  const service = createMockService()
  const view = createMockView()
  const controller = new TrainerController(service, view, createMockRepo())

  await service.create({ documentId: 'ENT-001', name: 'Original' })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showEditForm(1)
  assert(view.formOpened, 'showEditForm debería abrir formulario')
  assert(view._trainer !== null, 'showEditForm debería pasar el entrenador')

  await view._formSubmit({ documentId: 'ENT-001', name: 'Actualizado' })

  assert(view.successMessage !== null, 'update debería mostrar éxito')
  const updated = await service.getById(1)
  assert(updated.name === 'Actualizado', 'update debería cambiar el nombre')

  console.log('  ✓ testHandleUpdate')
}

async function testHandleDelete() {
  const service = createMockService()
  const view = createMockView()
  const controller = new TrainerController(service, view, createMockRepo())

  await service.create({ documentId: 'ENT-001', name: 'A eliminar' })

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = true
  await controller.handleDelete(1)

  assert(view.successMessage !== null, 'delete debería mostrar éxito')
  const all = await service.getAll()
  assert(all.length === 0, 'delete debería eliminar el entrenador')

  console.log('  ✓ testHandleDelete')
}

async function testHandleDeleteCancelled() {
  const service = createMockService()
  const view = createMockView()
  const controller = new TrainerController(service, view, createMockRepo())

  await service.create({ documentId: 'ENT-001', name: 'A eliminar' })

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
  const controller = new TrainerController(service, view, createMockRepo())

  service.getAll = async () => { throw new Error('Error al cargar entrenadores') }

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.errorMessage === 'Error al cargar entrenadores', 'init debería mostrar error si falla carga')

  console.log('  ✓ testInitLoadError')
}

async function testShowEditFormError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new TrainerController(service, view, createMockRepo())

  const container = document.createElement('div')
  await controller.init(container)

  service.getById = async () => { throw new Error('Error al obtener entrenador') }
  view.reset()

  await controller.showEditForm(999)
  assert(view.errorMessage === 'Error al obtener entrenador', 'showEditForm debería mostrar error')

  console.log('  ✓ testShowEditFormError')
}

async function testHandleSaveCreateError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new TrainerController(service, view, createMockRepo())

  service.create = async () => { throw new Error('Error al crear entrenador') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showCreateForm()
  await view._formSubmit({ name: 'Nuevo' })

  assert(view.errorMessage === 'Error al crear entrenador', 'handleSave create debería mostrar error')

  console.log('  ✓ testHandleSaveCreateError')
}

async function testHandleSaveUpdateError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new TrainerController(service, view, createMockRepo())

  await service.create({ documentId: 'ENT-001', name: 'Original' })
  service.update = async () => { throw new Error('Error al actualizar entrenador') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showEditForm(1)
  view.reset()
  await view._formSubmit({ documentId: 'ENT-001', name: 'Actualizado' })

  assert(view.errorMessage === 'Error al actualizar entrenador', 'handleSave update debería mostrar error')

  console.log('  ✓ testHandleSaveUpdateError')
}

async function testHandleDeleteError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new TrainerController(service, view, createMockRepo())

  await service.create({ documentId: 'ENT-001', name: 'A eliminar' })
  service.delete = async () => { throw new Error('Error al eliminar entrenador') }

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = true
  await controller.handleDelete(1)

  assert(view.errorMessage === 'Error al eliminar entrenador', 'handleDelete debería mostrar error')

  console.log('  ✓ testHandleDeleteError')
}

async function testHandleSearchError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new TrainerController(service, view, createMockRepo())

  service.search = async () => { throw new Error('Error de búsqueda') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleSearch('algo')

  assert(view.errorMessage === 'Error de búsqueda', 'handleSearch debería mostrar error')

  console.log('  ✓ testHandleSearchError')
}

export async function runTrainerControllerTests() {
  console.log('\n--- TrainerController Tests ---\n')

  await testInitLoadsTrainers()
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

  console.log('\n✓ Todos los tests de TrainerController pasaron\n')
}