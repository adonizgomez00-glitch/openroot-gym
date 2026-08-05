import { MembershipController } from '../../src/controllers/MembershipController.js'

function createMockRepo() {
  return {
    async generateNextId() { return 1 },
    async findById(id) { return { id, durationDays: 30 } }
  }
}

function createMockMemberRepo() {
  return {
    async findAll() { return [
      { id: 1, name: 'Juan Pérez', documentId: 'M001' },
      { id: 2, name: 'María García', documentId: 'M002' }
    ] }
  }
}

function createMockPlanRepo() {
  return {
    async findAll() { return [
      { id: 1, name: 'Básico Mensual' },
      { id: 2, name: 'Premium Trimestral' }
    ] }
  }
}

function createMockService() {
  let memberships = []
  let nextId = 1

  return {
    async getAll() { return [...memberships] },

    async getById(id) {
      const m = memberships.find(x => x.id === id)
      if (!m) throw new Error(`Membresía con id ${id} no encontrada`)
      return { ...m }
    },

    async findByMemberId(memberId) {
      return memberships.filter(m => m.memberId === memberId).map(m => ({ ...m }))
    },

    async findActiveByMemberId(memberId) {
      return memberships.filter(m => m.memberId === memberId && m.status === 'active' && m.active).map(m => ({ ...m }))
    },

    async findExpired() {
      const today = new Date().toISOString().split('T')[0]
      return memberships.filter(m => (m.status === 'active' || m.status === 'frozen') && m.endDate < today).map(m => ({ ...m }))
    },

    async findExpiringSoon(days = 7) {
      return []
    },

    async search(query) {
      if (!query.trim()) return [...memberships]
      const lower = query.toLowerCase()
      return memberships.filter(m =>
        String(m.memberId).includes(lower) ||
        String(m.planId).includes(lower) ||
        m.status.toLowerCase().includes(lower)
      )
    },

    async create(data) {
      const m = { id: nextId++, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      memberships.push(m)
      return { ...m }
    },

    async update(id, data) {
      const idx = memberships.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Membresía con id ${id} no encontrada`)
      memberships[idx] = { ...memberships[idx], ...data, updatedAt: new Date().toISOString() }
      return { ...memberships[idx] }
    },

    async delete(id) {
      const idx = memberships.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Membresía con id ${id} no encontrada`)
      memberships.splice(idx, 1)
      return true
    },

    async renew(id, days) {
      const m = memberships.find(x => x.id === id)
      if (!m) throw new Error(`Membresía con id ${id} no encontrada`)
      const newEndDate = new Date(m.endDate || m.startDate)
      newEndDate.setDate(newEndDate.getDate() + days)
      return { ...m, endDate: newEndDate.toISOString().split('T')[0], status: 'active' }
    },

    async freeze(id) {
      const m = memberships.find(x => x.id === id)
      if (!m) throw new Error(`Membresía con id ${id} no encontrada`)
      return { ...m, status: 'frozen' }
    },

    async unfreeze(id) {
      const m = memberships.find(x => x.id === id)
      if (!m) throw new Error(`Membresía con id ${id} no encontrada`)
      return { ...m, status: 'active' }
    },

    async expire(id) {
      const m = memberships.find(x => x.id === id)
      if (!m) throw new Error(`Membresía con id ${id} no encontrada`)
      return { ...m, status: 'expired' }
    }
  }
}

