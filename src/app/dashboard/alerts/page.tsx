'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, Button, Badge, Modal, Input, EmptyState, Skeleton, showToast, Avatar } from '@/components/ui'
import { AlertTriangle, Bell, Check, X as XIcon, Plus, MessageSquare, Bot } from 'lucide-react'
import { istDateTimeToUtcISO, formatISTDateTime } from '@/lib/dateTime'

// Human-friendly labels for the machine reason codes recorded on the backend.
const REASON_LABEL: Record<string, string> = {
  capacity_full:    'Slot at capacity',
  conflict:         'Another appointment at that time',
  duplicate:        'Customer already booked this slot',
  past_datetime:    'Time already passed',
  closed_day:       'Business closed that day',
  holiday:          'Holiday',
  outside_hours:    'Outside working hours',
  after_cutoff:     'After the last-booking cutoff',
  unknown_service:  'Service not on the list',
  missing_datetime: 'Missing date or time',
  ambiguous:        "Couldn't understand the slot",
  llm_error:        'AI was unavailable',
  extractor_failed: 'Booking pipeline error',
}
const REASON_TONE: Record<string, string> = {
  capacity_full:    'amber',
  conflict:         'amber',
  duplicate:        'default',
  past_datetime:    'default',
  closed_day:       'default',
  holiday:          'default',
  outside_hours:    'default',
  after_cutoff:     'default',
  unknown_service:  'default',
  missing_datetime: 'amber',
  ambiguous:        'amber',
  llm_error:        'red',
  extractor_failed: 'red',
}

