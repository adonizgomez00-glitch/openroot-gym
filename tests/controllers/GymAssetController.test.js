import { GymAssetController } from '../../src/controllers/GymAssetController.js'

function createMockService() {
  let assets = []
  let nextId = 1

  return {
    async getAll() { return [...assets] },

    async getById(id) {
      const a = assets.find(x => x.id === id)
      if (!a) throw new Error(`Activo con id ${id} no encontrado`)
      return { ...a }
    },

    async getByCode(code) {
      const a = assets.find(x => x.code === code)
      if (!a) throw new Error(`Activo con código ${code} no encontrado`)
      return { ...a }
    },

    async getByStatus(status) {
      return assets.filter(a => a.status === status).map(a => ({ ...a }))
    },

    async getExpiringWarranty(days) {
      return assets.filter(a => !!a.warrantyUntil).map(a => ({ ...a }))
    },

    async search(query) {
      if (!query || !query.trim()) return [...assets]
      const lower = query.toLowerCase()
      return assets.filter(a =>
        a.code?.toLowerCase().includes(lower) ||
        a.name?.toLowerCase().includes(lower)
      ).map(a => ({ ...a }))
    },

    async create(data) {
      const a = { id: nextId++, ...data }
      assets.push(a)
      return { ...a }
    },

    async update(id, data) {
      const idx = assets.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Activo con id ${id} no encontrado`)
      assets[idx] = { ...assets[idx], ...data }
      return { ...assets[idx] }
    },

    async delete(id) {
      const idx = assets.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Activo con id ${id} no encontrado`)
      assets.splice(idx, 1)
      return true
    },

    async count() { return assets.length }
  }
}

function createMockRepo() {
  return {
    async generateNextCode() { return 'Gym-0003' }
  }
}

