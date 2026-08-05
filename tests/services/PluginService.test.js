import { PluginService } from '../../src/services/PluginService.js'

function createMockSettingRepo() {
  const store = {}
  return {
    async get(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null
    },
    async set(key, value) {
      store[key] = value
    },
    _getStore() { return store }
  }
}

function createMockPermissionRepo() {
  const perms = []
  const rolePerms = []
  let nextPermId = 1

  return {
    async findByName(name) {
      return perms.find(p => p.name === name) || null
    },
    async removePermission(roleId, permissionId) {
      const idx = rolePerms.findIndex(rp => rp.roleId === roleId && rp.permissionId === permissionId)
      if (idx === -1) return false
      rolePerms.splice(idx, 1)
      return true
    },
    _addPerm(name) {
      const p = { id: nextPermId++, name }
      perms.push(p)
      return p
    },
    _grant(roleId, permissionId) {
      rolePerms.push({ roleId, permissionId })
    },
    _rolePerms() { return rolePerms }
  }
}

function createMockRoleRepo() {
  const roles = []
  let nextId = 1
  return {
    async findAll() { return [...roles] },
    _addRole(name) {
      const r = { id: nextId++, name }
      roles.push(r)
      return r
    }
  }
}

function createMockDb(tables = []) {
  const store = {}
  const db = {
    _store: store,
    transaction(mode, objs, fn) { return fn() }
  }
  for (const t of tables) {
    store[t] = []
    db[t] = {
      async clear() { store[t] = [] },
      _store: store[t]
    }
  }
  return db
}

const TEST_PLUGINS = [
  { id: 'core', label: 'Core', required: true, defaultEnabled: true, requires: [], tables: [], permissions: ['core.view'] },
  { id: 'products', label: 'Productos', required: false, defaultEnabled: true, requires: [], tables: ['products'], permissions: ['products.view'] },
  { id: 'sales', label: 'Ventas', required: false, defaultEnabled: true, requires: ['products'], tables: ['sales', 'saleItems'], permissions: ['sales.view', 'sales.create'] },
  { id: 'assets', label: 'Activos', required: false, defaultEnabled: false, requires: [], tables: ['gymAssets'], permissions: ['assets.view'] }
]

function createService({ dbTables = [] } = {}) {
  const settingRepo = createMockSettingRepo()
  const permissionRepo = createMockPermissionRepo()
  const roleRepo = createMockRoleRepo()
  const db = createMockDb(dbTables)
  const service = new PluginService({
    settingRepository: settingRepo,
    permissionRepository: permissionRepo,
    roleRepository: roleRepo,
    db,
    plugins: TEST_PLUGINS
  })
  return { service, settingRepo, permissionRepo, roleRepo, db }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testDefaultEnabled() {
  const { service } = createService()
  assert(await service.isEnabled('core') === true, 'core debe estar habilitado por default')
  assert(await service.isEnabled('assets') === false, 'assets debe estar deshabilitado por default')
  console.log('  ✓ testDefaultEnabled')
}

async function testSetEnabled() {
  const { service, settingRepo } = createService()
  await service.setEnabled('assets', true)
  assert(await service.isEnabled('assets') === true, 'assets debe habilitarse con setEnabled')
  const store = settingRepo._getStore()
  assert(store['module.assets.enabled'] === '1', 'setEnabled debe persistir la clave en settings')
  console.log('  ✓ testSetEnabled')
}

async function testInstall() {
  const { service } = createService()
  const plugin = await service.install('assets')
  assert(plugin.id === 'assets', 'install debe retornar el plugin')
  assert(await service.isEnabled('assets') === true, 'install debe habilitar el plugin')
  console.log('  ✓ testInstall')
}

async function testUninstallRequiredBlocked() {
  const { service } = createService()
  try {
    await service.uninstall('core')
    assert(false, 'uninstall de un plugin requerido debe lanzar error')
  } catch (error) {
    assert(error.message.includes('núcleo'), 'Error debe indicar que es del núcleo')
  }
  console.log('  ✓ testUninstallRequiredBlocked')
}

async function testUninstallDependentBlocked() {
  const { service } = createService({ dbTables: ['sales', 'saleItems', 'products'] })
  await service.install('sales')
  await service.install('products')
  try {
    await service.uninstall('products')
    assert(false, 'uninstall de un plugin requerido por otro habilitado debe lanzar error')
  } catch (error) {
    assert(error.message.includes('requieren'), 'Error debe mencionar dependencias')
    assert(await service.isEnabled('products') === true, 'products debe seguir habilitado')
  }
  console.log('  ✓ testUninstallDependentBlocked')
}

async function testUninstallSuccess() {
  const { service, db } = createService({ dbTables: ['gymAssets'] })
  db._store.gymAssets.push({ id: 1, name: 'Caminadora' }, { id: 2, name: 'Bicicleta' })
  await service.install('assets')
  const plugin = await service.uninstall('assets')
  assert(plugin.id === 'assets', 'uninstall debe retornar el plugin')
  assert(db._store.gymAssets.length === 0, 'uninstall debe limpiar las tablas propias del plugin')
  assert(await service.isEnabled('assets') === false, 'uninstall debe deshabilitar el plugin')
  console.log('  ✓ testUninstallSuccess')
}

async function testUninstallRevokesNonAdminPermissions() {
  const { service, permissionRepo, roleRepo } = createService()
  const admin = roleRepo._addRole('Administrador')
  const seller = roleRepo._addRole('Vendedor')
  const assetsPerm = permissionRepo._addPerm('assets.view')
  permissionRepo._grant(admin.id, assetsPerm.id)
  permissionRepo._grant(seller.id, assetsPerm.id)

  await service.install('assets')
  await service.uninstall('assets')

  const rolePerms = permissionRepo._rolePerms()
  assert(rolePerms.some(rp => rp.roleId === admin.id), 'Administrador debe conservar sus permisos')
  assert(!rolePerms.some(rp => rp.roleId === seller.id), 'Vendedor debe perder el permiso del plugin desinstalado')
  console.log('  ✓ testUninstallRevokesNonAdminPermissions')
}

export async function runPluginServiceTests() {
  console.log('\n--- PluginService Tests ---\n')

  await testDefaultEnabled()
  await testSetEnabled()
  await testInstall()
  await testUninstallRequiredBlocked()
  await testUninstallDependentBlocked()
  await testUninstallSuccess()
  await testUninstallRevokesNonAdminPermissions()

  console.log('\n✓ Todos los tests de PluginService pasaron\n')
}
