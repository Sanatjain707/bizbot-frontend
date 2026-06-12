'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Users, Send, Search } from 'lucide-react'

function daysSince(date: string) {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
}

function ChurnBadge({ days }: { days: number }) {
  if (days >= 21) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-medium">At risk</span>
  if (days >= 14) return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">Inactive</span>
  return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">Active</span>
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [search,    setSearch]    = useState('')
  const [loading,   setLoading]   = useState(true)
  const [sending,   setSending]   = useState<string|null>(null)
  const [toast,     setToast]     = useState('')

  useEffect(() => {
    api.getCustomers().then(({data}) => { if(data) setCustomers(data); setLoading(false) })
  }, [])

  async function reengage(id: string, name: string) {
    setSending(id)
    await api.sendReengagement(id)
    setToast(`✓ Re-engagement message sent to ${name}`)
    setCustomers(prev => prev.map(c => c.id===id ? {...c, reengagement_sent: true} : c))
    setTimeout(() => setToast(''), 3000)
    setSending(null)
  }

  const filtered = customers.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  )

  const atRisk = customers.filter(c => daysSince(c.last_seen) >= 21).length
  const active = customers.filter(c => daysSince(c.last_seen) <= 7).length

  return (
    <div className="animate-in max-w-5xl">
      {toast && (
        <div className="fixed bottom-6 right-6 bg-emerald-500 text-black text-sm font-medium px-4 py-2.5 rounded-xl z-50 animate-in shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white mb-1">Customers</h1>
        <p className="text-sm text-zinc-500">Everyone who has contacted you via WhatsApp</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Total Customers</p>
          <p className="text-2xl font-semibold text-white">{customers.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">At Risk (21+ days)</p>
          <p className="text-2xl font-semibold text-red-400">{atRisk}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Active (last 7 days)</p>
          <p className="text-2xl font-semibold text-emerald-400">{active}</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input type="text" placeholder="Search by name or phone..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-700 transition-colors" />
      </div>

      {loading ? (
        <div className="text-center py-20 text-zinc-600 text-sm">Loading customers...</div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Customer','Last Seen','Visits','Status','Action'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => {
                const days = daysSince(c.last_seen)
                return (
                  <tr key={c.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-white">{c.name || '—'}</p>
                      <p className="text-xs text-zinc-500 font-mono">{c.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-zinc-300">{days === 0 ? 'Today' : `${days}d ago`}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-300">{c.total_visits || 0}</td>
                    <td className="px-4 py-3"><ChurnBadge days={days} /></td>
                    <td className="px-4 py-3">
                      {days >= 14 && !c.reengagement_sent ? (
                        <button onClick={() => reengage(c.id, c.name || c.phone)} disabled={sending === c.id}
                          className="text-xs px-2.5 py-1 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg hover:border-emerald-500/50 hover:text-emerald-400 flex items-center gap-1.5 disabled:opacity-50 transition-colors">
                          <Send size={10} />{sending === c.id ? '...' : 'Re-engage'}
                        </button>
                      ) : c.reengagement_sent ? (
                        <span className="text-xs text-zinc-600">Sent ✓</span>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10">
                  <Users size={28} className="text-zinc-700 mx-auto mb-2" />
                  <p className="text-zinc-600 text-sm">No customers found</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
