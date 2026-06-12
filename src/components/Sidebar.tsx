'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from '@/lib/supabase'
import { LayoutDashboard, Calendar, MessageSquare, CreditCard, Users, Settings, LogOut, Zap } from 'lucide-react'

const NAV = [
  { href: '/dashboard',                  label: 'Overview',       icon: LayoutDashboard },
  { href: '/dashboard/appointments',     label: 'Appointments',   icon: Calendar },
  { href: '/dashboard/conversations',    label: 'Conversations',  icon: MessageSquare },
  { href: '/dashboard/payments',         label: 'Payments',       icon: CreditCard },
  { href: '/dashboard/customers',        label: 'Customers',      icon: Users },
  { href: '/dashboard/settings',         label: 'Settings',       icon: Settings },
]

export default function Sidebar({ bizName }: { bizName?: string }) {
  const path   = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    localStorage.removeItem('bizId')
    router.push('/login')
  }

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-52 bg-zinc-900 border-r border-zinc-800 flex flex-col z-40">
      <div className="px-4 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 pulse" />
          <span className="font-bold text-white text-base tracking-tight">BizBot</span>
        </div>
        {bizName && <p className="text-xs text-zinc-500 truncate pl-4">{bizName}</p>}
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href
          return (
            <Link key={href} href={href} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              active ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}>
              <Icon size={15} />{label}
            </Link>
          )
        })}
      </nav>

      <div className="mx-2 mb-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Zap size={11} className="text-emerald-400" />
          <span className="text-xs font-medium text-emerald-400">AI Active</span>
        </div>
        <p className="text-xs text-zinc-600">Handling WhatsApp 24/7</p>
      </div>

      <div className="px-2 pb-3">
        <button onClick={handleSignOut} className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
          <LogOut size={15} />Sign out
        </button>
      </div>
    </aside>
  )
}
