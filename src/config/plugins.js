/*
 * Open Root Gym — Sistema de gestión para gimnasios, 100% offline, open source, libre y gratuito
 * Copyright (C) 2024 Adónis Adonai Gómez Martínez <adonizgomez00@gmail.com>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

/**
 * plugins.js — Registro de plugins (módulos)
 *
 * Todos los módulos de la aplicación son plugins instalables/desinstalables
 * desde la UI. Aquí se declara su metadato:
 *
 * - id: identificador único
 * - label: nombre visible en el menú
 * - icon: glifo del menú
 * - group: agrupación para la vista de Plugins
 * - description: texto descriptivo
 * - viewPermission: permiso `modulo.accion` requerido para verlo (null = sin restricción)
 * - adminOnly: visible únicamente para el rol Administrador
 * - required: no puede desinstalarse (núcleo de la app)
 * - defaultEnabled: estado por defecto si no hay configuración guardada
 * - requires: ids de plugins que deben estar instalados para poder usarlo
 * - tables: tablas de datos propias del plugin (se limpian al desinstalar)
 * - permissions: permisos `modulo.accion` que gestiona (se revocan a roles no-admin al desinstalar)
 */

export const PLUGINS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '\u25a0',
    group: 'General',
    description: 'Indicadores principales del gimnasio.',
    viewPermission: 'dashboard.view',
    adminOnly: false,
    required: true,
    defaultEnabled: true,
    requires: [],
    tables: [],
    permissions: ['dashboard.view']
  },
  {
    id: 'products',
    label: 'Productos',
    icon: '\u2616',
    group: 'Comercial',
    description: 'Inventario comercial: suplementos, bebidas, ropa, accesorios y snacks.',
    viewPermission: 'products.view',
    adminOnly: false,
    required: false,
    defaultEnabled: true,
    requires: [],
    tables: ['products'],
    permissions: ['products.view', 'products.create', 'products.edit', 'products.delete']
  },
  {
    id: 'members',
    label: 'Miembros',
    icon: '\u263a',
    group: 'Comercial',
    description: 'Miembros del gimnasio: datos personales, estado y membresía.',
    viewPermission: 'members.view',
    adminOnly: false,
    required: false,
    defaultEnabled: true,
    requires: [],
    tables: ['members'],
    permissions: ['members.view', 'members.create', 'members.edit', 'members.delete']
  },
  {
    id: 'membershipPlans',
    label: 'Planes de Membresía',
    icon: '\u2606',
    group: 'Comercial',
    description: 'Planificación de membresías: planes, precios y duraciones.',
    viewPermission: 'memberships.view',
    adminOnly: false,
    required: false,
    defaultEnabled: true,
    requires: ['members'],
    tables: ['membershipPlans'],
    permissions: ['memberships.view', 'memberships.create', 'memberships.edit', 'memberships.delete']
  },
  {
    id: 'memberships',
    label: 'Membresías',
    icon: '\u26B1',
    group: 'Comercial',
    description: 'Gestión de membresías: asignaciones, renovaciones, congelamientos y vencimientos.',
    viewPermission: 'memberships.view',
    adminOnly: false,
    required: false,
    defaultEnabled: true,
    requires: ['members', 'membershipPlans'],
    tables: ['memberships', 'membershipHistory', 'membershipPayments'],
    permissions: ['memberships.view', 'memberships.create', 'memberships.edit', 'memberships.delete', 'memberships.payments.create']
  },
  {
    id: 'attendance',
    label: 'Asistencias',
    icon: '\u24C5',
    group: 'Gimnasio',
    description: 'Registro manual de asistencias de miembros: fecha, hora, historial y estadísticas.',
    viewPermission: 'attendance.view',
    adminOnly: false,
    required: false,
    defaultEnabled: true,
    requires: ['members'],
    tables: ['attendance'],
    permissions: ['attendance.view', 'attendance.create', 'attendance.delete']
  },
  {
    id: 'trainers',
    label: 'Entrenadores',
    icon: '\u2633',
    group: 'Gimnasio',
    description: 'Gestión de entrenadores: datos personales, especialidades y estado.',
    viewPermission: 'trainers.view',
    adminOnly: false,
    required: false,
    defaultEnabled: true,
    requires: [],
    tables: ['trainers'],
    permissions: ['trainers.view', 'trainers.create', 'trainers.edit', 'trainers.delete']
  },
  {
    id: 'physicalEvolutions',
    label: 'Evolución Física',
    icon: '\u2318',
    group: 'Gimnasio',
    description: 'Registro de evolución física de miembros: peso, altura, IMC, porcentaje de grasa y más.',
    viewPermission: 'physicalEvolutions.view',
    adminOnly: false,
    required: false,
    defaultEnabled: true,
    requires: ['members'],
    tables: ['physicalEvolutions'],
    permissions: ['physicalEvolutions.view', 'physicalEvolutions.create', 'physicalEvolutions.edit', 'physicalEvolutions.delete']
  },
  {
    id: 'gymAssets',
    label: 'Activos del Gimnasio',
    icon: '\u2696',
    group: 'Gimnasio',
    description: 'Gestión de activos físicos del gimnasio: caminadoras, bicicletas, poleas, máquinas, bancos, mancuernas, etc. Registro de garantía, mantenimiento y ubicación.',
    viewPermission: 'assets.view',
    adminOnly: false,
    required: false,
    defaultEnabled: true,
    requires: [],
    tables: ['gymAssets'],
    permissions: ['assets.view', 'assets.create', 'assets.edit', 'assets.delete']
  },
  {
    id: 'maintenance',
    label: 'Mantenimiento',
    icon: '\u2697',
    group: 'Gimnasio',
    description: 'Programación y registro de mantenimientos de activos: preventivo, correctivo, limpieza, lubricación y cambios de piezas.',
    viewPermission: 'maintenance.view',
    adminOnly: false,
    required: false,
    defaultEnabled: true,
    requires: ['gymAssets'],
    tables: ['maintenance'],
    permissions: ['maintenance.view', 'maintenance.create', 'maintenance.edit', 'maintenance.delete']
  },
  {
    id: 'suppliers',
    label: 'Proveedores',
    icon: '\u2191',
    group: 'Comercial',
    description: 'Proveedores para reabastecer el inventario comercial.',
    viewPermission: 'suppliers.view',
    adminOnly: false,
    required: false,
    defaultEnabled: true,
    requires: [],
    tables: ['suppliers'],
    permissions: ['suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete']
  },
  {
    id: 'sales',
    label: 'Ventas',
    icon: '\u2714',
    group: 'Comercial',
    description: 'Punto de venta de productos del gimnasio.',
    viewPermission: 'sales.view',
    adminOnly: false,
    required: false,
    defaultEnabled: true,
    requires: ['products', 'members'],
    tables: ['sales', 'saleItems'],
    permissions: ['sales.view', 'sales.create', 'sales.cancel', 'sales.delete']
  },
  {
    id: 'purchases',
    label: 'Compras',
    icon: '\u2190',
    group: 'Comercial',
    description: 'Compras a proveedores para reposición de inventario.',
    viewPermission: 'purchases.view',
    adminOnly: false,
    required: false,
    defaultEnabled: true,
    requires: ['products', 'suppliers'],
    tables: ['purchases', 'purchaseItems'],
    permissions: ['purchases.view', 'purchases.create', 'purchases.cancel', 'purchases.delete']
  },
  {
    id: 'inventory',
    label: 'Inventario',
    icon: '\u25a3',
    group: 'Comercial',
    description: 'Movimientos y control de stock del inventario comercial.',
    viewPermission: 'inventory.view',
    adminOnly: false,
    required: false,
    defaultEnabled: true,
    requires: ['products'],
    tables: ['inventoryMovements'],
    permissions: ['inventory.view', 'inventory.adjust']
  },
  {
    id: 'accounting',
    label: 'Contabilidad',
    icon: '\u2630',
    group: 'Finanzas',
    description: 'Plan de cuentas, asientos y reportes financieros.',
    viewPermission: 'accounting.view',
    adminOnly: false,
    required: false,
    defaultEnabled: true,
    requires: [],
    tables: ['accounts', 'accountingEntries'],
    permissions: ['accounting.view', 'accounting.create', 'accounting.edit']
  },
  {
    id: 'reports',
    label: 'Reportes',
    icon: '\u2261',
    group: 'General',
    description: 'Reportes de ventas, compras, stock y módulos del gimnasio.',
    viewPermission: 'reports.view',
    adminOnly: false,
    required: true,
    defaultEnabled: true,
    requires: ['products', 'members', 'suppliers', 'sales', 'purchases'],
    tables: [],
    permissions: ['reports.view']
  },
  {
    id: 'exports',
    label: 'Exportar',
    icon: '\u2197',
    group: 'General',
    description: 'Exportación de datos en CSV y JSON.',
    viewPermission: 'exports.view',
    adminOnly: false,
    required: true,
    defaultEnabled: true,
    requires: [],
    tables: [],
    permissions: ['exports.view', 'exports.create']
  },
  {
    id: 'imports',
    label: 'Importar',
    icon: '\u2193',
    group: 'General',
    description: 'Importación de datos con auto-detección de formato.',
    viewPermission: 'imports.view',
    adminOnly: false,
    required: true,
    defaultEnabled: true,
    requires: [],
    tables: [],
    permissions: ['imports.view', 'imports.create']
  },
  {
    id: 'settings',
    label: 'Configuración',
    icon: '\u2699',
    group: 'Sistema',
    description: 'Configuración general del negocio y del sistema.',
    viewPermission: 'settings.view',
    adminOnly: false,
    required: true,
    defaultEnabled: true,
    requires: [],
    tables: [],
    permissions: ['settings.view', 'settings.edit']
  },
  {
    id: 'users',
    label: 'Usuarios',
    icon: '\u263c',
    group: 'Sistema',
    description: 'Administración de usuarios, roles y permisos.',
    viewPermission: 'users.view',
    adminOnly: false,
    required: true,
    defaultEnabled: true,
    requires: [],
    tables: ['users'],
    permissions: ['users.view', 'users.create', 'users.edit', 'users.delete']
  },
  {
    id: 'plugins',
    label: 'Plugins',
    icon: '\u2299',
    group: 'Sistema',
    description: 'Instalar y desinstalar los módulos de la aplicación.',
    viewPermission: null,
    adminOnly: true,
    required: true,
    defaultEnabled: true,
    requires: [],
    tables: [],
    permissions: ['plugins.manage']
  }
]
