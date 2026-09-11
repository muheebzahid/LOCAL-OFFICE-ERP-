'use client'
import { useState, useEffect, useRef } from 'react'
import {
  Plus, Search, X, Printer, ChevronDown, ChevronUp, Pencil, Trash2, Check,
  AlertCircle, Package, ShoppingCart, Wrench, DollarSign, Download, Building2,
  RotateCcw, FileText, Barcode, ShieldCheck, CheckCircle2, XCircle, Lock, Clock, Tag,
  QrCode, LayoutDashboard, Layers, ShieldAlert, ArrowRight, ArrowLeft, FileSpreadsheet,
  Users, UserPlus
} from 'lucide-react'
import Link from 'next/link'
import type { Device, Sale, RefurbCenter, Batch, BatchDevice, RefurbTransaction, Client } from '@/lib/db'

// Constants & Helpers
function safeStr(val: unknown): string {
  if (val === null || val === undefined) return ''
  return String(val)
}

function safeLower(val: unknown): string {
  return safeStr(val).trim().toLowerCase()
}

const EMPTY_DEVICE: Record<string, string> = {
  imei: '', model: '15 PRO', storage: '128GB', color: 'BLACK', faults: '',
  housing: '', backGlass: '', displayMsg: '', batteryMsg: '', battery: '',
  lcd: '', nfc: '', faceId: '', frontCamera: '', backCamera: '', flex: '',
  sensor: '', board: '', flashlight: '', frontSpeaker: '', costAed: '', notes: ''
}

const MODELS = ['15 PRO', '15 PRO MAX', '15', '15 PLUS', '14 PRO', '14 PRO MAX', '14', '13 PRO', '13 PRO MAX', '13', '12 PRO', '12']
const STORAGES = ['128GB', '256GB', '512GB', '1TB']
const COLORS = ['BLACK', 'NATURAL', 'BLUE', 'WHITE', 'YELLOW', 'GREEN', 'PINK', 'RED']

const DIAG_FIELDS = [
  'HOUSING', 'BACK GLASS', 'DISPLAY MSG', 'BATTERY MSG', 'BATTERY',
  'LCD', 'NFC', 'FACE ID', 'FRONT CAMERA', 'BACK CAMERA', 'FLEX',
  'SENSOR', 'BOARD', 'FLASHLIGHT', 'FRONT SPEAKER'
]

const COL_HEADS = [
  { key: 'model', label: 'Model' }, { key: 'storage', label: 'GB' }, { key: 'color', label: 'Color' },
  { key: 'imei', label: 'IMEI' }, { key: 'faults', label: 'Faults' }, { key: 'status', label: 'Status' },
  { key: 'costAed', label: 'Cost (AED)' }, { key: 'sellingPriceAed', label: 'Sale (AED)' },
]

function SBadge({ s }: { s: string }) {
  if (s === 'RAW_STOCK') return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">📦 RAW STOCK</span>
  if (s === 'RAW_QC_DONE') return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">📋 RAW QC DONE</span>
  if (s === 'SOLD') return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">SOLD</span>
  if (s === 'AT_REPAIR') return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">AT REPAIR</span>
  if (s === 'AFTER_FIX_QC' || s === 'IN_QC') return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">🔍 AFTER-FIX QC</span>
  if (s === 'QC_FAILED_RETRY') return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">🔴 QC FAILED (RETRY)</span>
  if (s === 'MASTER_CHECK_PENDING') return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-extrabold bg-red-900 text-white">🔒 MASTER CHECK</span>
  if (s === 'MASTER_CHECK_APPROVED') return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-300">🛡️ APPROVED</span>
  return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">READY TO SELL</span>
}

function LiveBatchTimer({ sentAt }: { sentAt: string }) {
  const [elapsed, setElapsed] = useState('')
  useEffect(() => {
    function calc() {
      const diff = Math.max(0, Date.now() - new Date(sentAt).getTime())
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const mins = Math.floor((diff / (1000 * 60)) % 60)
      const secs = Math.floor((diff / 1000) % 60)
      setElapsed(`${days > 0 ? days + 'd ' : ''}${hours}h ${mins}m ${secs}s`)
    }
    calc()
    const timer = setInterval(calc, 1000)
    return () => clearInterval(timer)
  }, [sentAt])
  return (
    <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
      <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
      {elapsed} elapsed
    </span>
  )
}

function LiveUnitTimer({ sentAt }: { sentAt: string }) {
  const [elapsed, setElapsed] = useState('')
  useEffect(() => {
    function calc() {
      if (!sentAt) return
      const diff = Math.max(0, Date.now() - new Date(sentAt).getTime())
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const mins = Math.floor((diff / (1000 * 60)) % 60)
      const secs = Math.floor((diff / 1000) % 60)
      setElapsed(`${days > 0 ? days + 'd ' : ''}${hours}h ${mins}m ${secs}s`)
    }
    calc()
    const timer = setInterval(calc, 1000)
    return () => clearInterval(timer)
  }, [sentAt])
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-black text-amber-200 bg-black/60 px-1.5 py-0.5 rounded border border-red-400 shrink-0 shadow-xs">
      <Clock className="w-3 h-3 text-yellow-400 animate-pulse" />
      {elapsed || '0m 00s'}
    </span>
  )
}

export interface UserSession {
  username: string
  name: string
  role: 'ADMIN' | 'SUPERVISOR' | 'REFURB'
  centerId?: string
  batchNumber?: string
}

