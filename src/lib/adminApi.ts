// Operator-console API client. Separate from lib/api.ts because admin routes
// are cross-tenant: they need the Supabase JWT but NOT an x-business-id header.
import { getAccessToken } from '@/lib/supabase'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

async function adminCall<T>(path: string, opts: RequestInit = {}): Promise<{ data: T | null; error: string | null }> {
  try {
    const token = await getAccessToken()
    const res = await fetch(`${BASE}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts.headers || {}),
      },
    })
    if (!res.ok) {
      const e = await res.json().catch(() => ({}))
      if (res.status === 401) return { data: null, error: 'Session expired. Please sign in again.' }
      if (res.status === 403) return { data: null, error: 'Admin access only.' }
      return { data: null, error: e.error || `HTTP ${res.status}` }
    }
    return { data: await res.json(), error: null }
  } catch (e: any) {
    return { data: null, error: e.message || 'Network error' }
  }
}

export const adminApi = {
  me:           ()                       => adminCall<{ admin: boolean; email: string }>('/api/admin/me'),
  overview:     ()                       => adminCall<any>('/api/admin/overview'),
  clients:      (query = '')             => adminCall<any>(`/api/admin/clients${query ? `?${query}` : ''}`),
  client:       (id: string)             => adminCall<any>(`/api/admin/clients/${id}`),
  alerts:       (query = '')             => adminCall<any>(`/api/admin/alerts${query ? `?${query}` : ''}`),
  audit:        (query = '')             => adminCall<any>(`/api/admin/audit${query ? `?${query}` : ''}`),
  notes:        (id: string)             => adminCall<any>(`/api/admin/clients/${id}/notes`),
  addNote:      (id: string, body: string) => adminCall<any>(`/api/admin/clients/${id}/notes`, { method: 'POST', body: JSON.stringify({ body }) }),
  deleteNote:   (noteId: string)         => adminCall<any>(`/api/admin/notes/${noteId}`, { method: 'DELETE' }),
  changePlan:   (id: string, body: any)  => adminCall<any>(`/api/admin/clients/${id}/plan`,   { method: 'PATCH', body: JSON.stringify(body) }),
  changeStatus: (id: string, body: any)  => adminCall<any>(`/api/admin/clients/${id}/status`, { method: 'PATCH', body: JSON.stringify(body) }),
}
