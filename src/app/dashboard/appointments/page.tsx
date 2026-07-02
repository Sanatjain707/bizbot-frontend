'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, Button, Badge, Modal, Input, EmptyState, Skeleton, showToast, Avatar } from '@/components/ui'
import { Calendar, Plus, Bell, List, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { istDateStr, istDateTimeToUtcISO, utcToISTDateStr, utcToISTParts, formatISTDateTime } from '@/lib/dateTime'

const STATUSES = ['all', 'confirmed', 'done', 'cancelled', 'no_show']
const CLS: any = { confirmed: 'green', done: 'default', cancelled: 'red', no_show: 'amber' }

export default function AppointmentsPage() {
  const [appts,   setAppts]   = useState<any[]>([])
  const [filter,  setFilter]  = useState('all')
  const [view,    setView]    = useState<'list' | 'calendar'>('list')
  const [loading, setLoading] = useState(true)
  const [updating,setUpdating]= useState<string | null>(null)
  const [showForm,setShowForm]= useState(false)
  const [saving,  setSaving]  = useState(false)
  const [calMonth,setCalMonth]= useState(new Date())
  const [confirmRemind,setConfirmRemind] = useState(false)
  const [remindingAll,setRemindingAll]   = useState(false)
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', service: '', appointment_date: '', appointment_time: '', notes: '' })

  // How many distinct customers have a confirmed appointment today (IST).
  // Backend anchors business days to Asia/Kolkata; comparing against a UTC
  // day-string dropped appointments after 18:30 IST when the UTC day flipped.
  const todayIST = istDateStr()
  const remindCount = new Set(
    appts.filter(a => a.status === 'confirmed' && a.appointment_time && utcToISTDateStr(a.appointment_time) === todayIST)
         .map(a => a.customer_id || a.customers?.phone)
  ).size

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t) }, [])
  async function load() { const { data } = await api.getAllAppointments(); if (data) setAppts(data); setLoading(false) }

  async function updateStatus(id: string, status: string) {
    setUpdating(id); await api.updateAppointmentStatus(id, status)
    setAppts(prev => prev.map(a => a.id === id ? { ...a, status } : a)); setUpdating(null)
    showToast(`Marked as ${status.replace('_', ' ')}`, 'success')
  }
  async function sendReminder(id: string) {
    const { error } = await api.sendAppointmentReminder(id)
    showToast(error ? 'Failed to send' : 'Reminder sent on WhatsApp', error ? 'error' : 'success')
  }
  async function remindAll() {
    setRemindingAll(true)
    const { data, error } = await api.remindAllToday()
    setRemindingAll(false)
    setConfirmRemind(false)
    if (error) { showToast(error, 'error'); return }
    const { total, sent, windowFailed, otherFailed } = data || {}
    if (!total) { showToast('No confirmed appointments today', 'info'); return }
    // Be honest: reminders that silently failed the 24h-window rule are called out
    let msg = `Reminded ${sent} customer${sent === 1 ? '' : 's'}`
    const issues: string[] = []
    if (windowFailed) issues.push(`${windowFailed} couldn't be reached (outside WhatsApp's 24-hour window)`)
    if (otherFailed)  issues.push(`${otherFailed} failed to send`)
    if (issues.length) msg += ` · ${issues.join(' · ')}`
    showToast(msg, sent > 0 ? 'success' : (windowFailed ? 'warning' : 'error'))
    load()
  }
  async function create() {
    if (!form.customer_name || !form.service || !form.appointment_date || !form.appointment_time) { showToast('Fill all required fields', 'error'); return }
    const phone = (form.customer_phone || '').replace(/\D/g, '')
    if (phone.length < 10) { showToast('Enter a valid 10-digit phone number', 'error'); return }
    setSaving(true)
    // Anchor the picked date+time to IST regardless of the browser's timezone —
    // the backend treats all business timestamps as IST. Without the +05:30
    // offset, `new Date('YYYY-MM-DDTHH:MM')` parses in browser TZ and
    // shifts by ±5:30h for anyone outside India.
    const appointment_time = istDateTimeToUtcISO(form.appointment_date, form.appointment_time)
    const { error } = await api.createAppointment({ customer_name: form.customer_name, customer_phone: form.customer_phone, service: form.service, appointment_time, notes: form.notes, status: 'confirmed' })
    if (error) showToast('Failed to create', 'error')
    else { showToast('Appointment created', 'success'); setShowForm(false); setForm({ customer_name: '', customer_phone: '', service: '', appointment_date: '', appointment_time: '', notes: '' }); await load() }
    setSaving(false)
  }

  const list = filter === 'all' ? appts : appts.filter(a => a.status === filter)
  const counts: any = STATUSES.reduce((acc, s) => ({ ...acc, [s]: s === 'all' ? appts.length : appts.filter(a => a.status === s).length }), {})

  function buildCalendar() {
    // Calendar cells are IST days. Comparing each appointment's IST-projected
    // year/month/day (not the browser-TZ getMonth/getDate) prevents an
    // appointment near IST midnight from showing on the wrong cell for
    // browsers running in a different timezone.
    const year = calMonth.getFullYear(), month = calMonth.getMonth()
    const startDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: any[] = []
    for (let i = 0; i < startDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const dayAppts = appts.filter(a => {
        if (!a.appointment_time) return false
        const p = utcToISTParts(a.appointment_time)
        return p.year === year && p.month === month && p.day === d
      })
      cells.push({ day: d, appts: dayAppts })
    }
    return cells
  }

  return (
    <div className="animate-up">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-bold text-[#E8EAED] mb-1 font-[Syne]">Appointments</h1><p className="text-sm text-[#5A6370]">Bookings via AI + manual entries</p></div>
        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 bg-[#141618] rounded-xl border border-[rgba(255,255,255,0.06)]">
            <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${view === 'list' ? 'bg-[#1A1D20] text-[#E8EAED]' : 'text-[#5A6370]'}`}><List size={13} /> List</button>
            <button onClick={() => setView('calendar')} className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${view === 'calendar' ? 'bg-[#1A1D20] text-[#E8EAED]' : 'text-[#5A6370]'}`}><CalendarDays size={13} /> Calendar</button>
          </div>
          <Button variant="secondary" icon={Bell} onClick={() => setConfirmRemind(true)}>Remind all</Button>
          <Button icon={Plus} onClick={() => setShowForm(true)}>Add</Button>
        </div>
      </div>

      {view === 'list' ? (
        <>
          <div className="flex gap-2 mb-5 overflow-x-auto">
            {STATUSES.map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${filter === s ? 'bg-[rgba(0,197,122,0.1)] text-[#00C57A] border border-[rgba(0,197,122,0.2)]' : 'text-[#5A6370] border border-[rgba(255,255,255,0.06)] hover:text-[#9AA0AB]'}`}>
                {s.replace('_', ' ')}<span className={`px-1.5 py-0.5 rounded text-xs ${filter === s ? 'bg-[rgba(0,197,122,0.2)]' : 'bg-[#1A1D20]'}`}>{counts[s]}</span>
              </button>
            ))}
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : list.length === 0 ? (
            <Card className="py-4"><EmptyState icon={Calendar} title="No appointments" desc="Add one manually or wait for WhatsApp bookings" action={<Button size="sm" icon={Plus} onClick={() => setShowForm(true)}>Add manually</Button>} /></Card>
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full">
                <thead><tr className="border-b border-[rgba(255,255,255,0.06)]">{['Customer', 'Service', 'Date & Time', 'Status', 'Actions'].map(h => <th key={h} className="text-left text-xs font-medium text-[#5A6370] uppercase tracking-wider px-4 py-3">{h}</th>)}</tr></thead>
                <tbody>
                  {list.map((a: any) => {
                    // Render date/time in IST regardless of browser TZ.
                    const { date, time } = formatISTDateTime(a.appointment_time)
                    return (
                      <tr key={a.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[#141618] transition-all">
                        <td className="px-4 py-3"><div className="flex items-center gap-2.5"><Avatar name={a.customers?.name} phone={a.customers?.phone} size="sm" /><div><p className="text-sm font-medium text-[#E8EAED]">{a.customers?.name || '—'}</p><p className="text-xs text-[#5A6370]">{a.customers?.phone}</p></div></div></td>
                        <td className="px-4 py-3 text-sm text-[#9AA0AB]">{a.service || '—'}</td>
                        <td className="px-4 py-3"><p className="text-sm text-[#9AA0AB]">{date}</p><p className="text-xs text-[#5A6370]">{time}</p></td>
                        <td className="px-4 py-3"><Badge variant={CLS[a.status]}>{a.status.replace('_', ' ')}</Badge></td>
                        <td className="px-4 py-3">{a.status === 'confirmed' && (<div className="flex gap-1.5"><Button size="xs" variant="ghost" icon={Bell} onClick={() => sendReminder(a.id)}>Remind</Button><Button size="xs" variant="secondary" onClick={() => updateStatus(a.id, 'done')} loading={updating === a.id}>Done</Button><Button size="xs" variant="ghost" onClick={() => updateStatus(a.id, 'no_show')}>No-show</Button></div>)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </>
      ) : (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))} className="p-2 rounded-lg hover:bg-[#1A1D20] text-[#9AA0AB]"><ChevronLeft size={16} /></button>
            <h2 className="text-sm font-semibold text-[#E8EAED]">{calMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h2>
            <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))} className="p-2 rounded-lg hover:bg-[#1A1D20] text-[#9AA0AB]"><ChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center text-xs text-[#5A6370] py-2 font-medium">{d}</div>)}</div>
          <div className="grid grid-cols-7 gap-1">
            {buildCalendar().map((cell, i) => (
              <div key={i} className={`min-h-[72px] rounded-lg p-1.5 ${cell ? 'bg-[#141618] border border-[rgba(255,255,255,0.04)]' : ''}`}>
                {cell && (<><p className="text-xs text-[#9AA0AB] mb-1">{cell.day}</p><div className="space-y-0.5">{cell.appts.slice(0, 2).map((a: any) => (<div key={a.id} className="text-xs px-1.5 py-0.5 rounded bg-[rgba(0,197,122,0.12)] text-[#00C57A] truncate">{formatISTDateTime(a.appointment_time).time} {a.customers?.name || a.service}</div>))}{cell.appts.length > 2 && <p className="text-xs text-[#5A6370] px-1">+{cell.appts.length - 2}</p>}</div></>)}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Appointment">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Customer Name *" placeholder="Priya Sharma" value={form.customer_name} onChange={(e: any) => setForm(p => ({ ...p, customer_name: e.target.value }))} />
          <Input label="Phone *" placeholder="9876543210" value={form.customer_phone} onChange={(e: any) => setForm(p => ({ ...p, customer_phone: e.target.value }))} />
          <Input label="Service *" placeholder="Facial..." value={form.service} onChange={(e: any) => setForm(p => ({ ...p, service: e.target.value }))} />
          <Input label="Notes" placeholder="Optional" value={form.notes} onChange={(e: any) => setForm(p => ({ ...p, notes: e.target.value }))} />
          <Input label="Date *" type="date" value={form.appointment_date} onChange={(e: any) => setForm(p => ({ ...p, appointment_date: e.target.value }))} />
          <Input label="Time *" type="time" value={form.appointment_time} onChange={(e: any) => setForm(p => ({ ...p, appointment_time: e.target.value }))} />
        </div>
        <div className="flex gap-2 mt-5"><Button onClick={create} loading={saving}>Save Appointment</Button><Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button></div>
      </Modal>

      <Modal open={confirmRemind} onClose={() => setConfirmRemind(false)} title="Remind today's customers?">
        {remindCount === 0 ? (
          <>
            <p className="text-sm text-[#9AA0AB]">No confirmed appointments for today yet.</p>
            <div className="flex gap-2 mt-5"><Button variant="ghost" onClick={() => setConfirmRemind(false)}>Close</Button></div>
          </>
        ) : (
          <>
            <p className="text-sm text-[#9AA0AB] mb-1.5">Send a WhatsApp reminder to the <span className="text-[#E8EAED] font-medium">{remindCount} customer{remindCount === 1 ? '' : 's'}</span> with a confirmed appointment today.</p>
            <p className="text-xs text-[#5A6370]">WhatsApp only delivers to customers who messaged you in the last 24 hours. Anyone outside that window won't receive it — we'll tell you exactly how many.</p>
            <div className="flex gap-2 mt-5"><Button icon={Bell} onClick={remindAll} loading={remindingAll}>Send reminders</Button><Button variant="ghost" onClick={() => setConfirmRemind(false)}>Cancel</Button></div>
          </>
        )}
      </Modal>
    </div>
  )
}