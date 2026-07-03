'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, Button, Badge, Modal, Input, Textarea, Select, EmptyState, Skeleton, showToast } from '@/components/ui'
import { Plus, FileText, Trash2, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react'

const STATUS_META: any = {
  APPROVED: { variant: 'green', icon: CheckCircle, label: 'Approved' },
  PENDING:  { variant: 'amber', icon: Clock,       label: 'Pending approval' },
  REJECTED: { variant: 'red',   icon: XCircle,     label: 'Rejected' },
}

const LANGUAGES = [
  { value: 'en',    label: 'English' },
  { value: 'en_US', label: 'English (US)' },
  { value: 'hi',    label: 'Hindi' },
]

// Highest positional variable {{n}} in a string. "Hi {{1}}, {{2}}" -> 2.
function varCount(text: string) {
  const matches = String(text || '').match(/\{\{\s*(\d+)\s*\}\}/g) || []
  return matches.reduce((max, m) => Math.max(max, Number(m.replace(/[^\d]/g, ''))), 0)
}
// Replace {{n}} with the example value; keep the token if no example given.
function fillVars(text: string, examples: any[]) {
  return String(text || '').replace(/\{\{\s*(\d+)\s*\}\}/g, (_m, n) => {
    const v = examples?.[Number(n) - 1]
    return v && String(v).trim() ? String(v) : `{{${n}}}`
  })
}

// WhatsApp-style bubble preview.
function WaPreview({ header, body, footer, headerExample, bodyExamples }: any) {
  const h = fillVars(header, [headerExample])
  const b = fillVars(body, bodyExamples || [])
  return (
    <div className="rounded-xl p-4" style={{ background: '#0B141A', minHeight: 180 }}>
      <div className="max-w-[90%] rounded-lg rounded-tl-none px-3 py-2 shadow" style={{ background: '#202C33' }}>
        {h && <p className="text-sm font-bold mb-1 whitespace-pre-wrap break-words" style={{ color: '#E9EDEF' }}>{h}</p>}
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed" style={{ color: '#E9EDEF' }}>{b || 'Your message preview appears here…'}</p>
        {footer && <p className="text-xs mt-1.5 whitespace-pre-wrap break-words" style={{ color: '#8696A0' }}>{footer}</p>}
        <p className="text-[10px] text-right mt-1" style={{ color: '#8696A0' }}>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
  )
}

const EMPTY = { name: '', category: 'MARKETING', language: 'en', header: '', body: '', footer: '', bodyExamples: [] as string[], headerExample: '' }

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY })
  const [confirmDel, setConfirmDel] = useState<any>(null)

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await api.getTemplates()
    if (data) setTemplates(data)
    setLoading(false)
  }

  function openNew() { setForm({ ...EMPTY }); setModal(true) }
  function setBodyExample(i: number, v: string) {
    setForm(p => { const arr = [...(p.bodyExamples || [])]; arr[i] = v; return { ...p, bodyExamples: arr } })
  }

  async function create() {
    if (!form.name.trim() || !form.body.trim()) { showToast('Name and message body are required', 'error'); return }
    setSaving(true)
    const { error } = await api.createTemplate(form)
    if (error) showToast(error, 'error')
    else {
      showToast('Template submitted for approval', 'success')
      setModal(false); setForm({ ...EMPTY }); load()
    }
    setSaving(false)
  }

  async function remove(t: any) {
    const { error } = await api.deleteTemplate(t.id)
    if (error) showToast(error, 'error')
    else { setTemplates(prev => prev.filter(x => x.id !== t.id)); showToast('Template deleted from Meta and BizBot', 'success') }
    setConfirmDel(null)
  }

  const approved = templates.filter(t => t.status === 'APPROVED')
  const others   = templates.filter(t => t.status !== 'APPROVED')
  const nBody = varCount(form.body)
  const nHeader = varCount(form.header)

  function TemplateCard({ t }: any) {
    const meta = STATUS_META[t.status] || STATUS_META.PENDING
    const Icon = meta.icon
    const ex = t.variable_examples || {}
    const nVars = varCount(t.body) + varCount(t.header)
    return (
      <Card className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-[#9AA0AB]" />
            <span className="text-sm font-semibold text-[#E8EAED]">{t.name}</span>
          </div>
          <Badge variant={meta.variant}><Icon size={11} className="mr-1" />{meta.label}</Badge>
        </div>
        {t.header && <p className="text-xs font-semibold text-[#9AA0AB] mb-1 whitespace-pre-wrap">{fillVars(t.header, [ex.header])}</p>}
        <p className="text-sm text-[#9AA0AB] leading-relaxed whitespace-pre-wrap">{fillVars(t.body, ex.body || [])}</p>
        {t.footer && <p className="text-xs text-[#5A6370] mt-1">{t.footer}</p>}
        {t.status === 'REJECTED' && t.reject_reason && (
          <p className="text-xs text-[#FF5A5A] mt-2 bg-[rgba(255,90,90,0.08)] px-2 py-1.5 rounded-lg">Reason: {t.reject_reason}</p>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
          <span className="text-xs text-[#5A6370]">{t.category} · {t.language}{nVars ? ` · ${nVars} variable${nVars > 1 ? 's' : ''}` : ''}</span>
          <button onClick={() => setConfirmDel(t)} className="p-1.5 rounded-lg hover:bg-[rgba(255,90,90,0.1)] text-[#FF5A5A]"><Trash2 size={13} /></button>
        </div>
      </Card>
    )
  }

  return (
    <div className="animate-up">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-bold text-[#E8EAED] mb-1 font-[Syne]">Message Templates</h1><p className="text-sm text-[#5A6370]">Create templates for broadcasts. Meta must approve each one before use.</p></div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={load}>Refresh</Button>
          <Button icon={Plus} onClick={openNew}>New Template</Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : templates.length === 0 ? (
        <Card className="py-4"><EmptyState icon={FileText} title="No templates yet" desc="Create your first template — it'll be sent to Meta for approval (~1 hour to 1 day)" action={<Button size="sm" icon={Plus} onClick={openNew}>New Template</Button>} /></Card>
      ) : (
        <>
          {approved.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3"><CheckCircle size={14} className="text-[#00C57A]" /><h2 className="text-sm font-semibold text-[#E8EAED]">Approved · ready to send</h2><Badge variant="green" size="xs">{approved.length}</Badge></div>
              <div className="grid grid-cols-2 gap-3">{approved.map(t => <TemplateCard key={t.id} t={t} />)}</div>
            </div>
          )}
          {others.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3"><Clock size={14} className="text-[#FFA040]" /><h2 className="text-sm font-semibold text-[#E8EAED]">Pending & rejected</h2><Badge variant="amber" size="xs">{others.length}</Badge></div>
              <div className="grid grid-cols-2 gap-3">{others.map(t => <TemplateCard key={t.id} t={t} />)}</div>
            </div>
          )}
        </>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="New Message Template" size="xl">
        <div className="grid grid-cols-2 gap-6">
          {/* Left — form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Template Name *" placeholder="diwali_offer" value={form.name} onChange={(e: any) => setForm(p => ({ ...p, name: e.target.value }))} hint="lowercase + underscores" />
              <Select label="Language" value={form.language} onChange={(e: any) => setForm(p => ({ ...p, language: e.target.value }))} options={LANGUAGES} />
            </div>
            <Select label="Category" value={form.category} onChange={(e: any) => setForm(p => ({ ...p, category: e.target.value }))} options={[{ value: 'MARKETING', label: 'Marketing (offers, promos)' }, { value: 'UTILITY', label: 'Utility (updates, alerts, reminders)' }]} />
            <Input label="Header (optional)" placeholder="🎉 Diwali Special!" value={form.header} onChange={(e: any) => setForm(p => ({ ...p, header: e.target.value }))} />
            {nHeader > 0 && (
              <Input label="Example for header {{1}}" placeholder="e.g. Priya" value={form.headerExample} onChange={(e: any) => setForm(p => ({ ...p, headerExample: e.target.value }))} />
            )}
            <Textarea label="Message Body *" rows={4} placeholder="Namaste {{1}}! Is Diwali, paayein 20% off. Book karein aaj hi! 🪔" value={form.body} onChange={(e: any) => setForm(p => ({ ...p, body: e.target.value }))} hint="Use {{1}}, {{2}}… for personalised values (name, amount, date)" />
            {nBody > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-[#9AA0AB]">Example values (needed for Meta approval)</p>
                {Array.from({ length: nBody }).map((_, i) => (
                  <Input key={i} placeholder={`Example for {{${i + 1}}}`} value={form.bodyExamples[i] || ''} onChange={(e: any) => setBodyExample(i, e.target.value)} />
                ))}
              </div>
            )}
            <Input label="Footer (optional)" placeholder="Reply STOP to unsubscribe" value={form.footer} onChange={(e: any) => setForm(p => ({ ...p, footer: e.target.value }))} />
          </div>

          {/* Right — live preview */}
          <div>
            <p className="text-xs font-medium text-[#9AA0AB] mb-2">Preview</p>
            <WaPreview header={form.header} body={form.body} footer={form.footer} headerExample={form.headerExample} bodyExamples={form.bodyExamples} />
            <p className="text-xs text-[#5A6370] mt-3">Meta reviews each template (usually within an hour). Status updates appear here automatically.</p>
          </div>
        </div>

        <div className="flex gap-2 mt-5 pt-4 border-t border-[rgba(255,255,255,0.06)]">
          <Button onClick={create} loading={saving}>Submit for Approval</Button>
          <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Delete template?" size="sm">
        <p className="text-sm text-[#9AA0AB] leading-relaxed mb-2">
          This will permanently delete <strong className="text-[#E8EAED]">{confirmDel?.name}</strong> from both BizBot and your WhatsApp (Meta) account.
        </p>
        <p className="text-xs text-[#FFA040] bg-[rgba(255,160,64,0.08)] px-3 py-2 rounded-lg mb-4">
          ⚠️ Meta locks the template name for ~30 days — you can&apos;t reuse the same name immediately.
        </p>
        <div className="flex gap-2">
          <Button variant="danger" onClick={() => remove(confirmDel)}>Delete permanently</Button>
          <Button variant="ghost" onClick={() => setConfirmDel(null)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  )
}
