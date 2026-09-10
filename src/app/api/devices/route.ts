import { NextRequest, NextResponse } from 'next/server'
import { getDb, saveDb } from '@/lib/db'
import type { Device } from '@/lib/db'

export async function GET() {
  const db = getDb()
  return NextResponse.json(db.devices)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const db = getDb()

  const imei = (body.imei || '').trim()
  if (imei) {
    const existing = db.devices.find(d => d.imei === imei)
    if (existing) {
      return NextResponse.json(
        { error: `⚠️ Duplicate IMEI Alert! Device with IMEI "${imei}" already exists in inventory (${existing.model} - ${existing.color}).` },
        { status: 400 }
      )
    }
  }

  const device: Device = {
    id: 'dev-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    imei: body.imei || '',
    model: body.model || '',
    storage: body.storage || '128GB',
    color: (body.color || 'BLACK').toUpperCase(),
    status: body.status || 'RAW_STOCK',
    faults: body.faults || '',
    housing: body.housing || '',
    backGlass: body.backGlass || '',
    displayMsg: body.displayMsg || '',
    batteryMsg: body.batteryMsg || '',
    battery: body.battery || '',
    lcd: body.lcd || '',
    nfc: body.nfc || '',
    faceId: body.faceId || '',
    frontCamera: body.frontCamera || '',
    backCamera: body.backCamera || '',
    flex: body.flex || '',
    sensor: body.sensor || '',
    board: body.board || '',
    flashlight: body.flashlight || '',
    frontSpeaker: body.frontSpeaker || '',
    costAed: Number(body.costAed) || 0,
    sellingPriceAed: 0,
    notes: body.notes || '',
    intakeAt: new Date().toISOString(),
    saleId: null,
  }

  db.devices.unshift(device)
  saveDb(db)
  return NextResponse.json(device)
}

export async function DELETE(req: NextRequest) {
  const body = await req.json()
  const ids: string[] = body.ids || []
  if (ids.length === 0) {
    return NextResponse.json({ error: 'No device IDs provided' }, { status: 400 })
  }

  const db = getDb()
  const initialCount = db.devices.length
  // Delete devices that are in the ID list and not sold
  db.devices = db.devices.filter(d => !(ids.includes(d.id) && d.status !== 'SOLD'))
  const deletedCount = initialCount - db.devices.length

  saveDb(db)
  return NextResponse.json({ ok: true, deletedCount, devices: db.devices })
}
