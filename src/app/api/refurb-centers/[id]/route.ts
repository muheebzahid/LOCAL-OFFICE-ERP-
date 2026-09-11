import { NextRequest, NextResponse } from 'next/server'
import { getDb, saveDb } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const db = getDb()
  const idx = (db.refurbCenters || []).findIndex(c => c.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Refurb center not found' }, { status: 404 })

  const center = db.refurbCenters[idx]
  if (body.name !== undefined) {
    const oldName = center.name
    center.name = body.name || center.name
    if (oldName !== center.name && Array.isArray(db.batches)) {
      db.batches.forEach(b => {
        if (b.refurbCenterId === center.id) b.refurbCenterName = center.name
      })
    }
  }
  if (body.contact !== undefined) center.contact = body.contact
  if (body.address !== undefined) center.address = body.address
  if (body.notes !== undefined) center.notes = body.notes

  db.refurbCenters[idx] = center
  saveDb(db)
  return NextResponse.json({ center, refurbCenters: db.refurbCenters })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  db.refurbCenters = (db.refurbCenters || []).filter(c => c.id !== id)
  saveDb(db)
  return NextResponse.json({ ok: true, refurbCenters: db.refurbCenters })
}
