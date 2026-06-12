'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { CreditCard, Send, CheckCircle, AlertTriangle } from 'lucide-react'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [sending,  setSending]  = useState<string|null>(null)
  const [toast,    setToast]    = useState('')

  useEffect(() => {
    api.getPendingPayments().then(({data}) => { if(data) setPayments(data); setLoading(false) })
  }, [])

  function showToast(msg: string) { setToast(msg); setTimeout(()=>setToast(''),3000) }

  async function remind(id: string, name: string) {
    setSending(id)
    const {error} = await api.sendPaymentReminder(id)
    showToast(error ? 'Failed to send reminder' : `✓ Reminder sent to ${name} on WhatsApp`)
    setSending(null)
  }

  async function markPaid(id: string) {
    await api.markPaymentPaid(id)
    setPayments(prev => prev.filter(p => p.id !== id))
    showToast('✓ Payment marked as received')
  }

  function daysOverdue(due: string) {
    const d = Math.floor((Date.now() - new Date(due).getTime()) / 86400000)
    if (d <= 0) return 'Due today'
    return `${d}d overdue`
  }

  const total = payments.reduce((s,p) => s + Number(p.amount), 0)

  return (
    <div className="animate-in max-w-4xl">
      {toast && (
        <div className={`fixed bottom-6 right-6 text-sm font-medium px-4 py-2.5 rounded-xl z-50 animate-in shadow-lg ${toast.startsWith('✓')?'bg-emerald-500 text-black':'bg-red-500 text-white'}`}>
          {toast}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white mb-1">Payments</h1>
        <p className="text-sm text-zinc-500">Track dues and send WhatsApp reminders</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Total Pending</p>
          <p className="text-2xl font-semibold text-amber-400">₹{total.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Outstanding Invoices</p>
          <p className="text-2xl font-semibold text-white">{payments.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Auto Reminders</p>
          <p className="text-2xl font-semibold text-emerald-400">On</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-zinc-600 text-sm">Loading payments...</div>
      ) : payments.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle size={36} className="text-emerald-700 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm font-medium">All payments collected!</p>
          <p className="text-zinc-600 text-xs mt-1">No pending dues right now</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <h2 className="text-sm font-medium text-white">Pending Dues</h2>
            <button
              onClick={() => payments.forEach(p => remind(p.id, p.customers?.name || p.customers?.phone))}
              className="text-xs px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 flex items-center gap-1.5 transition-colors"
            >
              <Send size={11} />Send all reminders
            </button>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {payments.map((p: any) => {
              const overdue = daysOverdue(p.due_date)
              const isLate  = overdue !== 'Due today'
              return (
                <div key={p.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-zinc-800/30 transition-colors">
                  <div className={`p-2 rounded-lg ${isLate ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                    <AlertTriangle size={14} className={isLate ? 'text-red-400' : 'text-amber-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{p.customers?.name || '—'}</p>
                    <p className="text-xs text-zinc-500 truncate">{p.description}</p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="text-sm font-semibold text-white">₹{Number(p.amount).toLocaleString('en-IN')}</p>
                    <p className={`text-xs ${isLate ? 'text-red-400' : 'text-amber-400'}`}>{overdue}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => remind(p.id, p.customers?.name || p.customers?.phone)} disabled={sending === p.id}
                      className="text-xs px-3 py-1.5 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg hover:border-emerald-500/50 hover:text-emerald-400 flex items-center gap-1.5 disabled:opacity-50 transition-colors">
                      <Send size={10} />{sending === p.id ? '...' : 'Remind'}
                    </button>
                    <button onClick={() => markPaid(p.id)}
                      className="text-xs px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 flex items-center gap-1.5 transition-colors">
                      <CheckCircle size={10} />Paid
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