export default function AlertsPage() {
  const [alerts, setAlerts]     = useState<any[]>([])
  const [tab, setTab]           = useState<'open' | 'handled' | 'dismissed'>('open')
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [active, setActive]     = useState<any>(null)
  const [form, setForm]         = useState({ customer_name: '', customer_phone: '', service: '', appointment_date: '', appointment_time: '', notes: '' })

  useEffect(() => { load() /* eslint-disable-next-line */ }, [tab])
  async function load() {
    setLoading(true)
    const { data } = await api.getBookingAlerts(tab)
    setAlerts(data || [])
    setLoading(false)
  }

  function open(alert: any) {
    setActive(alert)
    // Prefill from whatever the extractor guessed. The owner can edit before saving.
    setForm({
      customer_name:    alert.customers?.name || '',
      customer_phone:   alert.customers?.phone || '',
      service:          alert.suggested_service || '',
      appointment_date: alert.suggested_date || '',
      appointment_time: alert.suggested_time || '',
      notes: '',
    })
  }

  async function saveAppointment() {
    if (!active) return
    if (!form.customer_name || !form.service || !form.appointment_date || !form.appointment_time) {
      showToast('Fill all required fields', 'error'); return
    }
    setSaving(true)
    const appointment_time = istDateTimeToUtcISO(form.appointment_date, form.appointment_time)
    const { error } = await api.createAppointmentFromAlert(active.id, {
      customer_name:  form.customer_name,
      customer_phone: form.customer_phone,
      service:        form.service,
      appointment_time,
      notes:          form.notes,
      status:         'confirmed',
    })
    setSaving(false)
    if (error) return showToast(error, 'error')
    showToast('Appointment created and alert cleared', 'success')
    setActive(null)
    load()
  }

  async function dismiss(id: string) {
    const { error } = await api.dismissBookingAlert(id)
    if (error) return showToast(error, 'error')
    showToast('Alert dismissed', 'success')
    load()
  }
  async function markHandled(id: string) {
    const { error } = await api.handleBookingAlert(id)
    if (error) return showToast(error, 'error')
    showToast('Marked as handled', 'success')
    load()
  }

  return (
    <div className="animate-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#E8EAED] mb-1 font-[Syne]">Attention needed</h1>
          <p className="text-sm text-[#5A6370]">Bookings the AI couldn't complete — review and act manually.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {(['open', 'handled', 'dismissed'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${tab === t ? 'bg-[rgba(255,160,64,0.1)] text-[#FFA040] border border-[rgba(255,160,64,0.2)]' : 'text-[#5A6370] border border-[rgba(255,255,255,0.06)]'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : alerts.length === 0 ? (
        <Card className="py-4"><EmptyState icon={Bell} title="Nothing pending" desc="Alerts appear here when the AI can't complete a booking on its own." /></Card>
      ) : (
        <div className="space-y-2">
          {alerts.map(a => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[rgba(255,160,64,0.12)] flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={16} className="text-[#FFA040]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar name={a.customers?.name} phone={a.customers?.phone} size="sm" />
                    <p className="text-sm font-medium text-[#E8EAED] truncate">{a.customers?.name || a.customers?.phone || 'Unknown customer'}</p>
                    <Badge variant={REASON_TONE[a.reason] || 'default'}>{REASON_LABEL[a.reason] || a.reason}</Badge>
                  </div>
                  <p className="text-xs text-[#5A6370] mb-2">{formatISTDateTime(a.created_at).date} · {formatISTDateTime(a.created_at).time}</p>
                  {a.message_snippet && (
                    <div className="flex items-start gap-2 text-xs text-[#9AA0AB] mb-1"><MessageSquare size={12} className="text-[#5A6370] mt-0.5 flex-shrink-0" /><span className="truncate">"{a.message_snippet}"</span></div>
                  )}
                  {a.ai_reply_snippet && (
                    <div className="flex items-start gap-2 text-xs text-[#5A6370]"><Bot size={12} className="text-[#5A6370] mt-0.5 flex-shrink-0" /><span className="truncate">Bot: "{a.ai_reply_snippet}"</span></div>
                  )}
                  {(a.suggested_service || a.suggested_date || a.suggested_time) && (
                    <p className="text-xs text-[#5A6370] mt-1.5">Guessed: <span className="text-[#9AA0AB]">{a.suggested_service || '—'}</span> · <span className="text-[#9AA0AB]">{a.suggested_date || '—'}</span> · <span className="text-[#9AA0AB]">{a.suggested_time || '—'}</span></p>
                  )}
                </div>
                {tab === 'open' && (
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <Button size="xs" icon={Plus} onClick={() => open(a)}>Book manually</Button>
                    <div className="flex gap-1">
                      <Button size="xs" variant="secondary" icon={Check} onClick={() => markHandled(a.id)}>Handled</Button>
                      <Button size="xs" variant="ghost" icon={XIcon} onClick={() => dismiss(a.id)}>Dismiss</Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!active} onClose={() => setActive(null)} title="Create appointment manually">
        {active && (
          <>
            <p className="text-xs text-[#5A6370] mb-4">Prefilled from what the AI understood. Edit anything before saving.</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Customer Name *" value={form.customer_name} onChange={(e: any) => setForm(p => ({ ...p, customer_name: e.target.value }))} />
              <Input label="Phone *" value={form.customer_phone} onChange={(e: any) => setForm(p => ({ ...p, customer_phone: e.target.value }))} />
              <Input label="Service *" value={form.service} onChange={(e: any) => setForm(p => ({ ...p, service: e.target.value }))} />
              <Input label="Notes" value={form.notes} onChange={(e: any) => setForm(p => ({ ...p, notes: e.target.value }))} />
              <Input label="Date *" type="date" value={form.appointment_date} onChange={(e: any) => setForm(p => ({ ...p, appointment_date: e.target.value }))} />
              <Input label="Time *" type="time" value={form.appointment_time} onChange={(e: any) => setForm(p => ({ ...p, appointment_time: e.target.value }))} />
            </div>
            <div className="flex gap-2 mt-5">
              <Button onClick={saveAppointment} loading={saving}>Save Appointment</Button>
              <Button variant="ghost" onClick={() => setActive(null)}>Cancel</Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
