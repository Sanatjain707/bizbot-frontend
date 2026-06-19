'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getCurrentUser, destinationForUser } from '@/lib/supabase'

// Google (and any OAuth) lands here. Its only job: figure out where this
// identity should go — dashboard if they already have an account, onboarding
// if they're new. The button they clicked (login vs signup) is irrelevant.
export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    let done = false
    async function route(user: any) {
      if (done || !user) return
      done = true
      const dest = await destinationForUser(user) // '/dashboard' or '/onboarding'
      router.replace(dest)
    }

    getCurrentUser().then(u => { if (u) route(u) })

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) route(session.user)
    })

    // Fallback if the session never arrives
    const t = setTimeout(async () => {
      if (!done) {
        const u = await getCurrentUser()
        if (u) route(u)
        else router.replace('/login')
      }
    }, 3000)

    return () => { sub.subscription.unsubscribe(); clearTimeout(t) }
  }, [router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF7F0', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, margin: '0 auto 16px', border: '3px solid rgba(10,135,84,0.2)', borderTopColor: '#0A8754', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#5C5248', fontSize: 15 }}>Signing you in…</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}