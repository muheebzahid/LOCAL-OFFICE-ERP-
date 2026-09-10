import { NextRequest, NextResponse } from 'next/server'
import { getDb, saveDb } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const db = getDb()
  const idx = db.devices.findIndex(d => d.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (body.imei && body.imei.trim()) {
    const newImei = body.imei.trim()
    const duplicate = db.devices.find(d => d.id !== id && d.imei === newImei)
    if (duplicate) {
      return NextResponse.json(
        { error: `⚠️ Duplicate IMEI Alert! Another device already uses IMEI "${newImei}" (${duplicate.model} - ${duplicate.color}).` },
        { status: 400 }
      )
    }
  }

  db.devices[idx] = { ...db.devices[idx], ...body }
  saveDb(db)
  return NextResponse.json(db.devices[idx])
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const device = db.devices.find(d => d.id === id)
  if (!device) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (device.status === 'SOLD') return NextResponse.json({ error: 'Cannot delete a sold device' }, { status: 400 })
  db.devices = db.devices.filter(d => d.id !== id)
  saveDb(db)
  return NextResponse.json({ ok: true })
}
