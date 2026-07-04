'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, Button, Badge, Modal, Input, StatCard, EmptyState, Skeleton, showToast, Avatar } from '@/components/ui'
import { CreditCard, Plus, Send, CheckCircle, AlertTriangle, IndianRupee } from 'lucide-react'

export default function PaymentsPage() {
  const [pending, setPending] = useState<any[]>([])
  const [paid,    setPaid]    = useState<any[]>([])
  const [tab,     setTab]     = useState<'pending' | 'paid'>('pending')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)
  const [showForm,setShowForm]= useState(false)
  const [saving,  setSaving]  = useState(false)
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', amount: '', description: '', due_date: '' })

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t) }, [])

  async function load() {
    const [p, pd] = await Promise.all([api.getPendingPayments(), api.getPaidPayments()])
    if (p.data) setPending(p.data)
    if (pd.data) setPaid(pd.data)
    setLoading(false)
  }

  async function remind(id: string, name: string) {
    setSending(id)
    const { error } = await api.sendPaymentReminder(id)
    showToast(error ? 'Failed to send' : `Reminder sent to ${name}`, error ? 'error' : 'success')
    setSending(null)
  }

  async function markPaid(id: string) {
    // Snapshot the row so we can roll back if the backend rejects. Previously
    // this optimistically filtered AND then called load(), which stampeded
    // the paid row back into pending if the read raced ahead of the write.
    const removed = pending.find(p => p.id === id)
    setPending(prev => prev.filter(p => p.id !== id))
    const { error } = await api.markPaymentPaid(id)
    if (error) {
      if (removed) setPending(prev => [removed, ...prev])
      showToast('Failed to mark paid', 'error')
      return
    }
    showToast('Payment marked as received', 'success')
    // No load() — the optimistic update is already correct.
  }

  async function create() {
    if (!form.customer_name || !form.amount) { showToast('Fill required fields', 'error'); return }
    // Guard against NaN and non-positive amounts. Number('abc') → NaN, which
    // serialises to null in JSON and silently corrupts the DB.
    const amount = Number(form.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast('Enter a valid amount greater than 0', 'error')
      return
    }
    setSaving(true)
    const { error } = await api.createPayment({
      customer_name: form.customer_name, customer_phone: form.customer_phone,
      amount, description: form.description,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : new Date().toISOString(),
    })
    if (error) showToast('Failed to create', 'error')
    else { showToast('Payment record added', 'success'); setShowForm(false); setForm({ customer_name: '', customer_phone: '', amount: '', description: '', due_date: '' }); load() }
    setSaving(false)
  }

  const totalPending = pending.reduce((s, p) => s + Number(p.amount), 0)
  const totalPaid    = paid.reduce((s, p) => s + Number(p.amount), 0)

  function daysOverdue(due: string) {
    const d = Math.floor((Date.now() - new Date(due).getTime()) / 86400000)
    return d <= 0 ? 'Due today' : `${d}d overdue`
  }

  const list = tab === 'pending' ? pending : paid

  return (
    <div className="animate-up">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-bold text-[#E8EAED] mb-1 font-[Syne]">Payments</h1><p className="text-sm text-[#5A6370]">Track dues and collections</p></div>
        <Button icon={Plus} onClick={() => setShowForm(true)}>Add Payment</Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Pending" value={`₹${totalPending.toLocaleString('en-IN')}`} sub={`${pending.length} invoices`} icon={AlertTriangle} color="amber" />
        <StatCard label="Collected" value={`₹${totalPaid.toLocaleString('en-IN')}`} sub={`${paid.length} paid`} icon={CheckCircle} color="green" />
        <StatCard label="AI Reminders" value="Auto" sub="Day 3 & 7" icon={Send} color="blue" />
      </div>

      <div className="flex gap-2 mb-5">
        {['pending', 'paid'].map(t => (
          <button key={t} onClick={() => setTab(t as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${tab === t ? 'bg-[rgba(0,197,122,0.1)] text-[#00C57A] border border-[rgba(0,197,122,0.2)]' : 'text-[#5A6370] border border-[rgba(255,255,255,0.06)]'}`}>
            {t} ({t === 'pending' ? pending.length : paid.length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : list.length === 0 ? (
        <Card className="py-4"><EmptyState icon={tab === 'pending' ? CheckCircle : CreditCard} title={tab === 'pending' ? 'All collected!' : 'No payments yet'} desc={tab === 'pending' ? 'No pending dues right now' : 'Paid invoices appear here'} /></Card>
      ) : (
        <Card className="overflow-hidden divide-y divide-[rgba(255,255,255,0.03)]">
          {list.map((p: any) => {
            const overdue = daysOverdue(p.due_date)
            const isLate  = overdue.includes('overdue')
            return (
              <div key={p.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-[#141618] transition-all">
                <Avatar name={p.customers?.name} phone={p.customers?.phone} size="sm" />
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-[#E8EAED]">{p.customers?.name || '—'}</p><p className="text-xs text-[#5A6370] truncate">{p.description || 'Payment'}</p></div>
                <div className="text-right mr-3"><p className="text-sm font-semibold text-[#E8EAED]">₹{Number(p.amount).toLocaleString('en-IN')}</p>{tab === 'pending' && <p className={`text-xs ${isLate ? 'text-[#FF5A5A]' : 'text-[#FFA040]'}`}>{overdue}</p>}</div>
                {tab === 'pending' && (
                  <div className="flex gap-1.5">
                    <Button size="xs" variant="ghost" icon={Send} onClick={() => remind(p.id, p.customers?.name || 'customer')} loading={sending === p.id}>Remind</Button>
                    <Button size="xs" variant="secondary" icon={CheckCircle} onClick={() => markPaid(p.id)}>Paid</Button>
                  </div>
                )}
              </div>
            )
          })}
        </Card>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Payment Record">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Customer Name *" placeholder="Priya Sharma" value={form.customer_name} onChange={(e: any) => setForm(p => ({ ...p, customer_name: e.target.value }))} />
          <Input label="Phone" placeholder="9876543210" value={form.customer_phone} onChange={(e: any) => setForm(p => ({ ...p, customer_phone: e.target.value }))} />
          <Input label="Amount (₹) *" type="number" placeholder="1500" value={form.amount} onChange={(e: any) => setForm(p => ({ ...p, amount: e.target.value }))} />
          <Input label="Due Date" type="date" value={form.due_date} onChange={(e: any) => setForm(p => ({ ...p, due_date: e.target.value }))} />
          <Input label="Description" placeholder="Monthly package" value={form.description} onChange={(e: any) => setForm(p => ({ ...p, description: e.target.value }))} className="col-span-2" />
        </div>
        <div className="flex gap-2 mt-5"><Button onClick={create} loading={saving}>Save</Button><Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button></div>
      </Modal>
    </div>
  )
}