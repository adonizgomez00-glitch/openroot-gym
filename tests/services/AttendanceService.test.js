import { AttendanceService } from '../../src/services/AttendanceService.js'

function createMockAttendanceRepo() {
  const attendances = []
  let nextId = 1

  return {
    attendances,

    async findAll() { return [...attendances] },

    async findById(id) {
      const a = attendances.find(x => x.id === id)
      return a ? { ...a } : null
    },

    async findByMemberId(memberId) {
      return attendances.filter(a => a.memberId === memberId).map(a => ({ ...a }))
    },

    async findByDateRange(startDate, endDate) {
      return attendances
        .filter(a => a.date >= startDate && a.date <= endDate)
        .map(a => ({ ...a }))
    },

    async findByMemberAndDate(memberId, date) {
      return attendances
        .filter(a => a.memberId === memberId && a.date === date)
        .map(a => ({ ...a }))
    },

    async countByDate(date) {
      return attendances.filter(a => a.date === date).length
    },

    async countByMemberId(memberId) {
      return attendances.filter(a => a.memberId === memberId).length
    },

    async search(query) {
      const lower = query.toLowerCase()
      return attendances.filter(a =>
        String(a.memberId).includes(lower) ||
        a.date.toLowerCase().includes(lower) ||
        a.time.toLowerCase().includes(lower)
      ).map(a => ({ ...a }))
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

function createMockMemberRepo() {
  const members = [
    { id: 1, documentId: 'M001', name: 'Juan Pérez', status: 'active', active: true },
    { id: 2, documentId: 'M002', name: 'María García', status: 'active', active: true },
    { id: 3, documentId: 'M003', name: 'Carlos López', status: 'inactive', active: false }
  ]

  return {
    members,

    async findAll() {
      return members.map(m => ({ ...m }))
    },

    async findById(id) {
      const m = members.find(x => x.id === id)
      return m ? { ...m } : null
    }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testGetAll() {
  const attendanceRepo = createMockAttendanceRepo()
  const memberRepo = createMockMemberRepo()
  const service = new AttendanceService(attendanceRepo, memberRepo)

  attendanceRepo.attendances.push({ id: 1, memberId: 1, date: '2026-01-01', time: '08:00' })
  attendanceRepo.attendances.push({ id: 2, memberId: 2, date: '2026-01-01', time: '09:00' })

  const result = await service.getAll()
  assert(result.length === 2, 'getAll debería retornar 2 registros')
  assert(result[0].memberName === 'Juan Pérez', 'getAll debería adjuntar memberName')
  assert(result[0].memberDocumentId === 'M001', 'getAll debería adjuntar memberDocumentId')
  console.log('  ✓ testGetAll')
}

async function testGetById() {
  const attendanceRepo = createMockAttendanceRepo()
  const memberRepo = createMockMemberRepo()
  const service = new AttendanceService(attendanceRepo, memberRepo)

  attendanceRepo.attendances.push({ id: 1, memberId: 1, date: '2026-01-01', time: '08:00' })

  const attendance = await service.getById(1)
  assert(attendance !== null, 'getById debería retornar el registro')
  assert(attendance.memberId === 1, 'getById debería retornar el memberId correcto')

  try {
    await service.getById(999)
    assert(false, 'getById debería lanzar error para ID inexistente')
  } catch { /* Expected */ }

  console.log('  ✓ testGetById')
}

async function testCreateValidMember() {
  const attendanceRepo = createMockAttendanceRepo()
  const memberRepo = createMockMemberRepo()
  const service = new AttendanceService(attendanceRepo, memberRepo)

  const attendance = await service.create({ memberId: 1, date: '2026-01-01', time: '08:00' })

  assert(attendance.id !== undefined, 'create debería asignar un ID')
  assert(attendance.memberId === 1, 'create debería retornar el memberId correcto')
  assert(attendanceRepo.attendances.length === 1, 'create debería agregar al repositorio')

  console.log('  ✓ testCreateValidMember')
}

async function testCreateInactiveMember() {
  const attendanceRepo = createMockAttendanceRepo()
  const memberRepo = createMockMemberRepo()
  const service = new AttendanceService(attendanceRepo, memberRepo)

  try {
    await service.create({ memberId: 3, date: '2026-01-01', time: '08:00' })
    assert(false, 'create debería rechazar miembro inactivo')
  } catch (error) {
    assert(error.message.includes('inactivo'), 'Error debería mencionar inactivo')
  }

  console.log('  ✓ testCreateInactiveMember')
}

async function testCreateNonExistentMember() {
  const attendanceRepo = createMockAttendanceRepo()
  const memberRepo = createMockMemberRepo()
  const service = new AttendanceService(attendanceRepo, memberRepo)

  try {
    await service.create({ memberId: 999, date: '2026-01-01', time: '08:00' })
    assert(false, 'create debería rechazar miembro inexistente')
  } catch (error) {
    assert(error.message.includes('no encontrado'), 'Error debería mencionar no encontrado')
  }

  console.log('  ✓ testCreateNonExistentMember')
}

async function testCreateDuplicateAttendance() {
  const attendanceRepo = createMockAttendanceRepo()
  const memberRepo = createMockMemberRepo()
  const service = new AttendanceService(attendanceRepo, memberRepo)

  await service.create({ memberId: 1, date: '2026-01-01', time: '08:00' })

  try {
    await service.create({ memberId: 1, date: '2026-01-01', time: '09:00' })
    assert(false, 'create debería rechazar asistencia duplicada')
  } catch (error) {
    assert(error.message.includes('existe'), 'Error debería mencionar que existe')
  }

  console.log('  ✓ testCreateDuplicateAttendance')
}

async function testUpdate() {
  const attendanceRepo = createMockAttendanceRepo()
  const memberRepo = createMockMemberRepo()
  const service = new AttendanceService(attendanceRepo, memberRepo)

  attendanceRepo.attendances.push({ id: 1, memberId: 1, date: '2026-01-01', time: '08:00' })

  const updated = await service.update(1, { time: '09:00' })
  assert(updated.time === '09:00', 'update debería cambiar la hora')

  console.log('  ✓ testUpdate')
}

async function testDelete() {
  const attendanceRepo = createMockAttendanceRepo()
  const memberRepo = createMockMemberRepo()
  const service = new AttendanceService(attendanceRepo, memberRepo)

  attendanceRepo.attendances.push({ id: 1, memberId: 1, date: '2026-01-01', time: '08:00' })

  assert(attendanceRepo.attendances.length === 1, 'debería haber 1 registro antes de eliminar')

  await service.delete(1)
  assert(attendanceRepo.attendances.length === 0, 'delete debería eliminar el registro')

  console.log('  ✓ testDelete')
}

async function testFindByDateRange() {
  const attendanceRepo = createMockAttendanceRepo()
  const memberRepo = createMockMemberRepo()
  const service = new AttendanceService(attendanceRepo, memberRepo)

  attendanceRepo.attendances.push({ id: 1, memberId: 1, date: '2026-01-01', time: '08:00' })
  attendanceRepo.attendances.push({ id: 2, memberId: 2, date: '2026-01-15', time: '09:00' })

  const result = await service.findByDateRange('2026-01-01', '2026-01-10')
  assert(result.length === 1, 'findByDateRange debería retornar 1 registro en el rango')

  console.log('  ✓ testFindByDateRange')
}

export async function runAttendanceServiceTests() {
  console.log('\n--- AttendanceService Tests ---\n')

  await testGetAll()
  await testGetById()
  await testCreateValidMember()
  await testCreateInactiveMember()
  await testCreateNonExistentMember()
  await testCreateDuplicateAttendance()
  await testUpdate()
  await testDelete()
  await testFindByDateRange()

  console.log('\n✓ Todos los tests de AttendanceService pasaron\n')
}