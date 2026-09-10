import { NextRequest, NextResponse } from 'next/server'
import { getDb, saveDb } from '@/lib/db'
import type { Client } from '@/lib/db'

export async function GET() {
  const db = getDb()
  const clients = db.clients || []
  const sales = db.sales || []

  // Compute enriched metrics for each client
  const enrichedClients = clients.map(client => {
    const clientSales = sales.filter(s => s.customerName.trim().toLowerCase() === client.name.trim().toLowerCase())
    const totalBilledAed = clientSales.reduce((sum, s) => sum + (s.sellingPriceAed || 0), 0)
    const creditSales = clientSales.filter(s => s.paymentTermType === 'CREDIT')
    const creditDueAed = creditSales.reduce((sum, s) => sum + (s.sellingPriceAed || 0), 0)

    return {
      ...client,
      totalInvoicesCount: clientSales.length,
      totalBilledAed,
      creditDueAed,
      sales: clientSales
    }
  })

  return NextResponse.json({ clients: enrichedClients })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const db = getDb()
  if (!db.clients) db.clients = []

  const name = (body.name || '').trim()
  if (!name) {
    return NextResponse.json({ error: 'Client name is required' }, { status: 400 })
  }

  const existing = db.clients.find(c => c.name.trim().toLowerCase() === name.toLowerCase())
  if (existing) {
    return NextResponse.json({ error: `Client "${name}" already exists` }, { status: 400 })
  }

  const client: Client = {
    name,
    phone: body.phone || '',
    createdAt: new Date().toISOString(),
  }

  db.clients.push(client)
  saveDb(db)
  return NextResponse.json({ client, clients: db.clients })
}
