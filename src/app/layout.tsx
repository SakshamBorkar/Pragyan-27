import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pragyan PI Scheduler',
  description: 'Schedule PI slots and send WhatsApp confirmations',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0f0f1a] min-h-screen text-white">{children}</body>
    </html>
  )
}
