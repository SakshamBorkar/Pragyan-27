import type { Metadata, Viewport } from 'next'
import './globals.css'
import { APP_NAME, APP_TAGLINE } from '@/lib/branding'

export const metadata: Metadata = {
  title: `${APP_NAME} · ${APP_TAGLINE}`,
  description: 'Schedule PI slots and send WhatsApp confirmations',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0f0f1a] min-h-screen text-white">{children}</body>
    </html>
  )
}
