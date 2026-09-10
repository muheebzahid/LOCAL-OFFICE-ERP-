import { NextRequest, NextResponse } from 'next/server'
import { getDb, saveDb } from '@/lib/db'
import type { Sale } from '@/lib/db'

export async function GET() {
  const db = getDb()
  return NextResponse.json(db.sales)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const db = getDb()

  const itemsInput: Array<{ deviceId: string; sellingPriceAed?: number }> = body.items || []

  // Fallback for single device payload
  if (itemsInput.length === 0 && body.deviceId) {
    itemsInput.push({ deviceId: body.deviceId, sellingPriceAed: Number(body.sellingPriceAed) || 0 })
  }

  if (itemsInput.length === 0) {
    return NextResponse.json({ error: 'Select at least one device to generate an invoice' }, { status: 400 })
  }

  const invoiceNum = String(db.nextInvoiceNum).padStart(4, '0')
  const invoiceNumber = `INV-WS-${new Date().getFullYear()}-${invoiceNum}`
  db.nextInvoiceNum += 1

  const paymentTermType: 'CASH' | 'CREDIT' = body.paymentTermType === 'CREDIT' ? 'CREDIT' : 'CASH'
  let paymentMethod = 'Cash'
  if (paymentTermType === 'CREDIT') {
    const d = body.creditDueDate || ''
    const parts = d.split('-')
    const formatted = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d
    paymentMethod = `Credit (Due: ${formatted})`
  }

  const saleId = 'sale-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)
  const saleItems: Array<{ deviceId: string; imei: string; model: string; storage: string; color: string; sellingPriceAed: number }> = []
  let totalInvoicePrice = 0

  for (const item of itemsInput) {
    const dev = db.devices.find(d => d.id === item.deviceId)
    if (!dev) continue
    if (dev.status === 'SOLD') continue

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

    // Mark device as SOLD in database
    const dIdx = db.devices.findIndex(d => d.id === dev.id)
    if (dIdx !== -1) {
      db.devices[dIdx].status = 'SOLD'
      db.devices[dIdx].sellingPriceAed = itemPrice
      db.devices[dIdx].saleId = saleId
    }
  }

  if (saleItems.length === 0) {
    return NextResponse.json({ error: 'No valid (unsold) devices selected for invoice' }, { status: 400 })
  }

  const primaryItem = saleItems[0]

  const sale: Sale = {
    id: saleId,
    invoiceNumber,
    customerName: body.customerName || 'Walk-in Customer',
    customerPhone: body.customerPhone || '',
    paymentMethod,
    paymentTermType,
    creditDueDate: paymentTermType === 'CREDIT' ? (body.creditDueDate || null) : null,
    sellingPriceAed: totalInvoicePrice,
    soldAt: new Date().toISOString(),
    deviceId: primaryItem.deviceId,
    imei: saleItems.length === 1 ? primaryItem.imei : `${saleItems.length} Units (${saleItems.map(i => i.imei.slice(-6)).join(', ')})`,
    model: saleItems.length === 1 ? primaryItem.model : `${saleItems.length} Units (${Array.from(new Set(saleItems.map(i => i.model))).join(', ')})`,
    items: saleItems,
    notes: body.notes || '',
  }

  db.sales.unshift(sale)

  // Upsert client account
  if (body.customerName && !db.clients.find(c => c.name.trim().toLowerCase() === body.customerName.trim().toLowerCase())) {
    db.clients.push({ name: body.customerName.trim(), phone: body.customerPhone || '', createdAt: sale.soldAt })
  }

  saveDb(db)
  return NextResponse.json({ sale, devices: db.devices })
}
