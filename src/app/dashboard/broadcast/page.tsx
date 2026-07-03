'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, Button, Badge, Modal, Input, Select, EmptyState, Skeleton, showToast } from '@/components/ui'
import LockGate from '@/components/dashboard/LockGate'
import { Plus, Megaphone, Send, Users, IndianRupee, Eye, MessageSquare, CheckCheck, FileText } from 'lucide-react'
import { scheduledLocalToUtcISO } from '@/lib/dateTime'

const SEGMENTS = [
  { value: 'all',    label: 'All customers' },
  { value: 'active', label: 'Active (visited in last 14 days)' },
  { value: 'lapsed', label: 'Lapsed (21+ days inactive)' },
  { value: 'service',label: 'By service booked' },
]

export default function BroadcastPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [sending,   setSending]   = useState<string | null>(null)
  const [audience,  setAudience]  = useState<any>({ count: 0, estCost: 0 })
  const [form, setForm] = useState({ name: '', template_id: '', segment: 'all', segment_value: '', scheduled_at: '' })
  const [confirmSend, setConfirmSend] = useState<any>(null)
  const [cancelling, setCancelling] = useState<string | null>(null)

  useEffect(() => { load() }, [])
  async function load() {
    const [c, t] = await Promise.all([api.getCampaigns(), api.getTemplates()])
    if (c.data) setCampaigns(c.data)
    if (t.data) setTemplates(t.data)
    setLoading(false)
  }

  // A blast runs in the background; poll so counters update live while it sends.
  useEffect(() => {
    if (!campaigns.some(c => c.status === 'sending')) return
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [campaigns])

  async function doCancel(id: string) {
    setCancelling(id)
    const { error } = await api.cancelCampaign(id)
    setCancelling(null)
    showToast(error || 'Campaign cancelled', error ? 'error' : 'success')
    load()
  }

  // Recompute audience whenever segment changes. Debounce so typing a service
  // name doesn't fire one request per keystroke (~6 for "Facial").
  useEffect(() => {
    if (!modal) return
    const timer = setTimeout(() => {
      let cancelled = false
      api.getAudience(form.segment, form.segment_value).then(({ data }) => {
        if (!cancelled && data) setAudience(data)
      })
      return () => { cancelled = true }
    }, 350)
    return () => clearTimeout(timer)
  }, [form.segment, form.segment_value, modal])

  const approvedTemplates = templates.filter(t => t.status === 'APPROVED')

  async function create(thenSend: boolean) {
    if (!form.name.trim()) { showToast('Name your campaign', 'error'); return }
    if (!form.template_id) { showToast('Pick an approved template', 'error'); return }
    setSaving(true)
    // Anchor the picked schedule to IST regardless of the browser's timezone —
    // the backend interprets scheduled_at as IST for consistency with all
    // other business timestamps.
    const payload = {
      ...form,
      scheduled_at: form.scheduled_at ? scheduledLocalToUtcISO(form.scheduled_at) : '',
    }
    const { data, error } = await api.createCampaign(payload)
    if (error || !data) { showToast(error || 'Failed', 'error'); setSaving(false); return }
    if (thenSend) {
      const { data: sd, error: sErr } = await api.sendCampaign((data as any).id)
      if (sErr) showToast(`Send failed: ${sErr}`, 'error')
      else showToast(`Broadcasting to ${(sd as any)?.total ?? ''} customers — sending in the background 🚀`, 'success')
    } else {
      showToast(form.scheduled_at ? 'Campaign scheduled' : 'Campaign saved as draft', 'success')
    }
    setModal(false)
    setForm({ name: '', template_id: '', segment: 'all', segment_value: '', scheduled_at: '' })
    load()
    setSaving(false)
  }

  async function sendNow(id: string) {
    setSending(id)
    const { data, error } = await api.sendCampaign(id)
    if (error) showToast(`Send failed: ${error}`, 'error')
    else showToast(`Broadcasting to ${(data as any)?.total ?? ''} customers — sending in the background 🚀`, 'success')
    setSending(null)
    load()
  }

  function rate(part: number, whole: number) {
    if (!whole) return '0%'
    return Math.round((part / whole) * 100) + '%'
  }

  return (
    <div className="animate-up">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-bold text-[#E8EAED] mb-1 font-[Syne]">Broadcast</h1><p className="text-sm text-[#5A6370]">Send offers & updates to your customers via approved templates</p></div>
        <LockGate hint="Upgrade to send broadcasts"><Button icon={Plus} onClick={() => setModal(true)}>New Campaign</Button></LockGate>
      </div>

      {approvedTemplates.length === 0 && !loading && (
        <Card className="p-4 mb-5 bg-[rgba(255,160,64,0.06)] border-[rgba(255,160,64,0.2)]">
          <div className="flex items-center gap-3">
            <FileText size={18} className="text-[#FFA040]" />
            <div className="flex-1"><p className="text-sm text-[#E8EAED] font-medium">No approved templates yet</p><p className="text-xs text-[#5A6370]">Create a template first and wait for Meta approval before you can broadcast.</p></div>
            <a href="/dashboard/templates"><Button size="sm" variant="secondary">Go to Templates</Button></a>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full" />)}</div>
      ) : campaigns.length === 0 ? (
        <Card className="py-4"><EmptyState icon={Megaphone} title="No campaigns yet" desc="Create your first broadcast to reach customers with an offer" action={<Button size="sm" icon={Plus} onClick={() => setModal(true)}>New Campaign</Button>} /></Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c: any) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-[#E8EAED]">{c.name}</span>
                    <Badge variant={c.status === 'sent' ? 'green' : c.status === 'sending' ? 'blue' : c.status === 'scheduled' ? 'amber' : 'default'}>{c.status}</Badge>
                  </div>
                  <p className="text-xs text-[#5A6370]">{c.templates?.name || 'template'} · {SEGMENTS.find(s => s.value === c.segment)?.label || c.segment} · {c.total} recipients</p>
                </div>
                <div className="flex gap-2">
                  {c.status === 'draft' && (
                    <Button size="sm" icon={Send} loading={sending === c.id} onClick={() => setConfirmSend({ type: 'existing', id: c.id, count: c.total, cost: c.est_cost })}>Send Now</Button>
                  )}
                  {(c.status === 'draft' || c.status === 'scheduled') && (
                    <Button size="sm" variant="ghost" loading={cancelling === c.id} onClick={() => doCancel(c.id)}>Cancel</Button>
                  )}
                </div>
              </div>
              {/* Analytics funnel */}
              <div className="grid grid-cols-5 gap-2">
                {[
                  ['Sent', c.sent, Users, '#9AA0AB'],
                  ['Delivered', c.delivered, CheckCheck, '#4D9EFF'],
                  ['Read', c.read, Eye, '#A87EFF'],
                  ['Replied', c.replied, MessageSquare, '#00C57A'],
                  ['Cost', `₹${c.est_cost}`, IndianRupee, '#FFA040'],
                ].map(([label, val, Icon, color]: any, i) => (
                  <div key={i} className="bg-[#141618] rounded-xl p-3 text-center">
                    <Icon size={13} style={{ color }} className="mx-auto mb-1" />
                    <div className="text-base font-bold text-[#E8EAED]">{val}</div>
                    <div className="text-xs text-[#5A6370]">{label}</div>
                    {i > 0 && i < 4 && typeof val === 'number' && <div className="text-xs" style={{ color }}>{rate(val, c.sent)}</div>}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="New Broadcast Campaign" size="lg">
        <div className="space-y-4">
          <Input label="Campaign Name *" placeholder="Diwali Offer 2026" value={form.name} onChange={(e: any) => setForm(p => ({ ...p, name: e.target.value }))} />
          <Select label="Template *" value={form.template_id} onChange={(e: any) => setForm(p => ({ ...p, template_id: e.target.value }))}
            options={[{ value: '', label: approvedTemplates.length ? 'Choose an approved template' : 'No approved templates yet' },
              ...approvedTemplates.map(t => ({ value: t.id, label: t.name }))]} />
          <Select label="Audience" value={form.segment} onChange={(e: any) => setForm(p => ({ ...p, segment: e.target.value }))} options={SEGMENTS} />
          {form.segment === 'service' && (
            <Input label="Service name" placeholder="Facial" value={form.segment_value} onChange={(e: any) => setForm(p => ({ ...p, segment_value: e.target.value }))} />
          )}
          <Input label="Schedule (optional)" type="datetime-local" value={form.scheduled_at} onChange={(e: any) => setForm(p => ({ ...p, scheduled_at: e.target.value }))} hint="Leave empty to send immediately" />

          {/* Audience + cost preview */}
          <div className="flex gap-3">
            <div className="flex-1 bg-[#141618] rounded-xl p-3 text-center">
              <Users size={14} className="text-[#4D9EFF] mx-auto mb-1" />
              <div className="text-lg font-bold text-[#E8EAED]">{audience.count}</div>
              <div className="text-xs text-[#5A6370]">recipients</div>
            </div>
            <div className="flex-1 bg-[#141618] rounded-xl p-3 text-center">
              <IndianRupee size={14} className="text-[#FFA040] mx-auto mb-1" />
              <div className="text-lg font-bold text-[#E8EAED]">₹{audience.estCost}</div>
              <div className="text-xs text-[#5A6370]">est. cost</div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          {!form.scheduled_at && (
            <Button onClick={() => setConfirmSend({ type: 'new', count: audience.count, cost: audience.estCost })} loading={saving} icon={Send}>Send Now</Button>
          )}
          <Button variant="secondary" onClick={() => create(false)} loading={saving}>{form.scheduled_at ? 'Schedule' : 'Save Draft'}</Button>
          <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
        </div>
        <p className="text-xs text-[#5A6370] mt-3">Customers who replied &quot;STOP&quot; are automatically excluded. Meta charges per marketing message.</p>
      </Modal>

      {/* Cost-confirmation gate */}
      <Modal open={!!confirmSend} onClose={() => setConfirmSend(null)} title="Confirm broadcast" size="sm">
        <p className="text-sm text-[#9AA0AB] mb-1">You&apos;re about to message <strong className="text-[#E8EAED]">{confirmSend?.count} customer{confirmSend?.count === 1 ? '' : 's'}</strong>.</p>
        <p className="text-sm text-[#9AA0AB] mb-4">Estimated cost: <strong className="text-[#FFA040]">₹{confirmSend?.cost}</strong> — Meta charges per marketing message.</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setConfirmSend(null)}>Cancel</Button>
          <Button icon={Send} loading={saving || sending !== null} onClick={async () => {
            const cs = confirmSend; setConfirmSend(null)
            if (cs.type === 'new') await create(true)
            else await sendNow(cs.id)
          }}>Send to {confirmSend?.count}</Button>
        </div>
      </Modal>
    </div>
  )
}