import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function signInWithPhone(phone: string) {
  const formatted = phone.startsWith('+') ? phone : `+91${phone}`
  return supabase.auth.signInWithOtp({ phone: formatted })
}

export async function verifyOtp(phone: string, token: string) {
  const formatted = phone.startsWith('+') ? phone : `+91${phone}`
  return supabase.auth.verifyOtp({ phone: formatted, token, type: 'sms' })
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function signOut() {
  await supabase.auth.signOut()
}
