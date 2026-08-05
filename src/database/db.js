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

import Dexie from '../../assets/lib/dexie.js'

/**
 * Base de datos local de Open Root Gym.
 * Base nueva: 'OpenRootGym'. El esquema conserva las tablas del ERP original
 * y agrega las tablas de los módulos propios del gimnasio. Todas las tablas
 * existen desde la v1 aunque el plugin correspondiente esté desinstalado.
 *
 * Nota: la tabla `customers` se renombra a `members` en la versión 2 de la base de datos.
 */

export const db = new Dexie('OpenRootGym')

db.version(1).stores({
  // --- Núcleo ERP ---
  products: '++id, &code, name, category, active, stock, createdAt, updatedAt',
  customers: '++id, &documentId, name, email, phone, active, createdAt, updatedAt',
  suppliers: '++id, &documentId, name, email, phone, active, createdAt, updatedAt',
  sales: '++id, date, customerId, status, createdAt, updatedAt, [customerId+date]',
  saleItems: '++id, saleId, productId, [saleId+productId]',
  purchases: '++id, date, supplierId, status, createdAt, updatedAt, [supplierId+date]',
  purchaseItems: '++id, purchaseId, productId, [purchaseId+productId]',
  inventoryMovements: '++id, productId, date, type, reference, referenceId, [productId+date]',
  settings: '++id, &key',
  users: '++id, &username, roleId, active, createdAt, updatedAt',
  roles: '++id, &name, active, createdAt, updatedAt',
  permissions: '++id, &name, description, createdAt',
  rolePermissions: '++id, roleId, permissionId, [roleId+permissionId]',
  sessions: '++id, userId, &token, createdAt, expiresAt, lastAccess',
  accounts: '++id, &code, name, type, active, createdAt, updatedAt',
  accountingEntries: '++id, date, description, referenceType, referenceId, createdAt, [referenceType+referenceId]',

  // --- Membresías ---
  membershipPlans: '++id, &name, active, createdAt, updatedAt',
  memberships: '++id, memberId, planId, startDate, endDate, status, active, createdAt, updatedAt, [status+endDate]',
  membershipHistory: '++id, membershipId, memberId, type, date, notes, createdAt',
  membershipPayments: '++id, membershipId, memberId, amount, method, date, notes, accountingEntryId, createdAt, [memberId+date]',

  // --- Asistencias ---
  attendance: '++id, memberId, date, [memberId+date], createdAt',

  // --- Entrenadores ---
  trainers: '++id, &documentId, name, email, phone, specialty, schedule, active, createdAt, updatedAt',

  // --- Evolución física ---
  physicalEvolutions: '++id, memberId, date, [memberId+date], createdAt',

  // --- Activos del gimnasio ---
  gymAssets: '++id, &code, name, type, serial, brand, model, warrantyUntil, purchaseDate, purchasePrice, status, location, responsible, photos, manual, notes, createdAt, updatedAt',
  maintenance: '++id, assetId, type, date, cost, description, nextDate, status, createdAt, updatedAt, [assetId+date]'
})

db.version(2).stores({
  members: '++id, &documentId, name, email, phone, photo, physicalGoal, assignedTrainerId, joinDate, membershipId, status, active, createdAt, updatedAt'
}).upgrade(async (tx) => {
  const customers = await tx.table('customers').toArray()
  for (const c of customers) {
    const { id, ...rest } = c
    await tx.table('members').add({
      ...rest,
      photo: '',
      physicalGoal: '',
      assignedTrainerId: null,
      joinDate: c.createdAt ? c.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
      membershipId: null,
      status: c.active ? 'active' : 'inactive'
    })
  }
})