function createMockView() {
  return {
    rendered: false,
    membershipsData: null,
    errorMessage: null,
    successMessage: null,
    formOpened: false,
    formClosed: false,
    savingState: false,
    loadingState: false,
    confirmed: true,

    reset() {
      this.rendered = false
      this.membershipsData = null
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

    renderMemberships(memberships) {
      this.membershipsData = memberships
    },

    showForm(membership, onSubmit, onCancel) {
      this.formOpened = true
      this._membership = membership
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
    onDelete(cb) { this._deleteCb = cb },
    onRenew(cb) { this._renewCb = cb },
    onFreeze(cb) { this._freezeCb = cb },
    onUnfreeze(cb) { this._unfreezeCb = cb }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testInitLoadsMemberships() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MembershipController(service, view, createMockRepo(), createMockMemberRepo(), createMockPlanRepo())

  await service.create({ memberId: 1, planId: 1, startDate: '2026-01-01', endDate: '2026-01-31', status: 'active' })
  await service.create({ memberId: 2, planId: 1, startDate: '2026-01-01', endDate: '2026-03-31', status: 'active' })

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.rendered, 'init debería llamar a view.render')
  assert(view.membershipsData !== null, 'init debería cargar membresías')
  assert(view.membershipsData.length === 2, 'init debería cargar 2 membresías')

  console.log('  ✓ testInitLoadsMemberships')
}

async function testHandleSearch() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MembershipController(service, view, createMockRepo(), createMockMemberRepo(), createMockPlanRepo())

  await service.create({ memberId: 1, planId: 1, startDate: '2026-01-01', endDate: '2026-01-31', status: 'active' })
  await service.create({ memberId: 2, planId: 2, startDate: '2026-01-01', endDate: '2026-03-31', status: 'expired' })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleSearch('2')
  assert(view.membershipsData.length === 1, 'búsqueda debería filtrar a 1 membresía')
  assert(view.membershipsData[0].status === 'expired', 'búsqueda debería encontrar la membresía expirada')

  await controller.handleSearch('')
  assert(view.membershipsData.length === 2, 'búsqueda vacía debería retornar todos')

  console.log('  ✓ testHandleSearch')
}

async function testHandleCreate() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MembershipController(service, view, createMockRepo(), createMockMemberRepo(), createMockPlanRepo())

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showCreateForm()
  assert(view.formOpened, 'showCreateForm debería abrir formulario')
  assert(view._membership === null, 'showCreateForm debería pasar null')

  await view._formSubmit({ memberId: 1, planId: 1, startDate: '2026-01-01', endDate: '2026-01-31', status: 'active', price: 100 })

  assert(view.successMessage !== null, 'handleSave debería mostrar éxito')
  assert(view.formClosed, 'handleSave debería cerrar formulario')
  assert(view.membershipsData.length === 1, 'handleSave debería recargar lista')

  console.log('  ✓ testHandleCreate')
}

async function testHandleUpdate() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MembershipController(service, view, createMockRepo(), createMockMemberRepo(), createMockPlanRepo())

  await service.create({ memberId: 1, planId: 1, startDate: '2026-01-01', endDate: '2026-01-31', status: 'active' })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showEditForm(1)
  assert(view.formOpened, 'showEditForm debería abrir formulario')
  assert(view._membership !== null, 'showEditForm debería pasar la membresía')

  await view._formSubmit({ memberId: 1, planId: 1, startDate: '2026-01-01', endDate: '2026-02-28', status: 'active', price: 150 })

  assert(view.successMessage !== null, 'update debería mostrar mensaje de éxito')
  assert(view.successMessage?.includes('actualizada') || view.successMessage?.includes('Actualizada'), 'update debería mostrar mensaje de actualización')
  const updated = await service.getById(1)
  assert(updated.endDate === '2026-02-28', 'update debería cambiar la fecha de fin')

  console.log('  ✓ testHandleUpdate')
}

async function testHandleDelete() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MembershipController(service, view, createMockRepo(), createMockMemberRepo(), createMockPlanRepo())

  await service.create({ memberId: 1, planId: 1, startDate: '2026-01-01', endDate: '2026-01-31', status: 'active' })

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = true
  await controller.handleDelete(1)

  assert(view.successMessage !== null, 'delete debería mostrar éxito')
  const all = await service.getAll()
  assert(all.length === 0, 'delete debería eliminar la membresía')

  console.log('  ✓ testHandleDelete')
}

async function testHandleRenew() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MembershipController(service, view, createMockRepo(), createMockMemberRepo(), createMockPlanRepo())

  await service.create({ memberId: 1, planId: 1, startDate: '2026-01-01', endDate: '2026-01-31', status: 'active' })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleRenew(1)
  assert(view.successMessage !== null, 'renew debería mostrar éxito')

  console.log('  ✓ testHandleRenew')
}

async function testHandleFreeze() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MembershipController(service, view, createMockRepo(), createMockMemberRepo(), createMockPlanRepo())

  await service.create({ memberId: 1, planId: 1, startDate: '2026-01-01', endDate: '2026-01-31', status: 'active' })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleFreeze(1)
  assert(view.successMessage !== null, 'freeze debería mostrar éxito')

  console.log('  ✓ testHandleFreeze')
}

