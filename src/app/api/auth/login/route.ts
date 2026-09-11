import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const username = (body.username || '').trim().toLowerCase()
    const password = (body.password || '').trim()

    // 1. Check Super Admin
    if (username === 'admin' && (password === 'aquacell2026' || password === 'admin')) {
      return NextResponse.json({
        ok: true,
        user: {
          username: 'admin',
          name: 'Super Admin',
          role: 'ADMIN'
        }
      })
    }

    // 2. Check Supervisor
    if (username === 'supervisor' && (password === 'super123' || password === 'supervisor')) {
      return NextResponse.json({
        ok: true,
        user: {
          username: 'supervisor',
          name: 'Operations Supervisor',
          role: 'SUPERVISOR'
        }
      })
    }

    // 3. Check Refurb Partner (General)
    if (username === 'refurb' && (password === 'repair123' || password === 'refurb')) {
      return NextResponse.json({
        ok: true,
        user: {
          username: 'refurb',
          name: 'Refurb Technician Workstation',
          role: 'REFURB'
        }
      })
    }

    // 4. Check specific Refurb Center or Batch Number lookup
    const db = getDb()
    const matchCenter = (db.refurbCenters || []).find(c => c.name.trim().toLowerCase() === username || c.id.toLowerCase() === username)
    if (matchCenter && (password === 'repair123' || password === 'refurb' || password === 'aquacell2026')) {
      return NextResponse.json({
        ok: true,
        user: {
          username: matchCenter.name,
          name: `${matchCenter.name} Refurb Workstation`,
          role: 'REFURB',
          centerId: matchCenter.id
        }
      })
    }

    // 5. Batch Number Login
    const matchBatch = (db.batches || []).find(b => b.batchNumber.trim().toLowerCase() === username || b.id.toLowerCase() === username)
    if (matchBatch) {
      return NextResponse.json({
        ok: true,
        user: {
          username: matchBatch.batchNumber,
          name: `Batch ${matchBatch.batchNumber} Workstation`,
          role: 'REFURB',
          batchNumber: matchBatch.batchNumber,
          centerId: matchBatch.refurbCenterId
        }
      })
    }

    return NextResponse.json({ error: 'Invalid credentials. Please check your username/password or batch number.' }, { status: 401 })
  } catch (_err) {
    return NextResponse.json({ error: 'Server error processing login' }, { status: 500 })
  }
}
