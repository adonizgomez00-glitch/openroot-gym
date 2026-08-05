import { AttendanceController } from '../../src/controllers/AttendanceController.js'

function createMockMemberRepo() {
  return {
    async findAll() { return [
      { id: 1, name: 'Juan Pérez', documentId: 'M001' },
      { id: 2, name: 'María García', documentId: 'M002' }
    ] }
  }
}

function createMockService() {
  let attendances = []
  let nextId = 1

  return {
    async getAll() { return [...attendances] },

    async getById(id) {
      const a = attendances.find(x => x.id === id)
      if (!a) throw new Error(`Asistencia con id ${id} no encontrada`)
      return { ...a }
    },

    async findByMemberId(memberId) {
      return attendances.filter(a => a.memberId === memberId).map(a => ({ ...a }))
    },

    async findByDateRange(startDate, endDate) {
      return attendances
        .filter(a => a.date >= startDate && a.date <= endDate)
        .map(a => ({ ...a }))
    },

    async countByDate(date) {
      return attendances.filter(a => a.date === date).length
    },

    async countByMemberId(memberId) {
      return attendances.filter(a => a.memberId === memberId).length
    },

    async search(query) {
      if (!query.trim()) return [...attendances]
      const lower = query.toLowerCase()
      return attendances.filter(a =>
        String(a.memberId).includes(lower) ||
        a.date.toLowerCase().includes(lower) ||
        a.time.toLowerCase().includes(lower)
      )
    },

    async create(data) {
      const a = { id: nextId++, ...data, createdAt: new Date().toISOString() }
      attendances.push(a)
      return { ...a }
    },

    async update(id, data) {
      const idx = attendances.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Asistencia con id ${id} no encontrada`)
      attendances[idx] = { ...attendances[idx], ...data, updatedAt: new Date().toISOString() }
      return { ...attendances[idx] }
    },

    async delete(id) {
      const idx = attendances.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Asistencia con id ${id} no encontrada`)
      attendances.splice(idx, 1)
      return true
    }
  }
}

