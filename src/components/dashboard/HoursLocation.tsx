'use client'
import { useState } from 'react'
import { Card, Input, Button, Badge, showToast } from '@/components/ui'
import { Clock, MapPin, Navigation, Check } from 'lucide-react'

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
        <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
          <label className="text-xs font-medium text-[#9AA0AB] block mb-1.5">Last booking time</label>
          <div className="flex items-center gap-3">
            <input type="time" value={biz.last_booking_time || ''} onChange={e => set('last_booking_time', e.target.value)}
              className="bg-[#141618] border border-[rgba(255,255,255,0.08)] rounded-lg px-2.5 py-1.5 text-sm text-[#E8EAED] outline-none focus:border-[#4D9EFF]" />
            <span className="text-xs text-[#5A6370]">Latest slot you accept (e.g. close at 5 PM, last booking 4:30 PM)</span>
          </div>
        </div>
      </Card>
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