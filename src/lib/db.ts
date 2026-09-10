import fs from 'fs'
import path from 'path'

export interface InitialQcReport {
  completedAt: string
  inspector: string
  faults: string[]
  notes: string
}

export interface AfterFixQcReport {
  completedAt: string
  inspector: string
  verifiedFixedFaults: string[]
  unfixedFaults: string[]
  newFaults?: string
  status: 'PASSED' | 'FAILED_RETRY' | 'FAILED_INHOUSE'
  rawCostAed?: number
  repairCostAed?: number
  chargebackAmountAed?: number
  notes?: string
}

export interface Device {
  id: string
  imei: string
  model: string
  storage: string
  color: string
  status: 'RAW_STOCK' | 'RAW_QC_DONE' | 'AT_REPAIR' | 'AFTER_FIX_QC' | 'IN_QC' | 'QC_FAILED_RETRY' | 'MASTER_CHECK_PENDING' | 'MASTER_CHECK_APPROVED' | 'IN_STOCK' | 'SOLD'
  faults: string
  housing: string
  backGlass: string
  displayMsg: string
  batteryMsg: string
  battery: string
  lcd: string
  nfc: string
  faceId: string
  frontCamera: string
  backCamera: string
  flex: string
  sensor: string
  board: string
  flashlight: string
  frontSpeaker: string
  costAed: number
  repairCostAed?: number
  sellingPriceAed: number
  notes: string
  intakeAt: string
  saleId: string | null
  qcFailCount?: number
  qcStatus?: 'PENDING' | 'PASSED' | 'FAILED_1' | 'FAILED_2' | null
  qcNotes?: string
  masterCheckApprovedAt?: string | null
  masterCheckApprovedBy?: string | null
  initialQcReport?: InitialQcReport | null
  afterFixQcReport?: AfterFixQcReport | null
  isReRepair?: boolean
  reRepairNotes?: string
  reRepairSentAt?: string
}

export interface SaleItem {
  deviceId: string
  imei: string
  model: string
  storage: string
  color: string
  sellingPriceAed: number
}

export interface Sale {
  id: string
  invoiceNumber: string
  customerName: string
  customerPhone: string
  paymentMethod: string
  paymentTermType: 'CASH' | 'CREDIT'
  creditDueDate: string | null
  sellingPriceAed: number
  soldAt: string
  deviceId: string
  imei: string
  model: string
  items?: SaleItem[]
  notes: string
}

export interface Client {
  name: string
  phone: string
  address?: string
  notes?: string
  createdAt: string
  totalInvoicesCount?: number
  totalBilledAed?: number
  creditDueAed?: number
  sales?: Sale[]
}

export interface RefurbCenter {
  id: string
  name: string
  contact: string
  address: string
  notes: string
  createdAt: string
  totalPayableAed?: number
  totalPaidAed?: number
  unpaidBalanceAed?: number
}

export interface RefurbTransaction {
  id: string
  refurbCenterId: string
  refurbCenterName: string
  type: 'REPAIR_FEE' | 'CHARGEBACK_DEDUCTION' | 'PAYMENT_MADE'
  amountAed: number
  deviceId?: string
  imei?: string
  batchId?: string
  batchNumber?: string
  notes: string
  createdAt: string
}

export interface BatchDevice {
  deviceId: string
  imei: string
  model: string
  storage: string
  color: string
  faults: string
  repairCostAed: number
  repairNotes: string
  returned: boolean
  returnedAt: string | null
  isReRepair?: boolean
  reRepairNotes?: string
  reRepairSentAt?: string
}

export interface Batch {
  id: string
  batchNumber: string
  refurbCenterId: string
  refurbCenterName: string
  devices: BatchDevice[]
  status: 'SENT' | 'IN_REPAIR' | 'PARTIALLY_RETURNED' | 'RETURNED'
  sentAt: string
  returnedAt: string | null
  totalRepairCostAed: number
  invoiceNumber: string
  invoiceDate: string
  invoiceNotes: string
  notes: string
}

export interface Db {
  devices: Device[]
  sales: Sale[]
  clients: Client[]
  nextInvoiceNum: number
  refurbCenters: RefurbCenter[]
  batches: Batch[]
  refurbTransactions?: RefurbTransaction[]
  nextBatchNum: number
}

const DB_PATH = path.join(process.cwd(), 'data', 'db.json')

export function getDb(): Db {
  const raw = fs.readFileSync(DB_PATH, 'utf8')
  const data = JSON.parse(raw)
  if (!data.refurbTransactions) data.refurbTransactions = []
  return data
}

export function saveDb(db: Db): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}
