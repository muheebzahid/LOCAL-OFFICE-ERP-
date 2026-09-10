import { NextRequest, NextResponse } from 'next/server'
import { getDb, saveDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const db = getDb()
    const { deviceId, faults, inspector, notes } = body

    const dIdx = db.devices.findIndex(d => d.id === deviceId || d.imei === deviceId)
    if (dIdx === -1) return NextResponse.json({ error: 'Device not found' }, { status: 404 })

    const device = db.devices[dIdx]

    const faultsList = Array.isArray(faults)
      ? faults
      : String(faults || '').split(',').map(s => s.trim()).filter(Boolean)

    device.initialQcReport = {
      completedAt: new Date().toISOString(),
      inspector: inspector || 'Inspector',
      faults: faultsList,
      notes: notes || ''
    }

    device.status = 'RAW_QC_DONE'
    if (faultsList.length > 0) {
      device.faults = faultsList.join(', ')
    }

    db.devices[dIdx] = device
    saveDb(db)

    return NextResponse.json({ success: true, device, devices: db.devices })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error processing initial QC' }, { status: 500 })
  }
}
