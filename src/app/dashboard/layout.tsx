'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { api } from '@/lib/api'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router            = useRouter()
  const [bizName, setBizName] = useState('My Business')
  const [ready,   setReady]   = useState(false)
  const [authed,  setAuthed]  = useState(false)

  useEffect(() => {
    async function init() {
      // Check localStorage for session
      const raw = localStorage.getItem('bizbot-session')

      if (!raw) {
        // No session — redirect to login
        router.replace('/login')
        return
      }

      try {
        const session = JSON.parse(raw)

        // Check if session expired
        const now = Math.floor(Date.now() / 1000)
        if (session.expires_at && session.expires_at < now) {
          localStorage.removeItem('bizbot-session')
          router.replace('/login')
          return
        }

        setAuthed(true)

        // Load business info
        const { data } = await api.getBusiness()
        if (data?.id) {
          localStorage.setItem('bizId', data.id)
          setBizName(data.name || 'My Business')
        }

        setReady(true)
      } catch (e) {
        // Bad session data
        localStorage.removeItem('bizbot-session')
        router.replace('/login')
      }
    }

    init()
  }, [router])

  // Show loading while checking auth
  if (!ready) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-zinc-500 text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 pulse" />
          {authed ? 'Loading dashboard...' : 'Checking session...'}
        </div>
        {!authed && (
          <p className="text-xs text-zinc-700">
            If this takes too long, <a href="/login" className="text-emerald-600 hover:text-emerald-400">go back to login</a>
          </p>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar bizName={bizName} />
      <main className="ml-52 p-8 max-w-6xl">{children}</main>
    </div>
  )
}
