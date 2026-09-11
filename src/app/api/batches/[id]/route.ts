import { NextRequest, NextResponse } from 'next/server'
import { getDb, saveDb } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const db = getDb()
  if (!db.batches) db.batches = []

  const bIdx = db.batches.findIndex(b => b.id === id)
  if (bIdx === -1) return NextResponse.json({ error: 'Batch not found' }, { status: 404 })

  const batch = db.batches[bIdx]

  if (body.batchNumber !== undefined && body.batchNumber.trim()) batch.batchNumber = body.batchNumber.trim()
  if (body.invoiceNumber !== undefined) batch.invoiceNumber = body.invoiceNumber
  if (body.invoiceDate !== undefined) batch.invoiceDate = body.invoiceDate
  if (body.invoiceNotes !== undefined) batch.invoiceNotes = body.invoiceNotes
  if (body.notes !== undefined) batch.notes = body.notes
  // Support adding devices to an existing batch
  if (body.addDeviceIds && Array.isArray(body.addDeviceIds)) {
    for (const did of body.addDeviceIds) {
      const dev = db.devices.find(d => d.id === did || d.imei === did)
      if (!dev) continue
      if (!batch.devices.some(bd => bd.deviceId === dev.id)) {
        batch.devices.push({
          deviceId: dev.id,
          imei: dev.imei,
          model: dev.model,
          storage: dev.storage,
          color: dev.color,
          faults: dev.faults,
          repairCostAed: 0,
          repairNotes: '',
          returned: false,
          returnedAt: null
        })
      }
      const dIdx = db.devices.findIndex(d => d.id === dev.id)
      if (dIdx !== -1) {
        db.devices[dIdx].status = 'AT_REPAIR'
      }
    }
  }

  if (body.deviceUpdates && Array.isArray(body.deviceUpdates)) {
    for (const upd of body.deviceUpdates) {
      const dev = batch.devices.find(d => d.deviceId === upd.deviceId)
      if (!dev) continue
      if (upd.repairCostAed !== undefined) dev.repairCostAed = Number(upd.repairCostAed) || 0
      if (upd.repairNotes !== undefined) dev.repairNotes = upd.repairNotes
      if (upd.faults !== undefined) {
        dev.faults = upd.faults
        const dIdx = db.devices.findIndex(d => d.id === upd.deviceId)
        if (dIdx !== -1) db.devices[dIdx].faults = upd.faults
      }
    }
  }

  // Return devices back into QC section (IN_QC)
  if (body.returnDeviceIds && Array.isArray(body.returnDeviceIds)) {
    for (const did of body.returnDeviceIds) {
      const bDev = batch.devices.find(d => d.deviceId === did)
      if (!bDev || bDev.returned) continue
      bDev.returned = true
      bDev.returnedAt = new Date().toISOString()
      const dIdx = db.devices.findIndex(d => d.id === did)
      if (dIdx !== -1) {
        db.devices[dIdx].status = 'AFTER_FIX_QC'
        db.devices[dIdx].qcStatus = 'PENDING'
      }
    }
  }

  // Support Scan to Return single IMEI
  if (body.scanReturnImei && typeof body.scanReturnImei === 'string') {
    const q = body.scanReturnImei.trim().toLowerCase()
    const bDev = batch.devices.find(d => d.imei.toLowerCase() === q || d.imei.toLowerCase().endsWith(q))
    if (bDev) {
      if (!bDev.returned) {
        bDev.returned = true
        bDev.returnedAt = new Date().toISOString()
        const dIdx = db.devices.findIndex(d => d.id === bDev.deviceId)
        if (dIdx !== -1) {
          db.devices[dIdx].status = 'AFTER_FIX_QC'
          db.devices[dIdx].qcStatus = 'PENDING'
        }
      }
    } else {
      return NextResponse.json({ error: `IMEI "${body.scanReturnImei}" not found in this batch.` }, { status: 400 })
    }
  }

  // Support Revert Return (moving device back into AT_REPAIR / Re-repair in Batch)
  if (body.revertReturnDeviceId && typeof body.revertReturnDeviceId === 'string') {
    const bDev = batch.devices.find(d => d.deviceId === body.revertReturnDeviceId)
    if (bDev) {
      bDev.returned = false
      bDev.returnedAt = null
      if (body.isReRepair !== undefined) bDev.isReRepair = Boolean(body.isReRepair)
      if (body.reRepairNotes !== undefined) bDev.reRepairNotes = String(body.reRepairNotes || '')
      bDev.reRepairSentAt = new Date().toISOString()
      const dIdx = db.devices.findIndex(d => d.id === body.revertReturnDeviceId)
      if (dIdx !== -1) {
        db.devices[dIdx].status = 'AT_REPAIR'
        db.devices[dIdx].qcStatus = undefined
        if (body.isReRepair !== undefined) db.devices[dIdx].isReRepair = Boolean(body.isReRepair)
        if (body.reRepairNotes !== undefined) db.devices[dIdx].reRepairNotes = String(body.reRepairNotes || '')
        db.devices[dIdx].reRepairSentAt = bDev.reRepairSentAt
      }
    }
  }

  if (body.updateReRepair && typeof body.updateReRepair === 'object') {
    const { deviceId, isReRepair, reRepairNotes } = body.updateReRepair
    const bDev = batch.devices.find(d => d.deviceId === deviceId)
    if (bDev) {
      if (isReRepair !== undefined) bDev.isReRepair = Boolean(isReRepair)
      if (reRepairNotes !== undefined) bDev.reRepairNotes = String(reRepairNotes || '')
      const dIdx = db.devices.findIndex(d => d.id === deviceId)
      if (dIdx !== -1) {
        if (isReRepair !== undefined) db.devices[dIdx].isReRepair = Boolean(isReRepair)
        if (reRepairNotes !== undefined) db.devices[dIdx].reRepairNotes = String(reRepairNotes || '')
      }
    }
  }

  if (body.revertReturnDeviceIds && Array.isArray(body.revertReturnDeviceIds)) {
    for (const did of body.revertReturnDeviceIds) {
      const bDev = batch.devices.find(d => d.deviceId === did)
      if (!bDev || !bDev.returned) continue
      bDev.returned = false
      bDev.returnedAt = null
      const dIdx = db.devices.findIndex(d => d.id === did)
      if (dIdx !== -1) {
        db.devices[dIdx].status = 'AT_REPAIR'
        db.devices[dIdx].qcStatus = undefined
      }
    }
  }

  batch.totalRepairCostAed = batch.devices.reduce((sum, d) => sum + (d.repairCostAed || 0), 0)

  const returnedCount = batch.devices.filter(d => d.returned).length
  if (returnedCount === batch.devices.length && returnedCount > 0) {
    batch.status = 'RETURNED'
    batch.returnedAt = batch.returnedAt || new Date().toISOString()
  } else if (returnedCount > 0) {
    batch.status = 'PARTIALLY_RETURNED'
  } else if (batch.status === 'RETURNED') {
    batch.status = 'IN_REPAIR'
  }

  db.batches[bIdx] = batch
  saveDb(db)
  return NextResponse.json({ batch, devices: db.devices })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  if (!db.batches) db.batches = []

  const batch = db.batches.find(b => b.id === id)
  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 })

  // Revert any devices in this batch that are AT_REPAIR back to IN_STOCK
  for (const bDev of batch.devices) {
    const dIdx = db.devices.findIndex(d => d.id === bDev.deviceId)
    if (dIdx !== -1 && db.devices[dIdx].status === 'AT_REPAIR') {
      db.devices[dIdx].status = 'IN_STOCK'
    }
  }

  db.batches = db.batches.filter(b => b.id !== id)
  saveDb(db)
  return NextResponse.json({ ok: true, batches: db.batches, devices: db.devices })
}

