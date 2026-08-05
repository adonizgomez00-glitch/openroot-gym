import { MembershipService } from '../../src/services/MembershipService.js'

function createMockRepositories() {
  const memberships = []
  const histories = []
  let nextId = 1
  let nextHistoryId = 1

  const membershipRepo = {
    memberships,

    async findAll() { return [...memberships] },

    async findById(id) {
      const m = memberships.find(x => x.id === id)
      return m ? { ...m } : null
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
      const today = new Date()
      const cutoff = new Date(today)
      cutoff.setDate(cutoff.getDate() + days)
      const todayStr = today.toISOString().split('T')[0]
      const cutoffStr = cutoff.toISOString().split('T')[0]
      return memberships.filter(m => m.status === 'active' && m.endDate >= todayStr && m.endDate <= cutoffStr).map(m => ({ ...m }))
    },

    async search(query) {
      const lower = query.toLowerCase()
      return memberships.filter(m =>
        String(m.memberId).includes(lower) ||
        String(m.planId).includes(lower) ||
        m.status.toLowerCase().includes(lower)
      ).map(m => ({ ...m }))
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
    }
  }

  const plans = [{ id: 1, name: 'Básico Mensual', durationDays: 30 }]
  const planRepo = {
    async findAll() { return plans.map(p => ({ ...p })) },

    async findById(id) {
      const p = plans.find(x => x.id === id)
      return p ? { ...p } : null
    }
  }

  const members = [
    { id: 1, documentId: 'M001', name: 'Juan Pérez', status: 'active' },
    { id: 2, documentId: 'M002', name: 'María García', status: 'active' }
  ]
  const memberRepo = {
    async findAll() { return members.map(m => ({ ...m })) },

    async findById(id) {
      const m = members.find(x => x.id === id)
      return m ? { ...m } : null
    }
  }

  const historyRepo = {
    histories,

    async create(data) {
      const h = { id: nextHistoryId++, ...data, createdAt: new Date().toISOString() }
      histories.push(h)
      return { ...h }
    }
  }

  return { membershipRepo, planRepo, historyRepo, memberRepo }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testGetAll() {
  const { membershipRepo, planRepo, historyRepo, memberRepo } = createMockRepositories()
  const service = new MembershipService(membershipRepo, planRepo, historyRepo, memberRepo)

  membershipRepo.memberships.push({ id: 1, memberId: 1, planId: 1, status: 'active' })
  membershipRepo.memberships.push({ id: 2, memberId: 2, planId: 1, status: 'expired' })

  const result = await service.getAll()
  assert(result.length === 2, 'getAll debería retornar 2 membresías')
  assert(result[0].memberName === 'Juan Pérez', 'getAll debería adjuntar memberName')
  assert(result[0].memberDocumentId === 'M001', 'getAll debería adjuntar memberDocumentId')
  assert(result[0].planName === 'Básico Mensual', 'getAll debería adjuntar planName')
  console.log('  ✓ testGetAll')
}

async function testSearchEnriched() {
  const { membershipRepo, planRepo, historyRepo, memberRepo } = createMockRepositories()
  const service = new MembershipService(membershipRepo, planRepo, historyRepo, memberRepo)

  membershipRepo.memberships.push({ id: 1, memberId: 1, planId: 1, status: 'active' })

  const result = await service.search('active')
  assert(result.length === 1, 'search debería retornar 1 membresía')
  assert(result[0].memberName === 'Juan Pérez', 'search debería adjuntar memberName')
  assert(result[0].planName === 'Básico Mensual', 'search debería adjuntar planName')
  console.log('  ✓ testSearchEnriched')
}

async function testCreateValid() {
  const { membershipRepo, planRepo, historyRepo, memberRepo } = createMockRepositories()
  const service = new MembershipService(membershipRepo, planRepo, historyRepo, memberRepo)

  const created = await service.create({ memberId: 1, planId: 1, startDate: '2026-01-01', endDate: '2026-01-31', status: 'active' })
  assert(created.id !== undefined, 'create debería asignar un ID')
  assert(membershipRepo.memberships.length === 1, 'create debería agregar la membresía')
  console.log('  ✓ testCreateValid')
}

async function testCreateInvalidMember() {
  const { membershipRepo, planRepo, historyRepo, memberRepo } = createMockRepositories()
  const service = new MembershipService(membershipRepo, planRepo, historyRepo, memberRepo)

  try {
    await service.create({ memberId: 999, planId: 1, startDate: '2026-01-01', endDate: '2026-01-31', status: 'active' })
    assert(false, 'create debería rechazar miembro inexistente')
  } catch (error) {
    assert(error.message.includes('no encontrado'), 'create debería mencionar miembro no encontrado')
  }
  assert(membershipRepo.memberships.length === 0, 'create no debería guardar con miembro inválido')
  console.log('  ✓ testCreateInvalidMember')
}

async function testCreateInvalidPlan() {
  const { membershipRepo, planRepo, historyRepo, memberRepo } = createMockRepositories()
  const service = new MembershipService(membershipRepo, planRepo, historyRepo, memberRepo)

  try {
    await service.create({ memberId: 1, planId: 999, startDate: '2026-01-01', endDate: '2026-01-31', status: 'active' })
    assert(false, 'create debería rechazar plan inexistente')
  } catch (error) {
    assert(error.message.includes('no encontrado'), 'create debería mencionar plan no encontrado')
  }
  assert(membershipRepo.memberships.length === 0, 'create no debería guardar con plan inválido')
  console.log('  ✓ testCreateInvalidPlan')
}

async function testGetById() {
  const { membershipRepo, planRepo, historyRepo, memberRepo } = createMockRepositories()
  const service = new MembershipService(membershipRepo, planRepo, historyRepo, memberRepo)

  membershipRepo.memberships.push({ id: 1, memberId: 1, planId: 1, status: 'active' })

  const membership = await service.getById(1)
  assert(membership !== null, 'getById debería retornar la membresía')
  assert(membership.memberId === 1, 'getById debería retornar el memberId correcto')

  try {
    await service.getById(999)
    assert(false, 'getById debería lanzar error para ID inexistente')
  } catch { /* Expected */ }

  console.log('  ✓ testGetById')
}

async function testFindByMemberId() {
  const { membershipRepo, planRepo, historyRepo, memberRepo } = createMockRepositories()
  const service = new MembershipService(membershipRepo, planRepo, historyRepo, memberRepo)

  membershipRepo.memberships.push({ id: 1, memberId: 1, planId: 1, status: 'active' })
  membershipRepo.memberships.push({ id: 2, memberId: 1, planId: 2, status: 'expired' })
  membershipRepo.memberships.push({ id: 3, memberId: 2, planId: 1, status: 'active' })

  const result = await service.findByMemberId(1)
  assert(result.length === 2, 'findByMemberId debería retornar 2 membresías')

  console.log('  ✓ testFindByMemberId')
}

async function testRenew() {
  const { membershipRepo, planRepo, historyRepo, memberRepo } = createMockRepositories()
  const service = new MembershipService(membershipRepo, planRepo, historyRepo, memberRepo)

  membershipRepo.memberships.push({ id: 1, memberId: 1, planId: 1, startDate: '2026-01-01', endDate: '2026-01-31', status: 'active' })

  const renewed = await service.renew(1, 30)
  const expectedEndDate = new Date('2026-01-31')
  expectedEndDate.setDate(expectedEndDate.getDate() + 30)
  assert(renewed.endDate === expectedEndDate.toISOString().split('T')[0], 'renew debería extender la fecha de fin')
  assert(renewed.status === 'active', 'renew debería mantener el estado active')
  assert(historyRepo.histories.length === 1, 'renew debería crear un registro de historial')
  assert(historyRepo.histories[0].type === 'renewal', 'renew debería crear un historial de tipo renewal')

  console.log('  ✓ testRenew')
}

async function testFreeze() {
  const { membershipRepo, planRepo, historyRepo, memberRepo } = createMockRepositories()
  const service = new MembershipService(membershipRepo, planRepo, historyRepo, memberRepo)

  membershipRepo.memberships.push({ id: 1, memberId: 1, planId: 1, startDate: '2026-01-01', endDate: '2026-01-31', status: 'active' })

  const frozen = await service.freeze(1)
  assert(frozen.status === 'frozen', 'freeze debería cambiar el estado a frozen')
  assert(historyRepo.histories.length === 1, 'freeze debería crear un registro de historial')
  assert(historyRepo.histories[0].type === 'freeze', 'freeze debería crear un historial de tipo freeze')

  console.log('  ✓ testFreeze')
}

async function testUnfreeze() {
  const { membershipRepo, planRepo, historyRepo, memberRepo } = createMockRepositories()
  const service = new MembershipService(membershipRepo, planRepo, historyRepo, memberRepo)

  membershipRepo.memberships.push({ id: 1, memberId: 1, planId: 1, startDate: '2026-01-01', endDate: '2026-01-31', status: 'frozen' })

  const unfrozen = await service.unfreeze(1)
  assert(unfrozen.status === 'active', 'unfreeze debería cambiar el estado a active')
  assert(historyRepo.histories.length === 1, 'unfreeze debería crear un registro de historial')
  assert(historyRepo.histories[0].type === 'unfreeze', 'unfreeze debería crear un historial de tipo unfreeze')

  console.log('  ✓ testUnfreeze')
}

async function testExpire() {
  const { membershipRepo, planRepo, historyRepo, memberRepo } = createMockRepositories()
  const service = new MembershipService(membershipRepo, planRepo, historyRepo, memberRepo)

  membershipRepo.memberships.push({ id: 1, memberId: 1, planId: 1, startDate: '2026-01-01', endDate: '2025-12-31', status: 'active' })

  const expired = await service.expire(1)
  assert(expired.status === 'expired', 'expire debería cambiar el estado a expired')
  assert(historyRepo.histories.length === 1, 'expire debería crear un registro de historial')
  assert(historyRepo.histories[0].type === 'expiration', 'expire debería crear un historial de tipo expiration')

  console.log('  ✓ testExpire')
}

async function testCheckExpiredMemberships() {
  const { membershipRepo, planRepo, historyRepo, memberRepo } = createMockRepositories()
  const service = new MembershipService(membershipRepo, planRepo, historyRepo, memberRepo)

  membershipRepo.memberships.push({ id: 1, memberId: 1, planId: 1, startDate: '2026-01-01', endDate: '2025-12-31', status: 'active' })

  const expired = await service.checkExpiredMemberships()
  assert(expired.length === 1, 'checkExpiredMemberships debería retornar 1 membresía expirada')
  assert(expired[0].status === 'expired', 'checkExpiredMemberships debería marcar la membresía como expired')

  console.log('  ✓ testCheckExpiredMemberships')
}

export async function runMembershipServiceTests() {
  console.log('\n--- MembershipService Tests ---\n')

  await testGetAll()
  await testSearchEnriched()
  await testCreateValid()
  await testCreateInvalidMember()
  await testCreateInvalidPlan()
  await testGetById()
  await testFindByMemberId()
  await testRenew()
  await testFreeze()
  await testUnfreeze()
  await testExpire()
  await testCheckExpiredMemberships()

  console.log('\n✓ Todos los tests de MembershipService pasaron\n')
}