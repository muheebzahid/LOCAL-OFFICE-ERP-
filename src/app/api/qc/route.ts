import { NextRequest, NextResponse } from 'next/server'
import { getDb, saveDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const db = getDb()

  const { deviceId, imei, outcome, notes } = body

  let device = db.devices.find(d => d.id === deviceId)
  if (!device && imei) {
    const q = String(imei).trim().toLowerCase()
    device = db.devices.find(d => d.imei.toLowerCase() === q || d.imei.toLowerCase().endsWith(q))
  }

  if (!device) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 })
  }

  if (outcome === 'PASS') {
    device.status = 'IN_STOCK'
    device.qcStatus = 'PASSED'
    if (notes) {
      device.notes = device.notes ? `${device.notes} | QC Pass: ${notes}` : `QC Pass: ${notes}`
    }
  } else if (outcome === 'FAIL') {
    const currentFails = (device.qcFailCount || 0) + 1
    device.qcFailCount = currentFails
    if (notes) {
      device.faults = notes
    }

    if (currentFails === 1) {
      device.status = 'QC_FAILED_RETRY'
      device.qcStatus = 'FAILED_1'
    } else {
      device.status = 'MASTER_CHECK_PENDING'
      device.qcStatus = 'FAILED_2'
    }
  } else {
    return NextResponse.json({ error: 'Invalid outcome. Must be PASS or FAIL.' }, { status: 400 })
  }

  saveDb(db)
  return NextResponse.json({ device, devices: db.devices })
}
