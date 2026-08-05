const SEED_PRODUCTS = [
  { code: 'SUP-001', name: 'Proteína Whey 1kg', category: 'Suplementos', purchasePrice: 180, salePrice: 250, stock: 15, stockMin: 5 },
  { code: 'SUP-002', name: 'Creatina Monohidratada 300g', category: 'Suplementos', purchasePrice: 120, salePrice: 170, stock: 20, stockMin: 6 },
  { code: 'SUP-003', name: 'BCAAs 240 cápsulas', category: 'Suplementos', purchasePrice: 90, salePrice: 140, stock: 18, stockMin: 5 },
  { code: 'BEB-001', name: 'Bebida Isotónica 500ml', category: 'Bebidas', purchasePrice: 6, salePrice: 12, stock: 80, stockMin: 20 },
  { code: 'BEB-002', name: 'Bebida Energética 355ml', category: 'Bebidas', purchasePrice: 8, salePrice: 15, stock: 60, stockMin: 15 },
  { code: 'ROP-001', name: 'Camiseta Deportiva', category: 'Ropa Deportiva', purchasePrice: 40, salePrice: 75, stock: 25, stockMin: 8 },
  { code: 'ROP-002', name: 'Pantalón Deportivo', category: 'Ropa Deportiva', purchasePrice: 60, salePrice: 110, stock: 15, stockMin: 5 },
  { code: 'ACC-001', name: 'Guantes de Entrenamiento', category: 'Accesorios', purchasePrice: 45, salePrice: 80, stock: 22, stockMin: 6 },
  { code: 'ACC-002', name: 'Toalla Deportiva', category: 'Accesorios', purchasePrice: 20, salePrice: 40, stock: 30, stockMin: 10 },
  { code: 'SNK-001', name: 'Barra de Proteína', category: 'Snacks', purchasePrice: 5, salePrice: 10, stock: 90, stockMin: 25 }
]

const SEED_MEMBERS = [
  { documentId: 'M001', name: 'Juan Pérez', email: 'juan@email.com', phone: '5555-0101', address: 'Av. Principal 123', photo: '', physicalGoal: '', assignedTrainerId: '', joinDate: new Date().toISOString(), membershipId: '', status: 'active' },
  { documentId: 'M002', name: 'María García', email: 'maria@email.com', phone: '5555-0102', address: 'Calle Secundaria 456', photo: '', physicalGoal: '', assignedTrainerId: '', joinDate: new Date().toISOString(), membershipId: '', status: 'active' },
  { documentId: 'M003', name: 'Carlos López', email: 'carlos@email.com', phone: '5555-0103', address: 'Blvd. Central 789', photo: '', physicalGoal: '', assignedTrainerId: '', joinDate: new Date().toISOString(), membershipId: '', status: 'active' },
  { documentId: 'M004', name: 'Ana Martínez', email: 'ana@email.com', phone: '5555-0104', address: 'Plaza Mayor 321', photo: '', physicalGoal: '', assignedTrainerId: '', joinDate: new Date().toISOString(), membershipId: '', status: 'active' },
  { documentId: 'M005', name: 'Pedro Ramírez', email: 'pedro@email.com', phone: '5555-0105', address: 'Calle Los Olivos 654', photo: '', physicalGoal: '', assignedTrainerId: '', joinDate: new Date().toISOString(), membershipId: '', status: 'active' }
]

const SEED_SUPPLIERS = [
  { documentId: 'PROV-001', name: 'Distribuidora Deportiva S.A.', email: 'ventas@deporsup.com', phone: '5555-1001', address: '8a. Calle 10-20, Zona 12' },
  { documentId: 'PROV-002', name: 'Importaciones Fitness, S.A.', email: 'info@fitimport.com', phone: '5555-1002', address: '1a. Avenida 5-30, Zona 10' },
  { documentId: 'PROV-003', name: 'Nutrición Total S.A.', email: 'pedidos@nutritotal.com', phone: '5555-1003', address: '7a. Avenida 15-45, Zona 13' }
]

const SEED_PLANS = [
  { name: 'Básico Mensual', description: 'Acceso al área de pesas y cardio.', durationDays: 30, price: 250, active: true },
  { name: 'Premium Trimestral', description: 'Acceso completo + clases grupales.', durationDays: 90, price: 650, active: true },
  { name: 'Anual', description: 'Acceso completo + clases + nutrición.', durationDays: 365, price: 2200, active: true }
]

