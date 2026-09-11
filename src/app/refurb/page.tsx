'use client'
import { useEffect } from 'react'

export default function RefurbPage() {
  useEffect(() => {
    window.location.href = '/'
  }, [])
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-bold text-sm">
      Loading AQUA CELL ERP...
    </div>
  )
}