function createMockView() {
  return {
    rendered: false,
    attendancesData: null,
    errorMessage: null,
    successMessage: null,
    formOpened: false,
    formClosed: false,
    savingState: false,
    loadingState: false,
    confirmed: true,

    reset() {
      this.rendered = false
      this.attendancesData = null
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

    renderAttendances(attendances) {
      this.attendancesData = attendances
    },

    showForm(attendance, onSubmit, onCancel) {
      this.formOpened = true
      this._attendance = attendance
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

async function testInitLoadsAttendances() {
  const service = createMockService()
  const view = createMockView()
  const controller = new AttendanceController(service, view, createMockMemberRepo())

  await service.create({ memberId: 1, date: '2026-01-01', time: '08:00' })
  await service.create({ memberId: 2, date: '2026-01-01', time: '09:00' })

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.rendered, 'init debería llamar a view.render')
  assert(view.attendancesData !== null, 'init debería cargar asistencias')
  assert(view.attendancesData.length === 2, 'init debería cargar 2 asistencias')

  console.log('  ✓ testInitLoadsAttendances')
}

async function testHandleSearch() {
  const service = createMockService()
  const view = createMockView()
  const controller = new AttendanceController(service, view, createMockMemberRepo())

  await service.create({ memberId: 1, date: '2026-01-01', time: '08:00' })
  await service.create({ memberId: 2, date: '2026-01-15', time: '09:00' })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleSearch('2026-01-01')
  assert(view.attendancesData.length === 1, 'búsqueda debería filtrar a 1 asistencia')

  await controller.handleSearch('')
  assert(view.attendancesData.length === 2, 'búsqueda vacía debería retornar todos')

  console.log('  ✓ testHandleSearch')
}

async function testHandleCreate() {
  const service = createMockService()
  const view = createMockView()
  const controller = new AttendanceController(service, view, createMockMemberRepo())

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showCreateForm()
  assert(view.formOpened, 'showCreateForm debería abrir formulario')
  assert(view._attendance === null, 'showCreateForm debería pasar null')

  await view._formSubmit({ memberId: 1, date: '2026-01-01', time: '08:00' })

  assert(view.successMessage !== null, 'handleSave debería mostrar éxito')
  assert(view.formClosed, 'handleSave debería cerrar formulario')
  assert(view.attendancesData.length === 1, 'handleSave debería recargar lista')

  console.log('  ✓ testHandleCreate')
}

async function testHandleUpdate() {
  const service = createMockService()
  const view = createMockView()
  const controller = new AttendanceController(service, view, createMockMemberRepo())

  await service.create({ memberId: 1, date: '2026-01-01', time: '08:00' })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showEditForm(1)
  assert(view.formOpened, 'showEditForm debería abrir formulario')
  assert(view._attendance !== null, 'showEditForm debería pasar la asistencia')

  await view._formSubmit({ memberId: 1, date: '2026-01-01', time: '10:00' })

  assert(view.successMessage !== null, 'update debería mostrar éxito')
  const updated = await service.getById(1)
  assert(updated.time === '10:00', 'update debería cambiar la hora')

  console.log('  ✓ testHandleUpdate')
}

async function testHandleDelete() {
  const service = createMockService()
  const view = createMockView()
  const controller = new AttendanceController(service, view, createMockMemberRepo())

  await service.create({ memberId: 1, date: '2026-01-01', time: '08:00' })

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = true
  await controller.handleDelete(1)

  assert(view.successMessage !== null, 'delete debería mostrar éxito')
  const all = await service.getAll()
  assert(all.length === 0, 'delete debería eliminar la asistencia')

  console.log('  ✓ testHandleDelete')
}

async function testHandleDeleteCancelled() {
  const service = createMockService()
  const view = createMockView()
  const controller = new AttendanceController(service, view, createMockMemberRepo())

  await service.create({ memberId: 1, date: '2026-01-01', time: '08:00' })

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
  const controller = new AttendanceController(service, view, createMockMemberRepo())

  service.getAll = async () => { throw new Error('Error al cargar asistencias') }

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.errorMessage === 'Error al cargar asistencias', 'init debería mostrar error si falla carga')

  console.log('  ✓ testInitLoadError')
}

async function testShowEditFormError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new AttendanceController(service, view, createMockMemberRepo())

  const container = document.createElement('div')
  await controller.init(container)

  service.getById = async () => { throw new Error('Error al obtener asistencia') }
  view.reset()

  await controller.showEditForm(999)
  assert(view.errorMessage === 'Error al obtener asistencia', 'showEditForm debería mostrar error')

  console.log('  ✓ testShowEditFormError')
}

async function testHandleSaveCreateError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new AttendanceController(service, view, createMockMemberRepo())

  service.create = async () => { throw new Error('Error al crear asistencia') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showCreateForm()
  await view._formSubmit({ memberId: 1, date: '2026-01-01', time: '08:00' })

  assert(view.errorMessage === 'Error al crear asistencia', 'handleSave create debería mostrar error')

  console.log('  ✓ testHandleSaveCreateError')
}

async function testHandleSaveUpdateError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new AttendanceController(service, view, createMockMemberRepo())

  await service.create({ memberId: 1, date: '2026-01-01', time: '08:00' })
  service.update = async () => { throw new Error('Error al actualizar asistencia') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showEditForm(1)
  view.reset()
  await view._formSubmit({ memberId: 1, date: '2026-01-01', time: '10:00' })

  assert(view.errorMessage === 'Error al actualizar asistencia', 'handleSave update debería mostrar error')

  console.log('  ✓ testHandleSaveUpdateError')
}

async function testHandleDeleteError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new AttendanceController(service, view, createMockMemberRepo())

  await service.create({ memberId: 1, date: '2026-01-01', time: '08:00' })
  service.delete = async () => { throw new Error('Error al eliminar asistencia') }

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = true
  await controller.handleDelete(1)

  assert(view.errorMessage === 'Error al eliminar asistencia', 'handleDelete debería mostrar error')

  console.log('  ✓ testHandleDeleteError')
}

async function testHandleSearchError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new AttendanceController(service, view, createMockMemberRepo())

  service.search = async () => { throw new Error('Error de búsqueda') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleSearch('algo')

  assert(view.errorMessage === 'Error de búsqueda', 'handleSearch debería mostrar error')

  console.log('  ✓ testHandleSearchError')
}

export async function runAttendanceControllerTests() {
  console.log('\n--- AttendanceController Tests ---\n')

  await testInitLoadsAttendances()
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

  console.log('\n✓ Todos los tests de AttendanceController pasaron\n')
}