const SEED_ACCOUNTS = [
  { code: '1101', name: 'Caja y Bancos', type: 'asset', description: 'Efectivo y cuentas bancarias' },
  { code: '1201', name: 'Inventario', type: 'asset', description: 'Inventario de productos para la venta' },
  { code: '2101', name: 'IVA por Pagar', type: 'liability', description: 'Impuesto al Valor Agregado por pagar' },
  { code: '2102', name: 'Proveedores', type: 'liability', description: 'Obligaciones con proveedores' },
  { code: '3101', name: 'Capital Social', type: 'equity', description: 'Aportes de capital de los socios' },
  { code: '4101', name: 'Ventas', type: 'income', description: 'Ingresos por ventas de productos y membresías' },
  { code: '5101', name: 'Costo de Ventas', type: 'expense', description: 'Costo directo de productos vendidos' }
]

const SEED_SETTINGS = [
  { key: 'business_name', value: 'Gimnasio Open Root Gym' },
  { key: 'business_document', value: '12345678-9' },
  { key: 'business_address', value: '6a. Avenida 1-23, Zona 4' },
  { key: 'business_phone', value: '5555-0000' },
  { key: 'business_email', value: 'info@openrootgym.com' },
  { key: 'tax_rate', value: '0.12' },
  { key: 'currency_symbol', value: 'Q ' }
]

const TAX_RATE = 0.12

function makeDate(daysAgo) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

export async function seedData(db) {
  const productCount = await db.products.count()
  if (productCount > 0) {
    const saleCount = await db.sales.count()
    if (saleCount === 0) {
      const allMembers = await db.members.toArray()
      const allSuppliers = await db.suppliers.toArray()
      const pIds = allProducts.map(p => p.id)
      const mIds = allMembers.map(m => m.id)
      const sIds = allSuppliers.map(s => s.id)
      await seedTransactions(db, pIds, mIds, sIds)
    }
    return
  }

  await db.transaction('rw', db.products, db.members, db.suppliers, db.settings,
    db.inventoryMovements, db.accounts, db.sales, db.saleItems, db.purchases,
    db.purchaseItems, db.accountingEntries, db.membershipPlans, db.memberships,
    db.membershipHistory, db.membershipPayments, db.attendance, db.trainers,
    db.gymAssets, db.maintenance, db.physicalEvolutions, async () => {

    const stockTracker = {}
    const productIds = []
    for (const product of SEED_PRODUCTS) {
      const id = await db.products.add({ ...product, active: true })
      productIds.push(id)
      const stockBefore = 0
      const stockAfter = product.stock
      stockTracker[id] = stockAfter
      await db.inventoryMovements.add({
        productId: id,
        productName: product.name,
        type: 'entry',
        quantity: product.stock,
        stockBefore,
        stockAfter,
        reference: 'initial',
        notes: 'Stock inicial',
        date: makeDate(10)
      })
    }

    const memberIds = []
    for (const member of SEED_MEMBERS) {
      const id = await db.members.add({ ...member, active: true })
      memberIds.push(id)
    }

    const supplierIds = []
    for (const supplier of SEED_SUPPLIERS) {
      const id = await db.suppliers.add(supplier)
      supplierIds.push(id)
    }

    for (const plan of SEED_PLANS) {
      await db.membershipPlans.add(plan)
    }

    const planIds = await db.membershipPlans.toIndexes ? null : (await db.membershipPlans.toArray()).map(p => p.id)
    const planMap = {}
    {
      const allPlans = await db.membershipPlans.toArray()
      for (const p of allPlans) planMap[p.name] = p
    }

    const SEED_MEMBERSHIPS = [
      { memberId: memberIds[0], planId: planMap['Básico Mensual']?.id, startDate: makeDate(25), endDate: makeDate(-5), status: 'active', price: 250, notes: '' },
      { memberId: memberIds[1], planId: planMap['Premium Trimestral']?.id, startDate: makeDate(60), endDate: makeDate(-30), status: 'active', price: 650, notes: '' },
      { memberId: memberIds[2], planId: planMap['Anual']?.id, startDate: makeDate(400), endDate: makeDate(35), status: 'expired', price: 2200, notes: '' },
      { memberId: memberIds[3], planId: planMap['Básico Mensual']?.id, startDate: makeDate(10), endDate: makeDate(-20), status: 'frozen', price: 250, notes: '' },
      { memberId: memberIds[4], planId: planMap['Básico Mensual']?.id, startDate: makeDate(5), endDate: makeDate(-25), status: 'active', price: 250, notes: '' }
    ]

    for (const membership of SEED_MEMBERSHIPS) {
      const { id } = await db.memberships.add(membership)
      await db.membershipHistory.add({
        membershipId: id,
        memberId: membership.memberId,
        type: 'initial',
        date: membership.startDate,
        notes: `Membresía ${membership.status} creada`
      })
    }

    const membershipIds = []
    for (const membership of SEED_MEMBERSHIPS) {
      const found = await db.memberships.where('memberId').equals(membership.memberId).first()
      if (found) membershipIds.push(found)
    }

    const allMemberships = await db.memberships.toArray()
    for (const ms of allMemberships) {
      await db.membershipPayments.add({
        membershipId: ms.id,
        memberId: ms.memberId,
        amount: ms.price,
        method: 'cash',
        date: ms.startDate,
        notes: 'Pago inicial de membresía'
      })
    }

    for (const setting of SEED_SETTINGS) {
      await db.settings.add(setting)
    }

    for (const account of SEED_ACCOUNTS) {
      await db.accounts.add({ ...account, active: true })
    }

    const accounts = {}
    for (const a of SEED_ACCOUNTS) {
      const acc = await db.accounts.where('code').equals(a.code).first()
      accounts[a.code] = acc
    }

    await seedTransactions(db, productIds, memberIds, supplierIds, accounts, stockTracker)
  })
}

