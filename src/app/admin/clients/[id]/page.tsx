'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { adminApi } from '@/lib/adminApi'
import { Card, StatCard, Button, Select, Badge, Skeleton, showToast } from '@/components/ui'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ArrowLeft, MessageSquare, Calendar, Users, CreditCard } from 'lucide-react'

const PLANS = [
  { value: 'trial', label: 'Trial' },
  { value: 'starter', label: 'Starter' },
  { value: 'growth', label: 'Growth' },
  { value: 'pro', label: 'Pro' },
]

export default function AdminClientDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy]       = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await adminApi.client(id)
    if (error) showToast(error, 'error'); else setData(data)
    setLoading(false)
  }, [id])
  useEffect(() => { load() }, [load])

  async function act(fn: () => Promise<{ error: string | null }>, okMsg: string) {
    setBusy(true)
    const { error } = await fn()
    setBusy(false)
    if (error) showToast(error, 'error')
    else { showToast(okMsg, 'success'); load() }
  }

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}</div>
    </div>
  )
  if (!data) return <p className="text-sm text-[#FF5A5A]">Couldn&apos;t load client.</p>

  const c = data.client, u = data.usage
  const fmtDate = (t: string) => t ? new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
  const lastActive = u.lastActivity ? new Date(u.lastActivity).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'never'

  return (
    <div className="animate-up space-y-6">
      <button onClick={() => router.push('/admin/clients')} className="flex items-center gap-1.5 text-xs text-[#5A6370] hover:text-[#E8EAED]"><ArrowLeft size={13} /> All clients</button>

      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-[#E8EAED] font-[Syne]">{c.name}</h1>
        <StatusBadge status={c.status} />
      </div>
      <p className="text-sm text-[#5A6370] -mt-4">{c.type || '—'} · {c.owner_name || '—'} · {c.email || 'no email'}</p>

      {/* Usage */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Messages" value={u.messages} sub={`${u.aiReplies} AI replies`} icon={MessageSquare} color="blue" />
        <StatCard label="Appointments" value={u.appointments} sub="all time" icon={Calendar} color="green" />
        <StatCard label="Customers" value={u.customers} sub={`last active ${lastActive}`} icon={Users} color="purple" />
        <StatCard label="Revenue" value={`₹${Number(u.revenueCollected).toLocaleString('en-IN')}`} sub={`${u.openAlerts} open alerts`} icon={CreditCard} color="amber" />
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Plan & actions */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-[#E8EAED] mb-4">Plan &amp; billing</h2>
          <div className="space-y-2 text-sm mb-4">
            <Row label="Plan"><span className="capitalize text-[#E8EAED]">{c.plan || '—'}</span></Row>
            <Row label="Expires"><span className="text-[#E8EAED]">{fmtDate(c.plan_expires_at)}{c.daysLeft !== null && <span className="text-[#5A6370]"> ({c.daysLeft}d)</span>}</span></Row>
            <Row label="WhatsApp"><Badge variant={c.waba_status === 'live' ? 'green' : 'amber'}>{c.waba_status || 'pending'}</Badge></Row>
          </div>

          <div className="space-y-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
            <div>
              <p className="text-xs text-[#5A6370] mb-1.5">Extend</p>
              <div className="flex gap-2">
                <Button size="xs" variant="secondary" loading={busy} onClick={() => act(() => adminApi.changePlan(id, { extendDays: 7 }), 'Extended 7 days')}>+7 days</Button>
                <Button size="xs" variant="secondary" loading={busy} onClick={() => act(() => adminApi.changePlan(id, { extendDays: 30 }), 'Extended 30 days')}>+30 days</Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-[#5A6370] mb-1.5">Change plan</p>
              <Select value={c.plan || 'trial'} options={PLANS} onChange={(e: any) => act(() => adminApi.changePlan(id, { plan: e.target.value }), 'Plan changed')} className="w-40" />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {c.suspended
                ? <Button size="sm" variant="secondary" loading={busy} onClick={() => act(() => adminApi.changeStatus(id, { suspended: false }), 'Reactivated')}>Reactivate</Button>
                : <Button size="sm" variant="danger" loading={busy} onClick={() => act(() => adminApi.changeStatus(id, { suspended: true }), 'Suspended — AI paused')}>Suspend</Button>}
              {c.waba_status !== 'live'
                ? <Button size="sm" variant="secondary" loading={busy} onClick={() => act(() => adminApi.changeStatus(id, { waba_status: 'live' }), 'Marked WhatsApp live')}>Mark WABA live</Button>
                : <Button size="sm" variant="ghost" loading={busy} onClick={() => act(() => adminApi.changeStatus(id, { waba_status: 'pending' }), 'Set WABA pending')}>Set WABA pending</Button>}
            </div>
          </div>
        </Card>

        {/* Config snapshot */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-[#E8EAED] mb-4">Configuration</h2>
          <div className="space-y-2 text-sm">
            <Row label="Services"><span className="text-[#E8EAED]">{(c.services_list?.length ?? 0)} listed</span></Row>
            <Row label="Hours"><span className="text-[#E8EAED]">{c.business_hours && Object.keys(c.business_hours).length ? 'configured' : 'not set'}</span></Row>
            <Row label="UPI"><span className="text-[#E8EAED]">{c.upi_id || '—'}</span></Row>
            <Row label="WhatsApp phone id"><span className="text-[#E8EAED] font-mono text-xs">{c.whatsapp_phone_id || '—'}</span></Row>
            <Row label="Location"><span className="text-[#E8EAED]">{c.location || '—'}</span></Row>
            <Row label="Signed up"><span className="text-[#E8EAED]">{fmtDate(c.created_at)}</span></Row>
          </div>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-[#5A6370]">{label}</span>{children}</div>
}
