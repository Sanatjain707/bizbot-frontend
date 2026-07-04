'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { adminApi } from '@/lib/adminApi'
import { Card, Badge, Skeleton } from '@/components/ui'
import { StatusBadge } from '@/components/admin/StatusBadge'

export default function AdminOverview() {
  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    (async () => {
      const { data, error } = await adminApi.overview()
      if (error) setError(error); else setData(data)
      setLoading(false)
    })()
  }, [])

  if (loading) return <div className="grid grid-cols-5 gap-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20" />)}</div>
  if (error || !data) return <p className="text-sm text-[#FF5A5A]">{error || "Couldn't load overview."}</p>

  const c = data.clients
  const tiles = [
    { label: 'Total clients', value: c.total, color: 'text-[#E8EAED]' },
    { label: 'Active',        value: c.active, color: 'text-[#00C57A]' },
    { label: 'On trial',      value: c.trial, color: 'text-[#4D9EFF]' },
    { label: 'Expired',       value: c.expired, color: 'text-[#FF5A5A]' },
    { label: 'Suspended',     value: c.suspended, color: 'text-[#FFA040]' },
  ]

  return (
    <div className="animate-up space-y-6">
      <h1 className="text-xl font-bold text-[#E8EAED] font-[Syne]">Overview</h1>

      <div className="grid grid-cols-5 gap-3">
        {tiles.map(t => (
          <Card key={t.label} className="p-4">
            <p className="text-xs text-[#5A6370] mb-1 uppercase tracking-wider">{t.label}</p>
            <p className={`text-2xl font-bold font-[Syne] ${t.color}`}>{t.value}</p>
          </Card>
        ))}
      </div>

      {data.revenue && (
        <div className="grid grid-cols-4 gap-3">
          <Card className="p-4 col-span-2 bg-gradient-to-r from-[rgba(0,197,122,0.08)] to-transparent border-[rgba(0,197,122,0.15)]">
            <p className="text-xs text-[#5A6370] mb-1 uppercase tracking-wider">Monthly recurring revenue</p>
            <p className="text-3xl font-bold text-[#00C57A] font-[Syne]">₹{Number(data.revenue.mrr).toLocaleString('en-IN')}</p>
            <p className="text-xs text-[#5A6370] mt-1">{data.revenue.payingClients} paying client{data.revenue.payingClients === 1 ? '' : 's'}</p>
          </Card>
          <Card className="p-4 col-span-2">
            <p className="text-xs text-[#5A6370] mb-2 uppercase tracking-wider">Paying clients by plan</p>
            <div className="flex items-end gap-6">
              {[['Starter', data.revenue.byPlan.starter, '₹999'], ['Growth', data.revenue.byPlan.growth, '₹1,999'], ['Pro', data.revenue.byPlan.pro, '₹3,999']].map(([l, n, p]: any) => (
                <div key={l}>
                  <p className="text-2xl font-bold text-[#E8EAED] font-[Syne]">{n}</p>
                  <p className="text-xs text-[#9AA0AB]">{l}</p>
                  <p className="text-xs text-[#5A6370]">{p}/mo</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {[['Messages', data.totals.messages], ['Appointments', data.totals.appointments], ['Customers', data.totals.customers]].map(([l, v]: any) => (
          <Card key={l} className="p-4">
            <p className="text-xs text-[#5A6370] mb-1">{l} · all clients</p>
            <p className="text-xl font-bold text-[#E8EAED] font-[Syne]">{Number(v).toLocaleString('en-IN')}</p>
          </Card>
        ))}
        <Card className="p-4">
          <p className="text-xs text-[#5A6370] mb-1">WhatsApp spend · 30d</p>
          <p className="text-xl font-bold text-[#E8EAED] font-[Syne]">₹{Number(data.totals.whatsappSpend30d || 0).toLocaleString('en-IN')}</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-[#E8EAED] mb-3">Expiring soon (7 days)</h2>
          {data.expiringSoon.length === 0 ? (
            <p className="text-xs text-[#5A6370]">Nothing expiring in the next 7 days.</p>
          ) : (
            <div className="space-y-2">
              {data.expiringSoon.map((b: any) => (
                <Link key={b.id} href={`/admin/clients/${b.id}`} className="flex items-center justify-between p-2.5 bg-[#141618] rounded-xl hover:bg-[#1A1D20] transition-all">
                  <span className="text-sm text-[#E8EAED] truncate">{b.name}</span>
                  <Badge variant={b.daysLeft <= 2 ? 'red' : 'amber'}>{b.daysLeft}d left</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-[#E8EAED] mb-3">Recent signups</h2>
          {data.recentSignups.length === 0 ? (
            <p className="text-xs text-[#5A6370]">No signups yet.</p>
          ) : (
            <div className="space-y-2">
              {data.recentSignups.map((b: any) => (
                <Link key={b.id} href={`/admin/clients/${b.id}`} className="flex items-center justify-between p-2.5 bg-[#141618] rounded-xl hover:bg-[#1A1D20] transition-all">
                  <span className="text-sm text-[#E8EAED] truncate">{b.name} <span className="text-xs text-[#5A6370]">· {b.type || '—'}</span></span>
                  <StatusBadge status={b.status} />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
