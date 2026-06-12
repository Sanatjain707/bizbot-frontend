'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Calendar, Plus, X } from 'lucide-react'

const STATUSES = ['all', 'confirmed', 'done', 'cancelled', 'no_show']
const CLS: Record<string, string> = {
  confirmed: 'bg-emerald-500/10 text-emerald-400',
  done:      'bg-zinc-700/50 text-zinc-400',
  cancelled: 'bg-red-500/10 text-red-400',
  no_show:   'bg-amber-500/10 text-amber-400',
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

function getBizId() {
  return typeof window !== 'undefined' ? localStorage.getItem('bizId') || '' : ''
}

export default function AppointmentsPage() {
  const [appts,    setAppts]    = useState<any[]>([])
  const [filter,   setFilter]   = useState('all')
  const [loading,  setLoading]  = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [toast,    setToast]    = useState('')

  // Form state
  const [form, setForm] = useState({
    customer_name:    '',
    customer_phone:   '',
    service:          '',
    appointment_date: '',
    appointment_time: '',
    notes:            '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [])

  async function load() {
    const { data } = await api.getAllAppointments()
    if (data) setAppts(data)
    setLoading(false)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    await api.updateAppointmentStatus(id, status)
    setAppts(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    setUpdating(null)
  }

  async function createAppointment() {
    if (!form.customer_name || !form.service || !form.appointment_date || !form.appointment_time) {
      showToast('Please fill in all required fields')
      return
    }
    setSaving(true)

    try {
      const bizId = getBizId()
      const dt    = new Date(`${form.appointment_date}T${form.appointment_time}:00`)

      // First create/find customer
      const custRes = await fetch(`${API}/api/customers/find-or-create`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-business-id': bizId },
        body:    JSON.stringify({ name: form.customer_name, phone: form.customer_phone || `manual-${Date.now()}` })
      })

      let customerId = null
      if (custRes.ok) {
        const cust = await custRes.json()
        customerId = cust.id
      }

      // Create appointment directly via dashboard API
      const res = await fetch(`${API}/api/dashboard/appointments/create`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-business-id': bizId },
        body:    JSON.stringify({
          customer_id:      customerId,
          customer_name:    form.customer_name,
          customer_phone:   form.customer_phone,
          service:          form.service,
          appointment_time: dt.toISOString(),
          notes:            form.notes,
          status:           'confirmed',
        })
      })

      if (res.ok) {
        showToast('✓ Appointment created successfully')
        setShowForm(false)
        setForm({ customer_name: '', customer_phone: '', service: '', appointment_date: '', appointment_time: '', notes: '' })
        await load()
      } else {
        showToast('Failed to create appointment')
      }
    } catch (e) {
      showToast('Error creating appointment')
    }
    setSaving(false)
  }

  const list   = filter === 'all' ? appts : appts.filter(a => a.status === filter)
  const counts = STATUSES.reduce((acc, s) => ({
    ...acc,
    [s]: s === 'all' ? appts.length : appts.filter(a => a.status === s).length
  }), {} as any)

  return (
    <div className="animate-in max-w-5xl">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-emerald-500 text-black text-sm font-medium px-4 py-2.5 rounded-xl z-50 animate-in">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white mb-1">Appointments</h1>
          <p className="text-sm text-zinc-500">All bookings via WhatsApp AI + manual entries</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold rounded-xl transition-colors">
          <Plus size={15} /> Add Appointment
        </button>
      </div>

      {/* Manual Add Form */}
      {showForm && (
        <div className="bg-zinc-900 border border-emerald-500/30 rounded-xl p-5 mb-6 animate-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">New Appointment</h2>
            <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-300">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Customer Name *</label>
              <input type="text" value={form.customer_name}
                onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))}
                placeholder="Priya Sharma"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Phone (optional)</label>
              <input type="tel" value={form.customer_phone}
                onChange={e => setForm(p => ({ ...p, customer_phone: e.target.value }))}
                placeholder="9876543210"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Service *</label>
              <input type="text" value={form.service}
                onChange={e => setForm(p => ({ ...p, service: e.target.value }))}
                placeholder="Facial, Haircut..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Notes</label>
              <input type="text" value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Any special notes..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Date *</label>
              <input type="date" value={form.appointment_date}
                onChange={e => setForm(p => ({ ...p, appointment_date: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Time *</label>
              <input type="time" value={form.appointment_time}
                onChange={e => setForm(p => ({ ...p, appointment_time: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createAppointment} disabled={saving}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : '✓ Save Appointment'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-zinc-800 text-zinc-300 text-sm rounded-lg hover:bg-zinc-700 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filter === s
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-zinc-500 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
            }`}>
            {s.replace('_', ' ')}
            <span className={`px-1.5 py-0.5 rounded text-xs ${filter === s ? 'bg-emerald-500/20' : 'bg-zinc-800'}`}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-zinc-600 text-sm">Loading...</div>
      ) : list.length === 0 ? (
        <div className="text-center py-20">
          <Calendar size={32} className="text-zinc-700 mx-auto mb-2" />
          <p className="text-zinc-500 text-sm mb-3">No appointments found</p>
          <button onClick={() => setShowForm(true)}
            className="text-xs px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20">
            + Add manually
          </button>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Customer', 'Service', 'Date & Time', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((a: any) => {
                const dt = new Date(a.appointment_time)
                return (
                  <tr key={a.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-white">{a.customers?.name || '—'}</p>
                      <p className="text-xs text-zinc-500">{a.customers?.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-300">{a.service || '—'}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-zinc-300">
                        {dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CLS[a.status] || CLS.done}`}>
                        {a.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {a.status === 'confirmed' && (
                        <div className="flex gap-2">
                          <button onClick={() => updateStatus(a.id, 'done')} disabled={!!updating}
                            className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 disabled:opacity-50">
                            {updating === a.id ? '...' : '✓ Done'}
                          </button>
                          <button onClick={() => updateStatus(a.id, 'no_show')} disabled={!!updating}
                            className="text-xs px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg hover:bg-amber-500/20 disabled:opacity-50">
                            No show
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
