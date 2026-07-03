const BASE   = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// bizId is normally set by the dashboard layout after it resolves the business
// via /api/business/by-user. But business-scoped calls can fire before that
// finishes (e.g. the overview page on mount), which would send an empty
// x-business-id and 400. So resolve it here as a fallback — via the logged-in
// user, NEVER via an env-var default (that caused wrong-business bugs).
let pendingBizId: Promise<string> | null = null
async function resolveBizId(): Promise<string> {
  if (typeof window === 'undefined') return ''
  const cached = localStorage.getItem('bizId')
  if (cached) return cached
  // Coalesce concurrent misses (e.g. the overview's parallel calls) into one
  // lookup. Only clear the cached promise on FAILURE — clearing it in
  // `.finally` (as before) killed the coalescing: any second caller arriving
  // after the first promise settled would kick off its own fetch, so the
  // dashboard mount fired 3-5 parallel /by-user roundtrips.
  if (!pendingBizId) {
    pendingBizId = (async () => {
      try {
        const { getCurrentUser, getAccessToken } = await import('@/lib/supabase')
        const user = await getCurrentUser()
        if (!user) { pendingBizId = null; return '' }
        const params = new URLSearchParams()
        if (user.id) params.set('auth_user_id', user.id)
        if (user.email) params.set('email', user.email)
        // by-user is JWT-gated — without the token this 401s and bizId stays
        // empty, which then fails every downstream dashboard call.
        const token = await getAccessToken()
        const res = await fetch(`${BASE}/api/business/by-user?${params.toString()}`, {
          headers: { 'ngrok-skip-browser-warning': 'true', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        })
        const { business } = await res.json()
        if (business?.id) { localStorage.setItem('bizId', business.id); return business.id }
        pendingBizId = null   // no business — allow retry after onboarding
        return ''
      } catch (_) {
        pendingBizId = null   // transient failure — allow retry
        return ''
      }
    })()
  }
  return pendingBizId
}

async function call<T>(path: string, opts: RequestInit = {}): Promise<{ data: T | null; error: string | null }> {
  try {
    // Backend now requires the Supabase JWT (with AUTH_REQUIRED=true).
    // Injected here so every callsite is covered in one shot.
    const { getAccessToken } = await import('@/lib/supabase')
    const token = await getAccessToken()
    const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

    const res = await fetch(`${BASE}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'x-business-id': await resolveBizId(),
        ...authHeader,
        ...(opts.headers || {}),
      },
    })
    if (!res.ok) {
      const e = await res.json().catch(() => ({}))
      if (res.status === 401) {
        return { data: null, error: 'Session expired. Please sign in again.' }
      }
      if (res.status === 403) {
        return { data: null, error: 'You do not have access to this business.' }
      }
      // Plan expired — backend blocked a write action
      if (res.status === 402 || e.error === 'plan_expired') {
        return { data: null, error: 'Your trial/plan has expired. Please upgrade to continue.' }
      }
      return { data: null, error: e.error || `HTTP ${res.status}` }
    }
    return { data: await res.json(), error: null }
  } catch (e: any) {
    return { data: null, error: e.message || 'Network error' }
  }
}

// Unwrap the new paginated response envelope from three endpoints while the
// UI still consumes flat arrays. Backend returns { conversations|appointments|messages, nextCursor }
// now; we peel it here so existing .map() / .filter() callsites keep working.
// Migrate the UI to consume nextCursor later; keeping the shape uniform for now.
function unwrap<T>(res: { data: any | null; error: string | null }, key: string): { data: T[] | null; error: string | null } {
  if (!res.data) return { data: null, error: res.error }
  if (Array.isArray(res.data)) return { data: res.data as T[], error: res.error }
  const items = res.data[key]
  if (Array.isArray(items)) return { data: items as T[], error: res.error }
  return { data: [], error: res.error }
}

export const api = {
  // Stats
  getStats:                ()                       => call<any>('/api/dashboard/stats'),

  // Appointments
  getTodayAppointments:    ()                       => call<any[]>('/api/dashboard/appointments/today'),
  // Use the legacy flat endpoint so the list isn't silently capped at the
  // paginated default of 50. Returns the full set (up to 500) as a plain array.
  // Switch to cursor pagination here once the UI has a "load more".
  getAllAppointments:      async ()                 => unwrap<any>(await call<any>('/api/dashboard/appointments?paginated=false'), 'appointments'),
  createAppointment:       (d: any)                 => call('/api/dashboard/appointments/create', { method: 'POST', body: JSON.stringify(d) }),
  updateAppointment:       (id: string, d: any)     => call(`/api/dashboard/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
  updateAppointmentStatus: (id: string, status: string) => call(`/api/dashboard/appointments/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  sendAppointmentReminder: (id: string)             => call(`/api/dashboard/appointments/${id}/remind`, { method: 'POST' }),
  remindAllToday:          ()                       => call<any>('/api/dashboard/appointments/remind-all', { method: 'POST' }),

  // Conversations
  // Backend switched to `{ conversations, nextCursor }` and `{ messages, nextCursor }`;
  // unwrap so existing .map/.filter consumers keep working.
  getConversations:        async ()                 => unwrap<any>(await call<any>('/api/dashboard/conversations'), 'conversations'),
  // Messages come back newest-first from the paginated endpoint (cursor
  // pagination loads OLDER messages, so DESC is correct on the wire).
  // Reverse here so the UI renders them oldest→newest (WhatsApp convention:
  // scroll down = newer). Non-mutating slice().reverse() to keep the raw
  // array immutable if a future caller wants both orderings.
  getMessages:             async (cid: string) => {
    const r = unwrap<any>(await call<any>(`/api/dashboard/conversations/${cid}/messages`), 'messages')
    if (r.data) r.data = r.data.slice().reverse()
    return r
  },
  sendManualMessage:       (cid: string, text: string) => call(`/api/dashboard/conversations/${cid}/send`, { method: 'POST', body: JSON.stringify({ text }) }),
  toggleAI:                (cid: string, enabled: boolean) => call(`/api/dashboard/conversations/${cid}/ai`, { method: 'PATCH', body: JSON.stringify({ ai_enabled: enabled }) }),

  // Payments
  getPendingPayments:      ()                       => call<any[]>('/api/dashboard/payments/pending'),
  getPaidPayments:         ()                       => call<any[]>('/api/dashboard/payments/paid'),
  createPayment:           (d: any)                 => call('/api/dashboard/payments/create', { method: 'POST', body: JSON.stringify(d) }),
  sendPaymentReminder:     (id: string)             => call(`/api/payments/${id}/remind`, { method: 'POST' }),
  markPaymentPaid:         (id: string)             => call(`/api/payments/${id}/paid`, { method: 'PATCH' }),

  // Customers
  getCustomers:            ()                       => call<any[]>('/api/dashboard/customers'),
  getCustomerDetail:       (id: string)             => call<any>(`/api/dashboard/customers/${id}`),
  createCustomer:          (d: any)                 => call('/api/dashboard/customers/create', { method: 'POST', body: JSON.stringify(d) }),
  importCustomers:         (customers: any[])       => call<any>('/api/dashboard/customers/import', { method: 'POST', body: JSON.stringify({ customers }) }),
  deleteCustomer:          (id: string)             => call(`/api/dashboard/customers/${id}`, { method: 'DELETE' }),
  sendReengagement:        (id: string)             => call(`/api/dashboard/customers/${id}/reengage`, { method: 'POST' }),

  // Business
  getBusiness:             ()                       => call<any>('/api/business'),
  updateBusiness:          (d: any)                 => call('/api/business', { method: 'PATCH', body: JSON.stringify(d) }),
  createBusiness:          (d: any)                 => call('/api/business/create', { method: 'POST', body: JSON.stringify(d) }),

  // Broadcast — templates
  getTemplates:            ()                       => call<any[]>('/api/broadcast/templates'),
  createTemplate:          (d: any)                 => call('/api/broadcast/templates', { method: 'POST', body: JSON.stringify(d) }),
  deleteTemplate:          (id: string)             => call(`/api/broadcast/templates/${id}`, { method: 'DELETE' }),

  // Broadcast — campaigns
  getAudience:             (segment: string, value?: string) => call<any>(`/api/broadcast/audience?segment=${segment}${value ? `&value=${encodeURIComponent(value)}` : ''}`),
  getCampaigns:            ()                       => call<any[]>('/api/broadcast/campaigns'),
  createCampaign:          (d: any)                 => call('/api/broadcast/campaigns', { method: 'POST', body: JSON.stringify(d) }),
  sendCampaign:            (id: string)             => call<any>(`/api/broadcast/campaigns/${id}/send`, { method: 'POST' }),
  cancelCampaign:          (id: string)             => call(`/api/broadcast/campaigns/${id}/cancel`, { method: 'POST' }),

  // Analytics
  getAnalytics:            (q: string)              => call<any>(`/api/analytics?${q}`),

  // Booking alerts — surface every AI-couldn't-book event so the owner can act
  getBookingAlerts:        async (status: string = 'open') => unwrap<any>(await call<any>(`/api/dashboard/booking-alerts?status=${status}`), 'alerts'),
  getBookingAlertsCount:   ()                       => call<{ open: number }>('/api/dashboard/booking-alerts/count'),
  dismissBookingAlert:     (id: string)             => call(`/api/dashboard/booking-alerts/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'dismissed' }) }),
  handleBookingAlert:      (id: string)             => call(`/api/dashboard/booking-alerts/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'handled' }) }),
  createAppointmentFromAlert: (id: string, d: any)  => call(`/api/dashboard/booking-alerts/${id}/create-appointment`, { method: 'POST', body: JSON.stringify(d) }),
}

// CSV export: fetch with the business header + JWT, then trigger a browser download.
// (A plain <a href> can't send auth headers, so we blob it here.)
export async function downloadAnalyticsCsv(q: string) {
  const { getAccessToken } = await import('@/lib/supabase')
  const token = await getAccessToken()
  const headers: Record<string, string> = {
    'ngrok-skip-browser-warning': 'true',
    'x-business-id': await resolveBizId(),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}/api/analytics/export?${q}`, { headers })
  if (!res.ok) {
    if (res.status === 401) throw new Error('Session expired. Please sign in again.')
    if (res.status === 402) throw new Error('Your trial/plan has expired. Please upgrade to continue.')
    if (res.status === 403) throw new Error('You do not have access to this business.')
    throw new Error(`Export failed (HTTP ${res.status})`)
  }
  const blob = await res.blob()
  const url  = URL.createObjectURL(blob)
  const cd   = res.headers.get('Content-Disposition') || ''
  const match = cd.match(/filename="?([^"]+)"?/)
  const a = document.createElement('a')
  a.href = url
  a.download = match ? match[1] : 'bizbot-analytics.csv'
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}