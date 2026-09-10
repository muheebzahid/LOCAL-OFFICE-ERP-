import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AQUA CELL – Inventory Tracker',
  description: 'Phone inventory & sales management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
