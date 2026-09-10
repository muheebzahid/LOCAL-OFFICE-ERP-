import { NextRequest, NextResponse } from 'next/server'
import { getDb, saveDb } from '@/lib/db'
import type { Batch, BatchDevice } from '@/lib/db'

export async function GET() {
  const db = getDb()
  return NextResponse.json(db.batches || [])
}

function buildDeviceFaultSummary(dev: any): string {
  const parts: string[] = []
  if (dev.faults && dev.faults.trim()) {
    parts.push(dev.faults.trim())
  }
  
  const diagKeys = [
    'housing', 'backGlass', 'displayMsg', 'batteryMsg', 'battery',
    'lcd', 'nfc', 'faceId', 'frontCamera', 'backCamera', 'flex',
    'sensor', 'board', 'flashlight', 'frontSpeaker'
  ]
  
  for (const k of diagKeys) {
    const val = String(dev[k] || '').trim()
    if (val && val !== '-' && !parts.includes(val)) {
      parts.push(val)
    }
  }
  
  return parts.join(', ') || 'General Repair / Refurbishment'
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const db = getDb()
  if (!db.batches) db.batches = []
  if (!db.nextBatchNum) db.nextBatchNum = 1

  const center = (db.refurbCenters || []).find(c => c.id === body.refurbCenterId)
  if (!center) return NextResponse.json({ error: 'Refurb center not found' }, { status: 404 })

  const deviceIds: string[] = body.deviceIds || []
  if (deviceIds.length === 0) return NextResponse.json({ error: 'Select at least one device' }, { status: 400 })

  const batchDevices: BatchDevice[] = []
  for (const did of deviceIds) {
    const dev = db.devices.find(d => d.id === did)
    if (!dev) continue
    if (dev.status === 'RAW_STOCK' && !dev.initialQcReport) {
      return NextResponse.json({ error: `Device ${dev.imei} (${dev.model}) has not completed Initial QC. Only stock with completed Initial QC (RAW QC DONE) is eligible for repair dispatch.` }, { status: 400 })
    }
    batchDevices.push({
      deviceId: dev.id,
      imei: dev.imei,
      model: dev.model,
      storage: dev.storage,
      color: dev.color,
      faults: buildDeviceFaultSummary(dev),
      repairCostAed: 0,
      repairNotes: '',
      returned: false,
      returnedAt: null,
    })
    const dIdx = db.devices.findIndex(d => d.id === did)
    db.devices[dIdx].status = 'AT_REPAIR'
  }

  if (batchDevices.length === 0) return NextResponse.json({ error: 'No valid devices selected' }, { status: 400 })

  const maxExistingNum = (db.batches || []).reduce((max, b) => {
    const match = b.batchNumber ? b.batchNumber.match(/\d+$/) : null
    const num = match ? parseInt(match[0], 10) : 0
    return num > max ? num : max
  }, 0)
  const currentBatchNum = Math.max(db.nextBatchNum || 1, maxExistingNum + 1)
  const batchNum = String(currentBatchNum).padStart(4, '0')
  db.nextBatchNum = currentBatchNum + 1

  const batch: Batch = {
    id: 'batch-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
    batchNumber: (body.batchNumber && body.batchNumber.trim()) ? body.batchNumber.trim() : `BATCH-${new Date().getFullYear()}-${batchNum}`,
    refurbCenterId: center.id,
    refurbCenterName: center.name,
    devices: batchDevices,
    status: 'SENT',
    sentAt: new Date().toISOString(),
    returnedAt: null,
    totalRepairCostAed: 0,
    invoiceNumber: body.invoiceNumber || '',
    invoiceDate: body.invoiceDate || '',
    invoiceNotes: body.invoiceNotes || '',
    notes: body.notes || '',
  }

  db.batches.unshift(batch)
  saveDb(db)
  return NextResponse.json({ batch, devices: db.devices })
}