async function testHandleUnfreeze() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MembershipController(service, view, createMockRepo(), createMockMemberRepo(), createMockPlanRepo())

  await service.create({ memberId: 1, planId: 1, startDate: '2026-01-01', endDate: '2026-01-31', status: 'frozen' })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleUnfreeze(1)
  assert(view.successMessage !== null, 'unfreeze debería mostrar éxito')

  console.log('  ✓ testHandleUnfreeze')
}

async function testInitLoadError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MembershipController(service, view, createMockRepo(), createMockMemberRepo(), createMockPlanRepo())

  service.getAll = async () => { throw new Error('Error al cargar membresías') }

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.errorMessage === 'Error al cargar membresías', 'init debería mostrar error si falla carga')

  console.log('  ✓ testInitLoadError')
}

async function testShowEditFormError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MembershipController(service, view, createMockRepo(), createMockMemberRepo(), createMockPlanRepo())

  const container = document.createElement('div')
  await controller.init(container)

  service.getById = async () => { throw new Error('Error al obtener membresía') }
  view.reset()

  await controller.showEditForm(999)
  assert(view.errorMessage === 'Error al obtener membresía', 'showEditForm debería mostrar error')

  console.log('  ✓ testShowEditFormError')
}

async function testHandleSaveCreateError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MembershipController(service, view, createMockRepo(), createMockMemberRepo(), createMockPlanRepo())

  service.create = async () => { throw new Error('Error al crear membresía') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showCreateForm()
  await view._formSubmit({ memberId: 1, planId: 1, startDate: '2026-01-01', endDate: '2026-01-31', status: 'active', price: 100 })

  assert(view.errorMessage === 'Error al crear membresía', 'handleSave create debería mostrar error')

  console.log('  ✓ testHandleSaveCreateError')
}

async function testHandleSaveUpdateError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MembershipController(service, view, createMockRepo(), createMockMemberRepo(), createMockPlanRepo())

  await service.create({ memberId: 1, planId: 1, startDate: '2026-01-01', endDate: '2026-01-31', status: 'active' })
  service.update = async () => { throw new Error('Error al actualizar membresía') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showEditForm(1)
  view.reset()
  await view._formSubmit({ memberId: 1, planId: 1, startDate: '2026-01-01', endDate: '2026-02-28', status: 'active', price: 150 })

  assert(view.errorMessage === 'Error al actualizar membresía', 'handleSave update debería mostrar error')

  console.log('  ✓ testHandleSaveUpdateError')
}

async function testHandleDeleteError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MembershipController(service, view, createMockRepo(), createMockMemberRepo(), createMockPlanRepo())

  await service.create({ memberId: 1, planId: 1, startDate: '2026-01-01', endDate: '2026-01-31', status: 'active' })
  service.delete = async () => { throw new Error('Error al eliminar membresía') }

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = true
  await controller.handleDelete(1)

  assert(view.errorMessage === 'Error al eliminar membresía', 'handleDelete debería mostrar error')

  console.log('  ✓ testHandleDeleteError')
}

async function testHandleSearchError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new MembershipController(service, view, createMockRepo(), createMockMemberRepo(), createMockPlanRepo())

  service.search = async () => { throw new Error('Error de búsqueda') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleSearch('algo')

  assert(view.errorMessage === 'Error de búsqueda', 'handleSearch debería mostrar error')

  console.log('  ✓ testHandleSearchError')
}

export async function runMembershipControllerTests() {
  console.log('\n--- MembershipController Tests ---\n')

  await testInitLoadsMemberships()
  await testHandleSearch()
  await testHandleCreate()
  await testHandleUpdate()
  await testHandleDelete()
  await testHandleRenew()
  await testHandleFreeze()
  await testHandleUnfreeze()
  await testInitLoadError()
  await testShowEditFormError()
  await testHandleSaveCreateError()
  await testHandleSaveUpdateError()
  await testHandleDeleteError()
  await testHandleSearchError()

  console.log('\n✓ Todos los tests de MembershipController pasaron\n')
}