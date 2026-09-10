import { NextRequest, NextResponse } from 'next/server'
import { getDb, saveDb } from '@/lib/db'
import type { RefurbCenter } from '@/lib/db'

export async function GET() {
  const db = getDb()
  return NextResponse.json(db.refurbCenters || [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const db = getDb()
  if (!db.refurbCenters) db.refurbCenters = []
  const center: RefurbCenter = {
    id: 'rc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    name: body.name || '',
    contact: body.contact || '',
    address: body.address || '',
    notes: body.notes || '',
    createdAt: new Date().toISOString(),
  }
  db.refurbCenters.push(center)
  saveDb(db)
  return NextResponse.json(center)
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const db = getDb()
  if (!db.refurbCenters) db.refurbCenters = []
  
  const idx = db.refurbCenters.findIndex(c => c.id === body.id)
  if (idx === -1) {
    return NextResponse.json({ error: 'Refurb center not found' }, { status: 404 })
  }

  db.refurbCenters[idx] = {
    ...db.refurbCenters[idx],
    name: body.name !== undefined ? body.name : db.refurbCenters[idx].name,
    contact: body.contact !== undefined ? body.contact : db.refurbCenters[idx].contact,
    address: body.address !== undefined ? body.address : db.refurbCenters[idx].address,
    notes: body.notes !== undefined ? body.notes : db.refurbCenters[idx].notes,
  }

  // Update refurbCenterName in all batches referencing this refurbCenterId
  if (db.batches && body.name) {
    db.batches.forEach(b => {
      if (b.refurbCenterId === body.id) {
        b.refurbCenterName = body.name
      }
    })
  }

  saveDb(db)
  return NextResponse.json({ center: db.refurbCenters[idx], centers: db.refurbCenters, batches: db.batches })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const db = getDb()
  db.refurbCenters = (db.refurbCenters || []).filter(c => c.id !== id)
  saveDb(db)
  return NextResponse.json({ ok: true })
}

