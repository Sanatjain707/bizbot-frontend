'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from '@/lib/supabase'
import { Avatar } from '@/components/ui'
import {
  LayoutDashboard, MessageSquare, Calendar, CreditCard,
  Users, Settings, LogOut, Zap, Sparkles, Megaphone, FileText
} from 'lucide-react'

const NAV = [
  { href: '/dashboard',              label: 'Overview',      icon: LayoutDashboard },
  { href: '/dashboard/conversations',label: 'Conversations', icon: MessageSquare, badge: true },
  { href: '/dashboard/appointments', label: 'Appointments',  icon: Calendar },
  { href: '/dashboard/payments',     label: 'Payments',      icon: CreditCard },
  { href: '/dashboard/customers',    label: 'Customers',     icon: Users },
  { href: '/dashboard/broadcast',    label: 'Broadcast',     icon: Megaphone },
  { href: '/dashboard/templates',    label: 'Templates',     icon: FileText },
  { href: '/dashboard/billing',      label: 'Plans & Billing', icon: Sparkles },
  { href: '/dashboard/settings',     label: 'Settings',      icon: Settings },
]

export default function Sidebar({ bizName, bizType, plan, planActive, unread = 0 }: any) {
  const path   = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-60 bg-[#0F1012] border-r border-[rgba(255,255,255,0.06)] flex flex-col z-40">
      <div className="px-4 py-4 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-3">
          <Avatar name={bizName} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#E8EAED] truncate font-[Syne]">{bizName || 'BizBot'}</p>
            <p className="text-xs text-[#5A6370] truncate">{bizType || 'Setting up...'}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, badge }) => {
          const active = path === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active ? 'bg-[rgba(0,197,122,0.1)] text-[#00C57A]' : 'text-[#9AA0AB] hover:text-[#E8EAED] hover:bg-[#1A1D20]'
              }`}>
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {badge && unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#00C57A] text-black text-xs font-bold flex items-center justify-center">{unread}</span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="mx-3 mb-3 px-3 py-2.5 rounded-xl bg-[rgba(0,197,122,0.06)] border border-[rgba(0,197,122,0.15)]">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00C57A] pulse-dot" />
          <Zap size={11} className="text-[#00C57A]" />
          <span className="text-xs font-medium text-[#00C57A]">AI Active</span>
        </div>
        <p className="text-xs text-[#5A6370]">Handling WhatsApp 24/7</p>
      </div>

      <div className="px-3 pb-4 space-y-1">
        <Link href="/dashboard/billing" className="block">
          <div className="px-3 py-2 rounded-xl bg-[#141618] flex items-center justify-between hover:bg-[#1A1D20] transition-all">
            <span className="text-xs text-[#5A6370]">Plan</span>
            <span className={`text-xs font-semibold capitalize ${planActive ? 'text-[#00C57A]' : 'text-[#FFA040]'}`}>
              {plan && plan !== 'none' ? plan : 'Choose plan'}{!planActive && plan !== 'none' ? ' (expired)' : ''}
            </span>
          </div>
        </Link>
        <button onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-[#5A6370] hover:text-[#E8EAED] hover:bg-[#1A1D20] transition-all">
          <LogOut size={16} />Sign out
        </button>
      </div>
    </aside>
  )
}