async function seedTransactions(db, productIds, memberIds, supplierIds, accounts, stockTracker) {
  if (!stockTracker) {
    stockTracker = {}
    const allProducts = await db.products.toArray()
    for (const p of allProducts) {
      stockTracker[p.id] = p.stock || 0
    }
  }

  if (!accounts) {
    accounts = {}
    const allAccounts = await db.accounts.toArray()
    for (const a of allAccounts) {
      accounts[a.code] = a
    }
  }

  await db.transaction('rw', db.sales, db.saleItems, db.purchases, db.purchaseItems,
    db.inventoryMovements, db.accountingEntries, async () => {

    const PRODUCT_COST = {
      [productIds[0]]: 180,
      [productIds[1]]: 120,
      [productIds[2]]: 90,
      [productIds[3]]: 6,
      [productIds[4]]: 8,
      [productIds[5]]: 40,
      [productIds[6]]: 60,
      [productIds[7]]: 45,
      [productIds[8]]: 20,
      [productIds[9]]: 5
    }

    const saleData = [
      {
        date: makeDate(1),
        customerId: memberIds[0],
        customerName: 'Juan Pérez',
        items: [
          { productId: productIds[0], productCode: 'SUP-001', productName: 'Proteína Whey 1kg', quantity: 2, unitPrice: 250 },
          { productId: productIds[1], productCode: 'SUP-002', productName: 'Creatina Monohidratada 300g', quantity: 1, unitPrice: 170 }
        ]
      },
      {
        date: makeDate(3),
        customerId: memberIds[1],
        customerName: 'María García',
        items: [
          { productId: productIds[5], productCode: 'ROP-001', productName: 'Camiseta Deportiva', quantity: 1, unitPrice: 75 },
          { productId: productIds[7], productCode: 'ACC-001', productName: 'Guantes de Entrenamiento', quantity: 1, unitPrice: 80 }
        ]
      }
    ]

    for (const s of saleData) {
      const subtotal = s.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
      const tax = Math.round(subtotal * TAX_RATE * 100) / 100
      const total = subtotal + tax
      const totalCost = s.items.reduce((sum, i) => sum + (PRODUCT_COST[i.productId] || 0) * i.quantity, 0)

      const saleId = await db.sales.add({
        customerId: s.customerId,
        customerName: s.customerName,
        date: s.date,
        subtotal,
        tax,
        total,
        status: 'completed',
        notes: '',
        createdAt: s.date,
        updatedAt: s.date
      })

      for (let i = 0; i < s.items.length; i++) {
        const item = s.items[i]
        const qty = -item.quantity
        await db.saleItems.add({ ...item, saleId, subtotal: item.quantity * item.unitPrice })
        const stockBefore = stockTracker[item.productId]
        const stockAfter = Math.max(0, stockBefore + qty)
        stockTracker[item.productId] = stockAfter
        await db.inventoryMovements.add({
          productId: item.productId,
          productName: item.productName,
          type: 'sale',
          quantity: qty,
          stockBefore,
          stockAfter,
          reference: 'sale',
          referenceId: saleId,
          notes: `Venta #${saleId}`,
          date: s.date
        })
        await db.products.update(item.productId, { stock: stockAfter })
      }

      await db.accountingEntries.add({
        date: s.date,
        description: `Venta #${saleId}`,
        referenceType: 'sale',
        referenceId: saleId,
        items: [
          { accountId: accounts['1101'].id, accountCode: '1101', accountName: 'Caja y Bancos', debit: total, credit: 0 },
          { accountId: accounts['4101'].id, accountCode: '4101', accountName: 'Ventas', debit: 0, credit: subtotal },
          { accountId: accounts['2101'].id, accountCode: '2101', accountName: 'IVA por Pagar', debit: 0, credit: tax },
          { accountId: accounts['5101'].id, accountCode: '5101', accountName: 'Costo de Ventas', debit: totalCost, credit: 0 },
          { accountId: accounts['1201'].id, accountCode: '1201', accountName: 'Inventario', debit: 0, credit: totalCost }
        ]
      })
    }

    const purchaseData = [
      {
        date: makeDate(5),
        supplierId: supplierIds[0],
        supplierName: 'Distribuidora Deportiva S.A.',
        items: [
          { productId: productIds[0], productCode: 'SUP-001', productName: 'Proteína Whey 1kg', quantity: 10, unitPrice: 180 },
          { productId: productIds[1], productCode: 'SUP-002', productName: 'Creatina Monohidratada 300g', quantity: 15, unitPrice: 120 }
        ]
      },
      {
        date: makeDate(7),
        supplierId: supplierIds[2],
        supplierName: 'Nutrición Total S.A.',
        items: [
          { productId: productIds[2], productCode: 'SUP-003', productName: 'BCAAs 240 cápsulas', quantity: 12, unitPrice: 90 },
          { productId: productIds[9], productCode: 'SNK-001', productName: 'Barra de Proteína', quantity: 40, unitPrice: 5 }
        ]
      }
    ]

    for (const p of purchaseData) {
      const subtotal = p.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
      const tax = Math.round(subtotal * TAX_RATE * 100) / 100
      const total = subtotal + tax

      const purchaseId = await db.purchases.add({
        supplierId: p.supplierId,
        supplierName: p.supplierName,
        date: p.date,
        subtotal,
        tax,
        total,
        status: 'completed',
        notes: '',
        createdAt: p.date,
        updatedAt: p.date
      })

      for (const item of p.items) {
        await db.purchaseItems.add({ ...item, purchaseId, subtotal: item.quantity * item.unitPrice })
        const stockBefore = stockTracker[item.productId]
        const stockAfter = stockBefore + item.quantity
        stockTracker[item.productId] = stockAfter
        await db.inventoryMovements.add({
          productId: item.productId,
          productName: item.productName,
          type: 'purchase',
          quantity: item.quantity,
          stockBefore,
          stockAfter,
          reference: 'purchase',
          referenceId: purchaseId,
          notes: `Compra #${purchaseId}`,
          date: p.date
        })
        await db.products.update(item.productId, { stock: stockAfter })
      }

      await db.accountingEntries.add({
        date: p.date,
        description: `Compra #${purchaseId}`,
        referenceType: 'purchase',
        referenceId: purchaseId,
        items: [
          { accountId: accounts['1201'].id, accountCode: '1201', accountName: 'Inventario', debit: subtotal, credit: 0 },
          { accountId: accounts['2101'].id, accountCode: '2101', accountName: 'IVA por Pagar', debit: tax, credit: 0 },
          { accountId: accounts['2102'].id, accountCode: '2102', accountName: 'Proveedores', debit: 0, credit: total }
        ]
      })
    }
  })
}