export default function InventoryDashboardPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null)
  const [backingUp, setBackingUp] = useState(false)

  async function triggerBackupAndDownload() {
    setBackingUp(true)
    try {
      const res = await fetch('/api/backup', { method: 'POST' })
      const stats = await res.json()
      setBackingUp(false)
      if (res.ok && stats.ok) {
        showToast(`💾 Server Backup Saved! (${stats.devicesCount} devices, ${stats.salesCount} sales, ${stats.batchesCount} batches)`)
        const link = document.createElement('a')
        link.href = '/api/backup'
        link.download = `AQUA_CELL_DB_Backup_${new Date().toISOString().slice(0, 10)}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        showToast(stats.error || 'Failed to create backup', false)
      }
    } catch (_err) {
      setBackingUp(false)
      showToast('Failed to trigger backup', false)
    }
  }
  const [authInitialized, setAuthInitialized] = useState(false)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginErr, setLoginErr] = useState('')
  const [authenticating, setAuthenticating] = useState(false)

  const [devices, setDevices] = useState<Device[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [centers, setCenters] = useState<RefurbCenter[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [transactions, setTransactions] = useState<RefurbTransaction[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  // Module Tab State
  type TabType = 'dashboard' | 'inventory' | 'batches' | 'afterFixQc' | 'readyToSell' | 'masterCheck' | 'accounts' | 'centers' | 'sales' | 'clients'
  const [tab, setTab] = useState<TabType>('dashboard')

  // Search & Filter state
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [sortCol, setSortCol] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [universalSearchQuery, setUniversalSearchQuery] = useState('')
  const [salesScanImei, setSalesScanImei] = useState('')

  // Multi-unit invoice draft state
  const [invoiceDraftItems, setInvoiceDraftItems] = useState<Array<{ deviceId: string; imei: string; model: string; storage: string; color: string; sellingPriceAed: number }>>([])
  const [addDeviceToInvoiceId, setAddDeviceToInvoiceId] = useState('')
  const [bulkPriceInput, setBulkPriceInput] = useState('')

  // Edit Invoice State
  const [editSaleModal, setEditSaleModal] = useState<Sale | null>(null)
  const [editSaleCustomerName, setEditSaleCustomerName] = useState('')
  const [editSaleCustomerPhone, setEditSaleCustomerPhone] = useState('')
  const [editSalePaymentType, setEditSalePaymentType] = useState<'CASH' | 'CREDIT'>('CASH')
  const [editSaleCreditDueDate, setEditSaleCreditDueDate] = useState('')
  const [editSaleNotes, setEditSaleNotes] = useState('')
  const [submittingEditSale, setSubmittingEditSale] = useState(false)

  // Client Accounts State
  const [showAddClient, setShowAddClient] = useState(false)
  const [newClientForm, setNewClientForm] = useState({ name: '', phone: '', address: '', notes: '' })
  const [savingClient, setSavingClient] = useState(false)
  const [showBillClientModal, setShowBillClientModal] = useState(false)
  const [billClientTarget, setBillClientTarget] = useState<Client | null>(null)
  const [billSelectedDeviceId, setBillSelectedDeviceId] = useState('')
  const [billSellingPrice, setBillSellingPrice] = useState('')
  const [billPaymentType, setBillPaymentType] = useState<'CASH' | 'CREDIT'>('CASH')
  const [billCreditDueDate, setBillCreditDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10))
  const [billNotes, setBillNotes] = useState('')
  const [submittingBill, setSubmittingBill] = useState(false)
  const [viewClientStatement, setViewClientStatement] = useState<Client | null>(null)


  // Modals state
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<Record<string, string>>({ ...EMPTY_DEVICE })
  const [editDevice, setEditDevice] = useState<Device | null>(null)
  const [editForm, setEditForm] = useState<Record<string, string>>({ ...EMPTY_DEVICE })
  const [sellDevice, setSellDevice] = useState<Device | null>(null)
  const [invoiceData, setInvoiceData] = useState<{ device: Device; sale: Sale } | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [showScannerModal, setShowScannerModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // Refurb engine modals
  const [initialQcModalDevice, setInitialQcModalDevice] = useState<Device | null>(null)
  const [initialQcFaults, setInitialQcFaults] = useState<string[]>([])
  const [initialQcNotes, setInitialQcNotes] = useState('')
  const [submittingInitialQc, setSubmittingInitialQc] = useState(false)

  const [afterFixModalDevice, setAfterFixModalDevice] = useState<Device | null>(null)
  const [verifiedFixed, setVerifiedFixed] = useState<string[]>([])
  const [afterFixAction, setAfterFixAction] = useState<'PASS' | 'FAIL_RETRY' | 'FAIL_INHOUSE'>('PASS')
  const [rawCostInput, setRawCostInput] = useState('')
  const [repairCostInput, setRepairCostInput] = useState('')
  const [inhouseRepairCostInput, setInhouseRepairCostInput] = useState('')
  const [afterFixNotes, setAfterFixNotes] = useState('')
  const [submittingAfterFix, setSubmittingAfterFix] = useState(false)

  const [afterFixScanImei, setAfterFixScanImei] = useState('')
  const [batchScanImei, setBatchScanImei] = useState('')
  const [submittingBatchScan, setSubmittingBatchScan] = useState(false)
  const [modalScanImei, setModalScanImei] = useState('')

  const [viewBatch, setViewBatch] = useState<Batch | null>(null)
  const [showNewBatch, setShowNewBatch] = useState(false)
  const [batchModalMode, setBatchModalMode] = useState<'CREATE_NEW' | 'ADD_TO_EXISTING'>('CREATE_NEW')
  const [existingBatchTargetId, setExistingBatchTargetId] = useState('')
  const [showScanFaultModal, setShowScanFaultModal] = useState(false)
  const [scanFaultForm, setScanFaultForm] = useState({
    imei: '',
    model: '15 PRO',
    storage: '128GB',
    color: 'BLACK',
    costAed: '1400',
    faults: [] as string[],
    notes: '',
    destination: 'REPAIR_BATCH' as 'REPAIR_BATCH' | 'READY_TO_SELL' | 'RAW_QC_DONE',
    targetBatchId: ''
  })
  const [batchStep, setBatchStep] = useState<1 | 2>(1)
  const [batchCenter, setBatchCenter] = useState('')
  const [selectedBatchDeviceIds, setSelectedBatchDeviceIds] = useState<string[]>([])
  const [batchMeta, setBatchMeta] = useState({ batchNumber: '', invoiceNumber: '', invoiceDate: '', invoiceNotes: '', notes: '' })
  const [savingBatch, setSavingBatch] = useState(false)
  const [savingBatchDetail, setSavingBatchDetail] = useState(false)
  const [returningIds, setReturningIds] = useState<string[]>([])
  const [renameBatchModal, setRenameBatchModal] = useState<Batch | null>(null)
  const [newBatchNumberInput, setNewBatchNumberInput] = useState('')
  const [savingRename, setSavingRename] = useState(false)
  const [handoverModal, setHandoverModal] = useState<Batch | null>(null)

  const [reRepairModalData, setReRepairModalData] = useState<{ batchId: string; deviceId: string; imei: string; model: string; color: string; existingNotes?: string } | null>(null)
  const [reRepairNoteInput, setReRepairNoteInput] = useState('')
  const [submittingReRepair, setSubmittingReRepair] = useState(false)

  const [paymentModalCenter, setPaymentModalCenter] = useState<RefurbCenter | null>(null)
  const [paymentAmountInput, setPaymentAmountInput] = useState('')
  const [paymentNotesInput, setPaymentNotesInput] = useState('')
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [viewStatementCenter, setViewStatementCenter] = useState<RefurbCenter | null>(null)

  const [showAddCenter, setShowAddCenter] = useState(false)
  const [centerForm, setCenterForm] = useState({ name: '', contact: '', address: '', notes: '' })
  const [savingCenter, setSavingCenter] = useState(false)

  // Edit Center & Client State
  const [editCenterModal, setEditCenterModal] = useState<RefurbCenter | null>(null)
  const [editCenterForm, setEditCenterForm] = useState({ name: '', contact: '', address: '', notes: '' })
  const [savingEditCenter, setSavingEditCenter] = useState(false)

  const [editClientModal, setEditClientModal] = useState<Client | null>(null)
  const [editClientForm, setEditClientForm] = useState({ name: '', phone: '', address: '', notes: '' })
  const [savingEditClient, setSavingEditClient] = useState(false)

  const [masterCheckModalDevice, setMasterCheckModalDevice] = useState<Device | null>(null)
  const [adminPasscode, setAdminPasscode] = useState('')
  const [masterCheckErr, setMasterCheckErr] = useState('')
  const [approvingMasterCheck, setApprovingMasterCheck] = useState(false)

  // Passport Modal & Ready to Sell Sub-Tab State
  const [viewDevicePassport, setViewDevicePassport] = useState<Device | null>(null)
  const [readyToSellSubTab, setReadyToSellSubTab] = useState<'available' | 'sold'>('available')

  function showToast(msg: string, ok = true) { setToast({ msg, ok }); setTimeout(() => setToast(null), 4500) }

  function openEditCenterModal(c: RefurbCenter) {
    setEditCenterModal(c)
    setEditCenterForm({ name: c.name || '', contact: c.contact || '', address: c.address || '', notes: c.notes || '' })
  }

  async function saveEditCenter(e: React.FormEvent) {
    e.preventDefault(); if (!editCenterModal) return; setSavingEditCenter(true)
    const res = await fetch(`/api/refurb-centers/${editCenterModal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editCenterForm)
    })
    const data = await res.json()
    setSavingEditCenter(false)
    if (res.ok) {
      if (Array.isArray(data.refurbCenters)) setCenters(data.refurbCenters)
      setEditCenterModal(null)
      showToast('🏢 Refurb Center updated successfully!')
    } else {
      showToast(data.error || 'Failed to update refurb center', false)
    }
  }

  async function deleteRefurbCenter(id: string) {
    if (!confirm('Are you sure you want to delete this Refurb Center?')) return
    const res = await fetch(`/api/refurb-centers/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) {
      if (Array.isArray(data.refurbCenters)) setCenters(data.refurbCenters)
      showToast('🗑️ Refurb Center deleted')
    } else {
      showToast(data.error || 'Failed to delete center', false)
    }
  }

  function openEditClientModal(c: Client) {
    setEditClientModal(c)
    setEditClientForm({ name: c.name || '', phone: c.phone || '', address: c.address || '', notes: c.notes || '' })
  }

  async function saveEditClient(e: React.FormEvent) {
    e.preventDefault(); if (!editClientModal) return; setSavingEditClient(true)
    const res = await fetch(`/api/clients/${encodeURIComponent(editClientModal.name)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editClientForm)
    })
    const data = await res.json()
    setSavingEditClient(false)
    if (res.ok) {
      if (Array.isArray(data.clients)) setClients(data.clients)
      if (Array.isArray(data.sales)) setSales(data.sales)
      setEditClientModal(null)
      showToast('👤 Client account updated successfully!')
    } else {
      showToast(data.error || 'Failed to update client account', false)
    }
  }

  async function deleteClientAccount(name: string) {
    if (!confirm(`Are you sure you want to delete client account "${name}"?`)) return
    const res = await fetch(`/api/clients/${encodeURIComponent(name)}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) {
      if (Array.isArray(data.clients)) setClients(data.clients)
      showToast('🗑️ Client account deleted')
    } else {
      showToast(data.error || 'Failed to delete client account', false)
    }
  }

  async function loadData() {
    setLoading(true)
    const [dr, sr, cr, br, tr, clr] = await Promise.all([
      fetch('/api/devices'),
      fetch('/api/sales'),
      fetch('/api/refurb-centers'),
      fetch('/api/batches'),
      fetch('/api/refurb-centers/payments'),
      fetch('/api/clients')
    ])
    const dData = await dr.json()
    const sData = await sr.json()
    const cData = await cr.json()
    const bData = await br.json()
    const tData = await tr.json()
    const clData = await clr.json()

    setDevices(Array.isArray(dData) ? dData : [])
    setSales(Array.isArray(sData) ? sData : [])
    setCenters(Array.isArray(cData) ? cData : [])
    setBatches(Array.isArray(bData) ? bData : [])
    setTransactions(tData && Array.isArray(tData.transactions) ? tData.transactions : [])
    setClients(clData && Array.isArray(clData.clients) ? clData.clients : (Array.isArray(clData) ? clData : []))
    setLoading(false)

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const q = params.get('locateImei') || params.get('search') || params.get('tab')
      if (params.get('tab')) setTab(params.get('tab') as TabType)
      if (q) locateUnitByImei(q)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('aquacell_user')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && parsed.role) {
            setCurrentUser(parsed)
            if (parsed.role === 'REFURB') setTab('batches')
          }
        }
      } catch (_e) {}
      setAuthInitialized(true)
    }
    loadData()
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setAuthenticating(true); setLoginErr('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      })
      const data = await res.json()
      setAuthenticating(false)
      if (res.ok && data.user) {
        setCurrentUser(data.user)
        try { localStorage.setItem('aquacell_user', JSON.stringify(data.user)) } catch (_e) {}
        if (data.user.role === 'REFURB') setTab('batches')
        showToast(`🔑 Welcome, ${data.user.name}!`)
      } else {
        setLoginErr(data.error || 'Login failed')
      }
    } catch (_err) {
      setAuthenticating(false)
      setLoginErr('Network error. Please try again.')
    }
  }

  function handleLogout() {
    setCurrentUser(null)
    try { localStorage.removeItem('aquacell_user') } catch (_e) {}
    setLoginForm({ username: '', password: '' })
    showToast('🔒 Logged out successfully')
  }

  // Safe collections
  const safeDevices = Array.isArray(devices) ? devices : []
  const safeSales = Array.isArray(sales) ? sales : []
  const safeCenters = Array.isArray(centers) ? centers : []
  const safeBatches = Array.isArray(batches) ? batches : []
  const safeClients = Array.isArray(clients) ? clients : []

  const rawStockDevices = safeDevices.filter(d => d && d.status === 'RAW_STOCK' && !d.initialQcReport)
  const rawQcDoneDevices = safeDevices.filter(d => d && (d.status === 'RAW_QC_DONE' || (d.initialQcReport && d.status !== 'AT_REPAIR' && d.status !== 'SOLD' && d.status !== 'IN_STOCK')))
  const selectableBatchDevices = safeDevices.filter(d => d && (d.status === 'RAW_STOCK' || d.status === 'RAW_QC_DONE' || d.status === 'QC_FAILED_RETRY' || d.status === 'MASTER_CHECK_APPROVED'))
  const atRepairDevices = safeDevices.filter(d => d && d.status === 'AT_REPAIR')
  const afterFixQcDevices = safeDevices.filter(d => d && (d.status === 'AFTER_FIX_QC' || d.status === 'IN_QC'))
  const readyToSellDevices = safeDevices.filter(d => d && d.status === 'IN_STOCK')
  const soldDevices = safeDevices.filter(d => d && d.status === 'SOLD')
  const masterCheckPendingDevices = safeDevices.filter(d => d && d.status === 'MASTER_CHECK_PENDING')

  function getBatchInfoForDevice(deviceId: string, imei: string) {
    const b = safeBatches.find(batch => batch && Array.isArray(batch.devices) && batch.devices.some(d => d && (d.deviceId === deviceId || d.imei === imei)))
    if (b) return { batchNumber: safeStr(b.batchNumber) || '—', centerName: safeStr(b.refurbCenterName) || '—' }
    return { batchNumber: '—', centerName: '—' }
  }

  // Universal IMEI Locator
  function locateUnitByImei(queryStr: string) {
    const q = queryStr.trim().toLowerCase()
    if (!q) return
    let targetPool = devices
    if (currentUser?.role === 'REFURB') {
      const allowedDevIds = new Set(
        safeBatches
          .filter(b => b && (
            (currentUser.centerId && b.refurbCenterId === currentUser.centerId) ||
            (currentUser.batchNumber && safeLower(b.batchNumber) === safeLower(currentUser.batchNumber)) ||
            (!currentUser.centerId && !currentUser.batchNumber)
          ))
          .flatMap(b => (b.devices || []).map(d => d.deviceId))
      )
      targetPool = devices.filter(d => allowedDevIds.has(d.id))
    }
    const target = targetPool.find(d => d && (d.imei.toLowerCase() === q || d.imei.toLowerCase().endsWith(q)))
    if (!target) {
      showToast(`❌ No device found matching IMEI '${queryStr}' in system`, false)
      return
    }

    if (target.status === 'RAW_STOCK' || target.status === 'RAW_QC_DONE') {
      setTab('inventory')
      setSearch(target.imei)
      showToast(`📍 Found IMEI ${target.imei} in All Stock Inventory.`)
    } else if (target.status === 'AT_REPAIR') {
      setTab('batches')
      const b = batches.find(batch => batch.devices.some(d => d.deviceId === target.id || d.imei === target.imei))
      if (b) openBatch(b)
      showToast(`📍 Found IMEI ${target.imei} in Stage 3: Repair Batches (${b?.batchNumber || 'Active Batch'}).`)
    } else if (target.status === 'AFTER_FIX_QC' || target.status === 'IN_QC') {
      setTab('afterFixQc')
      openAfterFixQcModal(target)
      showToast(`📍 Found IMEI ${target.imei} in Stage 4: After-Fix QC Verification Desk. Opened Modal.`)
    } else if (target.status === 'IN_STOCK') {
      setTab('readyToSell')
      showToast(`📍 Found IMEI ${target.imei} in Stage 5: Ready to Sell Stock.`)
    } else if (target.status === 'MASTER_CHECK_PENDING' || target.status === 'MASTER_CHECK_APPROVED') {
      setTab('masterCheck')
      if (target.status === 'MASTER_CHECK_PENDING') setMasterCheckModalDevice(target)
      showToast(`📍 Found IMEI ${target.imei} in Stage 6: Master Check.`)
    } else if (target.status === 'SOLD') {
      setTab('sales')
      const sale = sales.find(s => s.deviceId === target.id || s.id === target.saleId)
      if (sale) setInvoiceData({ device: target, sale })
      showToast(`📍 Found SOLD IMEI ${target.imei}. Commercial invoice opened.`)
    }
    setUniversalSearchQuery('')
  }

  // Handlers
  function openInitialQcModal(device: Device) {
    setInitialQcModalDevice(device)
    const existing = device.faults ? device.faults.split(',').map(s => s.trim().toUpperCase()) : []
    setInitialQcFaults(existing)
    setInitialQcNotes(device.notes || '')
  }

  async function handleInitialQcSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!initialQcModalDevice) return; setSubmittingInitialQc(true)
    const res = await fetch('/api/initial-qc', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: initialQcModalDevice.id, faults: initialQcFaults, notes: initialQcNotes, inspector: 'Senior QC Inspector' })
    })
    const data = await res.json(); setSubmittingInitialQc(false)
    if (res.ok) { setDevices(data.devices); setInitialQcModalDevice(null); showToast('📋 Initial QC completed! Unit moved to RAW QC DONE stock.') }
    else showToast(data.error || 'Error', false)
  }

  async function moveToReadyToSell(device: Device) {
    const res = await fetch(`/api/devices/${device.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'IN_STOCK', qcStatus: 'PASSED' })
    })
    const updated = await res.json()
    if (res.ok) {
      setDevices(prev => prev.map(d => d.id === device.id ? updated : d))
      showToast(`🟢 ${device.model} (${device.imei}) marked as QC PASSED & moved to Ready to Sell Stock!`)
    } else {
      showToast(updated.error || 'Failed to update device status', false)
    }
  }

  function openSellModalForDevice(device: Device) {
    setSellDevice(device)
    setInvoiceDraftItems([
      {
        deviceId: device.id,
        imei: device.imei,
        model: device.model,
        storage: device.storage,
        color: device.color,
        sellingPriceAed: Number(device.sellingPriceAed || device.costAed || 1500)
      }
    ])
    setAddForm(f => ({
      ...f,
      customerName: f.customerName || '',
      customerPhone: f.customerPhone || ''
    }))
  }

  function openInvoiceForSale(s: Sale) {
    let dev = devices.find(d => d.id === s.deviceId)
    if (!dev) {
      dev = {
        id: s.deviceId || 'dev-00',
        imei: s.imei || '',
        model: s.model || 'iPhone',
        storage: '128GB',
        color: 'BLACK',
        status: 'SOLD',
        costAed: 0,
        sellingPriceAed: s.sellingPriceAed,
        faults: '', housing: '', backGlass: '', displayMsg: '', batteryMsg: '', battery: '', lcd: '', nfc: '', faceId: '', frontCamera: '', backCamera: '', flex: '', sensor: '', board: '', flashlight: '', frontSpeaker: '', notes: '', intakeAt: s.soldAt, saleId: s.id
      }
    }
    setInvoiceData({ device: dev, sale: s })
  }

  function handleSalesScanSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const q = salesScanImei.trim().toLowerCase()
    if (!q) return

    const target = devices.find(d => d.imei.toLowerCase() === q || d.imei.toLowerCase().endsWith(q))
    if (!target) {
      showToast(`❌ No device found matching IMEI '${salesScanImei}' in system`, false)
      return
    }

    if (target.status === 'SOLD') {
      const sale = sales.find(s => s.deviceId === target.id || s.id === target.saleId)
      if (sale) {
        openInvoiceForSale(sale)
        showToast(`📍 Found SOLD IMEI ${target.imei}. Commercial Invoice opened!`)
      } else {
        showToast(`📍 IMEI ${target.imei} is marked as SOLD.`, false)
      }
    } else {
      openSellModalForDevice(target)
      showToast(`📍 Located IMEI ${target.imei} (${target.model}). Move to Commercial Invoice!`)
    }
    setSalesScanImei('')
  }

  async function handleCreateClientSubmit(e: React.FormEvent) {
    e.preventDefault(); setSavingClient(true)
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClientForm)
    })
    const data = await res.json(); setSavingClient(false)
    if (res.ok) {
      loadData()
      setShowAddClient(false)
      setNewClientForm({ name: '', phone: '', address: '', notes: '' })
      showToast(`👤 Client Account "${data.client.name}" registered successfully!`)
    } else {
      showToast(data.error || 'Failed to create client account', false)
    }
  }

  async function handleBillClientSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!billClientTarget || invoiceDraftItems.length === 0) {
      showToast('Select at least one device for the invoice', false)
      return
    }
    setSubmittingBill(true)

    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: billClientTarget.name,
        customerPhone: billClientTarget.phone,
        paymentTermType: billPaymentType,
        creditDueDate: billPaymentType === 'CREDIT' ? billCreditDueDate : null,
        items: invoiceDraftItems,
        notes: billNotes
      })
    })
    const data = await res.json(); setSubmittingBill(false)
    if (res.ok) {
      await loadData()
      setShowBillClientModal(false)
      setBillSelectedDeviceId('')
      setBillNotes('')
      showToast(`🧾 Commercial Invoice ${data.sale.invoiceNumber} (${data.sale.items?.length || 1} units) generated!`)
      openInvoiceForSale(data.sale)
      setInvoiceDraftItems([])
    } else {
      showToast(data.error || 'Failed to bill client', false)
    }
  }

  function openEditInvoiceModal(s: Sale) {
    setEditSaleModal(s)
    setEditSaleCustomerName(s.customerName)
    setEditSaleCustomerPhone(s.customerPhone || '')
    setEditSalePaymentType(s.paymentTermType === 'CREDIT' ? 'CREDIT' : 'CASH')
    setEditSaleCreditDueDate(s.creditDueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10))
    setEditSaleNotes(s.notes || '')

    let items = s.items
    if (!items || items.length === 0) {
      const dev = devices.find(d => d.id === s.deviceId)
      items = [{
        deviceId: s.deviceId,
        imei: s.imei,
        model: s.model,
        storage: dev?.storage || '128GB',
        color: dev?.color || 'BLACK',
        sellingPriceAed: s.sellingPriceAed
      }]
    }
    setInvoiceDraftItems(items.map(it => ({
      deviceId: it.deviceId,
      imei: it.imei,
      model: it.model,
      storage: it.storage || '128GB',
      color: it.color || 'BLACK',
      sellingPriceAed: it.sellingPriceAed
    })))
  }

  async function handleEditInvoiceSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editSaleModal || invoiceDraftItems.length === 0) {
      showToast('Invoice must contain at least one unit', false)
      return
    }
    setSubmittingEditSale(true)

    const res = await fetch(`/api/sales/${editSaleModal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: editSaleCustomerName,
        customerPhone: editSaleCustomerPhone,
        paymentTermType: editSalePaymentType,
        creditDueDate: editSalePaymentType === 'CREDIT' ? editSaleCreditDueDate : null,
        items: invoiceDraftItems,
        notes: editSaleNotes
      })
    })
    const data = await res.json(); setSubmittingEditSale(false)
    if (res.ok) {
      await loadData()
      setEditSaleModal(null)
      setInvoiceDraftItems([])
      showToast(`✏️ Commercial Invoice ${data.sale.invoiceNumber} updated!`)
      openInvoiceForSale(data.sale)
    } else {
      showToast(data.error || 'Failed to update invoice', false)
    }
  }

  async function deleteInvoice(s: Sale) {
    const count = s.items?.length || 1
    if (!confirm(`Are you sure you want to DELETE Commercial Invoice ${s.invoiceNumber}?\n\n${count} unit(s) on this invoice will be automatically moved back to READY TO SELL stock.`)) return

    const res = await fetch(`/api/sales/${s.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) {
      if (invoiceData?.sale.id === s.id) setInvoiceData(null)
      await loadData()
      showToast(`🗑️ Invoice ${s.invoiceNumber} deleted! ${count} unit(s) moved back to Ready to Sell stock.`)
    } else {
      showToast(data.error || 'Failed to delete invoice', false)
    }
  }

  function openAfterFixQcModal(device: Device) {
    setAfterFixModalDevice(device)
    const reportedFaults = (device.faults || 'General Repair').split(',').map(s => s.trim()).filter(Boolean)
    setVerifiedFixed(reportedFaults)
    setAfterFixAction('PASS')
    setRawCostInput(String(device.costAed || ''))
    setRepairCostInput(String(device.repairCostAed || ''))
    setInhouseRepairCostInput('')
    setAfterFixNotes('')
  }

  async function handleAfterFixQcSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!afterFixModalDevice) return; setSubmittingAfterFix(true)
    const res = await fetch('/api/after-fix-qc', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: afterFixModalDevice.id, outcome: afterFixAction, inspector: 'After-Fix Inspector',
        verifiedFixedFaults: verifiedFixed, rawCostAed: Number(rawCostInput) || 0,
        repairCostAed: Number(repairCostInput) || 0, inhouseRepairCostAed: Number(inhouseRepairCostInput) || 0,
        notes: afterFixNotes
      })
    })
    const data = await res.json(); setSubmittingAfterFix(false)
    if (res.ok) {
      setDevices(data.devices); setCenters(data.refurbCenters); setTransactions(data.refurbTransactions || [])
      setAfterFixModalDevice(null)
      showToast('🟢 After-Fix QC Verification Completed!')
    } else showToast(data.error || 'Error', false)
  }

  function openBatch(b: Batch) {
    setViewBatch(b)
    setBatchMeta({ batchNumber: b.batchNumber, invoiceNumber: b.invoiceNumber || '', invoiceDate: b.invoiceDate || '', invoiceNotes: b.invoiceNotes || '', notes: b.notes || '' })
    setReturningIds([])
  }

  async function saveBatchDetail() {
    if (!viewBatch) return; setSavingBatchDetail(true)
    const res = await fetch('/api/batches/' + viewBatch.id, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...batchMeta, returnDeviceIds: returningIds })
    })
    const data = await res.json(); setSavingBatchDetail(false)
    if (res.ok) {
      setBatches(p => p.map(b => b.id === viewBatch.id ? data.batch : b))
      setDevices(data.devices)
      setViewBatch(data.batch)
      setReturningIds([])
      showToast('Batch updated & returned units moved to Stage 4 After-Fix QC!')
    } else showToast(data.error || 'Error', false)
  }

  async function handleBatchScanReturnSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault(); const q = batchScanImei.trim().toLowerCase(); if (!q) return
    let foundBatch: Batch | null = null, foundDeviceId: string | null = null
    for (const b of batches) {
      const bd = b.devices.find(d => !d.returned && (d.imei.toLowerCase() === q || d.imei.toLowerCase().endsWith(q)))
      if (bd) { foundBatch = b; foundDeviceId = bd.deviceId; break }
    }
    if (!foundBatch || !foundDeviceId) { showToast(`IMEI '${batchScanImei}' not found in active batches`, false); return }
    setSubmittingBatchScan(true)
    const res = await fetch('/api/batches/' + foundBatch.id, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnDeviceIds: [foundDeviceId] })
    })
    const data = await res.json(); setSubmittingBatchScan(false)
    if (res.ok) {
      setBatches(p => p.map(b => b.id === foundBatch!.id ? data.batch : b))
      setDevices(data.devices); setBatchScanImei('')
      showToast(`✓ IMEI ${q} returned from ${foundBatch.batchNumber} -> Moved to Stage 4 (After-Fix QC)!`)
    } else showToast(data.error || 'Error', false)
  }

  async function quickReturnSingleDevice(batchId: string, deviceId: string, imei: string) {
    const res = await fetch('/api/batches/' + batchId, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnDeviceIds: [deviceId] })
    })
    const data = await res.json()
    if (res.ok) {
      setBatches(p => p.map(b => b.id === batchId ? data.batch : b))
      setDevices(data.devices)
      showToast(`✓ IMEI ${imei.slice(-4)} moved to Stage 4 (After-Fix QC)!`)
    } else showToast(data.error || 'Error', false)
  }

  async function revertReturnSingleDevice(batchId: string, deviceId: string, imei: string, isReRepair = true, reRepairNotes = '') {
    const res = await fetch('/api/batches/' + batchId, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revertReturnDeviceId: deviceId, isReRepair, reRepairNotes })
    })
    const data = await res.json()
    if (res.ok) {
      setBatches(p => p.map(b => b.id === batchId ? data.batch : b))
      setDevices(data.devices)
      showToast(`🔴 IMEI ${imei.slice(-4)} marked for RE-REPAIR in batch!`)
    } else showToast(data.error || 'Error', false)
  }

  async function handleReRepairSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!reRepairModalData) return; setSubmittingReRepair(true)
    await revertReturnSingleDevice(reRepairModalData.batchId, reRepairModalData.deviceId, reRepairModalData.imei, true, reRepairNoteInput)
    setSubmittingReRepair(false)
    setReRepairModalData(null)
  }

  function downloadStockTemplate() {
    const content = `MODEL,STORAGE,COLOR,IMEI,FAULTS,COST\n15 PRO,128GB,BLACK,359182390194812,HOUSING LCD,1400\n15 PRO MAX,256GB,NATURAL,358192840192841,BACK GLASS,1800\n14 PRO,128GB,BLUE,357281940192842,BATTERY,1200`
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'AQUA_CELL_Stock_Import_Template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (text) {
        setImportText(text)
        showToast(`📁 Loaded "${file.name}" ready for import!`)
      }
    }
    reader.readAsText(file)
  }

  async function removeDeviceFromBatch(batchId: string, deviceId: string, imei: string) {
    if (!confirm(`Are you sure you want to remove unit (${imei}) from this batch?`)) return
    const deleteCompletely = confirm(`Click OK to revert unit back to Raw QC stock, or Cancel to delete unit completely from system.`) === false
    const res = await fetch(`/api/batches/${batchId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ removeDeviceId: deviceId, deleteCompletely })
    })
    const data = await res.json()
    if (res.ok) {
      setBatches(prev => prev.map(b => b.id === batchId ? data.batch : b))
      setDevices(data.devices)
      showToast(`🗑️ Unit ${imei} removed from batch!`)
    } else {
      showToast(data.error || 'Failed to remove device', false)
    }
  }

  async function addStockToExistingBatch(targetBatchId?: string, deviceIds?: string[]) {
    const bId = targetBatchId || existingBatchTargetId
    const dIds = deviceIds || selectedBatchDeviceIds
    if (!bId || dIds.length === 0) {
      showToast('Select an existing batch and at least one device', false)
      return
    }
    setSavingBatch(true)
    const res = await fetch(`/api/batches/${bId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addDeviceIds: dIds })
    })
    const data = await res.json()
    setSavingBatch(false)
    if (res.ok) {
      setBatches(prev => prev.map(b => b.id === bId ? data.batch : b))
      setDevices(data.devices)
      setShowNewBatch(false)
      setSelectedBatchDeviceIds([])
      setExistingBatchTargetId('')
      showToast(`✅ Added ${dIds.length} unit(s) to Batch ${data.batch.batchNumber}!`)
    } else {
      showToast(data.error || 'Failed to add stock to batch', false)
    }
  }

  async function createBatch() {
    if (!batchCenter) return; setSavingBatch(true)
    const res = await fetch('/api/batches', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refurbCenterId: batchCenter, deviceIds: selectedBatchDeviceIds, ...batchMeta })
    })
    const data = await res.json(); setSavingBatch(false)
    if (res.ok) {
      setBatches(p => [data.batch, ...p]); setDevices(data.devices)
      setShowNewBatch(false); setBatchStep(1); setBatchCenter(''); setSelectedBatchDeviceIds([])
      showToast('Batch ' + data.batch.batchNumber + ' created!')
    } else showToast(data.error || 'Error', false)
  }

  async function handleCreateCenter(e: React.FormEvent) {
    e.preventDefault(); setSavingCenter(true)
    const res = await fetch('/api/refurb-centers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(centerForm)
    })
    const data = await res.json(); setSavingCenter(false)
    if (res.ok) { setCenters(p => [...p, data]); setShowAddCenter(false); setCenterForm({ name: '', contact: '', address: '', notes: '' }); showToast('Refurb Center added!') }
    else showToast(data.error || 'Error', false)
  }

  async function handleMasterCheckApprove() {
    if (!masterCheckModalDevice) return; setApprovingMasterCheck(true)
    const res = await fetch('/api/master-check', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: masterCheckModalDevice.id, passcode: adminPasscode, action: 'APPROVE' })
    })
    const data = await res.json(); setApprovingMasterCheck(false)
    if (res.ok) { setDevices(data.devices); setMasterCheckModalDevice(null); showToast('🛡️ Admin Approved!') }
    else setMasterCheckErr(data.error || 'Failed')
  }

  // Inventory Table Filter & Sort
  const filtered = safeDevices.filter(d => {
    if (!d) return false
    if (filterStatus !== 'ALL' && d.status !== filterStatus) return false
    const q = safeLower(search)
    return !q || safeLower(d.imei).includes(q) || safeLower(d.model).includes(q) || safeLower(d.color).includes(q) || safeLower(d.faults).includes(q)
  })
  const displayDevices = sortCol ? [...filtered].sort((a, b) => {
    const av = safeStr((a as unknown as Record<string, unknown>)[sortCol])
    const bv = safeStr((b as unknown as Record<string, unknown>)[sortCol])
    const c = av.localeCompare(bv, undefined, { numeric: true })
    return sortDir === 'asc' ? c : -c
  }) : filtered

  const totalPayablesAed = safeCenters.reduce((sum, c) => sum + (c ? (c.unpaidBalanceAed || 0) : 0), 0)
  const totalSalesAed = safeSales.reduce((sum, s) => sum + (s ? (s.sellingPriceAed || 0) : 0), 0)

  if (authInitialized && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 text-white">
          <div className="text-center space-y-2">
            <div className="inline-flex bg-blue-600 p-3.5 rounded-2xl text-white font-black text-2xl mb-1 shadow-lg">AQ</div>
            <h1 className="text-2xl font-black tracking-tight text-white">AQUA CELL ERP</h1>
            <p className="text-xs text-slate-400 font-medium">Enterprise Stock, Sales &amp; Refurbishment Gateway</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginErr && (
              <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-xs text-red-400 text-center font-bold">
                {loginErr}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Username / Batch # / Refurb Center *</label>
              <input
                type="text"
                required
                value={loginForm.username}
                onChange={e => setLoginForm(f => ({ ...f, username: e.target.value }))}
                placeholder="e.g. admin, supervisor, refurb, BATCH-2026-0001"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Password *</label>
              <input
                type="password"
                required
                value={loginForm.password}
                onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Enter password..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={authenticating}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2"
            >
              {authenticating ? 'Authenticating...' : '🔓 Sign In to Workstation'}
            </button>
          </form>

          <div className="border-t border-slate-800/80 pt-4 space-y-2">
            <p className="text-[10px] font-black uppercase text-slate-500 text-center tracking-wider">Quick Preset Logins (Demo)</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => { setLoginForm({ username: 'admin', password: 'aquacell2026' }) }}
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-center"
              >
                <span className="block text-[10px] font-bold text-red-400">🔴 Super Admin</span>
                <span className="text-[10px] text-slate-400 font-mono">admin</span>
              </button>
              <button
                type="button"
                onClick={() => { setLoginForm({ username: 'supervisor', password: 'super123' }) }}
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-center"
              >
                <span className="block text-[10px] font-bold text-amber-400">🟡 Supervisor</span>
                <span className="text-[10px] text-slate-400 font-mono">supervisor</span>
              </button>
              <button
                type="button"
                onClick={() => { setLoginForm({ username: 'refurb', password: 'repair123' }) }}
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-center"
              >
                <span className="block text-[10px] font-bold text-blue-400">🔵 Refurb Center</span>
                <span className="text-[10px] text-slate-400 font-mono">refurb</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans text-gray-900">
      {/* MAIN APPLICATION CONTAINER (HIDDEN DURING PRINTING) */}
      <div className="flex-1 flex flex-col print:hidden">
        {/* GLOBAL TOP APP HEADER */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-3 flex items-center justify-between shadow-md shrink-0 print:hidden z-30">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white font-black text-lg">AQ</div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              AQUA CELL <span className="text-xs px-2 py-0.5 rounded bg-blue-500/30 text-blue-300 font-bold border border-blue-400/30">ERP ENGINE v3.0</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Enterprise Stock &amp; Refurbishment Management System</p>
          </div>
        </div>

        {/* UNIVERSAL TOP BARCODE / IMEI SEARCH BAR */}
        <form
          onSubmit={e => { e.preventDefault(); locateUnitByImei(universalSearchQuery) }}
          className="flex-1 max-w-xl mx-6 relative"
        >
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <input
              type="text"
              value={universalSearchQuery}
              onChange={e => setUniversalSearchQuery(e.target.value)}
              placeholder="🔍 Scan or enter IMEI barcode to locate unit anywhere in system..."
              className="w-full bg-slate-800 border border-slate-700 focus:bg-slate-950 rounded-xl pl-9 pr-24 py-2 text-xs font-mono font-bold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] rounded-lg transition shadow-sm"
            >
              Locate Unit
            </button>
          </div>
        </form>

        <div className="flex items-center gap-2">
          {currentUser?.role !== 'REFURB' && (
            <>
              <a href="/AQUA-CELL-ERP-Setup.zip" download className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-700 transition shadow-sm" title="Download Desktop App Installer (.exe)">
                <Download className="w-4 h-4 text-cyan-400" /> Desktop App (.exe)
              </a>
              <button onClick={() => setShowScannerModal(true)} className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs px-3.5 py-2 rounded-xl transition shadow-sm">
                <Barcode className="w-4 h-4" /> Dispatch Batch
              </button>
              <button onClick={() => setShowImport(true)} className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-sm">
                <Download className="w-4 h-4" /> Import Stock
              </button>
              <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-sm">
                <Plus className="w-4 h-4" /> Add Device
              </button>
            </>
          )}

          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERVISOR') && (
            <button
              onClick={triggerBackupAndDownload}
              disabled={backingUp}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
              title="Create instant server backup and download JSON snapshot to computer"
            >
              <Download className="w-4 h-4 text-emerald-200" />
              {backingUp ? 'Saving...' : '💾 Backup DB Now'}
            </button>
          )}

          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
              <div className="text-right">
                <p className="text-xs font-bold text-white leading-none">{currentUser.name}</p>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-black uppercase ${currentUser.role === 'ADMIN' ? 'bg-red-500/30 text-red-300 border border-red-500/40' : currentUser.role === 'SUPERVISOR' ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' : 'bg-blue-500/30 text-blue-300 border border-blue-500/40'}`}>
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-2 bg-slate-800 hover:bg-red-900/60 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
              >
                🚪
              </button>
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTAINER: SIDEBAR MODULE + CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR NAVIGATION MODULE */}
        <aside className="w-72 bg-slate-950 text-slate-300 border-r border-slate-800 flex flex-col shrink-0 print:hidden overflow-y-auto">
          {currentUser?.role === 'REFURB' ? (
            <div className="p-4 space-y-1">
              <p className="text-[10px] font-black uppercase text-amber-500 tracking-wider mb-2">WORKSTATION MODULE</p>
              <button
                onClick={() => setTab('batches')}
                className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-extrabold text-xs bg-amber-500 text-slate-950 shadow-md"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-slate-950" />
                  <span className="truncate">Assigned Repair Batches</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-black bg-slate-950/20 text-slate-950">
                  {safeBatches.filter(b => b && (
                    (currentUser?.centerId && b.refurbCenterId === currentUser.centerId) ||
                    (currentUser?.batchNumber && safeLower(b.batchNumber) === safeLower(currentUser.batchNumber)) ||
                    (!currentUser?.centerId && !currentUser?.batchNumber)
                  )).length}
                </span>
              </button>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-slate-800/80">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">ERP MODULE NAVIGATION</p>
                <div className="space-y-1">
                  {[
                    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, badge: null, color: 'text-blue-400' },
                    { id: 'inventory', label: 'All Stock Inventory', icon: Layers, badge: devices.length, color: 'text-indigo-400' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setTab(item.id as TabType)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs transition ${tab === item.id ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-900 text-slate-300'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon className={`w-4 h-4 ${tab === item.id ? 'text-white' : item.color}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== null && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-black ${tab === item.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* WORKFLOW MODULE NAVIGATION */}
              <div className="p-4 border-b border-slate-800/80 space-y-1">
                <p className="text-[10px] font-black uppercase text-amber-500 tracking-wider mb-2">REFURB WORKFLOW &amp; DESKS</p>
                {[
                  { id: 'batches', label: '1. Repair Batches & SLA Timers', icon: Clock, count: batches.length, color: 'text-amber-400' },
                  { id: 'afterFixQc', label: '2. After-Fix QC Desk', icon: ShieldCheck, count: afterFixQcDevices.length, alert: afterFixQcDevices.length > 0, color: 'text-purple-400' },
                  { id: 'readyToSell', label: '3. Ready to Sell Stock', icon: Check, count: readyToSellDevices.length, color: 'text-green-400' },
                  { id: 'masterCheck', label: '4. Master Check Desk', icon: Lock, count: masterCheckPendingDevices.length, alert: masterCheckPendingDevices.length > 0, color: 'text-red-400' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id as TabType)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs transition ${tab === item.id ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' : 'hover:bg-slate-900 text-slate-300'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className={`w-4 h-4 ${tab === item.id ? 'text-slate-950' : item.color}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-black ${item.alert ? 'bg-red-500 text-white animate-pulse' : tab === item.id ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* FINANCIAL & MANAGEMENT SIDEBAR MODULE */}
              <div className="p-4 space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">FINANCIAL &amp; ACCOUNTS</p>
                {[
                  { id: 'clients', label: 'Client Accounts & Billing', icon: Users, badge: clients.length, color: 'text-cyan-400' },
                  { id: 'sales', label: 'Sales & Invoices Ledger', icon: ShoppingCart, badge: sales.length, color: 'text-emerald-400' },
                  { id: 'accounts', label: 'Refurb Payables & Accounts', icon: DollarSign, badge: `AED ${totalPayablesAed.toFixed(0)}`, color: 'text-red-400' },
                  { id: 'centers', label: 'Refurb Centers Directory', icon: Building2, badge: centers.length, color: 'text-slate-400' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id as TabType)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs transition ${tab === item.id ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-900 text-slate-300'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className={`w-4 h-4 ${tab === item.id ? 'text-white' : item.color}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-black ${tab === item.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      {item.badge}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="mt-auto p-4 border-t border-slate-900 text-[10px] text-slate-500 text-center">
            AQUA CELL LLC • Naif Mobile Market, Dubai
          </div>
        </aside>

        {/* MAIN WORKSPACE VIEW */}
        <main className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TOP SUMMARY CARDS BAR (Visible for Admin and Supervisor) */}
          {currentUser?.role !== 'REFURB' && (
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            {[
              { label: 'Total Inventory', value: devices.length, icon: Package, bg: 'bg-blue-50', color: 'text-blue-600', t: 'inventory' },
              { label: 'Raw Stock (Initial QC)', value: rawStockDevices.length, icon: Package, bg: 'bg-indigo-50', color: 'text-indigo-600', t: 'initialQc' },
              { label: 'Active Repair Batches', value: batches.length, icon: Clock, bg: 'bg-amber-50', color: 'text-amber-600', t: 'batches' },
              { label: 'After-Fix QC Desk', value: afterFixQcDevices.length, icon: ShieldCheck, bg: 'bg-purple-50', color: 'text-purple-600', t: 'afterFixQc' },
              { label: 'Ready to Sell Stock', value: readyToSellDevices.length, icon: Check, bg: 'bg-green-50', color: 'text-green-600', t: 'readyToSell' },
              { label: 'Payables Ledger', value: `AED ${totalPayablesAed.toFixed(0)}`, icon: DollarSign, bg: 'bg-red-50', color: 'text-red-700', t: 'accounts' }
            ].map(({ label, value, icon: Icon, bg, color, t }) => (
              <button
                key={label}
                onClick={() => setTab(t as TabType)}
                className="bg-white rounded-2xl border border-gray-200 p-3.5 flex items-center gap-3 shadow-xs hover:border-blue-400 transition text-left"
              >
                <div className={`p-2.5 rounded-xl ${bg}`}><Icon className={`w-5 h-5 ${color}`} /></div>
                <div><p className="text-[10px] text-gray-500 font-bold leading-tight uppercase">{label}</p><p className="text-lg font-black text-gray-900">{value}</p></div>
              </button>
            ))}
          </div>
          )}

          {/* TAB 1: EXECUTIVE DASHBOARD */}
          {tab === 'dashboard' && (
            <div className="space-y-5">
              <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">ERP Stock &amp; Refurbishment Executive Summary</h2>
                  <p className="text-xs text-slate-400 mt-1">Complete Real-Time Visibility across Raw Intake, Quality Inspections, Repair SLA Timers &amp; Financial Ledgers.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setTab('inventory')} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm">View All Stock</button>
                  <button onClick={() => setTab('afterFixQc')} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-sm">After-Fix QC Desk</button>
                </div>
              </div>

              {/* QUICK STAGE SHORTCUTS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-sm text-gray-900">📦 Stage 1: Raw Stock Intake</h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">{rawStockDevices.length} Units</span>
                  </div>
                  <p className="text-xs text-gray-500">Stock awaiting Initial QC inspection before refurb batching.</p>
                  <button onClick={() => setTab('inventory')} className="w-full py-2 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-100 border border-blue-200">View All Stock Inventory →</button>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-sm text-gray-900">⏱️ Stage 3: Repair Batches &amp; Timers</h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">{batches.length} Batches ({atRepairDevices.length} Units)</span>
                  </div>
                  <p className="text-xs text-gray-500">Live turnaround SLA tracking per Refurb Center batch.</p>
                  <button onClick={() => setTab('batches')} className="w-full py-2 bg-amber-50 text-amber-800 font-bold text-xs rounded-xl hover:bg-amber-100 border border-amber-200">View Active Batches →</button>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-sm text-gray-900">💼 Refurb Payables Ledger</h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-bold">AED {totalPayablesAed.toFixed(0)}</span>
                  </div>
                  <p className="text-xs text-gray-500">Outstanding repair balances &amp; in-house chargebacks.</p>
                  <button onClick={() => setTab('accounts')} className="w-full py-2 bg-red-50 text-red-700 font-bold text-xs rounded-xl hover:bg-red-100 border border-red-200">Manage Accounts &amp; Payables →</button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALL STOCK INVENTORY */}
          {tab === 'inventory' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search IMEI, model, color, faults..." className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"><X className="w-4 h-4" /></button>}
                </div>
                {['ALL', 'RAW_STOCK', 'RAW_QC_DONE', 'AT_REPAIR', 'AFTER_FIX_QC', 'IN_STOCK', 'SOLD'].map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${filterStatus === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
                    {s === 'ALL' ? 'All' : s === 'RAW_STOCK' ? 'Raw Stock' : s === 'RAW_QC_DONE' ? 'QC Done' : s === 'AT_REPAIR' ? 'At Repair' : s === 'AFTER_FIX_QC' ? 'After-Fix QC' : s === 'IN_STOCK' ? 'Ready to Sell' : 'Sold'}
                  </button>
                ))}
                <span className="text-xs text-gray-400 font-bold ml-auto">{displayDevices.length} of {devices.length}</span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto overflow-y-auto max-h-[62vh]">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                      <tr>
                        {COL_HEADS.map(h => (
                          <th key={h.key} onClick={() => { setSortCol(h.key); setSortDir(d => d === 'asc' ? 'desc' : 'asc') }} className="px-3 py-2.5 text-left font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200">
                            {h.label}
                          </th>
                        ))}
                        <th className="px-3 py-2.5 text-center font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayDevices.map((d, i) => (
                        <tr key={d.id} className={`border-b border-gray-100 hover:bg-blue-50/40 transition ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                          <td className="px-3 py-2.5 font-bold text-gray-900">{d.model}</td>
                          <td className="px-3 py-2.5">{d.storage}</td>
                          <td className="px-3 py-2.5">{d.color}</td>
                          <td className="px-3 py-2.5 font-mono font-bold text-gray-800">{d.imei}</td>
                          <td className="px-3 py-2.5 max-w-[200px] truncate text-orange-950 font-semibold">{d.faults || '-'}</td>
                          <td className="px-3 py-2.5"><SBadge s={d.status} /></td>
                          <td className="px-3 py-2.5 text-gray-600 font-bold">AED {d.costAed || 0}</td>
                          <td className="px-3 py-2.5 text-blue-700 font-black">AED {d.sellingPriceAed || 0}</td>
                          <td className="px-3 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {/* DIRECT EDIT & STATUS ACTIONS */}
                              <button
                                onClick={() => {
                                  setEditDevice(d)
                                  setEditForm({
                                    imei: d.imei || '', model: d.model || '', storage: d.storage || '', color: d.color || '', faults: d.faults || '',
                                    housing: d.housing || '', backGlass: d.backGlass || '', displayMsg: d.displayMsg || '', batteryMsg: d.batteryMsg || '',
                                    battery: d.battery || '', lcd: d.lcd || '', nfc: d.nfc || '', faceId: d.faceId || '', frontCamera: d.frontCamera || '',
                                    backCamera: d.backCamera || '', flex: d.flex || '', sensor: d.sensor || '', board: d.board || '', flashlight: d.flashlight || '',
                                    frontSpeaker: d.frontSpeaker || '', costAed: String(d.costAed || ''), notes: d.notes || '', status: d.status || 'RAW_STOCK'
                                  })
                                }}
                                className="p-1 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition"
                                title="Edit Specifications, Faults & Status"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              {d.status !== 'SOLD' && (
                                <>
                                  <button
                                    onClick={() => { setSelectedBatchDeviceIds([d.id]); setBatchModalMode('CREATE_NEW'); setBatchStep(1); setShowNewBatch(true); setTab('batches') }}
                                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-lg text-[10px] transition shadow-xs flex items-center gap-1 shrink-0"
                                    title="Add unit to a Repair Batch"
                                  >
                                    <Layers className="w-3 h-3" /> Repair Batch
                                  </button>
                                  <button
                                    onClick={() => moveToReadyToSell(d)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[10px] transition shadow-xs flex items-center gap-1 shrink-0"
                                    title="Move unit directly to Ready to Sell stock"
                                  >
                                    <CheckCircle2 className="w-3 h-3" /> Ready to Sell
                                  </button>
                                </>
                              )}
                              {d.status === 'AT_REPAIR' && (
                                <button
                                  onClick={() => {
                                    const b = batches.find(x => x.devices.some(bd => bd.deviceId === d.id))
                                    if (b) quickReturnSingleDevice(b.id, d.id, d.imei)
                                  }}
                                  className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white font-extrabold rounded-lg text-[10px] transition shadow-xs flex items-center gap-1 shrink-0"
                                  title="Return Unit from Repair Batch -> Move to Step 4 (After-Fix QC)"
                                >
                                  <RotateCcw className="w-3 h-3 text-amber-200" /> Step 4 QC
                                </button>
                              )}
                              {(d.status === 'AFTER_FIX_QC' || d.status === 'IN_QC' || d.status === 'QC_FAILED_RETRY') && (
                                <button
                                  onClick={() => openAfterFixQcModal(d)}
                                  className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white font-extrabold rounded-lg text-[10px] transition shadow-xs flex items-center gap-1 shrink-0"
                                  title="Perform After-Fix QC Verification -> Move to Ready to Sell or Re-Repair"
                                >
                                  <Check className="w-3 h-3 text-purple-200" /> After-Fix QC
                                </button>
                              )}
                              {d.status === 'IN_STOCK' && (
                                <button
                                  onClick={() => setSellDevice(d)}
                                  className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white font-extrabold rounded-lg text-[10px] transition shadow-xs flex items-center gap-1 shrink-0"
                                  title="Sell Device &amp; Record Commercial Invoice"
                                >
                                  <DollarSign className="w-3 h-3 text-green-200" /> Sell Unit
                                </button>
                              )}
                              {d.status === 'SOLD' && (
                                <button
                                  onClick={() => { const s = sales.find(x => x.deviceId === d.id); if (s) setInvoiceData({ device: d, sale: s }) }}
                                  className="px-2.5 py-1 bg-gray-800 hover:bg-black text-white font-bold rounded-lg text-[10px] transition shadow-xs flex items-center gap-1 shrink-0"
                                  title="View/Print Commercial Invoice"
                                >
                                  <Printer className="w-3 h-3 text-gray-300" /> Invoice
                                </button>
                              )}

                              {/* EDIT DEVICE SPECS */}
                              {d.status !== 'SOLD' && (
                                <button
                                  onClick={() => { setEditDevice(d); setEditForm({ imei: d.imei || '', model: d.model || '', storage: d.storage || '', color: d.color || '', faults: d.faults || '', housing: d.housing || '', backGlass: d.backGlass || '', displayMsg: d.displayMsg || '', batteryMsg: d.batteryMsg || '', battery: d.battery || '', lcd: d.lcd || '', nfc: d.nfc || '', faceId: d.faceId || '', frontCamera: d.frontCamera || '', backCamera: d.backCamera || '', flex: d.flex || '', sensor: d.sensor || '', board: d.board || '', flashlight: d.flashlight || '', frontSpeaker: d.frontSpeaker || '', costAed: String(d.costAed || ''), notes: d.notes || '', status: d.status || '' }) }}
                                  className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                  title="Edit Device Specs"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}



          {/* TAB 5: REPAIR BATCHES & TIMERS */}
          {tab === 'batches' && (() => {
            const userRole = currentUser?.role
            const centerId = currentUser?.centerId
            const batchNo = currentUser?.batchNumber

            const scopedBatches = safeBatches.filter(b => {
              if (!b) return false
              if (userRole === 'REFURB') {
                if (centerId) return b.refurbCenterId === centerId
                if (batchNo) return safeLower(b.batchNumber) === safeLower(batchNo)
              }
              return true
            })

            const q = batchScanImei.trim().toLowerCase()
            let matchedUnit: { batch: Batch; device: BatchDevice } | null = null
            if (q) {
              for (const b of scopedBatches) {
                const bd = b.devices.find(d => d && (safeLower(d.imei) === q || safeLower(d.imei).endsWith(q)))
                if (bd) { matchedUnit = { batch: b, device: bd }; break }
              }
            }

            const displayBatches = q ? scopedBatches.filter(b =>
              safeLower(b.batchNumber).includes(q) ||
              safeLower(b.refurbCenterName).includes(q) ||
              b.devices.some(d => d && (safeLower(d.imei).includes(q) || safeLower(d.model).includes(q)))
            ) : scopedBatches

            return (
              <div className="space-y-4">
                <div className="bg-amber-900 text-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <h2 className="font-extrabold text-base">Stage 3: Refurb Repair Batches &amp; Real-Time SLA Timers</h2>
                    <p className="text-xs text-amber-200 font-medium">Track physical handover manifests, dispatch turnaround timers, and 🔴 RE-REPAIR stock flags per batch.</p>
                  </div>
                  {currentUser?.role !== 'REFURB' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => { setBatchModalMode('CREATE_NEW'); setBatchStep(1); setShowNewBatch(true) }} className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl transition shadow-sm flex items-center gap-1.5">
                        <Plus className="w-4 h-4" /> Create New Batch
                      </button>
                      <button onClick={() => { setBatchModalMode('ADD_TO_EXISTING'); setShowNewBatch(true) }} className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white font-extrabold text-xs rounded-xl transition shadow-sm flex items-center gap-1.5">
                        <Layers className="w-4 h-4" /> Add Stock to Existing Batch
                      </button>
                      <button onClick={() => setShowScanFaultModal(true)} className="px-3.5 py-2 bg-amber-300 text-amber-950 hover:bg-amber-200 font-black text-xs rounded-xl transition shadow-sm flex items-center gap-1.5">
                        <Barcode className="w-4 h-4" /> ⚡ Scan IMEI with Faults
                      </button>
                    </div>
                  )}
                </div>

                {/* BATCH IMEI SEARCH & BARCODE SCANNER */}
                <form onSubmit={e => { e.preventDefault(); if (matchedUnit && !matchedUnit.device.returned) quickReturnSingleDevice(matchedUnit.batch.id, matchedUnit.device.deviceId, matchedUnit.device.imei) }} className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <QrCode className="w-6 h-6 text-amber-700 shrink-0" />
                    <div className="flex-1">
                      <label className="block text-xs font-black text-amber-950 mb-1">
                        🔍 Scan or Type IMEI to Locate Batch &amp; Move / Return Stock
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={batchScanImei}
                          onChange={e => setBatchScanImei(e.target.value)}
                          placeholder="Scan 15-digit IMEI barcode or type Batch Number / Model..."
                          className="w-full bg-white border border-amber-300 rounded-xl pl-3 pr-24 py-2.5 text-sm font-mono font-bold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-600 shadow-inner"
                        />
                        {batchScanImei && (
                          <button type="button" onClick={() => setBatchScanImei('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-600 text-xs font-bold bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-lg">
                            Clear Search
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* LOCATED DEVICE HIGHLIGHT CARD */}
                  {matchedUnit && (
                    <div className={`rounded-xl p-4 flex items-center justify-between shadow-sm flex-wrap gap-3 border-2 ${matchedUnit.device.isReRepair && !matchedUnit.device.returned ? 'bg-red-100 border-red-500' : 'bg-amber-100 border-amber-400'}`}>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-200 px-2.5 py-1 rounded-full border border-amber-300">
                            📍 LOCATED IN {matchedUnit.batch.batchNumber}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                            matchedUnit.device.isReRepair && !matchedUnit.device.returned
                              ? 'bg-red-600 text-white border-red-700 font-black shadow-xs'
                              : matchedUnit.device.returned
                              ? 'bg-purple-200 text-purple-900 border-purple-300'
                              : 'bg-amber-200 text-amber-900 border-amber-300'
                          }`}>
                            {matchedUnit.device.isReRepair && !matchedUnit.device.returned ? '🔴 RE-REPAIR IN BATCH' : matchedUnit.device.returned ? '✓ RETURNED TO STEP 4 (AFTER-FIX QC)' : '⏱️ IN REPAIR (STAGE 3)'}
                          </span>
                        </div>
                        <p className="font-extrabold text-amber-950 text-base mt-1.5">
                          Apple iPhone {matchedUnit.device.model} {matchedUnit.device.color} — <span className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-amber-300">{matchedUnit.device.imei}</span>
                        </p>
                        <p className="text-xs text-amber-900 mt-0.5 font-medium">
                          Refurb Center: <strong>{matchedUnit.batch.refurbCenterName}</strong> | Dispatched: {new Date(matchedUnit.batch.sentAt).toLocaleString('en-GB')}
                        </p>
                        {matchedUnit.device.reRepairNotes && (
                          <p className="text-xs font-bold text-red-900 bg-red-200/80 px-3 py-1 rounded-lg mt-2 border border-red-300 inline-block">
                            📝 Re-Repair Note: &quot;{matchedUnit.device.reRepairNotes}&quot;
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!matchedUnit.device.returned ? (
                          <button
                            type="button"
                            onClick={() => quickReturnSingleDevice(matchedUnit!.batch.id, matchedUnit!.device.deviceId, matchedUnit!.device.imei)}
                            className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                          >
                            ➔ Move Stock to Step 4 (After-Fix QC)
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setReRepairModalData({ batchId: matchedUnit!.batch.id, deviceId: matchedUnit!.device.deviceId, imei: matchedUnit!.device.imei, model: matchedUnit!.device.model, color: matchedUnit!.device.color, existingNotes: matchedUnit!.device.reRepairNotes || '' })
                              setReRepairNoteInput(matchedUnit!.device.reRepairNotes || '')
                            }}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                          >
                            🔴 Return Stock to Batch (Re-Repair Note)
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openBatch(matchedUnit!.batch)}
                          className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl flex items-center gap-1"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit Batch
                        </button>
                      </div>
                    </div>
                  )}
                </form>

                {displayBatches.length === 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500 text-sm">
                    No batches match search query &quot;{batchScanImei}&quot;.
                  </div>
                )}

                {displayBatches.map(batch => (
                  <div key={batch.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 flex items-center gap-3 flex-wrap border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-gray-900 text-base font-mono">{batch.batchNumber}</p>
                          <button title="Edit Batch Number" onClick={() => { setRenameBatchModal(batch); setNewBatchNumberInput(batch.batchNumber) }} className="p-1 text-gray-400 hover:text-amber-700">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">Dispatched: {new Date(batch.sentAt).toLocaleString('en-GB')}</p>
                      </div>

                      {batch.status !== 'RETURNED' && <LiveBatchTimer sentAt={batch.sentAt} />}

                      <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                        <Building2 className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-xs font-bold text-amber-900">{batch.refurbCenterName}</span>
                      </div>

                      <span className="text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full font-bold">{batch.devices.length} Devices</span>

                      <div className="ml-auto flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            setScanFaultForm({
                              imei: '',
                              model: '15 PRO',
                              storage: '128GB',
                              color: 'BLACK',
                              costAed: '1400',
                              faults: [],
                              notes: '',
                              destination: 'REPAIR_BATCH',
                              targetBatchId: batch.id
                            })
                            setShowScanFaultModal(true)
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-sm transition"
                          title="Scan 15-digit IMEI barcode and write detailed faults for this batch"
                        >
                          <Barcode className="w-3.5 h-3.5" /> ⚡ Scan Units to Batch
                        </button>
                        <button onClick={() => setHandoverModal(batch)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-xs font-bold text-amber-800 hover:bg-amber-100 shadow-sm">
                          <Printer className="w-3.5 h-3.5 text-amber-600" /> Handover Voucher
                        </button>
                        <button onClick={() => openBatch(batch)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-bold hover:bg-gray-800">
                          <Wrench className="w-3.5 h-3.5" /> Manage Batch &amp; Return Stock
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 px-5 py-3 space-y-1.5 bg-gray-50/50">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Device List (Click unit pill: ➔ Move to Step 4 After-Fix QC or 🔴 Return to Repair Batch with Re-Repair Note):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {batch.devices.map(d => {
                          const isHighlighted = q && (d.imei.toLowerCase().includes(q) || d.model.toLowerCase().includes(q))
                          return (
                            <div key={d.deviceId} className="inline-flex items-center gap-1">
                              <button
                                onClick={() => {
                                  if (d.returned) {
                                    setReRepairModalData({ batchId: batch.id, deviceId: d.deviceId, imei: d.imei, model: d.model, color: d.color, existingNotes: d.reRepairNotes || '' })
                                    setReRepairNoteInput(d.reRepairNotes || '')
                                  } else {
                                    quickReturnSingleDevice(batch.id, d.deviceId, d.imei)
                                  }
                                }}
                                title={d.reRepairNotes ? `RE-REPAIR NOTE: "${d.reRepairNotes}"` : (d.returned ? "Click to Return Stock for Re-Repair" : "Click to Move Stock to Step 4 (After-Fix QC)")}
                                className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border font-mono transition shadow-xs cursor-pointer ${
                                  isHighlighted
                                    ? 'ring-2 ring-amber-500 bg-amber-300 text-amber-950 font-black border-amber-500 scale-105 shadow-md'
                                    : d.isReRepair && !d.returned
                                    ? 'bg-red-600 text-white font-extrabold border-2 border-red-800 shadow-md hover:bg-red-700'
                                    : d.returned
                                    ? 'bg-purple-100 text-purple-900 border-purple-300 font-bold hover:bg-purple-200'
                                    : 'bg-white text-gray-800 border-gray-300 hover:border-amber-500 hover:bg-amber-50'
                                }`}
                              >
                                {d.isReRepair && !d.returned ? '🔴 RE-REPAIR: ' : d.returned ? '✓ Step 4: ' : '↩ Batch: '}
                                {d.model} {d.color} ({d.imei.slice(-4)})
                                {d.isReRepair && !d.returned && (
                                  <LiveUnitTimer sentAt={d.reRepairSentAt || batch.sentAt} />
                                )}
                              </button>

                              {d.isReRepair && !d.returned && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReRepairModalData({ batchId: batch.id, deviceId: d.deviceId, imei: d.imei, model: d.model, color: d.color, existingNotes: d.reRepairNotes || '' })
                                    setReRepairNoteInput(d.reRepairNotes || '')
                                  }}
                                  className="text-[10px] bg-red-900 hover:bg-black text-white px-1.5 py-0.5 rounded font-extrabold shadow-xs"
                                  title="Edit Re-Repair Note"
                                >
                                  📝 Note
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeDeviceFromBatch(batch.id, d.deviceId, d.imei)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                title="Remove / Delete this unit from batch"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}

          {/* TAB 6: AFTER-FIX QC DESK */}
          {tab === 'afterFixQc' && (
            <div className="space-y-4">
              <div className="bg-purple-900 text-white rounded-2xl p-5 shadow-sm space-y-1">
                <h2 className="font-extrabold text-base">Stage 4: After-Fix QC Verification Desk</h2>
                <p className="text-xs text-purple-200">Verify repaired stock returning from refurb centers. Check fixed faults, prompt unit raw cost &amp; repair fee, or process in-house chargebacks.</p>
              </div>

              <form onSubmit={e => { e.preventDefault(); locateUnitByImei(afterFixScanImei) }} className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                <QrCode className="w-6 h-6 text-purple-700 shrink-0" />
                <div className="flex-1">
                  <label className="block text-xs font-bold text-purple-900 mb-1">
                    🔍 Scan IMEI Barcode to Instantly Open &amp; Verify After-Fix QC
                  </label>
                  <input
                    type="text"
                    value={afterFixScanImei}
                    onChange={e => setAfterFixScanImei(e.target.value)}
                    placeholder="Scan 15-digit IMEI barcode here..."
                    className="w-full bg-white border border-purple-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-inner"
                  />
                </div>
                <button type="submit" className="px-5 py-2.5 bg-purple-800 hover:bg-purple-900 text-white font-extrabold text-xs rounded-lg transition shadow-sm shrink-0 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-300" /> Verify Scanned IMEI
                </button>
              </form>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="min-w-full text-xs">
                  <thead className="bg-purple-100 text-purple-900 font-bold border-b border-purple-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-mono">Batch Number &amp; Refurb Center</th>
                      <th className="px-4 py-3 text-left">Model / Storage</th>
                      <th className="px-4 py-3 text-left">Color</th>
                      <th className="px-4 py-3 text-left font-mono">IMEI</th>
                      <th className="px-4 py-3 text-left">Reported Initial Faults</th>
                      <th className="px-4 py-3 text-center">After-Fix QC Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {afterFixQcDevices.map((d, i) => {
                      const bInfo = getBatchInfoForDevice(d.id, d.imei)
                      return (
                        <tr key={d.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-purple-50/20'}`}>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                              <Tag className="w-3.5 h-3.5 text-amber-600" /> {bInfo.batchNumber}
                            </span>
                            <div className="text-[10px] text-gray-500 font-semibold mt-0.5">{bInfo.centerName}</div>
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-900">{d.model} {d.storage}</td>
                          <td className="px-4 py-3">{d.color}</td>
                          <td className="px-4 py-3 font-mono text-purple-950 font-black text-sm">{d.imei}</td>
                          <td className="px-4 py-3 font-semibold text-orange-900">{d.faults || 'General Repair'}</td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => openAfterFixQcModal(d)} className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-extrabold rounded-lg text-xs transition shadow-sm inline-flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-purple-300" /> Verify After-Fix QC
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: READY TO SELL & SOLD STOCK */}
          {tab === 'readyToSell' && (
            <div className="space-y-4">
              <div className="bg-green-900 text-white rounded-2xl p-5 shadow-sm space-y-1">
                <h2 className="font-extrabold text-base">Stage 5: Ready to Sell &amp; Sold Stock Management</h2>
                <p className="text-xs text-green-200">QC Passed stock with verified unit raw cost &amp; repair fees, ready for commercial client sales invoicing, plus complete sold stock history.</p>
              </div>

              {/* Sub-Tab Navigation Bar */}
              <div className="flex gap-2 border-b border-gray-200 pb-3">
                <button
                  type="button"
                  onClick={() => setReadyToSellSubTab('available')}
                  className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 border ${
                    readyToSellSubTab === 'available'
                      ? 'bg-green-700 text-white border-green-700 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50'
                  }`}
                >
                  🟢 1. Ready to Sell Stock ({readyToSellDevices.length} Units Available)
                </button>
                <button
                  type="button"
                  onClick={() => setReadyToSellSubTab('sold')}
                  className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 border ${
                    readyToSellSubTab === 'sold'
                      ? 'bg-red-700 text-white border-red-700 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-red-50'
                  }`}
                >
                  🔴 2. Sold Stock History &amp; Profitability ({soldDevices.length} Units Sold)
                </button>
              </div>

              {/* Sub-Section 1: Ready to Sell Stock */}
              {readyToSellSubTab === 'available' && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <table className="min-w-full text-xs">
                    <thead className="bg-green-50 text-green-900 font-bold border-b border-green-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-mono">Origin Batch #</th>
                        <th className="px-4 py-3 text-left">Model</th>
                        <th className="px-4 py-3 text-left">Storage / Color</th>
                        <th className="px-4 py-3 text-left font-mono">IMEI (Click for Passport)</th>
                        <th className="px-4 py-3 text-right">Raw Cost (AED)</th>
                        <th className="px-4 py-3 text-right">Repair Fee (AED)</th>
                        <th className="px-4 py-3 text-right">Total Unit Cost</th>
                        <th className="px-4 py-3 text-center">Status / Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {readyToSellDevices.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-gray-400 text-xs">
                            No units currently available in Ready to Sell stock.
                          </td>
                        </tr>
                      )}
                      {readyToSellDevices.map((d, i) => {
                        const bInfo = getBatchInfoForDevice(d.id, d.imei)
                        const totalCost = (d.costAed || 0) + (d.repairCostAed || 0)
                        return (
                          <tr key={d.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-green-50/20'}`}>
                            <td className="px-4 py-3 font-mono font-bold text-amber-800">{bInfo.batchNumber}</td>
                            <td className="px-4 py-3 font-bold text-gray-900">{d.model}</td>
                            <td className="px-4 py-3">{d.storage} — {d.color}</td>
                            <td className="px-4 py-3 font-mono">
                              <button
                                type="button"
                                onClick={() => setViewDevicePassport(d)}
                                title="Click unit IMEI to view refurb center cost & full passport"
                                className="text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
                              >
                                {d.imei}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">AED {(d.costAed || 0).toFixed(2)}</td>
                            <td className="px-4 py-3 text-right text-amber-700 font-semibold">AED {(d.repairCostAed || 0).toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-black text-green-800">AED {totalCost.toFixed(2)}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <SBadge s={d.status} />
                                <button
                                  type="button"
                                  onClick={() => setViewDevicePassport(d)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-lg border border-slate-300 transition"
                                >
                                  🔍 Passport
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sub-Section 2: Sold Stock History */}
              {readyToSellSubTab === 'sold' && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <table className="min-w-full text-xs">
                    <thead className="bg-red-50 text-red-950 font-bold border-b border-red-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-mono">Origin Batch #</th>
                        <th className="px-4 py-3 text-left">Model / Storage</th>
                        <th className="px-4 py-3 text-left font-mono">IMEI (Click for Passport)</th>
                        <th className="px-4 py-3 text-left">Client Billed</th>
                        <th className="px-4 py-3 text-right">Total Cost (AED)</th>
                        <th className="px-4 py-3 text-right">Sale Price (AED)</th>
                        <th className="px-4 py-3 text-right">Net Profit (Margin %)</th>
                        <th className="px-4 py-3 text-center">Passport / Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {soldDevices.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-gray-400 text-xs">
                            No sold devices recorded in history yet.
                          </td>
                        </tr>
                      )}
                      {soldDevices.map((d, i) => {
                        const bInfo = getBatchInfoForDevice(d.id, d.imei)
                        const assocSale = sales.find(s => s.deviceId === d.id || s.id === d.saleId || s.imei === d.imei || (s.items && s.items.some(it => it.deviceId === d.id || it.imei === d.imei)))
                        const totalCost = (d.costAed || 0) + (d.repairCostAed || 0)
                        const salePrice = assocSale ? assocSale.sellingPriceAed : (d.sellingPriceAed || 0)
                        const profit = salePrice > 0 ? salePrice - totalCost : 0
                        const marginPct = salePrice > 0 ? ((profit / salePrice) * 100).toFixed(1) : '0'

                        return (
                          <tr key={d.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-red-50/10'}`}>
                            <td className="px-4 py-3 font-mono font-bold text-amber-800">{bInfo.batchNumber}</td>
                            <td className="px-4 py-3 font-bold text-gray-900">{d.model} {d.storage} — {d.color}</td>
                            <td className="px-4 py-3 font-mono">
                              <button
                                type="button"
                                onClick={() => setViewDevicePassport(d)}
                                title="Click unit IMEI to view refurb center cost & full passport"
                                className="text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
                              >
                                {d.imei}
                              </button>
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-900">
                              {assocSale ? assocSale.customerName : 'Walk-in Customer'}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-gray-600">AED {totalCost.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-mono font-black text-blue-900">AED {salePrice.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-mono font-black">
                              <span className={profit >= 0 ? 'text-green-700' : 'text-red-700'}>
                                AED {profit.toFixed(2)} ({marginPct}%)
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setViewDevicePassport(d)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-lg border border-slate-300 transition"
                                >
                                  🔍 Passport
                                </button>
                                {assocSale && (
                                  <button
                                    type="button"
                                    onClick={() => openInvoiceForSale(assocSale)}
                                    className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white font-bold text-[11px] rounded-lg transition inline-flex items-center gap-1"
                                  >
                                    <Printer className="w-3 h-3" /> Invoice
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: MASTER CHECK */}
          {tab === 'masterCheck' && (
            <div className="space-y-4">
              <div className="bg-red-950 text-white rounded-2xl p-5 shadow-sm space-y-1">
                <h2 className="font-extrabold text-base">Stage 6: Master Check Admin Desk</h2>
                <p className="text-xs text-red-200">Requires Senior Admin passcode authorization for failed or special case releases.</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="min-w-full text-xs">
                  <thead className="bg-red-50 text-red-950 font-bold border-b border-red-200">
                    <tr>
                      <th className="px-4 py-3 text-left">Model / Storage</th>
                      <th className="px-4 py-3 text-left">Color</th>
                      <th className="px-4 py-3 text-left font-mono">IMEI</th>
                      <th className="px-4 py-3 text-left">Reason / Master Check Status</th>
                      <th className="px-4 py-3 text-center">Admin Approval</th>
                    </tr>
                  </thead>
                  <tbody>
                    {masterCheckPendingDevices.map(d => (
                      <tr key={d.id} className="border-b border-gray-100 bg-red-50/20">
                        <td className="px-4 py-3 font-bold text-gray-900">{d.model} {d.storage}</td>
                        <td className="px-4 py-3">{d.color}</td>
                        <td className="px-4 py-3 font-mono text-gray-800 font-bold">{d.imei}</td>
                        <td className="px-4 py-3 text-red-800 font-bold">🔒 Master Check Required</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => setMasterCheckModalDevice(d)} className="px-4 py-1.5 bg-red-900 hover:bg-black text-white font-extrabold rounded-lg text-xs">
                            Unlock &amp; Approve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9: REFURB ACCOUNTS & PAYABLES */}
          {tab === 'accounts' && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="font-extrabold text-base">Refurb Center Accounts &amp; Payables Ledger</h2>
                  <p className="text-xs text-slate-400">Total Unpaid Balance = Repair Fees Passed - In-House Chargebacks - Payments Made.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {centers.map(c => (
                  <div key={c.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-black text-base text-gray-900">{c.name}</h3>
                        <p className="text-xs text-gray-500">{c.contact || 'No contact specified'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">UNPAID BALANCE:</p>
                        <p className="text-xl font-black text-red-700 font-mono">AED {(c.unpaidBalanceAed || 0).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-xl">
                      <div><span className="text-gray-500">Total Repair Fees:</span> <strong className="block text-gray-900 font-mono">AED {(c.totalPayableAed || 0).toFixed(2)}</strong></div>
                      <div><span className="text-gray-500">Total Paid to Center:</span> <strong className="block text-green-700 font-mono">AED {(c.totalPaidAed || 0).toFixed(2)}</strong></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setPaymentModalCenter(c)} className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-xs">Record Payment</button>
                      <button onClick={() => setViewStatementCenter(c)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300">View Statement</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 10: REFURB CENTERS */}
          {tab === 'centers' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
                <h2 className="font-extrabold text-base text-gray-900">Refurb Centers Directory ({centers.length})</h2>
                <button onClick={() => setShowAddCenter(true)} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl">
                  + Add New Refurb Center
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {safeCenters.map(c => (
                  <div key={c.id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-2 relative">
                    <div className="flex justify-between items-start">
                      <h3 className="font-black text-gray-900 text-base">{c.name}</h3>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditCenterModal(c)} title="Edit Refurb Center" className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg">
                          <Pencil className="w-4 h-4" />
                        </button>
                        {currentUser?.role === 'ADMIN' && (
                          <button onClick={() => deleteRefurbCenter(c.id)} title="Delete Refurb Center" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">📞 {c.contact || 'No Phone'}</p>
                    <p className="text-xs text-gray-500">📍 {c.address || 'Dubai, UAE'}</p>
                    {c.notes && <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg">{c.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 11: SALES & INVOICES */}
          {tab === 'sales' && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-1">
                <h2 className="font-extrabold text-base">Commercial Sales &amp; Invoices Ledger ({sales.length} Invoices)</h2>
                <p className="text-xs text-slate-400">Total Sales Value: <strong>AED {totalSalesAed.toFixed(2)}</strong></p>
              </div>

              {/* IMEI BARCODE SEARCH & INVOICE GENERATOR */}
              <form onSubmit={handleSalesScanSubmit} className="bg-slate-900 border border-slate-700 rounded-2xl p-4 flex items-center gap-3 shadow-md">
                <QrCode className="w-6 h-6 text-emerald-400 shrink-0" />
                <div className="flex-1">
                  <label className="block text-xs font-extrabold text-slate-200 mb-1">
                    🔍 Scan or Type IMEI to Open Commercial Invoice or Move Unit to Invoice
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={salesScanImei}
                      onChange={e => setSalesScanImei(e.target.value)}
                      placeholder="Scan 15-digit IMEI barcode or type IMEI..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3 pr-24 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
                    />
                    {salesScanImei && (
                      <button type="button" onClick={() => setSalesScanImei('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg">
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition shadow-md shrink-0 flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4" /> Move to Invoice
                </button>
              </form>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-100 font-bold border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left">Invoice #</th>
                      <th className="px-4 py-3 text-left">Customer Name</th>
                      <th className="px-4 py-3 text-left">Model</th>
                      <th className="px-4 py-3 text-left font-mono">IMEI</th>
                      <th className="px-4 py-3 text-left">Payment Method</th>
                      <th className="px-4 py-3 text-right">Sale Price (AED)</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {safeSales.map(s => {
                      const dev = safeDevices.find(d => d && d.id === s.deviceId)
                      return (
                        <tr key={s.id} className="border-b border-gray-100 hover:bg-blue-50/30">
                          <td className="px-4 py-3 font-mono font-bold text-blue-700">{s.invoiceNumber}</td>
                          <td className="px-4 py-3 font-bold text-gray-900">{s.customerName}</td>
                          <td className="px-4 py-3">{s.model}</td>
                          <td className="px-4 py-3 font-mono text-gray-700">{s.imei}</td>
                          <td className="px-4 py-3 font-semibold text-green-700">{s.paymentMethod}</td>
                          <td className="px-4 py-3 text-right font-black text-gray-900">AED {(s.sellingPriceAed || 0).toFixed(2)}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => openInvoiceForSale(s)} title="View / Print Invoice" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                                <Printer className="w-4 h-4" />
                              </button>
                              <button onClick={() => openEditInvoiceModal(s)} title="Edit Invoice" className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteInvoice(s)} title="Delete Invoice (Revert units to ready to sell stock)" className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 12: CLIENT ACCOUNTS & BILLING */}
          {tab === 'clients' && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="font-extrabold text-base flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" /> Client Accounts &amp; Billing Ledger ({clients.length} Clients)
                  </h2>
                  <p className="text-xs text-slate-400">Manage client accounts, move in-stock units to client invoices, and track outstanding credit balances.</p>
                </div>
                <button
                  onClick={() => setShowAddClient(true)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs rounded-xl transition shadow-sm flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" /> + Register New Client Account
                </button>
              </div>

              {/* CLIENT CARDS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.length === 0 ? (
                  <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-gray-200 text-gray-400 italic text-sm">
                    No client accounts registered yet. Register client accounts to bill them and track outstanding balances.
                  </div>
                ) : (
                  clients.map(client => (
                    <div key={client.name} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-black text-base text-gray-900">{client.name}</h3>
                            {client.phone && <p className="text-xs text-gray-500 font-mono">📞 {client.phone}</p>}
                            {client.address && <p className="text-xs text-gray-400">📍 {client.address}</p>}
                          </div>
                          <span className="text-[10px] font-black uppercase text-cyan-900 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">
                            {client.totalInvoicesCount || 0} Invoices
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-xl">
                          <div>
                            <span className="text-gray-500 text-[11px]">Total Billed:</span>
                            <strong className="block text-gray-900 font-mono text-sm font-black">AED {(client.totalBilledAed || 0).toFixed(2)}</strong>
                          </div>
                          <div>
                            <span className="text-gray-500 text-[11px]">Credit Due:</span>
                            <strong className={`block font-mono text-sm font-black ${(client.creditDueAed || 0) > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                              AED {(client.creditDueAed || 0).toFixed(2)}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-1.5 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => {
                            setBillClientTarget(client)
                            setShowBillClientModal(true)
                          }}
                          className="flex-1 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-extrabold text-xs rounded-xl shadow-xs inline-flex items-center justify-center gap-1"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" /> Move Stock &amp; Bill
                        </button>
                        <button
                          onClick={() => setViewClientStatement(client)}
                          className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300"
                        >
                          Invoices ({client.totalInvoicesCount || 0})
                        </button>
                        <button
                          onClick={() => openEditClientModal(client)}
                          title="Edit Client Account"
                          className="p-2 text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 rounded-xl border border-slate-200"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteClientAccount(client.name)}
                          title="Delete Client Account"
                          className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-xl border border-slate-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-2xl text-xs font-black flex items-center gap-2.5 ${toast.ok ? 'bg-slate-900 text-white border border-slate-700' : 'bg-red-600 text-white'}`}>
          {toast.ok ? <Check className="w-4 h-4 text-green-400" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* MODALS */}
      {/* INITIAL QC MODAL */}
      {initialQcModalDevice && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-blue-600" /> Perform Initial QC — {initialQcModalDevice.model}
              </h3>
              <button onClick={() => setInitialQcModalDevice(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleInitialQcSubmit} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs font-mono">
                <p className="font-bold text-blue-900">{initialQcModalDevice.model} ({initialQcModalDevice.color} - {initialQcModalDevice.storage})</p>
                <p className="text-gray-600 mt-0.5">IMEI: {initialQcModalDevice.imei}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Select Inspection Hardware Faults *</label>
                <div className="grid grid-cols-3 gap-1.5 max-h-44 overflow-y-auto p-1 border border-gray-200 rounded-xl">
                  {DIAG_FIELDS.map(f => {
                    const isSel = initialQcFaults.includes(f)
                    return (
                      <button
                        type="button" key={f}
                        onClick={() => setInitialQcFaults(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f])}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition ${isSel ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                      >
                        {isSel ? '✓ ' : '+ '}{f}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Inspector Notes</label>
                <textarea value={initialQcNotes} onChange={e => setInitialQcNotes(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-xl p-2.5 text-xs" placeholder="Inspector observations..." />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setInitialQcModalDevice(null)} className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-bold text-gray-600">Cancel</button>
                <button type="submit" disabled={submittingInitialQc} className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition">
                  {submittingInitialQc ? 'Saving...' : '✓ Complete Initial QC -> Move to RAW QC DONE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AFTER-FIX QC MODAL */}
      {afterFixModalDevice && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" /> After-Fix QC Verification — {afterFixModalDevice.model}
              </h3>
              <button onClick={() => setAfterFixModalDevice(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleAfterFixQcSubmit} className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 text-xs font-mono space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900 text-sm">{afterFixModalDevice.model} ({afterFixModalDevice.color} - {afterFixModalDevice.storage})</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs">
                    <Tag className="w-3.5 h-3.5 text-amber-700" /> Batch: {getBatchInfoForDevice(afterFixModalDevice.id, afterFixModalDevice.imei).batchNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center text-gray-600 text-xs">
                  <span>IMEI: <strong className="text-purple-950 font-black">{afterFixModalDevice.imei}</strong></span>
                  <span>Refurb Center: <strong className="text-gray-900 font-bold">{getBatchInfoForDevice(afterFixModalDevice.id, afterFixModalDevice.imei).centerName}</strong></span>
                </div>
                <p className="text-orange-950 font-bold border-t border-purple-200/60 pt-1 mt-1">Initial Faults: {afterFixModalDevice.faults || 'General Repair'}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select After-Fix Outcome *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => setAfterFixAction('PASS')} className={`p-2.5 rounded-xl font-bold text-xs border text-center ${afterFixAction === 'PASS' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                    🟢 PASS (Ready to Sell)
                  </button>
                  <button type="button" onClick={() => setAfterFixAction('FAIL_RETRY')} className={`p-2.5 rounded-xl font-bold text-xs border text-center ${afterFixAction === 'FAIL_RETRY' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                    🔴 FAIL (Retry Same Refurb Center)
                  </button>
                  <button type="button" onClick={() => setAfterFixAction('FAIL_INHOUSE')} className={`p-2.5 rounded-xl font-bold text-xs border text-center ${afterFixAction === 'FAIL_INHOUSE' ? 'bg-purple-700 text-white border-purple-700' : 'bg-white text-gray-700 border-gray-300'}`}>
                    🛠️ FAIL (Repair In-House &amp; Chargeback)
                  </button>
                </div>
              </div>

              {afterFixAction === 'PASS' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-green-900 uppercase">Unit Cost Accounting Entry:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Raw Unit Intake Cost (AED) *</label>
                      <input type="number" required value={rawCostInput} onChange={e => setRawCostInput(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" placeholder="1400" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">Refurb Repair Fee (AED) *</label>
                      <input type="number" required value={repairCostInput} onChange={e => setRepairCostInput(e.target.value)} className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm font-bold bg-white" placeholder="150" />
                    </div>
                  </div>
                  <p className="text-[10px] text-green-800 font-semibold">Total Unit Cost = AED {(Number(rawCostInput) || 0) + (Number(repairCostInput) || 0)}. Refurb fee will be billed to Refurb Center Account.</p>
                </div>
              )}

              {afterFixAction === 'FAIL_RETRY' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-black text-red-950 uppercase flex items-center gap-1.5">
                    🔴 Re-Repair Reason Note for Refurb Center:
                  </p>
                  <div>
                    <label className="block text-[11px] font-bold text-red-900 mb-1">Enter Re-Repair Notes / Reason *</label>
                    <textarea
                      required
                      value={afterFixNotes}
                      onChange={e => setAfterFixNotes(e.target.value)}
                      rows={3}
                      className="w-full border border-red-300 rounded-lg px-3 py-2 text-xs font-medium bg-white text-gray-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                      placeholder="e.g. Display flicker issue persists after repair, camera lens misaligned..."
                    />
                  </div>
                  <p className="text-[10px] text-red-800 font-extrabold">
                    ✓ Stock will be returned to the SAME repair batch, marked in 🔴 RED with a dedicated live unit turnaround SLA timer!
                  </p>
                </div>
              )}

              {afterFixAction === 'FAIL_INHOUSE' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-red-900 uppercase">In-House Repair Chargeback Penalty:</p>
                  <div>
                    <label className="block text-[11px] font-bold text-red-900 mb-1">In-House Repair Cost to Deduct from Refurb Center (AED) *</label>
                    <input type="number" required value={inhouseRepairCostInput} onChange={e => setInhouseRepairCostInput(e.target.value)} className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm font-bold bg-white" placeholder="e.g. 100" />
                  </div>
                  <p className="text-[10px] text-red-700 font-bold">This amount will be deducted directly from the initial Refurb Center's payable balance as a chargeback penalty.</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setAfterFixModalDevice(null)} className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-bold text-gray-600">Cancel</button>
                <button type="submit" disabled={submittingAfterFix} className="px-5 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs transition">
                  {submittingAfterFix ? 'Processing...' : '✓ Complete After-Fix QC Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RE-REPAIR NOTE MODAL */}
      {reRepairModalData && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <h3 className="font-extrabold text-red-700 text-base flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-red-600" /> Return Stock for RE-REPAIR
              </h3>
              <button onClick={() => setReRepairModalData(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleReRepairSubmit} className="space-y-4 text-xs">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 font-mono">
                <p className="font-bold text-red-950">{reRepairModalData.model} ({reRepairModalData.color})</p>
                <p className="text-red-700 font-bold">IMEI: {reRepairModalData.imei}</p>
                <p className="text-gray-500 text-[11px] mt-1">This unit will be marked with a 🔴 RED RE-REPAIR label inside the batch container.</p>
              </div>

              <div>
                <label className="block font-black text-gray-800 mb-1.5">
                  📝 Re-Repair Reason / Note for Refurb Center *
                </label>
                <textarea
                  required
                  value={reRepairNoteInput}
                  onChange={e => setReRepairNoteInput(e.target.value)}
                  rows={3}
                  className="w-full border border-red-300 rounded-xl p-3 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
                  placeholder="e.g. LCD display flicker issue persists, camera lens misaligned after repair..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setReRepairModalData(null)} className="px-4 py-2 border rounded-lg font-bold text-gray-600">Cancel</button>
                <button type="submit" disabled={submittingReRepair} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl shadow-md">
                  {submittingReRepair ? 'Saving...' : '🔴 Mark RE-REPAIR & Return to Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE BATCH MODAL */}
      {viewBatch && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-gray-900">{viewBatch.batchNumber}</h3>
                <p className="text-xs text-gray-500">{viewBatch.refurbCenterName}</p>
              </div>
              <button onClick={() => setViewBatch(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-700 uppercase">Select Units Returning to After-Fix QC ({viewBatch.devices.length} Items):</p>
              <form onSubmit={e => {
                e.preventDefault()
                const q = modalScanImei.trim().toLowerCase()
                const dev = viewBatch.devices.find(d => d.imei.toLowerCase() === q || d.imei.toLowerCase().endsWith(q))
                if (dev && !dev.returned && !returningIds.includes(dev.deviceId)) {
                  setReturningIds(p => [...p, dev.deviceId])
                  showToast(`Selected IMEI ${dev.imei}!`)
                }
                setModalScanImei('')
              }} className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-purple-700 shrink-0" />
                <input
                  type="text"
                  value={modalScanImei}
                  onChange={e => setModalScanImei(e.target.value)}
                  placeholder="Scan IMEI barcode to select &amp; return unit..."
                  className="flex-1 bg-white border border-purple-300 rounded-lg px-3 py-1.5 text-xs font-mono font-bold"
                />
                <button type="submit" className="px-4 py-1.5 bg-purple-700 text-white font-bold text-xs rounded-lg">Select</button>
              </form>

              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto text-xs">
                <table className="min-w-full">
                  <thead className="bg-gray-100 font-bold border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-center w-8">Return</th>
                      <th className="px-3 py-2 text-left">Model</th>
                      <th className="px-3 py-2 text-left font-mono">IMEI</th>
                      <th className="px-3 py-2 text-left">Faults</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewBatch.devices.map(d => (
                      <tr key={d.deviceId} className={`border-b border-gray-100 ${d.returned || returningIds.includes(d.deviceId) ? 'bg-purple-50 font-bold' : 'bg-white'}`}>
                        <td className="px-3 py-2 text-center">
                          <input type="checkbox" checked={d.returned || returningIds.includes(d.deviceId)} disabled={d.returned} onChange={() => setReturningIds(p => p.includes(d.deviceId) ? p.filter(x => x !== d.deviceId) : [...p, d.deviceId])} />
                        </td>
                        <td className="px-3 py-2 font-bold text-gray-900">{d.model} {d.color}</td>
                        <td className="px-3 py-2 font-mono">{d.imei}</td>
                        <td className="px-3 py-2 text-orange-900">{d.faults}</td>
                        <td className="px-3 py-2 text-center">
                          {d.returned || returningIds.includes(d.deviceId) ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">✓ In After-Fix QC</span> : <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">In Repair</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button type="button" onClick={() => setViewBatch(null)} className="px-4 py-2 rounded-lg border text-xs font-bold text-gray-600">Cancel</button>
              <button
                type="button"
                disabled={savingBatchDetail}
                onClick={async () => {
                  await saveBatchDetail()
                  if (returningIds.length > 0) setTab('afterFixQc')
                }}
                className="px-6 py-2 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl shadow-md"
              >
                {savingBatchDetail ? 'Processing...' : `✓ Move ${returningIds.length > 0 ? returningIds.length : ''} Selected Unit(s) to Step 4 (After-Fix QC)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH MANAGEMENT MODAL (NEW OR ADD STOCK) */}
      {showNewBatch && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBatchModalMode('CREATE_NEW')}
                  className={`px-3 py-1.5 rounded-lg font-extrabold text-xs transition ${batchModalMode === 'CREATE_NEW' ? 'bg-amber-500 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  ➕ Create New Repair Batch
                </button>
                <button
                  type="button"
                  onClick={() => setBatchModalMode('ADD_TO_EXISTING')}
                  className={`px-3 py-1.5 rounded-lg font-extrabold text-xs transition ${batchModalMode === 'ADD_TO_EXISTING' ? 'bg-amber-700 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  📥 Add Stock to Existing Batch
                </button>
              </div>
              <button onClick={() => setShowNewBatch(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            {batchModalMode === 'ADD_TO_EXISTING' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Select Open Active Batch *</label>
                  <select
                    value={existingBatchTargetId}
                    onChange={e => setExistingBatchTargetId(e.target.value)}
                    className="w-full border border-amber-300 rounded-xl px-3 py-2 text-sm font-bold text-amber-950 bg-amber-50/40"
                  >
                    <option value="">-- Choose Existing Active Batch --</option>
                    {safeBatches.filter(b => b.status === 'SENT' || b.status === 'IN_REPAIR' || b.status === 'PARTIALLY_RETURNED').map(b => (
                      <option key={b.id} value={b.id}>{b.batchNumber} ({b.refurbCenterName}) — {b.devices.length} units</option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="font-bold text-gray-700 uppercase mb-2">Select Stock to Add ({selectableBatchDevices.length} available):</p>
                  <div className="border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto text-xs">
                    <table className="min-w-full">
                      <thead className="bg-gray-100 font-bold border-b border-gray-200">
                        <tr>
                          <th className="px-3 py-2 w-8"><input type="checkbox" onChange={e => setSelectedBatchDeviceIds(e.target.checked ? selectableBatchDevices.map(d => d.id) : [])} /></th>
                          <th className="px-3 py-2 text-left">Model</th>
                          <th className="px-3 py-2 text-left font-mono">IMEI</th>
                          <th className="px-3 py-2 text-left">Faults</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectableBatchDevices.map(d => (
                          <tr key={d.id} className="border-b border-gray-100 hover:bg-amber-50 cursor-pointer" onClick={() => setSelectedBatchDeviceIds(p => p.includes(d.id) ? p.filter(x => x !== d.id) : [...p, d.id])}>
                            <td className="px-3 py-2"><input type="checkbox" checked={selectedBatchDeviceIds.includes(d.id)} readOnly /></td>
                            <td className="px-3 py-2 font-bold">{d.model} {d.color}</td>
                            <td className="px-3 py-2 font-mono">{d.imei}</td>
                            <td className="px-3 py-2 text-orange-900 font-semibold">{d.faults || 'RAW QC DONE'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button type="button" onClick={() => setShowNewBatch(false)} className="px-4 py-2 rounded-lg border text-xs font-bold text-gray-600">Cancel</button>
                  <button
                    type="button"
                    disabled={savingBatch || !existingBatchTargetId || selectedBatchDeviceIds.length === 0}
                    onClick={() => addStockToExistingBatch()}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md"
                  >
                    {savingBatch ? 'Adding...' : `✓ Add ${selectedBatchDeviceIds.length} Unit(s) to Batch`}
                  </button>
                </div>
              </div>
            )}

            {batchModalMode === 'CREATE_NEW' && batchStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Refurb Center *</label>
                  <select value={batchCenter} onChange={e => setBatchCenter(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm font-bold">
                    <option value="">Select a refurb center...</option>
                    {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-700 uppercase mb-2">Select Stock Eligible for Dispatch ({selectableBatchDevices.length} available):</p>
                  <div className="border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto text-xs">
                    <table className="min-w-full">
                      <thead className="bg-gray-100 font-bold border-b border-gray-200">
                        <tr>
                          <th className="px-3 py-2 w-8"><input type="checkbox" onChange={e => setSelectedBatchDeviceIds(e.target.checked ? selectableBatchDevices.map(d => d.id) : [])} /></th>
                          <th className="px-3 py-2 text-left">Model</th>
                          <th className="px-3 py-2 text-left font-mono">IMEI</th>
                          <th className="px-3 py-2 text-left">Faults</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectableBatchDevices.map(d => (
                          <tr key={d.id} className="border-b border-gray-100 hover:bg-amber-50 cursor-pointer" onClick={() => setSelectedBatchDeviceIds(p => p.includes(d.id) ? p.filter(x => x !== d.id) : [...p, d.id])}>
                            <td className="px-3 py-2"><input type="checkbox" checked={selectedBatchDeviceIds.includes(d.id)} readOnly /></td>
                            <td className="px-3 py-2 font-bold">{d.model} {d.color}</td>
                            <td className="px-3 py-2 font-mono">{d.imei}</td>
                            <td className="px-3 py-2 text-orange-900 font-semibold">{d.faults || 'RAW QC DONE'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button onClick={() => setShowNewBatch(false)} className="px-4 py-2 rounded-lg border text-xs font-bold text-gray-600">Cancel</button>
                  <button disabled={!batchCenter || selectedBatchDeviceIds.length === 0} onClick={() => setBatchStep(2)} className="px-5 py-2 bg-amber-500 text-white font-extrabold text-xs rounded-xl">Next →</button>
                </div>
              </div>
            )}

            {batchModalMode === 'CREATE_NEW' && batchStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Batch Number</label>
                  <input value={batchMeta.batchNumber} onChange={e => setBatchMeta(f => ({ ...f, batchNumber: e.target.value }))} className="w-full border border-amber-300 rounded-xl px-3 py-2 text-sm font-bold font-mono" placeholder="e.g. BATCH-2026-0004" />
                </div>
                <div className="flex justify-between gap-3 pt-3 border-t border-gray-100">
                  <button onClick={() => setBatchStep(1)} className="px-4 py-2 rounded-lg border text-xs font-bold text-gray-600">← Back</button>
                  <button disabled={savingBatch} onClick={createBatch} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl">{savingBatch ? 'Creating...' : '✓ Create Batch & Dispatch'}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RECORD SALE / SELL DEVICE MODAL */}
      {sellDevice && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 space-y-4 my-6">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" /> Record Sale &amp; Issue Commercial Invoice
              </h3>
              <button onClick={() => setSellDevice(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={async e => {
              e.preventDefault()
              const itemsToSell = invoiceDraftItems.length > 0 ? invoiceDraftItems : [
                {
                  deviceId: sellDevice.id,
                  imei: sellDevice.imei,
                  model: sellDevice.model,
                  storage: sellDevice.storage,
                  color: sellDevice.color,
                  sellingPriceAed: Number(addForm.sellingPriceAed) || 0
                }
              ]
              if (itemsToSell.length === 0) {
                showToast('Select at least one unit for the invoice', false)
                return
              }
              setSaving(true)
              const pType = addForm.paymentTermType === 'CREDIT' ? 'CREDIT' : 'CASH'
              const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  items: itemsToSell,
                  customerName: addForm.customerName || 'Walk-in Customer',
                  customerPhone: addForm.customerPhone || '',
                  paymentTermType: pType,
                  creditDueDate: pType === 'CREDIT' ? (addForm.creditDueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)) : null,
                  notes: addForm.notes || ''
                })
              })
              const data = await res.json(); setSaving(false)
              if (res.ok) {
                await loadData()
                setSellDevice(null)
                setInvoiceDraftItems([])
                showToast(`🧾 Commercial Invoice ${data.sale.invoiceNumber} (${data.sale.items?.length || 1} units) generated!`)
                openInvoiceForSale(data.sale)
              } else showToast(data.error || 'Error', false)
            }} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Select Client Account or Type Name *</label>
                {clients.length > 0 && (
                  <select
                    value={clients.some(c => c.name === addForm.customerName) ? addForm.customerName : ''}
                    onChange={e => {
                      const selName = e.target.value
                      const selClient = clients.find(c => c.name === selName)
                      setAddForm(f => ({
                        ...f,
                        customerName: selName,
                        customerPhone: selClient?.phone || f.customerPhone
                      }))
                    }}
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs mb-1 font-bold text-cyan-900 bg-cyan-50/50"
                  >
                    <option value="">-- Choose Registered Client Account --</option>
                    {clients.map(c => <option key={c.name} value={c.name}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
                  </select>
                )}
                <input
                  required
                  value={addForm.customerName || ''}
                  onChange={e => setAddForm(f => ({ ...f, customerName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs font-bold"
                  placeholder="Client / Company Name (e.g. Walk-in Customer)"
                />
              </div>

              {/* DRAFT INVOICE MULTI-UNIT SELECTION SECTION */}
              <div className="space-y-2.5 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    Units Included in Invoice ({invoiceDraftItems.length}):
                  </p>
                  <p className="font-black text-xs text-emerald-800 font-mono">
                    Total: AED {invoiceDraftItems.reduce((sum, item) => sum + (item.sellingPriceAed || 0), 0).toFixed(2)}
                  </p>
                </div>

                {/* BARCODE / IMEI SCANNER FOR INVOICE */}
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-white space-y-1.5 shadow-sm">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-emerald-400" /> 🔍 Scan Barcode / Type IMEI to Add Unit
                    </label>
                    <span className="text-[10px] text-slate-400">Press Enter after scanning</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={modalScanImei}
                      onChange={e => setModalScanImei(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const q = modalScanImei.trim().toLowerCase()
                          if (!q) return
                          const target = devices.find(d => d.status !== 'SOLD' && (d.imei.toLowerCase() === q || d.imei.toLowerCase().endsWith(q)))
                          if (!target) {
                            showToast(`❌ Device matching IMEI '${modalScanImei}' not found in stock!`, false)
                            return
                          }
                          if (invoiceDraftItems.some(item => item.deviceId === target.id)) {
                            showToast(`⚠️ Unit IMEI ${target.imei} is already added to this invoice!`, false)
                            setModalScanImei('')
                            return
                          }
                          setInvoiceDraftItems(prev => [
                            ...prev,
                            {
                              deviceId: target.id,
                              imei: target.imei,
                              model: target.model,
                              storage: target.storage,
                              color: target.color,
                              sellingPriceAed: Number(target.sellingPriceAed || target.costAed || 1500)
                            }
                          ])
                          showToast(`✓ Scanned & Added IMEI ${target.imei} (${target.model}) to invoice!`)
                          setModalScanImei('')
                        }
                      }}
                      placeholder="Scan 15-digit IMEI barcode here..."
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const q = modalScanImei.trim().toLowerCase()
                        if (!q) return
                        const target = devices.find(d => d.status !== 'SOLD' && (d.imei.toLowerCase() === q || d.imei.toLowerCase().endsWith(q)))
                        if (!target) {
                          showToast(`❌ Device matching IMEI '${modalScanImei}' not found in stock!`, false)
                          return
                        }
                        if (invoiceDraftItems.some(item => item.deviceId === target.id)) {
                          showToast(`⚠️ Unit IMEI ${target.imei} is already added to this invoice!`, false)
                          setModalScanImei('')
                          return
                        }
                        setInvoiceDraftItems(prev => [
                          ...prev,
                          {
                            deviceId: target.id,
                            imei: target.imei,
                            model: target.model,
                            storage: target.storage,
                            color: target.color,
                            sellingPriceAed: Number(target.sellingPriceAed || target.costAed || 1500)
                          }
                        ])
                        showToast(`✓ Scanned & Added IMEI ${target.imei} (${target.model}) to invoice!`)
                        setModalScanImei('')
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-lg shrink-0 transition"
                    >
                      + Scan &amp; Add
                    </button>
                  </div>
                </div>

                {/* BULK SELLING PRICE CONTROL BAR */}
                {invoiceDraftItems.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs shadow-xs">
                    <div className="flex items-center gap-1 font-extrabold text-amber-900 shrink-0">
                      <DollarSign className="w-4 h-4 text-amber-700" />
                      <span>Bulk Price Change:</span>
                    </div>
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <input
                        type="number"
                        value={bulkPriceInput}
                        onChange={e => setBulkPriceInput(e.target.value)}
                        placeholder="Price (AED) e.g. 1500"
                        className="w-36 bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = Number(bulkPriceInput)
                          if (!val || val <= 0) {
                            showToast('Enter a valid price to apply in bulk', false)
                            return
                          }
                          setInvoiceDraftItems(prev => prev.map(item => ({ ...item, sellingPriceAed: val })))
                          showToast(`⚡ Set AED ${val} selling price for all ${invoiceDraftItems.length} units in invoice!`)
                          setBulkPriceInput('')
                        }}
                        disabled={!bulkPriceInput}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-lg shrink-0 transition shadow-xs"
                      >
                        Set All Prices ({invoiceDraftItems.length})
                      </button>
                    </div>
                  </div>
                )}

                {/* ADD ANOTHER UNIT PICKER */}
                <div className="flex gap-2">
                  <select
                    value={addDeviceToInvoiceId}
                    onChange={e => setAddDeviceToInvoiceId(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-xl p-2 font-mono text-xs font-bold text-slate-900 bg-white"
                  >
                    <option value="">-- Add another device to invoice --</option>
                    {devices.filter(d => d.status !== 'SOLD' && !invoiceDraftItems.some(item => item.deviceId === d.id)).map(d => (
                      <option key={d.id} value={d.id}>
                        {d.model} {d.color} ({d.storage}) — IMEI: {d.imei}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const d = devices.find(dev => dev.id === addDeviceToInvoiceId)
                      if (d) {
                        setInvoiceDraftItems(prev => [
                          ...prev,
                          {
                            deviceId: d.id,
                            imei: d.imei,
                            model: d.model,
                            storage: d.storage,
                            color: d.color,
                            sellingPriceAed: Number(d.sellingPriceAed || d.costAed || 1500)
                          }
                        ])
                        setAddDeviceToInvoiceId('')
                      }
                    }}
                    disabled={!addDeviceToInvoiceId}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shrink-0"
                  >
                    + Add Unit
                  </button>
                </div>

                {/* DRAFT ITEMS TABLE */}
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-white">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2 text-center">#</th>
                        <th className="p-2 text-left">Model &amp; Spec</th>
                        <th className="p-2 text-left font-mono">IMEI</th>
                        <th className="p-2 text-right">Selling Price (AED)</th>
                        <th className="p-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceDraftItems.length === 0 ? (
                        <tr><td colSpan={5} className="p-4 text-center text-gray-400 italic">No units added yet. Select a unit above.</td></tr>
                      ) : (
                        invoiceDraftItems.map((item, idx) => (
                          <tr key={item.deviceId} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-2 text-center font-bold">{idx + 1}</td>
                            <td className="p-2 font-bold font-sans">{item.model} ({item.storage} {item.color})</td>
                            <td className="p-2 font-mono font-bold text-slate-700">{item.imei}</td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                value={item.sellingPriceAed || ''}
                                onChange={e => {
                                  const val = Number(e.target.value) || 0
                                  setInvoiceDraftItems(prev => prev.map((it, i) => i === idx ? { ...it, sellingPriceAed: val } : it))
                                }}
                                className="w-24 text-right border border-slate-300 rounded px-1.5 py-0.5 font-mono font-bold text-emerald-800"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => setInvoiceDraftItems(prev => prev.filter((_, i) => i !== idx))}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                                title="Remove unit from invoice"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Payment Term *</label>
                  <select
                    value={addForm.paymentTermType || 'CASH'}
                    onChange={e => setAddForm(f => ({ ...f, paymentTermType: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs font-bold"
                  >
                    <option value="CASH">💵 Cash Payment</option>
                    <option value="CREDIT">📝 Credit (Account Due)</option>
                  </select>
                </div>
                {addForm.paymentTermType === 'CREDIT' && (
                  <div>
                    <label className="block font-bold text-amber-800 mb-1">Credit Payment Due Date *</label>
                    <input
                      type="date"
                      required
                      value={addForm.creditDueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)}
                      onChange={e => setAddForm(f => ({ ...f, creditDueDate: e.target.value }))}
                      className="w-full border border-amber-300 rounded-lg p-2 text-xs bg-amber-50/50"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setSellDevice(null)} className="px-4 py-2 border rounded-lg font-bold text-gray-600">Cancel</button>
                <button type="submit" disabled={saving || invoiceDraftItems.length === 0} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg shadow-md">
                  {saving ? 'Saving...' : `🧾 Issue Commercial Invoice (${invoiceDraftItems.length} Units)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER NEW CLIENT MODAL */}
      {showAddClient && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-600" /> Register Client Account
              </h3>
              <button onClick={() => setShowAddClient(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreateClientSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Client / Company Name *</label>
                <input
                  required
                  value={newClientForm.name}
                  onChange={e => setNewClientForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs font-bold"
                  placeholder="e.g. TARIQ AL FAJR MOBILES LLC"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Phone Number</label>
                <input
                  value={newClientForm.phone}
                  onChange={e => setNewClientForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs font-mono"
                  placeholder="+971 50 123 4567"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Address / Location</label>
                <input
                  value={newClientForm.address}
                  onChange={e => setNewClientForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs"
                  placeholder="Deira Mobile Market, Dubai"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowAddClient(false)} className="px-4 py-2 border rounded-lg font-bold text-gray-600">Cancel</button>
                <button type="submit" disabled={savingClient} className="px-5 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-extrabold rounded-xl shadow-md">
                  {savingClient ? 'Saving...' : '✓ Create Client Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOVE STOCK & BILL CLIENT MODAL */}
      {showBillClientModal && billClientTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 space-y-4 my-6">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-cyan-600" /> Move Stock &amp; Issue Commercial Invoice
              </h3>
              <button onClick={() => setShowBillClientModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleBillClientSubmit} className="space-y-4 text-xs">
              <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3">
                <p className="font-bold text-cyan-900">Billed Client Account:</p>
                <p className="text-sm font-black text-slate-900">{billClientTarget.name}</p>
                {billClientTarget.phone && <p className="text-gray-500 font-mono">📞 {billClientTarget.phone}</p>}
              </div>

              {/* DRAFT INVOICE MULTI-UNIT SELECTION SECTION */}
              <div className="space-y-2.5 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    Units Included in Invoice ({invoiceDraftItems.length}):
                  </p>
                  <p className="font-black text-xs text-emerald-800 font-mono">
                    Total: AED {invoiceDraftItems.reduce((sum, item) => sum + (item.sellingPriceAed || 0), 0).toFixed(2)}
                  </p>
                </div>

                {/* BARCODE / IMEI SCANNER FOR INVOICE */}
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-white space-y-1.5 shadow-sm">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-emerald-400" /> 🔍 Scan Barcode / Type IMEI to Add Unit
                    </label>
                    <span className="text-[10px] text-slate-400">Press Enter after scanning</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={modalScanImei}
                      onChange={e => setModalScanImei(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const q = modalScanImei.trim().toLowerCase()
                          if (!q) return
                          const target = devices.find(d => d.status !== 'SOLD' && (d.imei.toLowerCase() === q || d.imei.toLowerCase().endsWith(q)))
                          if (!target) {
                            showToast(`❌ Device matching IMEI '${modalScanImei}' not found in stock!`, false)
                            return
                          }
                          if (invoiceDraftItems.some(item => item.deviceId === target.id)) {
                            showToast(`⚠️ Unit IMEI ${target.imei} is already added to this invoice!`, false)
                            setModalScanImei('')
                            return
                          }
                          setInvoiceDraftItems(prev => [
                            ...prev,
                            {
                              deviceId: target.id,
                              imei: target.imei,
                              model: target.model,
                              storage: target.storage,
                              color: target.color,
                              sellingPriceAed: Number(target.sellingPriceAed || target.costAed || 1500)
                            }
                          ])
                          showToast(`✓ Scanned & Added IMEI ${target.imei} (${target.model}) to invoice!`)
                          setModalScanImei('')
                        }
                      }}
                      placeholder="Scan 15-digit IMEI barcode here..."
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const q = modalScanImei.trim().toLowerCase()
                        if (!q) return
                        const target = devices.find(d => d.status !== 'SOLD' && (d.imei.toLowerCase() === q || d.imei.toLowerCase().endsWith(q)))
                        if (!target) {
                          showToast(`❌ Device matching IMEI '${modalScanImei}' not found in stock!`, false)
                          return
                        }
                        if (invoiceDraftItems.some(item => item.deviceId === target.id)) {
                          showToast(`⚠️ Unit IMEI ${target.imei} is already added to this invoice!`, false)
                          setModalScanImei('')
                          return
                        }
                        setInvoiceDraftItems(prev => [
                          ...prev,
                          {
                            deviceId: target.id,
                            imei: target.imei,
                            model: target.model,
                            storage: target.storage,
                            color: target.color,
                            sellingPriceAed: Number(target.sellingPriceAed || target.costAed || 1500)
                          }
                        ])
                        showToast(`✓ Scanned & Added IMEI ${target.imei} (${target.model}) to invoice!`)
                        setModalScanImei('')
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-lg shrink-0 transition"
                    >
                      + Scan &amp; Add
                    </button>
                  </div>
                </div>

                {/* BULK SELLING PRICE CONTROL BAR */}
                {invoiceDraftItems.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs shadow-xs">
                    <div className="flex items-center gap-1 font-extrabold text-amber-900 shrink-0">
                      <DollarSign className="w-4 h-4 text-amber-700" />
                      <span>Bulk Price Change:</span>
                    </div>
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <input
                        type="number"
                        value={bulkPriceInput}
                        onChange={e => setBulkPriceInput(e.target.value)}
                        placeholder="Price (AED) e.g. 1500"
                        className="w-36 bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = Number(bulkPriceInput)
                          if (!val || val <= 0) {
                            showToast('Enter a valid price to apply in bulk', false)
                            return
                          }
                          setInvoiceDraftItems(prev => prev.map(item => ({ ...item, sellingPriceAed: val })))
                          showToast(`⚡ Set AED ${val} selling price for all ${invoiceDraftItems.length} units in invoice!`)
                          setBulkPriceInput('')
                        }}
                        disabled={!bulkPriceInput}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-lg shrink-0 transition shadow-xs"
                      >
                        Set All Prices ({invoiceDraftItems.length})
                      </button>
                    </div>
                  </div>
                )}

                {/* ADD ANOTHER UNIT PICKER */}
                <div className="flex gap-2">
                  <select
                    value={addDeviceToInvoiceId}
                    onChange={e => setAddDeviceToInvoiceId(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-xl p-2 font-mono text-xs font-bold text-slate-900 bg-white"
                  >
                    <option value="">-- Add an in-stock device to invoice --</option>
                    {devices.filter(d => d.status !== 'SOLD' && !invoiceDraftItems.some(item => item.deviceId === d.id)).map(d => (
                      <option key={d.id} value={d.id}>
                        {d.model} {d.color} ({d.storage}) — IMEI: {d.imei}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const d = devices.find(dev => dev.id === addDeviceToInvoiceId)
                      if (d) {
                        setInvoiceDraftItems(prev => [
                          ...prev,
                          {
                            deviceId: d.id,
                            imei: d.imei,
                            model: d.model,
                            storage: d.storage,
                            color: d.color,
                            sellingPriceAed: Number(d.sellingPriceAed || d.costAed || 1500)
                          }
                        ])
                        setAddDeviceToInvoiceId('')
                      }
                    }}
                    disabled={!addDeviceToInvoiceId}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shrink-0"
                  >
                    + Add Unit
                  </button>
                </div>

                {/* DRAFT ITEMS TABLE */}
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-white">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2 text-center">#</th>
                        <th className="p-2 text-left">Model &amp; Spec</th>
                        <th className="p-2 text-left font-mono">IMEI</th>
                        <th className="p-2 text-right">Selling Price (AED)</th>
                        <th className="p-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceDraftItems.length === 0 ? (
                        <tr><td colSpan={5} className="p-4 text-center text-gray-400 italic">No units added yet. Select a unit above.</td></tr>
                      ) : (
                        invoiceDraftItems.map((item, idx) => (
                          <tr key={item.deviceId} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-2 text-center font-bold">{idx + 1}</td>
                            <td className="p-2 font-bold font-sans">{item.model} ({item.storage} {item.color})</td>
                            <td className="p-2 font-mono font-bold text-slate-700">{item.imei}</td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                value={item.sellingPriceAed || ''}
                                onChange={e => {
                                  const val = Number(e.target.value) || 0
                                  setInvoiceDraftItems(prev => prev.map((it, i) => i === idx ? { ...it, sellingPriceAed: val } : it))
                                }}
                                className="w-24 text-right border border-slate-300 rounded px-1.5 py-0.5 font-mono font-bold text-emerald-800"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => setInvoiceDraftItems(prev => prev.filter((_, i) => i !== idx))}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                                title="Remove unit from invoice"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Payment Term *</label>
                  <select
                    value={billPaymentType}
                    onChange={e => setBillPaymentType(e.target.value as 'CASH' | 'CREDIT')}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="CASH">💵 Cash</option>
                    <option value="CREDIT">📝 Credit</option>
                  </select>
                </div>
                {billPaymentType === 'CREDIT' && (
                  <div>
                    <label className="block font-bold text-amber-800 mb-1">Credit Due Date *</label>
                    <input
                      type="date"
                      required
                      value={billCreditDueDate}
                      onChange={e => setBillCreditDueDate(e.target.value)}
                      className="w-full border border-amber-300 rounded-xl p-2.5 text-xs bg-amber-50/50"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowBillClientModal(false)} className="px-4 py-2 border rounded-lg font-bold text-gray-600">Cancel</button>
                <button type="submit" disabled={submittingBill || invoiceDraftItems.length === 0} className="px-5 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white font-extrabold rounded-xl shadow-md">
                  {submittingBill ? 'Processing...' : `🧾 Generate Invoice (${invoiceDraftItems.length} Units)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SALES INVOICE MODAL */}
      {editSaleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 space-y-4 my-6">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-600" /> Edit Commercial Invoice — {editSaleModal.invoiceNumber}
              </h3>
              <button onClick={() => setEditSaleModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleEditInvoiceSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Select Client Account or Edit Name *</label>
                {clients.length > 0 && (
                  <select
                    value={clients.some(c => c.name === editSaleCustomerName) ? editSaleCustomerName : ''}
                    onChange={e => {
                      const selName = e.target.value
                      const selClient = clients.find(c => c.name === selName)
                      setEditSaleCustomerName(selName)
                      if (selClient?.phone) setEditSaleCustomerPhone(selClient.phone)
                    }}
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs mb-1 font-bold text-cyan-900 bg-cyan-50/50"
                  >
                    <option value="">-- Choose Registered Client Account --</option>
                    {clients.map(c => <option key={c.name} value={c.name}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
                  </select>
                )}
                <input
                  required
                  value={editSaleCustomerName}
                  onChange={e => setEditSaleCustomerName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs font-bold"
                  placeholder="Client / Company Name"
                />
              </div>

              {/* DRAFT INVOICE MULTI-UNIT SELECTION SECTION */}
              <div className="space-y-2.5 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    Units Included in Invoice ({invoiceDraftItems.length}):
                  </p>
                  <p className="font-black text-xs text-emerald-800 font-mono">
                    Total: AED {invoiceDraftItems.reduce((sum, item) => sum + (item.sellingPriceAed || 0), 0).toFixed(2)}
                  </p>
                </div>

                {/* BARCODE / IMEI SCANNER FOR INVOICE */}
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-white space-y-1.5 shadow-sm">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-emerald-400" /> 🔍 Scan Barcode / Type IMEI to Add Unit
                    </label>
                    <span className="text-[10px] text-slate-400">Press Enter after scanning</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={modalScanImei}
                      onChange={e => setModalScanImei(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const q = modalScanImei.trim().toLowerCase()
                          if (!q) return
                          const target = devices.find(d => d.status !== 'SOLD' && (d.imei.toLowerCase() === q || d.imei.toLowerCase().endsWith(q)))
                          if (!target) {
                            showToast(`❌ Device matching IMEI '${modalScanImei}' not found in stock!`, false)
                            return
                          }
                          if (invoiceDraftItems.some(item => item.deviceId === target.id)) {
                            showToast(`⚠️ Unit IMEI ${target.imei} is already added to this invoice!`, false)
                            setModalScanImei('')
                            return
                          }
                          setInvoiceDraftItems(prev => [
                            ...prev,
                            {
                              deviceId: target.id,
                              imei: target.imei,
                              model: target.model,
                              storage: target.storage,
                              color: target.color,
                              sellingPriceAed: Number(target.sellingPriceAed || target.costAed || 1500)
                            }
                          ])
                          showToast(`✓ Scanned & Added IMEI ${target.imei} (${target.model}) to invoice!`)
                          setModalScanImei('')
                        }
                      }}
                      placeholder="Scan 15-digit IMEI barcode here..."
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const q = modalScanImei.trim().toLowerCase()
                        if (!q) return
                        const target = devices.find(d => d.status !== 'SOLD' && (d.imei.toLowerCase() === q || d.imei.toLowerCase().endsWith(q)))
                        if (!target) {
                          showToast(`❌ Device matching IMEI '${modalScanImei}' not found in stock!`, false)
                          return
                        }
                        if (invoiceDraftItems.some(item => item.deviceId === target.id)) {
                          showToast(`⚠️ Unit IMEI ${target.imei} is already added to this invoice!`, false)
                          setModalScanImei('')
                          return
                        }
                        setInvoiceDraftItems(prev => [
                          ...prev,
                          {
                            deviceId: target.id,
                            imei: target.imei,
                            model: target.model,
                            storage: target.storage,
                            color: target.color,
                            sellingPriceAed: Number(target.sellingPriceAed || target.costAed || 1500)
                          }
                        ])
                        showToast(`✓ Scanned & Added IMEI ${target.imei} (${target.model}) to invoice!`)
                        setModalScanImei('')
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-lg shrink-0 transition"
                    >
                      + Scan &amp; Add
                    </button>
                  </div>
                </div>

                {/* BULK SELLING PRICE CONTROL BAR */}
                {invoiceDraftItems.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs shadow-xs">
                    <div className="flex items-center gap-1 font-extrabold text-amber-900 shrink-0">
                      <DollarSign className="w-4 h-4 text-amber-700" />
                      <span>Bulk Price Change:</span>
                    </div>
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <input
                        type="number"
                        value={bulkPriceInput}
                        onChange={e => setBulkPriceInput(e.target.value)}
                        placeholder="Price (AED) e.g. 1500"
                        className="w-36 bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = Number(bulkPriceInput)
                          if (!val || val <= 0) {
                            showToast('Enter a valid price to apply in bulk', false)
                            return
                          }
                          setInvoiceDraftItems(prev => prev.map(item => ({ ...item, sellingPriceAed: val })))
                          showToast(`⚡ Set AED ${val} selling price for all ${invoiceDraftItems.length} units in invoice!`)
                          setBulkPriceInput('')
                        }}
                        disabled={!bulkPriceInput}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-lg shrink-0 transition shadow-xs"
                      >
                        Set All Prices ({invoiceDraftItems.length})
                      </button>
                    </div>
                  </div>
                )}

                {/* ADD ANOTHER UNIT PICKER */}
                <div className="flex gap-2">
                  <select
                    value={addDeviceToInvoiceId}
                    onChange={e => setAddDeviceToInvoiceId(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-xl p-2 font-mono text-xs font-bold text-slate-900 bg-white"
                  >
                    <option value="">-- Add another in-stock device to invoice --</option>
                    {devices.filter(d => d.status !== 'SOLD' && !invoiceDraftItems.some(item => item.deviceId === d.id)).map(d => (
                      <option key={d.id} value={d.id}>
                        {d.model} {d.color} ({d.storage}) — IMEI: {d.imei}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const d = devices.find(dev => dev.id === addDeviceToInvoiceId)
                      if (d) {
                        setInvoiceDraftItems(prev => [
                          ...prev,
                          {
                            deviceId: d.id,
                            imei: d.imei,
                            model: d.model,
                            storage: d.storage,
                            color: d.color,
                            sellingPriceAed: Number(d.sellingPriceAed || d.costAed || 1500)
                          }
                        ])
                        setAddDeviceToInvoiceId('')
                      }
                    }}
                    disabled={!addDeviceToInvoiceId}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shrink-0"
                  >
                    + Add Unit
                  </button>
                </div>

                {/* DRAFT ITEMS TABLE */}
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-white">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2 text-center">#</th>
                        <th className="p-2 text-left">Model &amp; Spec</th>
                        <th className="p-2 text-left font-mono">IMEI</th>
                        <th className="p-2 text-right">Selling Price (AED)</th>
                        <th className="p-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceDraftItems.length === 0 ? (
                        <tr><td colSpan={5} className="p-4 text-center text-gray-400 italic">No units added yet. Select a unit above.</td></tr>
                      ) : (
                        invoiceDraftItems.map((item, idx) => (
                          <tr key={item.deviceId} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-2 text-center font-bold">{idx + 1}</td>
                            <td className="p-2 font-bold font-sans">{item.model} ({item.storage} {item.color})</td>
                            <td className="p-2 font-mono font-bold text-slate-700">{item.imei}</td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                value={item.sellingPriceAed || ''}
                                onChange={e => {
                                  const val = Number(e.target.value) || 0
                                  setInvoiceDraftItems(prev => prev.map((it, i) => i === idx ? { ...it, sellingPriceAed: val } : it))
                                }}
                                className="w-24 text-right border border-slate-300 rounded px-1.5 py-0.5 font-mono font-bold text-emerald-800"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => setInvoiceDraftItems(prev => prev.filter((_, i) => i !== idx))}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                                title="Remove unit from invoice"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Payment Term *</label>
                  <select
                    value={editSalePaymentType}
                    onChange={e => setEditSalePaymentType(e.target.value as 'CASH' | 'CREDIT')}
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs font-bold"
                  >
                    <option value="CASH">💵 Cash Payment</option>
                    <option value="CREDIT">📝 Credit (Account Due)</option>
                  </select>
                </div>
                {editSalePaymentType === 'CREDIT' && (
                  <div>
                    <label className="block font-bold text-amber-800 mb-1">Credit Payment Due Date *</label>
                    <input
                      type="date"
                      required
                      value={editSaleCreditDueDate}
                      onChange={e => setEditSaleCreditDueDate(e.target.value)}
                      className="w-full border border-amber-300 rounded-lg p-2 text-xs bg-amber-50/50"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    deleteInvoice(editSaleModal)
                    setEditSaleModal(null)
                  }}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Invoice
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditSaleModal(null)} className="px-4 py-2 border rounded-lg font-bold text-gray-600">Cancel</button>
                  <button type="submit" disabled={submittingEditSale || invoiceDraftItems.length === 0} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg shadow-md">
                    {submittingEditSale ? 'Saving...' : '✓ Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLIENT INVOICES STATEMENT MODAL */}
      {viewClientStatement && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <div>
                <h3 className="font-extrabold text-gray-900 text-base font-sans">{viewClientStatement.name}</h3>
                <p className="text-xs text-gray-500">Client Account Sales &amp; Invoice Statement</p>
              </div>
              <button onClick={() => setViewClientStatement(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-cyan-50 border border-cyan-200 p-3 rounded-xl">
              <div>
                <span className="text-gray-500 font-medium">Total Invoices Issued:</span>
                <strong className="block text-gray-900 font-bold text-sm">
                  {safeSales.filter(s => s && safeLower(s.customerName) === safeLower(viewClientStatement?.name)).length}
                </strong>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Total Billed Amount:</span>
                <strong className="block text-cyan-900 font-mono font-black text-sm">
                  AED {safeSales.filter(s => s && safeLower(s.customerName) === safeLower(viewClientStatement?.name)).reduce((sum, s) => sum + (s?.sellingPriceAed || 0), 0).toFixed(2)}
                </strong>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-2.5 text-left">Invoice #</th>
                    <th className="p-2.5 text-left font-mono">IMEI</th>
                    <th className="p-2.5 text-left">Model</th>
                    <th className="p-2.5 text-left">Terms</th>
                    <th className="p-2.5 text-right">Amount (AED)</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {safeSales.filter(s => s && safeLower(s.customerName) === safeLower(viewClientStatement?.name)).length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-400 italic">No invoices issued for this client account yet.</td></tr>
                  ) : (
                    safeSales.filter(s => s && safeLower(s.customerName) === safeLower(viewClientStatement?.name)).map(s => {
                      const dev = safeDevices.find(d => d && d.id === s.deviceId)
                      return (
                        <tr key={s.id} className="border-b hover:bg-cyan-50/20">
                          <td className="p-2.5 font-mono font-bold text-blue-700 cursor-pointer hover:underline" onClick={() => { setViewClientStatement(null); openEditInvoiceModal(s) }}>{s.invoiceNumber}</td>
                          <td className="p-2.5 font-mono">{s.imei}</td>
                          <td className="p-2.5 font-bold">{s.model}</td>
                          <td className="p-2.5 text-green-700 font-medium">{s.paymentMethod}</td>
                          <td className="p-2.5 text-right font-black">AED {(s.sellingPriceAed || 0).toFixed(2)}</td>
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setViewClientStatement(null)
                                  openInvoiceForSale(s)
                                }}
                                title="View / Print Invoice"
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setViewClientStatement(null)
                                  openEditInvoiceModal(s)
                                }}
                                title="Edit Invoice & Add More Stock"
                                className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setViewClientStatement(null)
                                  deleteInvoice(s)
                                }}
                                title="Delete Invoice & Revert Units to Stock"
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button onClick={() => setViewClientStatement(null)} className="px-4 py-2 border rounded-lg font-bold text-gray-600 text-xs">Close Statement</button>
            </div>
          </div>
        </div>
      )}

      {/* COMMERCIAL INVOICE MODAL */}
      {invoiceData && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-6 px-4 overflow-y-auto print:static print:block print:p-0 print:m-0 print:bg-white">
          <div className="printable-document bg-white rounded-2xl shadow-2xl w-full max-w-2xl mb-10 print:shadow-none print:w-full print:max-w-none border border-gray-200 overflow-hidden">
            {/* INVOICE MODAL ACTION BAR */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
              <div>
                <h2 className="font-extrabold text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" /> Commercial Sales Invoice — {invoiceData.sale.invoiceNumber}
                </h2>
                <p className="text-[11px] text-slate-400">Ready for instant A4 printing or PDF download</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditInvoiceModal(invoiceData.sale)}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl inline-flex items-center gap-1 transition shadow-sm"
                  title="Edit Commercial Invoice"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => deleteInvoice(invoiceData.sale)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl inline-flex items-center gap-1 transition shadow-sm"
                  title="Delete Commercial Invoice & Revert Units to Ready to Sell Stock"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl inline-flex items-center gap-1.5 transition shadow-sm"
                  title="Download as PDF or Print"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl inline-flex items-center gap-1.5 transition shadow-sm"
                  title="Print Hardcopy Invoice"
                >
                  <Printer className="w-4 h-4" /> Print Invoice
                </button>
                <button onClick={() => setInvoiceData(null)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE INVOICE DOCUMENT BODY */}
            <div className="p-8 space-y-6 font-mono text-xs text-gray-900 bg-white">
              {/* COMPANY BRAND & INVOICE HEADER */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                <div>
                  <h1 className="text-2xl font-black font-sans tracking-tight text-slate-950">AQUA CELL</h1>
                  <p className="text-gray-700 font-sans font-bold text-xs">Mobile Phones &amp; Electronics Trading LLC</p>
                  <p className="text-gray-500 text-[11px]">Deira / Naif Mobile Wholesale Market, Dubai, UAE</p>
                  <p className="text-gray-500 text-[11px]">Tel: +971 4 222 0000 | Email: sales@aquacell.ae</p>
                </div>
                <div className="text-right border-2 border-slate-900 p-3 rounded-2xl bg-slate-50 min-w-[200px]">
                  <p className="text-[11px] font-black uppercase text-blue-700 font-sans tracking-wider">OFFICIAL COMMERCIAL INVOICE</p>
                  <p className="font-extrabold text-base text-slate-950">{invoiceData.sale.invoiceNumber}</p>
                  <p className="text-gray-600 text-[11px] mt-1">
                    Invoice Date: <strong>{new Date(invoiceData.sale.soldAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                  </p>
                  <p className="text-gray-600 text-[11px]">
                    Payment Method: <strong className="text-emerald-800 font-sans font-extrabold">{invoiceData.sale.paymentMethod}</strong>
                  </p>
                </div>
              </div>

              {/* BILLED CLIENT ACCOUNT INFO */}
              <div className="bg-slate-50 border border-slate-300 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-0.5">BILLED TO CLIENT ACCOUNT:</p>
                  <p className="font-black text-base text-slate-950 font-sans">{invoiceData.sale.customerName}</p>
                  {invoiceData.sale.customerPhone && <p className="text-gray-600 text-xs font-mono">Phone: {invoiceData.sale.customerPhone}</p>}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-emerald-900 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full">
                    ✓ SALE INVOICED &amp; COMPLETED
                  </span>
                </div>
              </div>

              {/* ITEMIZED PRODUCT & SELLING PRICE TABLE */}
              <table className="w-full text-xs border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-400 text-slate-900 font-black font-sans">
                    <th className="border border-slate-400 p-2.5 text-center">#</th>
                    <th className="border border-slate-400 p-2.5 text-left">Product Specification</th>
                    <th className="border border-slate-400 p-2.5 text-left font-mono">IMEI Number</th>
                    <th className="border border-slate-400 p-2.5 text-center">Qty</th>
                    <th className="border border-slate-400 p-2.5 text-right">Unit Selling Price</th>
                    <th className="border border-slate-400 p-2.5 text-right">Total (AED)</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoiceData.sale.items || [{ deviceId: invoiceData.device.id, imei: invoiceData.device.imei, model: invoiceData.device.model, storage: invoiceData.device.storage, color: invoiceData.device.color, sellingPriceAed: invoiceData.sale.sellingPriceAed }]).map((item, idx) => (
                    <tr key={item.deviceId || idx} className="border-b border-slate-300">
                      <td className="border border-slate-300 p-2.5 text-center font-bold">{idx + 1}</td>
                      <td className="border border-slate-300 p-2.5 font-bold font-sans">
                        Apple iPhone {item.model} ({item.storage || '128GB'} — {item.color || 'BLACK'})
                      </td>
                      <td className="border border-slate-300 p-2.5 font-mono font-bold text-slate-900">
                        {item.imei}
                      </td>
                      <td className="border border-slate-300 p-2.5 text-center font-bold">1</td>
                      <td className="border border-slate-300 p-2.5 text-right font-black font-mono text-emerald-900">
                        AED {(Number(item?.sellingPriceAed) || 0).toFixed(2)}
                      </td>
                      <td className="border border-slate-300 p-2.5 text-right font-black font-mono text-slate-950">
                        AED {(Number(item?.sellingPriceAed) || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* TOTAL SELLING PRICE BREAKDOWN */}
              <div className="flex justify-end pt-2">
                <div className="w-72 space-y-1.5 text-xs bg-slate-50 border border-slate-300 p-4 rounded-xl">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal Selling Price:</span>
                    <span className="font-bold font-mono">AED {(Number(invoiceData.sale.sellingPriceAed) || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>VAT (0% Wholesale Export):</span>
                    <span className="font-bold font-mono">AED 0.00</span>
                  </div>
                  <div className="flex justify-between font-black text-slate-950 border-t border-slate-400 pt-2 text-sm">
                    <span>Total Amount Payable:</span>
                    <span className="font-mono text-blue-700">AED {(Number(invoiceData.sale.sellingPriceAed) || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* TERMS & WARRANTY POLICY */}
              <div className="border-t border-slate-300 pt-4 text-[10px] text-gray-500 space-y-1">
                <p className="font-bold text-slate-800 uppercase tracking-wider">Commercial Terms &amp; Warranty Policy:</p>
                <p>1. 7-Day Warranty covering internal hardware functionality from date of invoice.</p>
                <p>2. Warranty is strictly void if device exhibits liquid damage, physical cracks, display breakage, or third-party disassembly.</p>
                <p>3. Computer generated commercial sales invoice issued by AQUA CELL Trading LLC.</p>
              </div>

              {/* SIGNATURE & ACCEPTANCE BLOCKS */}
              <div className="grid grid-cols-2 gap-12 pt-6">
                <div>
                  <div className="border-b-2 border-slate-800 h-10 mb-1" />
                  <p className="text-[10px] font-bold text-slate-800 uppercase">Authorized Signatory • AQUA CELL TRADING</p>
                </div>
                <div className="text-right">
                  <div className="border-b-2 border-slate-800 h-10 mb-1" />
                  <p className="text-[10px] font-bold text-slate-800 uppercase">Customer Received &amp; Verified Signature</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HANDOVER VOUCHER MODAL */}
      {handoverModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-6 px-4 overflow-y-auto print:static print:block print:p-0 print:m-0 print:bg-white">
          <div className="printable-document bg-white rounded-2xl shadow-2xl w-full max-w-3xl mb-10 print:shadow-none print:w-full print:max-w-none">
            <div className="flex items-center justify-between px-6 py-4 bg-amber-700 text-white print:hidden">
              <h2 className="font-bold text-sm">Handover Voucher — {handoverModal.batchNumber}</h2>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="px-4 py-2 bg-amber-500 text-white font-bold text-xs rounded-lg inline-flex items-center gap-1.5"><Printer className="w-4 h-4" /> Print / Save PDF</button>
                <button onClick={() => setHandoverModal(null)}><X className="w-5 h-5 text-white" /></button>
              </div>
            </div>
            <div className="p-8 space-y-5 font-mono text-xs text-gray-900">
              <div className="flex justify-between border-b-2 border-gray-900 pb-4">
                <div>
                  <h1 className="text-2xl font-black font-sans">AQUA CELL</h1>
                  <p className="text-gray-600 font-sans text-xs">Mobile Phones &amp; Electronics Trading LLC</p>
                </div>
                <div className="text-right border-2 border-gray-900 p-3 rounded-xl bg-gray-50">
                  <p className="text-[10px] font-black uppercase text-amber-700">STOCK HANDOVER VOUCHER</p>
                  <p className="font-bold text-base">{handoverModal.batchNumber}</p>
                </div>
              </div>
              <div className="bg-gray-50 border p-3 rounded-xl">
                <p className="text-[10px] font-bold text-gray-500">REPAIR CENTER (DESTINATION):</p>
                <p className="font-black text-sm font-sans">{handoverModal.refurbCenterName}</p>
              </div>
              <table className="w-full text-xs border-collapse border border-gray-400">
                <thead><tr className="bg-gray-200"><th className="border p-2 text-center">#</th><th className="border p-2 text-left">Model</th><th className="border p-2 text-left font-mono">IMEI</th><th className="border p-2 text-left">Reported Fault</th></tr></thead>
                <tbody>
                  {handoverModal.devices.map((d, idx) => (
                    <tr key={d.deviceId} className="border-b"><td className="border p-2 text-center">{idx + 1}</td><td className="border p-2 font-bold font-sans">{d.model} {d.color}</td><td className="border p-2 font-mono font-bold">{d.imei}</td><td className="border p-2 text-orange-900">{d.faults || 'General Repair'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DEVICE PASSPORT MODAL */}
      {viewDevicePassport && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-5 my-8">
            <div className="flex justify-between items-start border-b border-gray-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-gray-900 font-sans">
                    {viewDevicePassport.model} ({viewDevicePassport.storage} — {viewDevicePassport.color})
                  </h2>
                  <SBadge s={viewDevicePassport.status} />
                </div>
                <p className="text-xs text-gray-500 font-mono mt-1">
                  IMEI Barcode: <strong className="text-gray-900 text-sm font-black">{viewDevicePassport.imei}</strong>
                </p>
              </div>
              <button onClick={() => setViewDevicePassport(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            {(() => {
              const bInfo = getBatchInfoForDevice(viewDevicePassport.id, viewDevicePassport.imei)
              const assocBatch = batches.find(b => b.devices.some(d => d.deviceId === viewDevicePassport.id || d.imei === viewDevicePassport.imei))
              const assocSale = sales.find(s => s.deviceId === viewDevicePassport.id || s.id === viewDevicePassport.saleId || s.imei === viewDevicePassport.imei || (s.items && s.items.some(it => it.deviceId === viewDevicePassport.id || it.imei === viewDevicePassport.imei)))

              const rawCost = viewDevicePassport.costAed || 0
              const repairCost = viewDevicePassport.repairCostAed || 0
              const totalCost = rawCost + repairCost
              const sellingPrice = assocSale ? assocSale.sellingPriceAed : (viewDevicePassport.sellingPriceAed || 0)
              const profit = sellingPrice > 0 ? sellingPrice - totalCost : 0
              const marginPct = sellingPrice > 0 ? ((profit / sellingPrice) * 100).toFixed(1) : '0'

              return (
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Refurb Center &amp; Batch Trail:</span>
                      <span className="font-mono text-xs font-black text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-300">
                        {bInfo.batchNumber}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-gray-500">Refurb Repair Center:</span>
                        <p className="font-extrabold text-slate-900 text-sm">{bInfo.centerName}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Batch Dispatch Date:</span>
                        <p className="font-bold text-slate-800">
                          {assocBatch ? new Date(assocBatch.sentAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Direct Intake'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-3">
                    <span className="text-[11px] font-extrabold text-emerald-950 uppercase tracking-wider block">
                      💰 Unit Cost Accounting &amp; Profitability Passport:
                    </span>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white border border-emerald-100 p-2.5 rounded-lg">
                        <span className="text-gray-500 text-[10px] uppercase font-bold">Raw Intake Cost</span>
                        <p className="font-mono font-black text-slate-900 text-sm">AED {rawCost.toFixed(2)}</p>
                      </div>
                      <div className="bg-white border border-emerald-100 p-2.5 rounded-lg">
                        <span className="text-amber-700 text-[10px] uppercase font-bold">Refurb Repair Fee</span>
                        <p className="font-mono font-black text-amber-800 text-sm">AED {repairCost.toFixed(2)}</p>
                      </div>
                      <div className="bg-emerald-100 border border-emerald-300 p-2.5 rounded-lg">
                        <span className="text-emerald-900 text-[10px] uppercase font-bold">Total Unit Cost</span>
                        <p className="font-mono font-black text-emerald-950 text-sm">AED {totalCost.toFixed(2)}</p>
                      </div>
                    </div>

                    {sellingPrice > 0 && (
                      <div className="grid grid-cols-2 gap-3 border-t border-emerald-200/80 pt-2.5">
                        <div className="bg-white border border-emerald-100 p-2.5 rounded-lg">
                          <span className="text-gray-500 text-[10px] uppercase font-bold">Commercial Selling Price</span>
                          <p className="font-mono font-black text-blue-900 text-sm">AED {sellingPrice.toFixed(2)}</p>
                        </div>
                        <div className={`p-2.5 rounded-lg border ${profit >= 0 ? 'bg-green-100 border-green-300 text-green-950' : 'bg-red-100 border-red-300 text-red-950'}`}>
                          <span className="text-[10px] uppercase font-bold">Net Profit (Margin %)</span>
                          <p className="font-mono font-black text-sm">
                            AED {profit.toFixed(2)} <span className="text-xs">({marginPct}%)</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                    <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block">
                      🛠️ Reported Intake Faults &amp; Diagnostics:
                    </span>
                    <p className="font-bold text-orange-950 text-xs bg-amber-50 border border-amber-200 p-2 rounded-lg">
                      {viewDevicePassport.faults || 'No initial hardware defects reported on intake'}
                    </p>
                    {viewDevicePassport.notes && (
                      <p className="text-xs text-gray-600 italic">
                        Notes: "{viewDevicePassport.notes}"
                      </p>
                    )}
                    {viewDevicePassport.reRepairNotes && (
                      <p className="text-xs text-red-800 font-bold bg-red-50 border border-red-200 p-2 rounded-lg">
                        🔴 Re-Repair History Note: "{viewDevicePassport.reRepairNotes}"
                      </p>
                    )}
                  </div>

                  {assocSale && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase text-blue-800">BILLED TO CLIENT:</span>
                        <p className="font-extrabold text-blue-950 text-sm font-sans">{assocSale.customerName}</p>
                        <p className="text-xs text-blue-700 font-mono">Invoice #{assocSale.invoiceNumber}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setViewDevicePassport(null)
                          openInvoiceForSale(assocSale)
                        }}
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 transition"
                      >
                        <Printer className="w-4 h-4" /> View Commercial Invoice
                      </button>
                    </div>
                  )}
                </div>
              )
            })()}

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setViewDevicePassport(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl transition shadow-xs"
              >
                Close Passport
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD DEVICE MODAL */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" /> Intake New Device (Raw Stock)
              </h3>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={async e => {
              e.preventDefault(); setSaving(true)
              const res = await fetch('/api/devices', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...addForm, costAed: Number(addForm.costAed) || 0, status: 'RAW_STOCK' })
              })
              const data = await res.json(); setSaving(false)
              if (res.ok) {
                setDevices(p => [data, ...p])
                setShowAdd(false)
                setAddForm({ ...EMPTY_DEVICE })
                showToast('📦 Device added to Raw Stock Intake!')
              } else showToast(data.error || 'Error adding device', false)
            }} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Model *</label>
                  <select value={addForm.model || '15 PRO'} onChange={e => setAddForm(f => ({ ...f, model: e.target.value }))} className="w-full border border-gray-300 rounded-xl p-2.5 font-bold">
                    {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Storage *</label>
                  <select value={addForm.storage || '128GB'} onChange={e => setAddForm(f => ({ ...f, storage: e.target.value }))} className="w-full border border-gray-300 rounded-xl p-2.5 font-bold">
                    {STORAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Color *</label>
                  <select value={addForm.color || 'BLACK'} onChange={e => setAddForm(f => ({ ...f, color: e.target.value }))} className="w-full border border-gray-300 rounded-xl p-2.5 font-bold">
                    {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">IMEI *</label>
                  <input required value={addForm.imei || ''} onChange={e => setAddForm(f => ({ ...f, imei: e.target.value }))} className="w-full border border-gray-300 rounded-xl p-2.5 font-mono font-bold" placeholder="15-digit IMEI barcode" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Raw Intake Cost (AED) *</label>
                <input required type="number" value={addForm.costAed || ''} onChange={e => setAddForm(f => ({ ...f, costAed: e.target.value }))} className="w-full border border-gray-300 rounded-xl p-2.5 font-mono font-bold" placeholder="1400" />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Faults / Intake Observations</label>
                <textarea value={addForm.faults || ''} onChange={e => setAddForm(f => ({ ...f, faults: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-xl p-2.5 text-xs" placeholder="e.g. Broken back glass, camera shaking, housing scratched..." />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 border rounded-lg font-bold text-gray-600">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md">{saving ? 'Saving...' : '✓ Add Device to Raw Stock'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT STOCK MODAL */}
      {showImport && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-600" /> Import Bulk Stock (Raw Stock Intake)
              </h3>
              <button onClick={() => setShowImport(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-bold text-xs text-emerald-950">Option 1: Excel CSV Template</p>
                  <p className="text-[11px] text-emerald-800">Download the formatted CSV spreadsheet, fill your stock, and upload it back.</p>
                </div>
                <button
                  type="button"
                  onClick={downloadStockTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Download Template (.csv)
                </button>
              </div>

              <div className="border-t border-emerald-200/60 pt-2 flex items-center justify-between flex-wrap gap-2">
                <p className="text-[11px] font-bold text-emerald-900">Upload CSV / TSV file directly from disk:</p>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-400 hover:bg-emerald-100 text-emerald-900 font-bold text-xs rounded-lg transition shadow-sm">
                  📁 Choose CSV File
                  <input
                    type="file"
                    accept=".csv,.tsv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <form onSubmit={async e => {
              e.preventDefault(); setSaving(true)
              const res = await fetch('/api/devices/import', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'append', text: importText })
              })
              const data = await res.json(); setSaving(false)
              if (res.ok) {
                setDevices(data.devices)
                setShowImport(false)
                setImportText('')
                if (data.skippedCount > 0 && data.importedCount > 0) {
                  showToast(`📥 Imported ${data.importedCount} new devices! ⚠️ ${data.skippedCount} duplicate IMEI(s) automatically excluded (${data.skippedImeis.slice(0, 2).join(', ')}${data.skippedCount > 2 ? '...' : ''}).`)
                } else if (data.importedCount === 0 && data.skippedCount > 0) {
                  showToast(`⚠️ 0 new devices added. All ${data.skippedCount} IMEI(s) already exist in system (${data.skippedImeis.slice(0, 2).join(', ')}${data.skippedCount > 2 ? '...' : ''}).`, false)
                } else {
                  showToast(`📥 Successfully imported ${data.importedCount} raw stock devices!`)
                }
              } else showToast(data.error || 'Import failed', false)
            }} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Option 2: Copy &amp; Paste TSV / CSV Content *</label>
                <p className="text-[11px] text-gray-500 mb-1.5">Format: <code>Model, Storage, Color, IMEI, Faults, Cost</code></p>
                <textarea
                  required
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  rows={7}
                  className="w-full border border-gray-300 rounded-xl p-3 text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="15 PRO,128GB,BLACK,359182390194812,HOUSING LCD,1400&#n15 PRO MAX,256GB,NATURAL,358192840192841,BACK GLASS,1800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowImport(false)} className="px-4 py-2 border rounded-lg font-bold text-gray-600">Cancel</button>
                <button type="submit" disabled={saving || !importText.trim()} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md">{saving ? 'Importing...' : '📥 Process & Import Stock'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT REFURB CENTER MODAL */}
      {editCenterModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <h3 className="font-extrabold text-gray-900 text-base">Edit Refurb Center — {editCenterModal.name}</h3>
              <button onClick={() => setEditCenterModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={saveEditCenter} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-600 mb-1">Center Name *</label>
                <input required value={editCenterForm.name} onChange={e => setEditCenterForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block font-semibold text-gray-600 mb-1">Contact Person / Phone</label>
                <input value={editCenterForm.contact} onChange={e => setEditCenterForm(f => ({ ...f, contact: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block font-semibold text-gray-600 mb-1">Address / Location</label>
                <input value={editCenterForm.address} onChange={e => setEditCenterForm(f => ({ ...f, address: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block font-semibold text-gray-600 mb-1">Notes / Terms</label>
                <textarea value={editCenterForm.notes} onChange={e => setEditCenterForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setEditCenterModal(null)} className="px-4 py-2 rounded-lg border border-gray-300 font-semibold text-gray-600">Cancel</button>
                <button type="submit" disabled={savingEditCenter} className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold">{savingEditCenter ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CLIENT ACCOUNT MODAL */}
      {editClientModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <h3 className="font-extrabold text-gray-900 text-base">Edit Client Account — {editClientModal.name}</h3>
              <button onClick={() => setEditClientModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={saveEditClient} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-600 mb-1">Client / Company Name *</label>
                <input required value={editClientForm.name} onChange={e => setEditClientForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block font-semibold text-gray-600 mb-1">Phone Number</label>
                <input value={editClientForm.phone} onChange={e => setEditClientForm(f => ({ ...f, phone: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block font-semibold text-gray-600 mb-1">Address / Market Location</label>
                <input value={editClientForm.address} onChange={e => setEditClientForm(f => ({ ...f, address: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block font-semibold text-gray-600 mb-1">Account Notes / Credit Limit Terms</label>
                <textarea value={editClientForm.notes} onChange={e => setEditClientForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setEditClientModal(null)} className="px-4 py-2 rounded-lg border border-gray-300 font-semibold text-gray-600">Cancel</button>
                <button type="submit" disabled={savingEditClient} className="px-5 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-bold">{savingEditClient ? 'Saving...' : 'Save Account Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DEVICE MODAL */}
      {editDevice && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-4 my-6">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-600" /> Edit Device Specs, Faults &amp; Status — <span className="font-mono text-gray-700">{editDevice.imei}</span>
              </h3>
              <button onClick={() => setEditDevice(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <form onSubmit={async e => {
              e.preventDefault()
              setSaving(true)
              const res = await fetch(`/api/devices/${editDevice.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  model: editForm.model,
                  storage: editForm.storage,
                  color: editForm.color,
                  imei: editForm.imei,
                  costAed: Number(editForm.costAed) || 0,
                  status: editForm.status,
                  faults: editForm.faults,
                  notes: editForm.notes,
                  housing: editForm.housing,
                  backGlass: editForm.backGlass,
                  displayMsg: editForm.displayMsg,
                  batteryMsg: editForm.batteryMsg,
                  battery: editForm.battery,
                  lcd: editForm.lcd,
                  nfc: editForm.nfc,
                  faceId: editForm.faceId,
                  frontCamera: editForm.frontCamera,
                  backCamera: editForm.backCamera,
                  flex: editForm.flex,
                  sensor: editForm.sensor,
                  board: editForm.board,
                  flashlight: editForm.flashlight,
                  frontSpeaker: editForm.frontSpeaker,
                })
              })
              const updated = await res.json()
              setSaving(false)
              if (res.ok) {
                setDevices(prev => prev.map(d => d.id === editDevice.id ? updated : d))
                setEditDevice(null)
                showToast(`✅ Device ${updated.model} (${updated.imei}) updated successfully!`)
              } else {
                showToast(updated.error || 'Failed to update device', false)
              }
            }} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Model</label>
                  <select value={editForm.model} onChange={e => setEditForm(f => ({ ...f, model: e.target.value }))} className="w-full border border-gray-300 rounded-lg p-2 font-bold">
                    {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Storage</label>
                  <select value={editForm.storage} onChange={e => setEditForm(f => ({ ...f, storage: e.target.value }))} className="w-full border border-gray-300 rounded-lg p-2 font-bold">
                    {STORAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Color</label>
                  <select value={editForm.color} onChange={e => setEditForm(f => ({ ...f, color: e.target.value }))} className="w-full border border-gray-300 rounded-lg p-2 font-bold">
                    {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Status</label>
                  <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-blue-400 bg-blue-50/40 rounded-lg p-2 font-bold text-blue-900">
                    <option value="RAW_STOCK">📦 Raw Stock</option>
                    <option value="IN_STOCK">🟢 Ready to Sell</option>
                    <option value="AT_REPAIR">⏱️ At Repair</option>
                    <option value="AFTER_FIX_QC">🔍 After-Fix QC</option>
                    <option value="SOLD">🛑 Sold</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">IMEI *</label>
                  <input required value={editForm.imei} onChange={e => setEditForm(f => ({ ...f, imei: e.target.value }))} className="w-full border border-gray-300 rounded-lg p-2 font-mono font-bold" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Cost (AED)</label>
                  <input type="number" value={editForm.costAed} onChange={e => setEditForm(f => ({ ...f, costAed: e.target.value }))} className="w-full border border-gray-300 rounded-lg p-2 font-bold" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Faults / Issues</label>
                <textarea value={editForm.faults} onChange={e => setEditForm(f => ({ ...f, faults: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg p-2" placeholder="e.g. Housing, Screen scratch, Face ID repair..." />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">General Notes</label>
                <input value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} className="w-full border border-gray-300 rounded-lg p-2" placeholder="Additional technician notes..." />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setEditDevice(null)} className="px-4 py-2 border rounded-lg font-bold text-gray-600">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg shadow-md">
                  {saving ? 'Saving...' : '✓ Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCAN IMEI WITH FAULTS MODAL */}
      {showScanFaultModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-4 my-6">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                  <Barcode className="w-5 h-5 text-amber-600" /> ⚡ Scan IMEI &amp; Manually Log Faults
                </h3>
                {(() => {
                  const targetBatchObj = safeBatches.find(b => b.id === scanFaultForm.targetBatchId)
                  return targetBatchObj ? (
                    <span className="text-xs font-black text-amber-900 bg-amber-200 px-3 py-1 rounded-full border border-amber-400 animate-pulse">
                      🎯 BATCH: {targetBatchObj.batchNumber} ({targetBatchObj.refurbCenterName})
                    </span>
                  ) : null
                })()}
              </div>
              <button onClick={() => setShowScanFaultModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-2">
                <label className="block font-black text-amber-950">15-Digit IMEI Barcode *</label>
                <input
                  type="text"
                  value={scanFaultForm.imei}
                  onChange={e => {
                    const val = e.target.value
                    const foundDev = safeDevices.find(d => d && safeLower(d.imei) === safeLower(val.trim()))
                    if (foundDev) {
                      setScanFaultForm(f => ({
                        ...f,
                        imei: val,
                        model: foundDev.model || f.model,
                        storage: foundDev.storage || f.storage,
                        color: foundDev.color || f.color,
                        costAed: String(foundDev.costAed || f.costAed),
                        notes: foundDev.faults || f.notes
                      }))
                    } else {
                      setScanFaultForm(f => ({ ...f, imei: val }))
                    }
                  }}
                  placeholder="Point scanner or type 15-digit IMEI..."
                  className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Model</label>
                  <select value={scanFaultForm.model} onChange={e => setScanFaultForm(f => ({ ...f, model: e.target.value }))} className="w-full border border-gray-300 rounded-lg p-2 font-bold">
                    {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Storage</label>
                  <select value={scanFaultForm.storage} onChange={e => setScanFaultForm(f => ({ ...f, storage: e.target.value }))} className="w-full border border-gray-300 rounded-lg p-2 font-bold">
                    {STORAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Color</label>
                  <select value={scanFaultForm.color} onChange={e => setScanFaultForm(f => ({ ...f, color: e.target.value }))} className="w-full border border-gray-300 rounded-lg p-2 font-bold">
                    {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Cost (AED)</label>
                  <input type="number" value={scanFaultForm.costAed} onChange={e => setScanFaultForm(f => ({ ...f, costAed: e.target.value }))} className="w-full border border-gray-300 rounded-lg p-2 font-bold" placeholder="1400" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-900 mb-1">Select / Toggle Hardware Faults:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-gray-50 border border-gray-200 p-3 rounded-xl max-h-44 overflow-y-auto">
                  {DIAG_FIELDS.map(field => {
                    const active = scanFaultForm.faults.includes(field)
                    return (
                      <button
                        key={field}
                        type="button"
                        onClick={() => setScanFaultForm(f => ({
                          ...f,
                          faults: active ? f.faults.filter(x => x !== field) : [...f.faults, field]
                        }))}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-left border transition flex items-center justify-between ${
                          active ? 'bg-orange-500 text-white border-orange-600 shadow-xs' : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                        }`}
                      >
                        <span>{field}</span>
                        {active && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Additional Fault Notes</label>
                <input
                  type="text"
                  value={scanFaultForm.notes}
                  onChange={e => setScanFaultForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. Broken LCD flex cable, battery health 78%..."
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
              </div>

              <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl space-y-2">
                <label className="block font-black text-amber-950">Select Destination for Scanned Device:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setScanFaultForm(f => ({ ...f, destination: 'REPAIR_BATCH' }))}
                    className={`py-2 px-3 rounded-lg font-extrabold text-xs border ${scanFaultForm.destination === 'REPAIR_BATCH' ? 'bg-amber-600 text-white border-amber-700' : 'bg-white text-amber-950 border-amber-300'}`}
                  >
                    📥 Repair Batch
                  </button>
                  <button
                    type="button"
                    onClick={() => setScanFaultForm(f => ({ ...f, destination: 'READY_TO_SELL' }))}
                    className={`py-2 px-3 rounded-lg font-extrabold text-xs border ${scanFaultForm.destination === 'READY_TO_SELL' ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-emerald-950 border-emerald-300'}`}
                  >
                    🟢 Ready to Sell
                  </button>
                  <button
                    type="button"
                    onClick={() => setScanFaultForm(f => ({ ...f, destination: 'RAW_QC_DONE' }))}
                    className={`py-2 px-3 rounded-lg font-extrabold text-xs border ${scanFaultForm.destination === 'RAW_QC_DONE' ? 'bg-teal-600 text-white border-teal-700' : 'bg-white text-teal-950 border-teal-300'}`}
                  >
                    📋 Raw QC Done
                  </button>
                </div>

                {scanFaultForm.destination === 'REPAIR_BATCH' && (
                  <div className="pt-2">
                    <label className="block font-bold text-amber-900 mb-1">Target Repair Batch</label>
                    <select
                      value={scanFaultForm.targetBatchId}
                      onChange={e => setScanFaultForm(f => ({ ...f, targetBatchId: e.target.value }))}
                      className="w-full border border-amber-300 rounded-lg p-2 font-bold text-amber-950 bg-white"
                    >
                      <option value="">-- Create New Batch or Select Open Batch --</option>
                      {safeBatches.filter(b => b.status === 'SENT' || b.status === 'IN_REPAIR' || b.status === 'PARTIALLY_RETURNED').map(b => (
                        <option key={b.id} value={b.id}>{b.batchNumber} ({b.refurbCenterName})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button type="button" onClick={() => setShowScanFaultModal(false)} className="px-4 py-2 rounded-lg border text-xs font-bold text-gray-600">Cancel</button>
              <button
                type="button"
                disabled={!scanFaultForm.imei.trim()}
                onClick={async () => {
                  const faultsStr = [...scanFaultForm.faults, scanFaultForm.notes].filter(Boolean).join(', ')
                  const devRes = await fetch('/api/devices', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      imei: scanFaultForm.imei.trim(),
                      model: scanFaultForm.model,
                      storage: scanFaultForm.storage,
                      color: scanFaultForm.color,
                      costAed: Number(scanFaultForm.costAed) || 0,
                      faults: faultsStr
                    })
                  })
                  const newDev = await devRes.json()
                  if (!devRes.ok) {
                    showToast(newDev.error || 'Failed to intake device', false)
                    return
                  }

                  const currentTargetBatchId = scanFaultForm.targetBatchId
                  if (scanFaultForm.destination === 'READY_TO_SELL') {
                    await moveToReadyToSell(newDev)
                  } else if (scanFaultForm.destination === 'REPAIR_BATCH') {
                    if (currentTargetBatchId) {
                      await addStockToExistingBatch(currentTargetBatchId, [newDev.id])
                    } else {
                      setSelectedBatchDeviceIds([newDev.id])
                      setBatchModalMode('CREATE_NEW')
                      setBatchStep(1)
                      setShowNewBatch(true)
                      setTab('batches')
                    }
                  } else {
                    showToast(`📋 ${newDev.model} (${newDev.imei}) saved to Raw QC Stock with logged faults!`)
                  }
                  await loadData()
                  if (currentTargetBatchId) {
                    showToast(`⚡ ${newDev.model} (${newDev.imei}) added to batch! Ready for next scan...`)
                    setScanFaultForm(f => ({
                      ...f,
                      imei: '',
                      faults: [],
                      notes: '',
                      targetBatchId: currentTargetBatchId
                    }))
                  } else {
                    setShowScanFaultModal(false)
                    setScanFaultForm({
                      imei: '',
                      model: '15 PRO',
                      storage: '128GB',
                      color: 'BLACK',
                      costAed: '1400',
                      faults: [],
                      notes: '',
                      destination: 'REPAIR_BATCH',
                      targetBatchId: ''
                    })
                  }
                }}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md"
              >
                ✓ Process Device &amp; Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
