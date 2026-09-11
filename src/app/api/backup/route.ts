import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export async function POST() {
  try {
    const db = getDb()
    const now = new Date()
    const timestampStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const backupFileName = `db_backup_${timestampStr}.json`

    let backupDir = '/var/www/aquacell_backups'
    if (!fs.existsSync('/var/www')) {
      backupDir = path.join(process.cwd(), 'data', 'backups')
    }

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    const backupFilePath = path.join(backupDir, backupFileName)
    fs.writeFileSync(backupFilePath, JSON.stringify(db, null, 2), 'utf-8')

    const stats = {
      ok: true,
      timestamp: now.toISOString(),
      backupFileName,
      backupFilePath,
      devicesCount: Array.isArray(db.devices) ? db.devices.length : 0,
      salesCount: Array.isArray(db.sales) ? db.sales.length : 0,
      batchesCount: Array.isArray(db.batches) ? db.batches.length : 0,
      clientsCount: Array.isArray(db.clients) ? db.clients.length : 0,
    }

    return NextResponse.json(stats)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Backup failed' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const db = getDb()
    const nowStr = new Date().toISOString().slice(0, 10)
    const fileName = `AQUA_CELL_DB_Backup_${nowStr}.json`
    const jsonStr = JSON.stringify(db, null, 2)

    return new NextResponse(jsonStr, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to download backup' }, { status: 500 })
  }
}
