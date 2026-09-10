import { NextRequest, NextResponse } from 'next/server'
import { getDb, saveDb } from '@/lib/db'
import type { RefurbTransaction } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const centerId = searchParams.get('centerId')
  const db = getDb()

  const txs = db.refurbTransactions || []
  const filtered = centerId ? txs.filter(t => t.refurbCenterId === centerId) : txs

  return NextResponse.json({ transactions: filtered, refurbCenters: db.refurbCenters || [] })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const db = getDb()
    const { refurbCenterId, amountAed, notes } = body

    const center = (db.refurbCenters || []).find(c => c.id === refurbCenterId)
    if (!center) return NextResponse.json({ error: 'Refurb Center not found' }, { status: 404 })

    const amount = Number(amountAed) || 0
    if (amount <= 0) return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 })

    if (!db.refurbTransactions) db.refurbTransactions = []

    const tx: RefurbTransaction = {
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      refurbCenterId: center.id,
      refurbCenterName: center.name,
      type: 'PAYMENT_MADE',
      amountAed: amount,
      notes: notes || `Payment recorded to ${center.name}`,
      createdAt: new Date().toISOString()
    }

    db.refurbTransactions.push(tx)

    // Recalculate balances
    const cTxs = db.refurbTransactions.filter(t => t.refurbCenterId === center.id)
    const repairFees = cTxs.filter(t => t.type === 'REPAIR_FEE').reduce((sum, t) => sum + t.amountAed, 0)
    const chargebacks = cTxs.filter(t => t.type === 'CHARGEBACK_DEDUCTION').reduce((sum, t) => sum + t.amountAed, 0)
    const payments = cTxs.filter(t => t.type === 'PAYMENT_MADE').reduce((sum, t) => sum + t.amountAed, 0)

    center.totalPayableAed = Math.max(0, repairFees - chargebacks)
    center.totalPaidAed = payments
    center.unpaidBalanceAed = Math.max(0, center.totalPayableAed - center.totalPaidAed)

    saveDb(db)

    return NextResponse.json({ success: true, transaction: tx, refurbCenters: db.refurbCenters, refurbTransactions: db.refurbTransactions })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error recording payment' }, { status: 500 })
  }
}
