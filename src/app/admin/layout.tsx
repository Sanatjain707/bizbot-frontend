'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, signOut } from '@/lib/supabase'
import { adminApi } from '@/lib/adminApi'

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/clients', label: 'Clients' },
  { href: '/admin/alerts', label: 'Alerts' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const path = usePathname()
  const [state, setState] = useState<'checking' | 'ok' | 'denied'>('checking')
  const [email, setEmail] = useState('')

  useEffect(() => {
    let cancelled = false
    async function check() {
      const user = await getCurrentUser().catch(() => null)
      if (cancelled) return
      if (!user) { router.replace('/login'); return }
      const { data } = await adminApi.me()
      if (cancelled) return
      if (data?.admin) { setEmail(data.email || user.email || ''); setState('ok') }
      else setState('denied')
    }
    check()
    return () => { cancelled = true }
  }, [router])

  if (state === 'checking') return <Full>Checking admin access…</Full>
  if (state === 'denied') return (
    <Full>
      <div className="text-center">
        <p className="text-[#E8EAED] font-semibold mb-2">Admin access only</p>
        <p className="text-sm text-[#5A6370] mb-4">This account isn&apos;t a platform admin.</p>
        <a href="/dashboard" className="text-[#00C57A] text-sm hover:underline">Go to your dashboard</a>
      </div>
    </Full>
  )

  return (
    <div className="min-h-screen bg-[#08090A]">
      <header className="sticky top-0 z-40 bg-[#0F1012] border-b border-[rgba(255,255,255,0.06)]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-[#E8EAED] font-[Syne]">BizBot <span className="text-[#00C57A]">Admin</span></span>
            <nav className="flex items-center gap-1">
              {NAV.map(n => {
                const active = n.href === '/admin' ? path === '/admin' : path.startsWith(n.href)
                return (
                  <Link key={n.href} href={n.href}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-[rgba(0,197,122,0.1)] text-[#00C57A]' : 'text-[#9AA0AB] hover:text-[#E8EAED]'}`}>
                    {n.label}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#5A6370] hidden sm:inline">{email}</span>
            <button onClick={async () => { await signOut(); router.push('/login') }}
              className="text-xs text-[#5A6370] hover:text-[#E8EAED]">Sign out</button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}

function Full({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#08090A] flex items-center justify-center text-[#5A6370] text-sm px-6">{children}</div>
}
