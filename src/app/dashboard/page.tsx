'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Card, StatCard, Avatar, Badge, Button, SkeletonCard, Skeleton, EmptyState } from '@/components/ui'
import GettingStarted from '@/components/dashboard/GettingStarted'
import { EngagementLine, rupee } from '@/components/dashboard/AnalyticsCharts'
import { Calendar, MessageSquare, CreditCard, Users, Plus, Zap, AlertTriangle, TrendingUp, Clock, BarChart3 } from 'lucide-react'

const STATUS_CLS: any = {
  confirmed: 'green', done: 'default', cancelled: 'red', no_show: 'amber',
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats,   setStats]   = useState<any>(null)
  const [appts,   setAppts]   = useState<any[]>([])
  const [convos,  setConvos]  = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [biz,     setBiz]     = useState<any>({})
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
  const hour  = Number(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }))
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    async function load() {
      const [s, a, c, cust, b, an] = await Promise.all([
        api.getStats(), api.getTodayAppointments(), api.getConversations(), api.getCustomers(), api.getBusiness(), api.getAnalytics('preset=30')
      ])
      if (s.data) setStats(s.data)
      if (a.data) setAppts(a.data)
      if (c.data) setConvos(c.data)
      if (cust.data) setCustomers(cust.data)
      if (b.data) setBiz(b.data)
      if (an.data) setAnalytics(an.data)
      setLoading(false)
    }
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [])

  const atRisk = customers.filter(c => {
    const days = Math.floor((Date.now() - new Date(c.last_seen).getTime()) / 86400000)
    return days >= 21
  }).length

  return (
    <div className="animate-up">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#E8EAED] mb-1 font-[Syne]">{greeting} 👋</h1>
          <p className="text-sm text-[#5A6370]">{today}</p>
        </div>
        {biz.whatsapp_phone_id ? (
          <Badge variant="green" size="md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00C57A] pulse-dot mr-1.5" /> WhatsApp Live
          </Badge>
        ) : (
          <Badge variant="amber" size="md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFA040] pulse-dot mr-1.5" /> WhatsApp Connecting
          </Badge>
        )}
      </div>

      {/* Getting started checklist (auto-hides when complete) */}
      {!loading && <GettingStarted biz={biz} servicesCount={(biz.services_list || []).length} />}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard label="Today's Bookings" value={stats?.todayAppointments ?? 0} sub="Via WhatsApp AI" icon={Calendar} color="green" />
          <StatCard label="Pending Payments" value={`₹${(stats?.pendingPayments ?? 0).toLocaleString('en-IN')}`} sub="To collect" icon={CreditCard} color="amber" />
          <StatCard label="AI Replies Today" value={stats?.aiRepliesToday ?? 0} sub="100% automated" icon={MessageSquare} color="blue" />
          <StatCard label="New Enquiries" value={stats?.newCustomersToday ?? 0} sub="Responded instantly" icon={Users} color="purple" />
        </div>
      )}

      {/* 30-day analytics summary (links to full page) */}
      {analytics?.hasData && (
        <Card className="p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={15} className="text-[#00C57A]" />
              <h2 className="text-sm font-semibold text-[#E8EAED]">Last 30 days</h2>
            </div>
            <a href="/dashboard/analytics" className="text-xs text-[#00C57A] hover:underline">Full analytics →</a>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-4">
            {[
              { label: 'Customers engaged', v: analytics.kpis.customersEngaged.value, t: analytics.kpis.customersEngaged.changePct },
              { label: 'Appointments',      v: analytics.kpis.appointments.value,     t: analytics.kpis.appointments.changePct },
              { label: 'Revenue collected', v: rupee(analytics.kpis.revenueCollected.value), t: analytics.kpis.revenueCollected.changePct },
              { label: 'New customers',     v: analytics.kpis.newCustomers.value,     t: analytics.kpis.newCustomers.changePct },
            ].map((m, i) => (
              <div key={i} className="bg-[#141618] rounded-xl p-3">
                <p className="text-xs text-[#5A6370] mb-1">{m.label}</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[#E8EAED] font-[Syne]">{m.v}</span>
                  {typeof m.t === 'number' && m.t !== 0 && (
                    <span className={`text-xs font-medium ${m.t > 0 ? 'text-[#00C57A]' : 'text-[#FF5A5A]'}`}>{m.t > 0 ? '↑' : '↓'}{Math.abs(m.t)}%</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <EngagementLine data={analytics.charts.engagementOverTime} height={120} />
        </Card>
      )}

      {/* AI activity bar */}
      <Card className="p-4 mb-6 flex items-center gap-4 bg-gradient-to-r from-[rgba(0,197,122,0.06)] to-transparent border-[rgba(0,197,122,0.15)]">
        <div className="w-9 h-9 rounded-xl bg-[rgba(0,197,122,0.12)] flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-[#00C57A]" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-[#E8EAED]">
            BizBot AI handled <strong className="text-[#00C57A]">{stats?.aiRepliesToday ?? 0} conversations</strong> today
          </p>
          <p className="text-xs text-[#5A6370]">Saving you approximately {Math.round((stats?.aiRepliesToday ?? 0) * 2)} minutes of manual replies</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => router.push('/dashboard/conversations')}>View chats →</Button>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card hover className="p-4 flex items-center gap-3" onClick={() => router.push('/dashboard/appointments')}>
          <div className="w-9 h-9 rounded-xl bg-[rgba(0,197,122,0.1)] flex items-center justify-center"><Plus size={16} className="text-[#00C57A]" /></div>
          <div><p className="text-sm font-medium text-[#E8EAED]">Add Appointment</p><p className="text-xs text-[#5A6370]">Manual booking</p></div>
        </Card>
        <Card hover className="p-4 flex items-center gap-3" onClick={() => router.push('/dashboard/payments')}>
          <div className="w-9 h-9 rounded-xl bg-[rgba(255,160,64,0.1)] flex items-center justify-center"><CreditCard size={16} className="text-[#FFA040]" /></div>
          <div><p className="text-sm font-medium text-[#E8EAED]">Log Payment</p><p className="text-xs text-[#5A6370]">Track a due</p></div>
        </Card>
        <Card hover className="p-4 flex items-center gap-3" onClick={() => router.push('/dashboard/customers')}>
          <div className="w-9 h-9 rounded-xl bg-[rgba(255,90,90,0.1)] flex items-center justify-center"><AlertTriangle size={16} className="text-[#FF5A5A]" /></div>
          <div><p className="text-sm font-medium text-[#E8EAED]">{atRisk} At-Risk</p><p className="text-xs text-[#5A6370]">Re-engage them</p></div>
        </Card>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-5 gap-5">

        {/* Today's appointments */}
        <Card className="col-span-3 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#E8EAED]">Today's Appointments</h2>
            <a href="/dashboard/appointments" className="text-xs text-[#00C57A] hover:underline">View all →</a>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : appts.length === 0 ? (
            <EmptyState icon={Calendar} title="No appointments today" desc="BizBot will book them automatically as enquiries come in" />
          ) : (
            <div className="space-y-2">
              {appts.slice(0, 6).map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 p-3 bg-[#141618] rounded-xl hover:bg-[#1A1D20] transition-all">
                  <Avatar name={a.customers?.name} phone={a.customers?.phone} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#E8EAED] truncate">{a.customers?.name || a.customers?.phone}</p>
                    <p className="text-xs text-[#5A6370] truncate">{a.service}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#9AA0AB] mb-1">{new Date(a.appointment_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                    <Badge variant={STATUS_CLS[a.status]} size="xs">{a.status.replace('_', ' ')}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Live conversations */}
        <Card className="col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#E8EAED]">Live Chats</h2>
            <a href="/dashboard/conversations" className="text-xs text-[#00C57A] hover:underline">View all →</a>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : convos.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No chats yet" desc="Messages appear here" />
          ) : (
            <div className="space-y-1">
              {convos.slice(0, 7).map((c: any) => (
                <a key={c.id} href="/dashboard/conversations"
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all ${c.unread > 0 ? 'bg-[rgba(0,197,122,0.06)]' : 'hover:bg-[#1A1D20]'}`}>
                  <Avatar name={c.name} phone={c.phone} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-[#E8EAED] truncate">{c.name || c.phone}</p>
                      <p className="text-xs text-[#5A6370] ml-1">{c.last_time}</p>
                    </div>
                    <p className="text-xs text-[#5A6370] truncate mt-0.5">{c.last_msg}</p>
                  </div>
                  {c.unread > 0 && <span className="w-4 h-4 rounded-full bg-[#00C57A] text-black text-xs font-bold flex items-center justify-center">{c.unread}</span>}
                </a>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}