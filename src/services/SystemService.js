export class SystemService {
  constructor(userRepository, roleRepository, permissionRepository, settingRepository) {
    this._userRepo = userRepository
    this._roleRepo = roleRepository
    this._permissionRepo = permissionRepository
    this._settingRepo = settingRepository
  }

  async isFirstRun() {
    const userCount = await this._userRepo.count()
    if (userCount > 0) return false
    const adminCount = await this._userRepo.countAdmins()
    return adminCount === 0
  }

  async setupInitial(data) {
    const isFirst = await this.isFirstRun()
    if (!isFirst) {
      throw new Error('El sistema ya ha sido configurado')
    }
    
    let role = await this._roleRepo.findByName('Administrador')
    if (!role) {
      role = await this._roleRepo.create({ name: 'Administrador', description: 'Acceso completo al sistema' })
    }
    
    const allPermissions = await this._permissionRepo.findAll()
    for (const perm of allPermissions) {
      const existing = await this._permissionRepo.hasPermission(role.id, perm.name)
      if (!existing) {
        await this._permissionRepo.assignPermission(role.id, perm.id)
      }
    }
    
    const passwordHash = data.passwordHash
    const existingUser = await this._userRepo.findByUsername(data.username)
    let user
    if (existingUser) {
      user = existingUser
      await this._userRepo.update(user.id, { passwordHash, roleId: role.id, active: true })
    } else {
      user = await this._userRepo.create({
        username: data.username,
        passwordHash,
        roleId: role.id,
        active: true
      })
    }
    
    if (data.businessName) {
      const existing = await this._settingRepo.get('business_name')
      if (!existing) {
        await this._settingRepo.create({ key: 'business_name', value: data.businessName })
      }
    }

    await this._ensureDefaultRoles()
    return { role, username: data.username }
  }

  async ensureDefaultPermissions() {
    const defaultPermissions = [
      { name: 'products.view', description: 'Ver productos' },
      { name: 'products.create', description: 'Crear productos' },
      { name: 'products.edit', description: 'Editar productos' },
      { name: 'products.delete', description: 'Eliminar productos' },
      { name: 'members.view', description: 'Ver miembros' },
      { name: 'members.create', description: 'Crear miembros' },
      { name: 'members.edit', description: 'Editar miembros' },
      { name: 'members.delete', description: 'Eliminar miembros' },
      { name: 'suppliers.view', description: 'Ver proveedores' },
      { name: 'suppliers.create', description: 'Crear proveedores' },
      { name: 'suppliers.edit', description: 'Editar proveedores' },
      { name: 'suppliers.delete', description: 'Eliminar proveedores' },
      { name: 'sales.view', description: 'Ver ventas' },
      { name: 'sales.create', description: 'Crear ventas' },
      { name: 'sales.cancel', description: 'Anular ventas' },
      { name: 'sales.delete', description: 'Eliminar ventas' },
      { name: 'purchases.view', description: 'Ver compras' },
      { name: 'purchases.create', description: 'Crear compras' },
      { name: 'purchases.cancel', description: 'Anular compras' },
      { name: 'purchases.delete', description: 'Eliminar compras' },
      { name: 'inventory.view', description: 'Ver inventario' },
      { name: 'inventory.adjust', description: 'Ajustar inventario' },
      { name: 'reports.view', description: 'Ver reportes' },
      { name: 'dashboard.view', description: 'Ver dashboard' },
      { name: 'settings.view', description: 'Ver configuración' },
      { name: 'settings.edit', description: 'Editar configuración' },
      { name: 'exports.view', description: 'Ver exportación' },
      { name: 'exports.create', description: 'Exportar datos' },
      { name: 'imports.view', description: 'Ver importación' },
      { name: 'imports.create', description: 'Importar datos' },
      { name: 'users.view', description: 'Ver usuarios' },
      { name: 'users.create', description: 'Crear usuarios' },
      { name: 'users.edit', description: 'Editar usuarios' },
      { name: 'users.delete', description: 'Eliminar usuarios' },
      { name: 'accounting.view', description: 'Ver contabilidad' },
      { name: 'accounting.create', description: 'Crear asientos contables' },
      { name: 'accounting.edit', description: 'Editar plan de cuentas' },
      { name: 'memberships.view', description: 'Ver membresías' },
      { name: 'memberships.create', description: 'Crear membresías' },
      { name: 'memberships.edit', description: 'Editar membresías' },
      { name: 'memberships.delete', description: 'Eliminar membresías' },
      { name: 'memberships.payments.create', description: 'Registrar pagos de membresías' },
      { name: 'attendance.view', description: 'Ver asistencias' },
      { name: 'attendance.create', description: 'Registrar asistencias' },
      { name: 'attendance.delete', description: 'Eliminar asistencias' },
      { name: 'trainers.view', description: 'Ver entrenadores' },
      { name: 'trainers.create', description: 'Crear entrenadores' },
      { name: 'trainers.edit', description: 'Editar entrenadores' },
      { name: 'trainers.delete', description: 'Eliminar entrenadores' },
      { name: 'evolution.view', description: 'Ver evolución física' },
      { name: 'evolution.create', description: 'Registrar evolución física' },
      { name: 'evolution.edit', description: 'Editar evolución física' },
      { name: 'evolution.delete', description: 'Eliminar evolución física' },
      { name: 'assets.view', description: 'Ver activos del gimnasio' },
      { name: 'assets.create', description: 'Crear activos del gimnasio' },
      { name: 'assets.edit', description: 'Editar activos del gimnasio' },
      { name: 'assets.delete', description: 'Eliminar activos del gimnasio' },
      { name: 'maintenance.view', description: 'Ver mantenimientos' },
      { name: 'maintenance.create', description: 'Crear mantenimientos' },
      { name: 'maintenance.edit', description: 'Editar mantenimientos' },
      { name: 'maintenance.delete', description: 'Eliminar mantenimientos' },
      { name: 'plugins.manage', description: 'Gestionar plugins' }
    ]
    const existing = await this._permissionRepo.findAll()
    const existingNames = new Set(existing.map(p => p.name))
    for (const perm of defaultPermissions) {
      if (!existingNames.has(perm.name)) {
        await this._permissionRepo.create(perm)
      }
    }
  }

  async _ensureDefaultRoles() {
    let usuarioRole = await this._roleRepo.findByName('Vendedor')
    if (usuarioRole) return

    usuarioRole = await this._roleRepo.create({ name: 'Vendedor', description: 'Acceso limitado: ver, crear, editar y exportar. No puede eliminar, anular ventas/compras, importar ni gestionar usuarios.' })

    const usuarioPermissions = [
      'products.view', 'products.create', 'products.edit',
      'members.view', 'members.create', 'members.edit',
      'suppliers.view', 'suppliers.create', 'suppliers.edit',
      'sales.view', 'sales.create',
      'purchases.view', 'purchases.create',
      'inventory.view', 'inventory.adjust',
      'reports.view',
      'dashboard.view',
      'settings.view',
      'exports.view', 'exports.create',
      'accounting.view',
      'memberships.view',
      'attendance.view', 'attendance.create',
      'trainers.view',
      'evolution.view',
      'assets.view',
      'maintenance.view'
    ]

    for (const permName of usuarioPermissions) {
      const perm = await this._permissionRepo.findByName(permName)
      if (perm) {
        await this._permissionRepo.assignPermission(usuarioRole.id, perm.id)
      }
    }
  }

  async getSystemInfo() {
    const userCount = await this._userRepo.count()
    const roleCount = (await this._roleRepo.findAll()).length
    const permCount = (await this._permissionRepo.findAll()).length
    return { userCount, roleCount, permCount }
  }
}
