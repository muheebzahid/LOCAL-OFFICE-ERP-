import { NextRequest, NextResponse } from 'next/server'
import { getDb, saveDb } from '@/lib/db'
import type { RefurbTransaction } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const db = getDb()
    const {
      deviceId,
      outcome, // 'PASS' | 'FAIL_RETRY' | 'FAIL_INHOUSE'
      inspector,
      verifiedFixedFaults,
      unfixedFaults,
      newFaults,
      rawCostAed,
      repairCostAed,
      inhouseRepairCostAed,
      notes
    } = body

    const dIdx = db.devices.findIndex(d => d.id === deviceId || d.imei === deviceId)
    if (dIdx === -1) return NextResponse.json({ error: 'Device not found' }, { status: 404 })

    const device = db.devices[dIdx]

    // Find the latest batch this device belonged to (to identify the refurb center)
    const batch = (db.batches || []).find(b => b.devices.some(bd => bd.deviceId === device.id || bd.imei === device.imei))
    const center = batch ? (db.refurbCenters || []).find(c => c.id === batch.refurbCenterId) : null

    if (!db.refurbTransactions) db.refurbTransactions = []

    const verifiedList = Array.isArray(verifiedFixedFaults) ? verifiedFixedFaults : []
    const unfixedList = Array.isArray(unfixedFaults) ? unfixedFaults : []

    device.afterFixQcReport = {
      completedAt: new Date().toISOString(),
      inspector: inspector || 'QC Inspector',
      verifiedFixedFaults: verifiedList,
      unfixedFaults: unfixedList,
      newFaults: newFaults || '',
      status: outcome === 'PASS' ? 'PASSED' : outcome === 'FAIL_INHOUSE' ? 'FAILED_INHOUSE' : 'FAILED_RETRY',
      rawCostAed: Number(rawCostAed) || device.costAed || 0,
      repairCostAed: Number(repairCostAed) || 0,
      chargebackAmountAed: Number(inhouseRepairCostAed) || 0,
      notes: notes || ''
    }

    if (outcome === 'PASS') {
      device.status = 'IN_STOCK' // Ready to Sell
      if (rawCostAed !== undefined) device.costAed = Number(rawCostAed) || device.costAed
      if (repairCostAed !== undefined) device.repairCostAed = Number(repairCostAed) || 0

      // Add Repair Fee Payable to Refurb Center Account
      if (center && (Number(repairCostAed) > 0)) {
        const tx: RefurbTransaction = {
          id: 'tx-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          refurbCenterId: center.id,
          refurbCenterName: center.name,
          type: 'REPAIR_FEE',
          amountAed: Number(repairCostAed),
          deviceId: device.id,
          imei: device.imei,
          batchId: batch?.id,
          batchNumber: batch?.batchNumber,
          notes: `Repair Fee passed in QC — ${device.model} (${device.color}) ${device.imei}`,
          createdAt: new Date().toISOString()
        }
        db.refurbTransactions.push(tx)
      }
    } else if (outcome === 'FAIL_RETRY') {
      device.status = 'AT_REPAIR'
      device.isReRepair = true
      device.reRepairNotes = notes || 'QC Failed — Sent back for Re-Repair'
      device.reRepairSentAt = new Date().toISOString()
      device.qcFailCount = (device.qcFailCount || 0) + 1
      device.faults = [
        ...unfixedList,
        newFaults ? `Additional: ${newFaults}` : ''
      ].filter(Boolean).join(', ') || 'Additional Problem Found'

      if (batch) {
        const bDev = batch.devices.find(bd => bd.deviceId === device.id || bd.imei === device.imei)
        if (bDev) {
          bDev.isReRepair = true
          bDev.reRepairNotes = device.reRepairNotes
          bDev.reRepairSentAt = device.reRepairSentAt
          bDev.returned = false
        }
      }
    } else if (outcome === 'FAIL_INHOUSE') {
      device.status = 'IN_STOCK' // Fixed In-House -> Ready to Sell
      const chargebackFee = Number(inhouseRepairCostAed) || 0

      // Deduct / Chargeback from Refurb Center Account
      if (center && chargebackFee > 0) {
        const tx: RefurbTransaction = {
          id: 'tx-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          refurbCenterId: center.id,
          refurbCenterName: center.name,
          type: 'CHARGEBACK_DEDUCTION',
          amountAed: chargebackFee,
          deviceId: device.id,
          imei: device.imei,
          batchId: batch?.id,
          batchNumber: batch?.batchNumber,
          notes: `In-House Repair Chargeback (QC Failed) — ${device.model} (${device.imei})`,
          createdAt: new Date().toISOString()
        }
        db.refurbTransactions.push(tx)
      }
    }

    // Recalculate Refurb Center Financial Ledgers
    (db.refurbCenters || []).forEach(c => {
      const cTxs = db.refurbTransactions!.filter(t => t.refurbCenterId === c.id)
      const repairFees = cTxs.filter(t => t.type === 'REPAIR_FEE').reduce((sum, t) => sum + t.amountAed, 0)
      const chargebacks = cTxs.filter(t => t.type === 'CHARGEBACK_DEDUCTION').reduce((sum, t) => sum + t.amountAed, 0)
      const payments = cTxs.filter(t => t.type === 'PAYMENT_MADE').reduce((sum, t) => sum + t.amountAed, 0)

      c.totalPayableAed = Math.max(0, repairFees - chargebacks)
      c.totalPaidAed = payments
      c.unpaidBalanceAed = Math.max(0, c.totalPayableAed - c.totalPaidAed)
    })

    db.devices[dIdx] = device
    saveDb(db)

    return NextResponse.json({ success: true, device, devices: db.devices, refurbCenters: db.refurbCenters, refurbTransactions: db.refurbTransactions })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error processing After-Fix QC' }, { status: 500 })
  }
}
