import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/ui'

export const metadata: Metadata = {
  title: 'BizBot — AI WhatsApp Agent',
  description: 'AI-powered WhatsApp agent for Indian SMBs',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}