function createMockView() {
  return {
    rendered: false,
    assetsData: null,
    errorMessage: null,
    successMessage: null,
    formOpened: false,
    formClosed: false,
    formEntity: null,
    savingState: false,
    loadingState: false,
    confirmed: true,
    nextCode: '',

    reset() {
      this.rendered = false
      this.assetsData = null
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

    renderAssets(assets) {
      this.assetsData = assets
    },

    showForm(asset, onSubmit, onCancel) {
      this.formOpened = true
      this._asset = asset
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

async function testInitLoadsAssets() {
  const service = createMockService()
  const view = createMockView()
  const repo = createMockRepo()
  const controller = new GymAssetController(service, view, repo)

  await service.create({ id: 1, code: 'Gym-0001', name: 'Caminadora', status: 'active' })
  await service.create({ id: 2, code: 'Gym-0002', name: 'Bicicleta', status: 'maintenance' })

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.rendered, 'init debería llamar a view.render')
  assert(view.assetsData !== null, 'init debería cargar activos')
  assert(view.assetsData.length === 2, 'init debería cargar 2 activos')

  console.log('  ✓ testInitLoadsAssets')
}

async function testHandleSearch() {
  const service = createMockService()
  const view = createMockView()
  const repo = createMockRepo()
  const controller = new GymAssetController(service, view, repo)

  await service.create({ id: 1, code: 'Gym-0001', name: 'Caminadora', status: 'active' })
  await service.create({ id: 2, code: 'Gym-0002', name: 'Bicicleta', status: 'maintenance' })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleSearch('Caminadora')
  assert(view.assetsData.length === 1, 'búsqueda debería filtrar a 1 activo')

  await controller.handleSearch('')
  assert(view.assetsData.length === 2, 'búsqueda vacía debería retornar todos')

  console.log('  ✓ testHandleSearch')
}

async function testHandleCreate() {
  const service = createMockService()
  const view = createMockView()
  const repo = createMockRepo()
  const controller = new GymAssetController(service, view, repo)

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showCreateForm()
  assert(view.formOpened, 'showCreateForm debería abrir formulario')

  await view._formSubmit({ code: 'Gym-0003', name: 'Nuevo Activo', type: 'Cardio' })

  assert(view.successMessage !== null, 'handleSave debería mostrar éxito')
  assert(view.formClosed, 'handleSave debería cerrar formulario')
  assert(view.assetsData.length === 1, 'handleSave debería recargar lista')

  console.log('  ✓ testHandleCreate')
}

async function testHandleUpdate() {
  const service = createMockService()
  const view = createMockView()
  const repo = createMockRepo()
  const controller = new GymAssetController(service, view, repo)

  await service.create({ id: 1, code: 'Gym-0001', name: 'Original' })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showEditForm(1)
  assert(view.formOpened, 'showEditForm debería abrir formulario')

  await view._formSubmit({ code: 'Gym-0001', name: 'Actualizado', type: 'Fuerza' })

  assert(view.successMessage !== null, 'update debería mostrar éxito')
  const updated = await service.getById(1)
  assert(updated.name === 'Actualizado', 'update debería cambiar el nombre')

  console.log('  ✓ testHandleUpdate')
}

async function testHandleDelete() {
  const service = createMockService()
  const view = createMockView()
  const repo = createMockRepo()
  const controller = new GymAssetController(service, view, repo)

  await service.create({ id: 1, code: 'Gym-0001', name: 'Activo a eliminar' })

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = true
  await controller.handleDelete(1)

  assert(view.successMessage !== null, 'delete debería mostrar éxito')
  const all = await service.getAll()
  assert(all.length === 0, 'delete debería eliminar el activo')

  console.log('  ✓ testHandleDelete')
}

async function testHandleDeleteCancelled() {
  const service = createMockService()
  const view = createMockView()
  const repo = createMockRepo()
  const controller = new GymAssetController(service, view, repo)

  await service.create({ id: 1, code: 'Gym-0001', name: 'A eliminar' })

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
  const repo = createMockRepo()
  const controller = new GymAssetController(service, view, repo)

  service.getAll = async () => { throw new Error('Error al cargar activos') }

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.errorMessage === 'Error al cargar activos', 'init debería mostrar error si falla carga')

  console.log('  ✓ testInitLoadError')
}

async function testShowEditFormError() {
  const service = createMockService()
  const view = createMockView()
  const repo = createMockRepo()
  const controller = new GymAssetController(service, view, repo)

  service.getById = async () => { throw new Error('Error al obtener activo') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showEditForm(999)
  assert(view.errorMessage === 'Error al obtener activo', 'showEditForm debería mostrar error')

  console.log('  ✓ testShowEditFormError')
}

async function testHandleSaveCreateError() {
  const service = createMockService()
  const view = createMockView()
  const repo = createMockRepo()
  const controller = new GymAssetController(service, view, repo)

  service.create = async () => { throw new Error('Error al crear activo') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showCreateForm()
  await view._formSubmit({ code: 'Gym-0003', name: 'Nuevo' })

  assert(view.errorMessage === 'Error al crear activo', 'handleSave create debería mostrar error')

  console.log('  ✓ testHandleSaveCreateError')
}

async function testHandleSaveUpdateError() {
  const service = createMockService()
  const view = createMockView()
  const repo = createMockRepo()
  const controller = new GymAssetController(service, view, repo)

  await service.create({ id: 1, code: 'Gym-0001', name: 'Original' })
  service.update = async () => { throw new Error('Error al actualizar activo') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showEditForm(1)
  view.reset()
  await view._formSubmit({ code: 'Gym-0001', name: 'Actualizado' })

  assert(view.errorMessage === 'Error al actualizar activo', 'handleSave update debería mostrar error')

  console.log('  ✓ testHandleSaveUpdateError')
}

async function testHandleDeleteError() {
  const service = createMockService()
  const view = createMockView()
  const repo = createMockRepo()
  const controller = new GymAssetController(service, view, repo)

  await service.create({ id: 1, code: 'Gym-0001', name: 'A eliminar' })
  service.delete = async () => { throw new Error('Error al eliminar activo') }

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = true
  await controller.handleDelete(1)

  assert(view.errorMessage === 'Error al eliminar activo', 'handleDelete debería mostrar error')

  console.log('  ✓ testHandleDeleteError')
}

async function testHandleSearchError() {
  const service = createMockService()
  const view = createMockView()
  const repo = createMockRepo()
  const controller = new GymAssetController(service, view, repo)

  service.search = async () => { throw new Error('Error de búsqueda') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleSearch('algo')

  assert(view.errorMessage === 'Error de búsqueda', 'handleSearch debería mostrar error')

  console.log('  ✓ testHandleSearchError')
}

export async function runGymAssetControllerTests() {
  console.log('\n--- GymAssetController Tests ---\n')

  await testInitLoadsAssets()
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

  console.log('\n✓ Todos los tests de GymAssetController pasaron\n')
}