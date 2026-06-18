const BASE   = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const BIZ_ID = () => (typeof window !== 'undefined' ? localStorage.getItem('bizId') || process.env.NEXT_PUBLIC_BUSINESS_ID || '' : '')

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

export const api = {
  // Stats
  getStats:                ()                       => call<any>('/api/dashboard/stats'),

  // Appointments
  getTodayAppointments:    ()                       => call<any[]>('/api/dashboard/appointments/today'),
  getAllAppointments:      ()                       => call<any[]>('/api/dashboard/appointments'),
  createAppointment:       (d: any)                 => call('/api/dashboard/appointments/create', { method: 'POST', body: JSON.stringify(d) }),
  updateAppointment:       (id: string, d: any)     => call(`/api/dashboard/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
  updateAppointmentStatus: (id: string, status: string) => call(`/api/dashboard/appointments/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  sendAppointmentReminder: (id: string)             => call(`/api/dashboard/appointments/${id}/remind`, { method: 'POST' }),

  // Conversations
  getConversations:        ()                       => call<any[]>('/api/dashboard/conversations'),
  getMessages:             (cid: string)            => call<any[]>(`/api/dashboard/conversations/${cid}/messages`),
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
  sendCampaign:            (id: string)             => call(`/api/broadcast/campaigns/${id}/send`, { method: 'POST' }),
}