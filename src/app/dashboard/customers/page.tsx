'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, Button, Badge, Modal, Input, StatCard, EmptyState, Skeleton, showToast, Avatar } from '@/components/ui'
import ImportCustomersModal from '@/components/dashboard/ImportCustomersModal'
import { Users, Plus, Send, Search, X, Phone, Calendar, Clock, Trash2, Upload } from 'lucide-react'

// daysSince(null) used to return NaN, which is neither >= 21 nor >= 14, so
// imported customers who never messaged fell through to "Active" — wrong.
// Return Infinity so they're treated as maximally stale (imports usually
// need re-engagement anyway).
function daysSince(d: string | null | undefined): number {
  if (!d) return Infinity
  const parsed = new Date(d).getTime()
  if (Number.isNaN(parsed)) return Infinity
  return Math.floor((Date.now() - parsed) / 86400000)
}
function churn(days: number) {
  if (!Number.isFinite(days)) return { v: 'default', l: 'New' }
  return days >= 21 ? { v: 'red', l: 'At risk' } : days >= 14 ? { v: 'amber', l: 'Inactive' } : { v: 'green', l: 'Active' }
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [search,    setSearch]    = useState('')
  const [tab,       setTab]       = useState('all')
  const [loading,   setLoading]   = useState(true)
  const [sending,   setSending]   = useState<string | null>(null)
  const [selected,  setSelected]  = useState<any>(null)
  const [showForm,  setShowForm]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [confirmDel, setConfirmDel] = useState<any>(null)
  const [deleting,  setDeleting]  = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '' })

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t) }, [])
  async function load() {
    const { data, error } = await api.getCustomers()
    // Only surface the error on the first load — subsequent polling failures
    // stay silent to avoid toast spam every 15s.
    if (error && loading) showToast(error, 'error')
    if (data) setCustomers(data)
    setLoading(false)
  }

  async function reengage(id: string, name: string) {
    setSending(id)
    await api.sendReengagement(id)
    showToast(`Re-engagement sent to ${name}`, 'success')
    setSending(null)
  }

  async function doDelete() {
    if (!confirmDel) return
    setDeleting(true)
    const { error } = await api.deleteCustomer(confirmDel.id)
    setDeleting(false)
    if (error) showToast(error, 'error')
    else {
      showToast('Customer deleted', 'success')
      setCustomers(prev => prev.filter(c => c.id !== confirmDel.id))
      setConfirmDel(null)
      if (selected?.id === confirmDel.id) setSelected(null)
    }
  }

  async function create() {
    if (!form.name) { showToast('Enter a name', 'error'); return }
    const phone = (form.phone || '').replace(/\D/g, '')
    if (phone.length < 10) { showToast('Enter a valid 10-digit phone number', 'error'); return }
    setSaving(true)
    const { error } = await api.createCustomer({ name: form.name, phone })
    if (error) showToast('Failed', 'error')
    else { showToast('Customer added', 'success'); setShowForm(false); setForm({ name: '', phone: '' }); load() }
    setSaving(false)
  }

  let filtered = customers.filter(c => !search || (c.name || '').toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search))
  if (tab === 'active')  filtered = filtered.filter(c => daysSince(c.last_seen) < 14)
  if (tab === 'at_risk') filtered = filtered.filter(c => daysSince(c.last_seen) >= 21)

  const atRisk = customers.filter(c => daysSince(c.last_seen) >= 21).length
  const active = customers.filter(c => daysSince(c.last_seen) < 7).length

  return (
    <div className="animate-up">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-bold text-[#E8EAED] mb-1 font-[Syne]">Customers</h1><p className="text-sm text-[#5A6370]">Everyone who contacted you on WhatsApp</p></div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={Upload} onClick={() => setShowImport(true)}>Import</Button>
          <Button icon={Plus} onClick={() => setShowForm(true)}>Add Customer</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total" value={customers.length} sub="All customers" icon={Users} color="blue" />
        <StatCard label="Active" value={active} sub="Last 7 days" icon={Users} color="green" />
        <StatCard label="At Risk" value={atRisk} sub="21+ days inactive" icon={Users} color="red" />
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex gap-2">
          {[['all', 'All'], ['active', 'Active'], ['at_risk', 'At Risk']].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${tab === v ? 'bg-[rgba(0,197,122,0.1)] text-[#00C57A] border border-[rgba(0,197,122,0.2)]' : 'text-[#5A6370] border border-[rgba(255,255,255,0.06)]'}`}>{l}</button>
          ))}
        </div>
        <div className="flex-1"><Input icon={Search} placeholder="Search by name or phone..." value={search} onChange={(e: any) => setSearch(e.target.value)} /></div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="py-4"><EmptyState icon={Users} title="No customers found" desc="They'll appear here when they message you" /></Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-[rgba(255,255,255,0.06)]">
              {['Customer', 'Last Seen', 'Visits', 'Status', 'Action'].map(h => <th key={h} className="text-left text-xs font-medium text-[#5A6370] uppercase tracking-wider px-4 py-3">{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map((c: any) => {
                const days = daysSince(c.last_seen)
                const ch = churn(days)
                return (
                  <tr key={c.id} onClick={() => setSelected(c)} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[#141618] transition-all cursor-pointer">
                    <td className="px-4 py-3"><div className="flex items-center gap-2.5"><Avatar name={c.name} phone={c.phone} size="sm" /><div><p className="text-sm font-medium text-[#E8EAED]">{c.name || '—'}</p><p className="text-xs text-[#5A6370] font-mono">{c.phone}</p></div></div></td>
                    <td className="px-4 py-3"><p className="text-sm text-[#9AA0AB]">{!Number.isFinite(days) ? 'Never' : days === 0 ? 'Today' : `${days}d ago`}</p></td>
                    <td className="px-4 py-3 text-sm text-[#9AA0AB]">{c.total_visits || 0}</td>
                    <td className="px-4 py-3"><Badge variant={ch.v}>{ch.l}</Badge></td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        {days >= 14 && !c.reengagement_sent && <Button size="xs" variant="ghost" icon={Send} onClick={() => reengage(c.id, c.name || c.phone)} loading={sending === c.id}>Re-engage</Button>}
                        {c.reengagement_sent && <span className="text-xs text-[#5A6370]">Sent ✓</span>}
                        <button onClick={() => setConfirmDel(c)} className="p-1.5 rounded-lg text-[#5A6370] hover:text-[#FF5A5A] hover:bg-[rgba(255,90,90,0.08)] transition-all" title="Delete customer"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
          <div className="relative w-96 bg-[#0F1012] border-l border-[rgba(255,255,255,0.08)] h-full animate-slide overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <h3 className="font-semibold text-[#E8EAED]">Customer Details</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-[#1A1D20] text-[#5A6370]"><X size={16} /></button>
            </div>
            <div className="p-5">
              <div className="flex flex-col items-center mb-6">
                <Avatar name={selected.name} phone={selected.phone} size="xl" className="mb-3" />
                <p className="text-lg font-semibold text-[#E8EAED]">{selected.name || 'Unknown'}</p>
                <p className="text-sm text-[#5A6370] font-mono">{selected.phone}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#141618] rounded-xl"><span className="text-xs text-[#5A6370] flex items-center gap-2"><Clock size={13} />Last Seen</span><span className="text-sm text-[#E8EAED]">{!Number.isFinite(daysSince(selected.last_seen)) ? 'Never' : `${daysSince(selected.last_seen)}d ago`}</span></div>
                <div className="flex items-center justify-between p-3 bg-[#141618] rounded-xl"><span className="text-xs text-[#5A6370] flex items-center gap-2"><Calendar size={13} />Total Visits</span><span className="text-sm text-[#E8EAED]">{selected.total_visits || 0}</span></div>
                <div className="flex items-center justify-between p-3 bg-[#141618] rounded-xl"><span className="text-xs text-[#5A6370]">Status</span><Badge variant={churn(daysSince(selected.last_seen)).v}>{churn(daysSince(selected.last_seen)).l}</Badge></div>
              </div>
              <div className="mt-5 flex gap-2">
                <Button size="sm" icon={Send} onClick={() => { reengage(selected.id, selected.name || selected.phone); setSelected(null) }}>Send Message</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Delete customer?">
        <p className="text-sm text-[#9AA0AB] mb-1">This will permanently remove <span className="text-[#E8EAED] font-medium">{confirmDel?.name || confirmDel?.phone}</span> and all their conversations, appointments, and payments.</p>
        <p className="text-sm text-[#FF5A5A] mb-5">This cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setConfirmDel(null)}>Cancel</Button>
          <Button variant="danger" icon={Trash2} loading={deleting} onClick={doDelete}>Delete</Button>
        </div>
      </Modal>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Customer">
        <div className="space-y-4">
          <Input label="Name *" placeholder="Priya Sharma" value={form.name} onChange={(e: any) => setForm(p => ({ ...p, name: e.target.value }))} />
          <Input label="Phone *" placeholder="9876543210" value={form.phone} onChange={(e: any) => setForm(p => ({ ...p, phone: e.target.value }))} />
        </div>
        <div className="flex gap-2 mt-5"><Button onClick={create} loading={saving}>Add</Button><Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button></div>
      </Modal>

      <ImportCustomersModal open={showImport} onClose={() => setShowImport(false)} onImported={load} />
    </div>
  )
}