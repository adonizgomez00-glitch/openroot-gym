import { MembershipPlanController } from '../../src/controllers/MembershipPlanController.js'

function createMockRepo() {
  return {
    async generateNextId() { return 1 }
  }
}

function createMockService() {
  let plans = []
  let nextId = 1

  return {
    async getAll() { return [...plans] },

    async getById(id) {
      const p = plans.find(x => x.id === id)
      if (!p) throw new Error(`Plan con id ${id} no encontrado`)
      return { ...p }
    },

    async search(query) {
      if (!query.trim()) return [...plans]
      const lower = query.toLowerCase()
      return plans.filter(p => p.name.toLowerCase().includes(lower))
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
}

function createMockView() {
  return {
    rendered: false,
    plansData: null,
    errorMessage: null,
    successMessage: null,
    formOpened: false,
    formClosed: false,
    savingState: false,
    loadingState: false,
    confirmed: true,

    reset() {
      this.rendered = false
      this.plansData = null
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

    renderPlans(plans) {
      this.plansData = plans
    },

    showForm(plan, onSubmit, onCancel) {
      this.formOpened = true
      this._plan = plan
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

async function testInitLoadsPlans() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MembershipPlanController(service, view)

  await service.create({ name: 'Plan 1', durationDays: 30, price: 100 })
  await service.create({ name: 'Plan 2', durationDays: 90, price: 250 })

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.rendered, 'init debería llamar a view.render')
  assert(view.plansData !== null, 'init debería cargar planes')
  assert(view.plansData.length === 2, 'init debería cargar 2 planes')

  console.log('  ✓ testInitLoadsPlans')
}

async function testHandleSearch() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MembershipPlanController(service, view)

  await service.create({ name: 'Básico Mensual', durationDays: 30, price: 100 })
  await service.create({ name: 'Premium Trimestral', durationDays: 90, price: 250 })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleSearch('Básico')
  assert(view.plansData.length === 1, 'búsqueda debería filtrar a 1 plan')
  assert(view.plansData[0].name === 'Básico Mensual', 'búsqueda debería encontrar Básico')

  await controller.handleSearch('')
  assert(view.plansData.length === 2, 'búsqueda vacía debería retornar todos')

  console.log('  ✓ testHandleSearch')
}

async function testHandleCreate() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MembershipPlanController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showCreateForm()
  assert(view.formOpened, 'showCreateForm debería abrir formulario')
  assert(view._plan === null, 'showCreateForm debería pasar null')

  await view._formSubmit({ name: 'Nuevo Plan', durationDays: 30, price: 100 })

  assert(view.successMessage !== null, 'handleSave debería mostrar éxito')
  assert(view.formClosed, 'handleSave debería cerrar formulario')
  assert(view.plansData.length === 1, 'handleSave debería recargar lista')

  console.log('  ✓ testHandleCreate')
}

async function testHandleUpdate() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MembershipPlanController(service, view)

  await service.create({ name: 'Original', durationDays: 30, price: 100 })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showEditForm(1)
  assert(view.formOpened, 'showEditForm debería abrir formulario')
  assert(view._plan !== null, 'showEditForm debería pasar el plan')

  await view._formSubmit({ name: 'Actualizado', durationDays: 60, price: 150 })

  assert(view.successMessage?.includes('actualizado'), 'update debería mostrar mensaje de actualización')
  const updated = await service.getById(1)
  assert(updated.name === 'Actualizado', 'update debería cambiar el nombre')

  console.log('  ✓ testHandleUpdate')
}

async function testHandleDelete() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MembershipPlanController(service, view)

  await service.create({ name: 'A eliminar', durationDays: 30, price: 100 })

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = true
  await controller.handleDelete(1)

  assert(view.successMessage !== null, 'delete debería mostrar éxito')
  const all = await service.getAll()
  assert(all.length === 0, 'delete debería eliminar el plan')

  console.log('  ✓ testHandleDelete')
}

async function testHandleDeleteCancelled() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MembershipPlanController(service, view)

  await service.create({ name: 'A eliminar', durationDays: 30, price: 100 })

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
  const controller = new MembershipPlanController(service, view)

  service.getAll = async () => { throw new Error('Error al cargar planes') }

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.errorMessage === 'Error al cargar planes', 'init debería mostrar error si falla carga')

  console.log('  ✓ testInitLoadError')
}

async function testShowEditFormError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MembershipPlanController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  service.getById = async () => { throw new Error('Error al obtener plan') }
  view.reset()

  await controller.showEditForm(999)
  assert(view.errorMessage === 'Error al obtener plan', 'showEditForm debería mostrar error')

  console.log('  ✓ testShowEditFormError')
}

async function testHandleSaveCreateError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MembershipPlanController(service, view)

  service.create = async () => { throw new Error('Error al crear plan') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showCreateForm()
  await view._formSubmit({ name: 'Nuevo', durationDays: 30, price: 100 })

  assert(view.errorMessage === 'Error al crear plan', 'handleSave create debería mostrar error')

  console.log('  ✓ testHandleSaveCreateError')
}

async function testHandleSaveUpdateError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MembershipPlanController(service, view)

  await service.create({ name: 'Original', durationDays: 30, price: 100 })
  service.update = async () => { throw new Error('Error al actualizar plan') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showEditForm(1)
  view.reset()
  await view._formSubmit({ name: 'Actualizado', durationDays: 60, price: 150 })

  assert(view.errorMessage === 'Error al actualizar plan', 'handleSave update debería mostrar error')

  console.log('  ✓ testHandleSaveUpdateError')
}

async function testHandleDeleteError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MembershipPlanController(service, view)

  await service.create({ name: 'A eliminar', durationDays: 30, price: 100 })
  service.delete = async () => { throw new Error('Error al eliminar plan') }

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = true
  await controller.handleDelete(1)

  assert(view.errorMessage === 'Error al eliminar plan', 'handleDelete debería mostrar error')

  console.log('  ✓ testHandleDeleteError')
}

async function testHandleSearchError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MembershipPlanController(service, view)

  service.search = async () => { throw new Error('Error de búsqueda') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleSearch('algo')

  assert(view.errorMessage === 'Error de búsqueda', 'handleSearch debería mostrar error')

  console.log('  ✓ testHandleSearchError')
}

export async function runMembershipPlanControllerTests() {
  console.log('\n--- MembershipPlanController Tests ---\n')

  await testInitLoadsPlans()
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

  console.log('\n✓ Todos los tests de MembershipPlanController pasaron\n')
}