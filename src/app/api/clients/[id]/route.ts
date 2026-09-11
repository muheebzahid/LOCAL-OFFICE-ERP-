import { NextRequest, NextResponse } from 'next/server'
import { getDb, saveDb } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const db = getDb()
  const clientNameKey = decodeURIComponent(id)
  const targetIdx = (db.clients || []).findIndex(c => c.name.trim().toLowerCase() === clientNameKey.trim().toLowerCase())

  if (targetIdx === -1) return NextResponse.json({ error: 'Client account not found' }, { status: 404 })

  const client = db.clients[targetIdx]
  const oldName = client.name

  if (body.name !== undefined && body.name.trim() !== '') {
    client.name = body.name.trim()
    if (oldName.trim().toLowerCase() !== client.name.trim().toLowerCase() && Array.isArray(db.sales)) {
      db.sales.forEach(s => {
        if (s.customerName.trim().toLowerCase() === oldName.trim().toLowerCase()) {
          s.customerName = client.name
        }
      })
    }
  }
  if (body.phone !== undefined) client.phone = body.phone
  if (body.address !== undefined) client.address = body.address
  if (body.notes !== undefined) client.notes = body.notes

  db.clients[targetIdx] = client
  saveDb(db)
  return NextResponse.json({ client, clients: db.clients, sales: db.sales })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const clientNameKey = decodeURIComponent(id)
  db.clients = (db.clients || []).filter(c => c.name.trim().toLowerCase() !== clientNameKey.trim().toLowerCase())
  saveDb(db)
  return NextResponse.json({ ok: true, clients: db.clients })
}
