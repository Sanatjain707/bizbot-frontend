'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi } from '@/lib/adminApi'
import { Card, Badge, Input, Skeleton, EmptyState } from '@/components/ui'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Search, Users, AlertTriangle } from 'lucide-react'

const FILTERS = ['all', 'trial', 'active', 'expired', 'suspended']

export default function AdminClients() {
  const router = useRouter()
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search.trim()) params.set('search', search.trim())
    if (status !== 'all') params.set('status', status)
    params.set('limit', '200')
    const { data } = await adminApi.clients(params.toString())
    setClients(data?.clients || [])
    setLoading(false)
  }, [search, status])

  // Debounce search; refetch on status change.
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t) }, [load])

  return (
    <div className="animate-up">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-[#E8EAED] font-[Syne]">Clients</h1>
        <span className="text-xs text-[#5A6370]">{clients.length} shown</span>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex gap-2">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setStatus(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${status === f ? 'bg-[rgba(0,197,122,0.1)] text-[#00C57A] border border-[rgba(0,197,122,0.2)]' : 'text-[#5A6370] border border-[rgba(255,255,255,0.06)] hover:text-[#9AA0AB]'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex-1"><Input icon={Search} placeholder="Search name, owner, or email..." value={search} onChange={(e: any) => setSearch(e.target.value)} /></div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : clients.length === 0 ? (
        <Card className="py-4"><EmptyState icon={Users} title="No clients" desc="No businesses match this filter." /></Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-[rgba(255,255,255,0.06)]">
              {['Business', 'Plan', 'Status', 'WhatsApp', 'Expires', ''].map(h => (
                <th key={h} className="text-left text-xs font-medium text-[#5A6370] uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {clients.map((c: any) => (
                <tr key={c.id} onClick={() => router.push(`/admin/clients/${c.id}`)}
                  className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[#141618] transition-all cursor-pointer">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-[#E8EAED]">{c.name || '—'}</p>
                    <p className="text-xs text-[#5A6370]">{c.owner_name || c.email || '—'} · {c.type || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#9AA0AB] capitalize">{c.plan || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3"><Badge variant={c.waba_status === 'live' ? 'green' : 'amber'}>{c.waba_status || 'pending'}</Badge></td>
                  <td className="px-4 py-3 text-sm text-[#9AA0AB]">{c.daysLeft === null ? '—' : `${c.daysLeft}d`}</td>
                  <td className="px-4 py-3">{c.atRisk && <AlertTriangle size={14} className="text-[#FFA040]" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
