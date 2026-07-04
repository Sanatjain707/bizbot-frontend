// IST-anchored date/time helpers. Mirrors src/utils/dateTime.js on the backend
// so the same conversions apply to both sides of the wire. Every business
// concept (opening hours, appointment day, cutoffs) is IST — do NOT use raw
// new Date() for anything user-facing.

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000

// Today's date in IST as YYYY-MM-DD.
export function istDateStr(d: Date = new Date()): string {
  const shifted = new Date(d.getTime() + IST_OFFSET_MS)
  return shifted.toISOString().slice(0, 10)
}

// Combine an IST date (YYYY-MM-DD) + time (HH:MM) into a UTC ISO string
// suitable for POSTing as `appointment_time`.
export function istDateTimeToUtcISO(dateISO: string, hhmm: string): string {
  return new Date(`${dateISO}T${hhmm}:00+05:30`).toISOString()
}

// Convert a UTC ISO string to the equivalent IST calendar day (YYYY-MM-DD).
// Use this when you need to decide "does this appointment fall on this
// IST-anchored day" for filters or calendar cells.
export function utcToISTDateStr(utcISO: string): string {
  return istDateStr(new Date(utcISO))
}

// Extract IST year/month(0-11)/day from a UTC ISO string — for calendar grids.
export function utcToISTParts(utcISO: string): { year: number; month: number; day: number } {
  const iso = utcToISTDateStr(utcISO)   // YYYY-MM-DD in IST
  const [y, m, d] = iso.split('-').map(Number)
  return { year: y, month: m - 1, day: d }
}

// "16:30" → "4:30 PM"
export function formatTime12(hhmm: string): string {
  if (!hhmm || !hhmm.includes(':')) return ''
  const [hStr, mStr] = hhmm.split(':')
  const h = parseInt(hStr, 10), m = parseInt(mStr, 10)
  if (Number.isNaN(h) || Number.isNaN(m)) return ''
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

// UTC ISO → "12 Jul, 4:00 PM" in IST for tables and cards.
export function formatISTDateTime(utcISO: string): { date: string; time: string } {
  const d = new Date(utcISO)
  return {
    date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
  }
}

// Combine an IST date string and 24h time string into a scheduled UTC ISO.
// Used by the broadcast scheduler where the user picks a datetime-local value.
export function scheduledLocalToUtcISO(datetimeLocal: string): string {
  // datetimeLocal comes as "YYYY-MM-DDTHH:MM" — no timezone. We anchor to IST.
  if (!datetimeLocal || !datetimeLocal.includes('T')) return ''
  const [d, t] = datetimeLocal.split('T')
  return istDateTimeToUtcISO(d, t.slice(0, 5))
}
