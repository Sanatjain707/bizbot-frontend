import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      storageKey: 'bizbot-auth',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    }
  }
)

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
export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/onboarding` },
  })
}

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

export function saveSession(session: any) {
  localStorage.setItem('bizbot-session', JSON.stringify({
    access_token:  session.access_token,
    refresh_token: session.refresh_token,
    user:          session.user,
    expires_at:    session.expires_at,
  }))
}

export function signOut() {
  localStorage.removeItem('bizbot-session')
  localStorage.removeItem('bizId')
  supabase.auth.signOut()
}