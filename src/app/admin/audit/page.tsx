'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { adminApi } from '@/lib/adminApi'
import { Card, Badge, Skeleton, EmptyState } from '@/components/ui'
import { ScrollText } from 'lucide-react'

const ACTION_LABEL: Record<string, string> = {
  plan_change: 'Plan change', status_change: 'Status change',
}

export default function AdminAudit() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data } = await adminApi.audit('limit=100')
      setEntries(data?.entries || [])
      setLoading(false)
    })()
  }, [])

  const fmt = (t: string) => t ? new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

  return (
    <div className="animate-up">
      <h1 className="text-xl font-bold text-[#E8EAED] font-[Syne] mb-1">Audit log</h1>
      <p className="text-sm text-[#5A6370] mb-5">Every admin action, most recent first.</p>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : entries.length === 0 ? (
        <Card className="py-4"><EmptyState icon={ScrollText} title="No actions yet" desc="Admin actions will appear here as they happen." /></Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-[rgba(255,255,255,0.06)]">
              {['When', 'Admin', 'Action', 'Client', 'Detail'].map(h => (
                <th key={h} className="text-left text-xs font-medium text-[#5A6370] uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {entries.map((e: any) => (
                <tr key={e.id} className="border-b border-[rgba(255,255,255,0.03)]">
                  <td className="px-4 py-3 text-xs text-[#9AA0AB] whitespace-nowrap">{fmt(e.created_at)}</td>
                  <td className="px-4 py-3 text-xs text-[#9AA0AB]">{e.admin_email}</td>
                  <td className="px-4 py-3"><Badge variant="blue">{ACTION_LABEL[e.action] || e.action}</Badge></td>
                  <td className="px-4 py-3 text-sm text-[#E8EAED]">
                    {e.target_business_id
                      ? <Link href={`/admin/clients/${e.target_business_id}`} className="hover:text-[#00C57A]">{e.businesses?.name || 'client'}</Link>
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#5A6370] font-mono">{e.detail ? JSON.stringify(e.detail) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
