const BASE    = process.env.NEXT_PUBLIC_API_URL    || 'http://localhost:3000'
const BIZ_ID  = () => process.env.NEXT_PUBLIC_BUSINESS_ID ||
                      (typeof window !== 'undefined' ? localStorage.getItem('bizId') || '' : '')

async function call<T>(path: string, opts: RequestInit = {}): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': BIZ_ID(),
        ...(opts.headers || {}),
      },
    })
    if (!res.ok) {
      const e = await res.json().catch(() => ({}))
      return { data: null, error: e.error || `HTTP ${res.status}` }
    }
    return { data: await res.json(), error: null }
  } catch (e: any) {
    return { data: null, error: e.message || 'Network error' }
  }
}

export const api = {
  getStats:                ()         => call<any>('/api/dashboard/stats'),
  getTodayAppointments:    ()         => call<any[]>('/api/dashboard/appointments/today'),
  getAllAppointments:       ()         => call<any[]>('/api/dashboard/appointments'),
  updateAppointmentStatus: (id: string, status: string) =>
                                         call(`/api/dashboard/appointments/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getConversations:        ()         => call<any[]>('/api/dashboard/conversations'),
  getMessages:             (cid: string) => call<any[]>(`/api/dashboard/conversations/${cid}/messages`),
  getPendingPayments:      ()         => call<any[]>('/api/dashboard/payments/pending'),
  sendPaymentReminder:     (id: string) => call(`/api/payments/${id}/remind`, { method: 'POST' }),
  markPaymentPaid:         (id: string) => call(`/api/payments/${id}/paid`,   { method: 'PATCH' }),
  getCustomers:            ()         => call<any[]>('/api/dashboard/customers'),
  sendReengagement:        (id: string) => call(`/api/dashboard/customers/${id}/reengage`, { method: 'POST' }),
  getBusiness:             ()         => call<any>('/api/business'),
  updateBusiness:          (d: any)   => call('/api/business', { method: 'PATCH', body: JSON.stringify(d) }),
}
