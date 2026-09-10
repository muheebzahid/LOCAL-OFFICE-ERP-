import { NextRequest, NextResponse } from 'next/server'
import { getDb, saveDb } from '@/lib/db'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const sIdx = db.sales.findIndex(s => s.id === id)
  if (sIdx === -1) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  const sale = db.sales[sIdx]
  const deviceIdsToRevert: string[] = []

  if (sale.items && sale.items.length > 0) {
    for (const item of sale.items) {
      if (item.deviceId) deviceIdsToRevert.push(item.deviceId)
    }
  } else if (sale.deviceId) {
    deviceIdsToRevert.push(sale.deviceId)
  }

  // Revert all units back to IN_STOCK (Ready to Sell stock)
  for (const did of deviceIdsToRevert) {
    const dIdx = db.devices.findIndex(d => d.id === did)
    if (dIdx !== -1) {
      db.devices[dIdx].status = 'IN_STOCK'
      db.devices[dIdx].saleId = null
      db.devices[dIdx].sellingPriceAed = 0
    }
  }

  // Remove sale record
  db.sales.splice(sIdx, 1)
  saveDb(db)

  return NextResponse.json({ ok: true, devices: db.devices, sales: db.sales })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const db = getDb()
  const sIdx = db.sales.findIndex(s => s.id === id)
  if (sIdx === -1) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  const sale = db.sales[sIdx]
  const newItemsInput: Array<{ deviceId: string; sellingPriceAed?: number }> = body.items || []

  // If no items passed, keep existing or fallback
  if (newItemsInput.length === 0 && body.deviceId) {
    newItemsInput.push({ deviceId: body.deviceId, sellingPriceAed: Number(body.sellingPriceAed) || 0 })
  }

  const oldDeviceIds = (sale.items || [{ deviceId: sale.deviceId }]).map(i => i.deviceId).filter(Boolean)
  const newDeviceIds = newItemsInput.map(i => i.deviceId).filter(Boolean)

  // Revert devices removed from invoice back to IN_STOCK
  const removedDeviceIds = oldDeviceIds.filter(did => !newDeviceIds.includes(did))
  for (const did of removedDeviceIds) {
    const dIdx = db.devices.findIndex(d => d.id === did)
    if (dIdx !== -1) {
      db.devices[dIdx].status = 'IN_STOCK'
      db.devices[dIdx].saleId = null
      db.devices[dIdx].sellingPriceAed = 0
    }
  }

  // Build new items list & mark devices as SOLD
  const saleItems: Array<{ deviceId: string; imei: string; model: string; storage: string; color: string; sellingPriceAed: number }> = []
  let totalInvoicePrice = 0

  for (const item of newItemsInput) {
    const dev = db.devices.find(d => d.id === item.deviceId)
    if (!dev) continue

    const itemPrice = item.sellingPriceAed !== undefined ? Number(item.sellingPriceAed) : (dev.sellingPriceAed || dev.costAed || 0)
    totalInvoicePrice += itemPrice

    saleItems.push({
      deviceId: dev.id,
      imei: dev.imei,
      model: dev.model,
      storage: dev.storage,
      color: dev.color,
      sellingPriceAed: itemPrice
    })

    const dIdx = db.devices.findIndex(d => d.id === dev.id)
    if (dIdx !== -1) {
      db.devices[dIdx].status = 'SOLD'
      db.devices[dIdx].sellingPriceAed = itemPrice
      db.devices[dIdx].saleId = sale.id
    }
  }

  if (saleItems.length === 0) {
    return NextResponse.json({ error: 'Invoice must contain at least one valid device' }, { status: 400 })
  }

  const paymentTermType: 'CASH' | 'CREDIT' = (body.paymentTermType || sale.paymentTermType) === 'CREDIT' ? 'CREDIT' : 'CASH'
  let paymentMethod = 'Cash'
  if (paymentTermType === 'CREDIT') {
    const d = body.creditDueDate || sale.creditDueDate || ''
    const parts = d.split('-')
    const formatted = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d
    paymentMethod = `Credit (Due: ${formatted})`
  }

  const primaryItem = saleItems[0]

  sale.customerName = body.customerName !== undefined ? body.customerName : sale.customerName
  sale.customerPhone = body.customerPhone !== undefined ? body.customerPhone : sale.customerPhone
  sale.paymentMethod = paymentMethod
  sale.paymentTermType = paymentTermType
  sale.creditDueDate = paymentTermType === 'CREDIT' ? (body.creditDueDate || sale.creditDueDate) : null
  sale.sellingPriceAed = totalInvoicePrice
  sale.deviceId = primaryItem.deviceId
  sale.imei = saleItems.length === 1 ? primaryItem.imei : `${saleItems.length} Units (${saleItems.map(i => i.imei.slice(-6)).join(', ')})`
  sale.model = saleItems.length === 1 ? primaryItem.model : `${saleItems.length} Units (${Array.from(new Set(saleItems.map(i => i.model))).join(', ')})`
  sale.items = saleItems
  if (body.notes !== undefined) sale.notes = body.notes

  db.sales[sIdx] = sale
  saveDb(db)

  return NextResponse.json({ sale, devices: db.devices, sales: db.sales })
}
