import { NextRequest, NextResponse } from 'next/server'
import { getDb, saveDb, Device } from '@/lib/db'

function autoExtractDiagnostics(faultsText: string) {
  const text = (faultsText || '').toUpperCase()

  let housing = ''
  let backGlass = ''
  let displayMsg = ''
  let batteryMsg = ''
  let battery = ''
  let lcd = ''
  let nfc = ''
  let faceId = ''
  let frontCamera = ''
  let backCamera = ''
  let flex = ''
  let sensor = ''
  let board = ''
  let flashlight = ''
  let frontSpeaker = ''

  if (text.includes('HOUSING')) housing = 'HOUSING'
  if (text.includes('BACK GLASS') || text.includes('BACKGLASS')) backGlass = 'BACK GLASS'
  else if (text.includes('GLASS')) backGlass = 'GLASS'

  if (text.includes('DISPLAY MSG') || text.includes('DIS MSG') || text.includes('DISPLAY UNKNOWN')) {
    displayMsg = text.includes('GENUINE') ? 'GENUINE' : (text.includes('UNKNOWN') ? 'UNKNOWN' : 'DISPLAY MSG')
  }

  if (text.includes('BATTERY MSG') || text.includes('BAT MSG')) {
    batteryMsg = text.includes('GENUINE') ? 'GENUINE' : (text.includes('UNKNOWN') ? 'UNKNOWN' : 'BATTERY MSG')
  }

  if (text.includes('NO BATTERY')) battery = 'NO BATTERY'
  else if (text.includes('BATTERY CELL')) battery = 'BATTERY CELL'
  else if (text.includes('BATTERY')) battery = 'BATTERY'

  if (text.includes('LCD STRIP')) lcd = 'LCD STRIP'
  else if (text.includes('LCD DEMAGE') || text.includes('LCD DAMAGE') || text.includes('LCD CHANGE') || text.includes('LCD MISMATCH') || text.includes('LCD')) lcd = 'LCD'

  if (text.includes('NFC')) nfc = 'NFC'
  if (text.includes('FACE ID') || text.includes('FACEID') || text.includes('TRUE DEPTH')) faceId = 'FACE ID'

  if (text.includes('FRONT CAM') || text.includes('FRONT CAMERA')) frontCamera = 'FRONT CAMERA'

  if (text.includes('BACK CAMERA') || text.includes('BACK CAM') || text.includes('CAM DOT') || text.includes('CAMERA LENS') || text.includes('CAMERA COVER') || text.includes('CAMERA UNKNOWN')) {
    backCamera = 'BACK CAMERA'
  } else if (text.includes('CAMERA')) {
    backCamera = 'CAMERA'
  }

  if (text.includes('SPEAKER FLEX')) flex = 'SPEAKER FLEX'
  else if (text.includes('VOLUME FLEX')) flex = 'VOLUME FLEX'
  else if (text.includes('FLEX')) flex = 'FLEX'

  if (text.includes('COMPASS SENSOR') || text.includes('LCD SENSOR') || text.includes('SENSOR')) sensor = 'SENSOR'
  if (text.includes('BOARD PROBLEM') || text.includes('LOGIC BOARD') || text.includes('BOARD')) board = 'BOARD'
  if (text.includes('FLASHLIGHT') || text.includes('FLASH')) flashlight = 'FLASHLIGHT'
  if (text.includes('FRONT SPEAKER') || text.includes('SPEAKER')) frontSpeaker = 'SPEAKER'

  return { housing, backGlass, displayMsg, batteryMsg, battery, lcd, nfc, faceId, frontCamera, backCamera, flex, sensor, board, flashlight, frontSpeaker }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { mode, text } = body // mode: 'append' | 'replace', text: raw TSV/CSV string

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 })
    }

    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)
    if (lines.length === 0) {
      return NextResponse.json({ error: 'Data is empty' }, { status: 400 })
    }

    // Determine delimiter (tab or comma)
    const firstLine = lines[0]
    const delimiter = firstLine.includes('\t') ? '\t' : (firstLine.includes(',') ? ',' : '\t')

    const rawRows = lines.map(line => line.split(delimiter).map(c => c.trim()))

    // Detect if first line is a header
    const firstRowUpper = rawRows[0].map(c => c.toUpperCase())
    const hasHeader = firstRowUpper.includes('MODEL') || firstRowUpper.includes('IMEI') || firstRowUpper.includes('COLOR')

    const headerIndices: Record<string, number> = {}
    if (hasHeader) {
      firstRowUpper.forEach((col, idx) => {
        if (col.includes('MODEL')) headerIndices['model'] = idx
        else if (col.includes('GB') || col.includes('STORAGE')) headerIndices['storage'] = idx
        else if (col.includes('COLOR') || col.includes('COLOUR')) headerIndices['color'] = idx
        else if (col.includes('IMEI')) headerIndices['imei'] = idx
        else if (col.includes('FAULT')) headerIndices['faults'] = idx
        else if (col.includes('HOUSING')) headerIndices['housing'] = idx
        else if (col.includes('BACK GLASS') || col.includes('BACKGLASS')) headerIndices['backGlass'] = idx
        else if (col.includes('DIS MSG') || col.includes('DISPLAY MSG')) headerIndices['displayMsg'] = idx
        else if (col.includes('BAT MSG') || col.includes('BATTERY MSG')) headerIndices['batteryMsg'] = idx
        else if (col === 'BATTERY' || col.includes('BATTERY')) headerIndices['battery'] = idx
        else if (col.includes('LCD')) headerIndices['lcd'] = idx
        else if (col.includes('NFC')) headerIndices['nfc'] = idx
        else if (col.includes('FACE ID') || col.includes('FACEID')) headerIndices['faceId'] = idx
        else if (col.includes('FRONT CAM')) headerIndices['frontCamera'] = idx
        else if (col.includes('BACK CAM') || col.includes('REAR CAM')) headerIndices['backCamera'] = idx
        else if (col.includes('FLEX')) headerIndices['flex'] = idx
        else if (col.includes('SENSOR')) headerIndices['sensor'] = idx
        else if (col.includes('BOARD')) headerIndices['board'] = idx
        else if (col.includes('FLASH')) headerIndices['flashlight'] = idx
        else if (col.includes('SPEAKER')) headerIndices['frontSpeaker'] = idx
        else if (col.includes('OTHER FAULT') || col.includes('OTHER_FAULT')) headerIndices['otherFaults'] = idx
        else if (col.includes('COST')) headerIndices['costAed'] = idx
      })
    }

    const startIdx = hasHeader ? 1 : 0
    const newDevices: Device[] = []

    for (let i = startIdx; i < rawRows.length; i++) {
      const cols = rawRows[i]
      if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue

      function getCol(key: string, defaultIdx: number): string {
        if (hasHeader && headerIndices[key] !== undefined) {
          return cols[headerIndices[key]] || ''
        }
        return cols[defaultIdx] || ''
      }

      const model = getCol('model', 0) || '15 PRO'
      const storage = getCol('storage', 1) || '128GB'
      const color = (getCol('color', 2) || 'BLACK').toUpperCase()
      const imei = getCol('imei', 3)
      let faults = getCol('faults', 4)
      const otherFaults = getCol('otherFaults', 20)
      if (otherFaults) {
        faults = faults ? `${faults}, ${otherFaults}` : otherFaults
      }

      // Auto-extract diagnostic flags from FAULTS if individual columns are empty
      const autoDiags = autoExtractDiagnostics(faults)

      const housing = getCol('housing', 5) || autoDiags.housing
      const backGlass = getCol('backGlass', 6) || autoDiags.backGlass
      const displayMsg = getCol('displayMsg', 7) || autoDiags.displayMsg
      const batteryMsg = getCol('batteryMsg', 8) || autoDiags.batteryMsg
      const battery = getCol('battery', 9) || autoDiags.battery
      const lcd = getCol('lcd', 10) || autoDiags.lcd
      const nfc = getCol('nfc', 11) || autoDiags.nfc
      const faceId = getCol('faceId', 12) || autoDiags.faceId
      const frontCamera = getCol('frontCamera', 13) || autoDiags.frontCamera
      const backCamera = getCol('backCamera', 14) || autoDiags.backCamera
      const flex = getCol('flex', 15) || autoDiags.flex
      const sensor = getCol('sensor', 16) || autoDiags.sensor
      const board = getCol('board', 17) || autoDiags.board
      const flashlight = getCol('flashlight', 18) || autoDiags.flashlight
      const frontSpeaker = getCol('frontSpeaker', 19) || autoDiags.frontSpeaker
      const costAed = Number(getCol('costAed', 21)) || 0

      newDevices.push({
        id: 'dev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7) + '-' + i,
        imei: imei || `NO_IMEI_${i}`,
        model: model,
        storage: storage,
        color: color,
        status: 'RAW_STOCK',
        faults: faults,
        housing: housing,
        backGlass: backGlass,
        displayMsg: displayMsg,
        batteryMsg: batteryMsg,
        battery: battery,
        lcd: lcd,
        nfc: nfc,
        faceId: faceId,
        frontCamera: frontCamera,
        backCamera: backCamera,
        flex: flex,
        sensor: sensor,
        board: board,
        flashlight: flashlight,
        frontSpeaker: frontSpeaker,
        costAed: costAed,
        sellingPriceAed: 0,
        notes: '',
        intakeAt: new Date().toISOString(),
        saleId: null
      })
    }

    const db = getDb()
    const existingImeisSet = new Set(db.devices.map(d => (d.imei || '').trim()).filter(Boolean))
    const seenInImportSet = new Set<string>()

    const validDevicesToImport: Device[] = []
    const skippedDuplicates: string[] = []

    for (const d of newDevices) {
      const cleanImei = (d.imei || '').trim()
      if (cleanImei && !cleanImei.startsWith('NO_IMEI_')) {
        if (existingImeisSet.has(cleanImei) || seenInImportSet.has(cleanImei)) {
          if (!skippedDuplicates.includes(cleanImei)) {
            skippedDuplicates.push(cleanImei)
          }
          // Skip duplicate unit automatically
          continue
        }
        seenInImportSet.add(cleanImei)
      }
      validDevicesToImport.push(d)
    }

    if (validDevicesToImport.length > 0) {
      // Append new valid devices to inventory and save DB
      db.devices = [...validDevicesToImport, ...db.devices]
      saveDb(db)
    }

    return NextResponse.json({
      success: true,
      importedCount: validDevicesToImport.length,
      skippedCount: skippedDuplicates.length,
      skippedImeis: skippedDuplicates,
      totalCount: db.devices.length,
      devices: db.devices
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
