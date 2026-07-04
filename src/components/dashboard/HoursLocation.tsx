'use client'
import { useState } from 'react'
import { Card, Input, Button, Badge, showToast } from '@/components/ui'
import { Clock, MapPin, Navigation, Check, Users, CalendarX, Plus, X } from 'lucide-react'

const DAYS = [
  ['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'],
  ['thu', 'Thursday'], ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday'],
] as const

type DayHours = { open: string; close: string; closed: boolean }
type Hours = Record<string, DayHours>

const DEFAULT_DAY: DayHours = { open: '09:00', close: '20:00', closed: false }

export default function HoursLocation({ biz, set }: { biz: any; set: (k: string, v: any) => void }) {
  const hours: Hours = biz.business_hours && Object.keys(biz.business_hours).length
    ? biz.business_hours
    : Object.fromEntries(DAYS.map(([k]) => [k, { ...DEFAULT_DAY }]))

  const [locating, setLocating] = useState(false)

  function updateDay(day: string, patch: Partial<DayHours>) {
    const next = { ...hours, [day]: { ...(hours[day] || DEFAULT_DAY), ...patch } }
    set('business_hours', next)
  }

  function copyMondayToAll() {
    const m = hours['mon'] || DEFAULT_DAY
    const next = Object.fromEntries(DAYS.map(([k]) => [k, { ...m }]))
    set('business_hours', next)
    showToast('Monday hours copied to all days', 'success')
  }

  function fetchLocation() {
    if (!navigator.geolocation) { showToast('Geolocation not supported on this device', 'error'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const link = `https://www.google.com/maps?q=${latitude},${longitude}`
        set('latitude', latitude)
        set('longitude', longitude)
        set('maps_link', link)
        setLocating(false)
        showToast('Location captured! Maps link saved.', 'success')
      },
      (err) => {
        setLocating(false)
        showToast(err.code === 1 ? 'Location permission denied' : 'Could not get location', 'error')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <>
      {/* Hours */}
      <Card className="p-5 mb-4">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-2"><Clock size={15} className="text-[#4D9EFF]" /><h2 className="text-sm font-semibold text-[#E8EAED]">Working Hours</h2></div>
          <button onClick={copyMondayToAll} className="text-xs font-medium text-[#4D9EFF] hover:underline">Copy Monday to all</button>
        </div>
        <div className="space-y-1.5">
          {DAYS.map(([key, label]) => {
            const d = hours[key] || DEFAULT_DAY
            return (
              <div key={key} className="flex items-center gap-3 py-1.5">
                <span className="text-sm text-[#E8EAED] w-24 flex-shrink-0">{label}</span>
                {d.closed ? (
                  <span className="flex-1 text-sm text-[#5A6370]">Closed</span>
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <input type="time" value={d.open} onChange={e => updateDay(key, { open: e.target.value })}
                      className="bg-[#141618] border border-[rgba(255,255,255,0.08)] rounded-lg px-2.5 py-1.5 text-sm text-[#E8EAED] outline-none focus:border-[#4D9EFF]" />
                    <span className="text-[#5A6370] text-sm">to</span>
                    <input type="time" value={d.close} onChange={e => updateDay(key, { close: e.target.value })}
                      className="bg-[#141618] border border-[rgba(255,255,255,0.08)] rounded-lg px-2.5 py-1.5 text-sm text-[#E8EAED] outline-none focus:border-[#4D9EFF]" />
                  </div>
                )}
                <button onClick={() => updateDay(key, { closed: !d.closed })}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex-shrink-0 ${d.closed ? 'bg-[rgba(0,197,122,0.1)] text-[#00C57A]' : 'bg-[#1A1D20] text-[#9AA0AB] hover:text-[#E8EAED]'}`}>
                  {d.closed ? 'Set open' : 'Mark closed'}
                </button>
              </div>
            )
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)] space-y-4">
          <div>
            <label className="text-xs font-medium text-[#9AA0AB] block mb-1.5">Last booking time</label>
            <div className="flex items-center gap-3">
              <input type="time" value={biz.last_booking_time || ''} onChange={e => set('last_booking_time', e.target.value)}
                className="bg-[#141618] border border-[rgba(255,255,255,0.08)] rounded-lg px-2.5 py-1.5 text-sm text-[#E8EAED] outline-none focus:border-[#4D9EFF]" />
              <span className="text-xs text-[#5A6370]">Latest slot you accept (e.g. close at 5 PM, last booking 4:30 PM)</span>
            </div>
          </div>

          <CapacityField biz={biz} set={set} />
        </div>
      </Card>

      <HolidaysCard biz={biz} set={set} />
      <Card className="p-5 mb-4">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[rgba(255,255,255,0.06)]"><MapPin size={15} className="text-[#FFA040]" /><h2 className="text-sm font-semibold text-[#E8EAED]">Location</h2></div>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-[#141618] rounded-xl">
            <div className="flex-1">
              <p className="text-sm text-[#E8EAED] font-medium">{biz.maps_link ? 'Location saved' : 'No location pin yet'}</p>
              <p className="text-xs text-[#5A6370]">{biz.maps_link ? 'Customers will get a Google Maps link' : 'Tap to capture your shop\'s exact location'}</p>
            </div>
            {biz.maps_link && <Badge variant="green"><Check size={11} className="mr-1" />Pinned</Badge>}
            <Button size="sm" variant="secondary" icon={Navigation} loading={locating} onClick={fetchLocation}>
              {biz.maps_link ? 'Update' : 'Use current location'}
            </Button>
          </div>
          {biz.maps_link && (
            <a href={biz.maps_link} target="_blank" rel="noopener noreferrer" className="text-xs text-[#4D9EFF] hover:underline break-all block">{biz.maps_link}</a>
          )}
          <Input label="Address" value={biz.location || ''} onChange={(e: any) => set('location', e.target.value)} placeholder="Shop 12, Lajpat Nagar, New Delhi" />
          <Input label="Landmark (optional)" value={biz.landmark || ''} onChange={(e: any) => set('landmark', e.target.value)} placeholder="Near Metro Station, opposite SBI" hint="Helps customers find you easily" />
        </div>
      </Card>
    </>
  )
}

// ── Per-hour capacity ─────────────────────────────────
// Drives the validator's capacity_full rejection — a business with 2 chairs
// should set 2. Blank / 0 = unlimited (backend treats null as no cap).
function CapacityField({ biz, set }: { biz: any; set: (k: string, v: any) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-[#9AA0AB] block mb-1.5 flex items-center gap-1.5">
        <Users size={12} /> Bookings per hour
      </label>
      <div className="flex items-center gap-3">
        <input
          type="number" min={0} step={1}
          value={biz.hourly_capacity ?? ''}
          onChange={e => {
            const raw = e.target.value
            if (raw === '') { set('hourly_capacity', null); return }
            const n = Number(raw)
            set('hourly_capacity', Number.isFinite(n) && n > 0 ? Math.floor(n) : null)
          }}
          placeholder="Unlimited"
          className="bg-[#141618] border border-[rgba(255,255,255,0.08)] rounded-lg px-2.5 py-1.5 text-sm text-[#E8EAED] outline-none focus:border-[#4D9EFF] w-32"
        />
        <span className="text-xs text-[#5A6370]">
          Max concurrent bookings the AI can accept in the same hour (e.g. number of chairs). Leave blank for unlimited.
        </span>
      </div>
    </div>
  )
}

// ── Holidays ──────────────────────────────────────────
// Backend reads business.holidays as an array of "YYYY-MM-DD" strings and
// blocks bookings on those days. Owner adds one date at a time; existing
// dates render as removable chips.
function HolidaysCard({ biz, set }: { biz: any; set: (k: string, v: any) => void }) {
  const list: string[] = Array.isArray(biz.holidays) ? biz.holidays : []
  const [draft, setDraft] = useState('')

  function add() {
    if (!draft) return
    if (list.includes(draft)) { showToast('That date is already added', 'info'); return }
    const next = [...list, draft].sort()
    set('holidays', next)
    setDraft('')
  }
  function remove(date: string) {
    set('holidays', list.filter(d => d !== date))
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <Card className="p-5 mb-4">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[rgba(255,255,255,0.06)]">
        <CalendarX size={15} className="text-[#FF5A5A]" />
        <h2 className="text-sm font-semibold text-[#E8EAED]">Holidays &amp; closed days</h2>
      </div>
      <p className="text-xs text-[#5A6370] mb-3">Bookings are blocked automatically on any date you add here — Diwali, Holi, staff off-days, anything.</p>

      <div className="flex items-center gap-2 mb-4">
        <input
          type="date" value={draft} min={today}
          onChange={e => setDraft(e.target.value)}
          className="bg-[#141618] border border-[rgba(255,255,255,0.08)] rounded-lg px-2.5 py-1.5 text-sm text-[#E8EAED] outline-none focus:border-[#4D9EFF]"
        />
        <Button size="sm" icon={Plus} onClick={add} disabled={!draft}>Add</Button>
      </div>

      {list.length === 0 ? (
        <p className="text-xs text-[#5A6370]">No holidays added yet.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {list.map(d => (
            <span key={d} className="inline-flex items-center gap-1.5 bg-[rgba(255,90,90,0.08)] text-[#FF5A5A] border border-[rgba(255,90,90,0.2)] px-2.5 py-1 rounded-lg text-xs font-medium">
              {new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              <button onClick={() => remove(d)} className="hover:text-[#E8EAED]" aria-label="Remove date"><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
    </Card>
  )
}