'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { adminApi } from '@/lib/adminApi'
import { Card, Badge, Skeleton, EmptyState } from '@/components/ui'
import { AlertTriangle } from 'lucide-react'

const FILTERS = ['open', 'handled', 'dismissed', 'all']
const REASON_LABEL: Record<string, string> = {
  ambiguous: 'Ambiguous date/time', llm_error: 'AI error', extractor_failed: 'Extractor failed',
  closed_day: 'Closed day', after_cutoff: 'After cutoff', holiday: 'Holiday',
  conflict: 'Slot conflict', capacity: 'Over capacity', past: 'In the past', duplicate: 'Duplicate',
}
const humanReason = (r: string) => REASON_LABEL[r] || (r || 'unknown').replace(/_/g, ' ')

export default function AdminAlerts() {
  const [alerts, setAlerts]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus]   = useState('open')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (status !== 'all') params.set('status', status)
    params.set('limit', '100')
    const { data } = await adminApi.alerts(params.toString())
    setAlerts(data?.alerts || [])
    setLoading(false)
  }, [status])
  useEffect(() => { load() }, [load])

  const fmt = (t: string) => t ? new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

  return (
    <div className="animate-up">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[#E8EAED] font-[Syne]">Booking alerts</h1>
          <p className="text-sm text-[#5A6370]">Every time the AI couldn&apos;t complete a booking — across all clients.</p>
        </div>
        <span className="text-xs text-[#5A6370]">{alerts.length} shown</span>
      </div>

      <div className="flex gap-2 mb-5">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setStatus(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${status === f ? 'bg-[rgba(0,197,122,0.1)] text-[#00C57A] border border-[rgba(0,197,122,0.2)]' : 'text-[#5A6370] border border-[rgba(255,255,255,0.06)] hover:text-[#9AA0AB]'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : alerts.length === 0 ? (
        <Card className="py-4"><EmptyState icon={AlertTriangle} title="No alerts" desc="Nothing to show for this filter." /></Card>
      ) : (
        <div className="space-y-2">
          {alerts.map((a: any) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Link href={`/admin/clients/${a.business_id}`} className="text-sm font-medium text-[#E8EAED] hover:text-[#00C57A]">{a.businesses?.name || 'Unknown business'}</Link>
                <Badge variant="amber">{humanReason(a.reason)}</Badge>
                {a.status !== 'open' && <Badge variant="default">{a.status}</Badge>}
              </div>
              <p className="text-xs text-[#5A6370] mb-1">{a.customers?.name || a.customers?.phone || 'customer'} · {fmt(a.created_at)}</p>
              {a.message_snippet && <p className="text-xs text-[#9AA0AB] truncate">&ldquo;{a.message_snippet}&rdquo;</p>}
              {(a.suggested_service || a.suggested_date || a.suggested_time) && (
                <p className="text-xs text-[#5A6370] mt-1">wanted: {[a.suggested_service, a.suggested_date, a.suggested_time].filter(Boolean).join(' · ')}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
