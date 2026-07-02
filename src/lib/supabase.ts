import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,   // needed so Google OAuth redirect populates the session
      storageKey: 'bizbot-auth',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    }
  }
)

// Keep a lightweight mirror of the session in `bizbot-session` so synchronous
// checks (isLoggedIn) work. Supabase's own store stays the source of truth.
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) saveSession(session)
    else localStorage.removeItem('bizbot-session')
  })
}

export async function signInWithPhone(phone: string) {
  const formatted = phone.startsWith('+') ? phone : `+91${phone}`
  return supabase.auth.signInWithOtp({ phone: formatted })
}

export async function verifyOtp(phone: string, token: string) {
  const formatted = phone.startsWith('+') ? phone : `+91${phone}`
  return supabase.auth.verifyOtp({ phone: formatted, token, type: 'sms' })
}

// ── Email + password (free, primary) ──────────────────
export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${window.location.origin}/login` },
  })
}
export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}
export async function resetPassword(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  })
}

// ── Google OAuth (free, one click) ────────────────────
// Always redirect to a neutral callback that decides dashboard-vs-onboarding
// based purely on whether this Google identity already has an account.
export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  })
}

// Synchronous best-effort check using the mirror.
export function isLoggedIn() {
  if (typeof window === 'undefined') return false
  const raw = localStorage.getItem('bizbot-session')
  if (!raw) return false
  try {
    const s = JSON.parse(raw)
    const now = Math.floor(Date.now() / 1000)
    return !(s.expires_at && s.expires_at < now)
  } catch { return false }
}

// Authoritative async check — asks Supabase directly (handles OAuth + refresh).
export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) saveSession(session)
  return session?.user || null
}

// Returns the current Supabase JWT (access_token) if the user is logged in.
// Backend routes gated by AUTH_REQUIRED expect this in Authorization: Bearer.
// Falls back to the localStorage mirror when Supabase is briefly unavailable
// (e.g. right after page load before the session hydrates).
export async function getAccessToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) return session.access_token
  } catch (_) { /* fall through to mirror */ }
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('bizbot-session')
    if (!raw) return null
    const s = JSON.parse(raw)
    const now = Math.floor(Date.now() / 1000)
    if (s.expires_at && s.expires_at < now) return null
    return s.access_token || null
  } catch { return null }
}

// SINGLE SOURCE OF TRUTH for post-auth routing.
// Given a logged-in user, decides: do they have a business?
//   → yes: store bizId, return '/dashboard'
//   → no (CONFIRMED empty lookup): return '/onboarding'
//   → lookup didn't complete: return '/dashboard' (the layout re-resolves) —
//     never dump an existing user into onboarding on a transient/early failure.
// Returns '/login' if there's no user at all.
export async function destinationForUser(user?: any) {
  const u = user || (await getCurrentUser())
  if (!u) return '/login'
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  const params = new URLSearchParams()
  if (u.id) params.set('auth_user_id', u.id)
  if (u.email) params.set('email', u.email)

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${base}/api/business/by-user?${params.toString()}`)
      if (!res.ok) throw new Error(`by-user ${res.status}`)
      const { business } = await res.json()
      if (business?.id) {
        if (typeof window !== 'undefined') localStorage.setItem('bizId', business.id)
        return '/dashboard'
      }
      return '/onboarding'   // definitive: this identity truly has no business
    } catch (_) {
      // Transient/early failure — brief pause, then retry once
      if (attempt === 0) await new Promise(r => setTimeout(r, 300))
    }
  }
  // Couldn't confirm after retry — send to dashboard, where the layout's own
  // by-user resolution runs authoritatively (and routes to onboarding only if
  // it definitively confirms no business). Never onboard on an unconfirmed lookup.
  console.warn('[destinationForUser] by-user lookup unconfirmed after retry — routing to /dashboard (layout will re-resolve) instead of /onboarding')
  return '/dashboard'
}

export function saveSession(session: any) {
  if (!session) return
  localStorage.setItem('bizbot-session', JSON.stringify({
    access_token:  session.access_token,
    refresh_token: session.refresh_token,
    user:          session.user,
    expires_at:    session.expires_at,
  }))
}

export async function signOut() {
  // Clear everything user-scoped so a subsequent login on the same browser
  // doesn't inherit stale state. The onboarding-redirect flag was the
  // trickiest — leaving it stuck new users on the dashboard forever.
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bizbot-session')
    localStorage.removeItem('bizId')
    localStorage.removeItem('bizbot-last-activity')
    sessionStorage.removeItem('onboarding-redirect')
  }
  await supabase.auth.signOut()
}