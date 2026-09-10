import { NextRequest, NextResponse } from 'next/server'
import { getDb, saveDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const db = getDb()

  const { deviceId, passcode, action } = body

  // Simple admin verification check
  const validPasscodes = ['1234', 'admin', '9999', 'aquacell']
  if (!passcode || !validPasscodes.includes(String(passcode).trim().toLowerCase())) {
    return NextResponse.json({ error: 'Invalid Admin Passcode' }, { status: 401 })
  }

  const device = db.devices.find(d => d.id === deviceId)
  if (!device) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 })
  }

  if (action === 'APPROVE') {
    device.status = 'MASTER_CHECK_APPROVED'
    device.masterCheckApprovedAt = new Date().toISOString()
    device.masterCheckApprovedBy = 'Admin'
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  saveDb(db)
  return NextResponse.json({ device, devices: db.devices })
}
