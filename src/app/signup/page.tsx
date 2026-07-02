'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUpWithEmail, signInWithGoogle, saveSession, destinationForUser } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [sent, setSent] = useState(false)

  // Only skip the form if they're already fully set up (have a business).
  useEffect(() => {
    let cancelled = false
    destinationForUser().then(dest => {
      if (!cancelled && dest === '/dashboard') router.replace('/dashboard')
    })
    return () => { cancelled = true }
  }, [])

  async function signup() {
    if (!email.includes('@')) { setErr('Enter a valid email'); return }
    if (password.length < 6) { setErr('Password must be at least 6 characters'); return }
    setErr(''); setLoading(true)
    const { data, error } = await signUpWithEmail(email, password)
    setLoading(false)
    if (error) { setErr(error.message); return }
    // If email confirmation is OFF, we get a session immediately → go to onboarding
    if (data.session) {
      saveSession(data.session)
      router.replace('/onboarding')
    } else {
      // Email confirmation ON → ask them to verify
      setSent(true)
    }
  }

  async function google() {
    setLoading(true)
    const { error } = await signInWithGoogle()
    if (error) { setErr(error.message); setLoading(false) }
    // On success, Supabase redirects to /onboarding automatically
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FBF7F0', display: 'flex', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      {/* Left brand panel */}
      <div style={{ flex: 1, background: 'linear-gradient(150deg,#0A8754,#0d6e47)', color: '#fff', padding: '56px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} className="auth-brand">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', textDecoration: 'none' }}>
          <span style={{ fontSize: 26 }}>🤖</span>
          <span style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Fraunces',serif" }}>BizBot</span>
        </Link>
        <div>
          <h1 style={{ fontSize: 38, fontWeight: 700, lineHeight: 1.15, marginBottom: 16, fontFamily: "'Fraunces',serif" }}>Start your 30-day free trial</h1>
          <p style={{ fontSize: 17, opacity: 0.9, lineHeight: 1.6, maxWidth: 380 }}>Your AI WhatsApp assistant — answering customers, booking appointments, chasing payments. No credit card needed.</p>
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['Set up in 15 minutes', 'Works in Hindi, English & Hinglish', 'Cancel anytime'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>✓</span>{t}
              </div>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 13, opacity: 0.7 }}>Made in India 🇮🇳</p>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 44, marginBottom: 16 }}>📧</div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1A1410', marginBottom: 10, fontFamily: "'Fraunces',serif" }}>Check your email</h2>
              <p style={{ fontSize: 15, color: '#5C5248', lineHeight: 1.6 }}>We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then log in.</p>
              <Link href="/login" style={{ display: 'inline-block', marginTop: 24, color: '#0A8754', fontWeight: 600 }}>Go to login →</Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1A1410', marginBottom: 6, fontFamily: "'Fraunces',serif" }}>Create your account</h2>
              <p style={{ fontSize: 14, color: '#8A7E72', marginBottom: 28 }}>Already have one? <Link href="/login" style={{ color: '#0A8754', fontWeight: 600 }}>Log in</Link></p>

              <button onClick={google} disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0', color: '#B5ACA0', fontSize: 13 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.1)' }} /> or <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.1)' }} />
              </div>

              <label style={{ fontSize: 13, fontWeight: 600, color: '#1A1410', display: 'block', marginBottom: 6 }}>Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@business.com" style={inputStyle} />

              <label style={{ fontSize: 13, fontWeight: 600, color: '#1A1410', display: 'block', margin: '16px 0 6px' }}>Password</label>
              <input value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && signup()} type="password" placeholder="At least 6 characters" style={inputStyle} />

              {err && <p style={{ color: '#D93636', fontSize: 13, marginTop: 12 }}>{err}</p>}

              <button onClick={signup} disabled={loading} style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: '#0A8754', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 20, opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Creating account…' : 'Create account & start trial'}
              </button>
              <p style={{ fontSize: 12, color: '#8A7E72', textAlign: 'center', marginTop: 14 }}>By signing up you agree to our Terms & Privacy Policy</p>
            </>
          )}
        </div>
      </div>
      <style>{`@media(max-width:820px){.auth-brand{display:none!important}}`}</style>
    </div>
  )
}

const inputStyle: any = {
  width: '100%', padding: '12px 14px', borderRadius: 12,
  border: '1.5px solid rgba(0,0,0,0.12)', fontSize: 15, outline: 'none',
  fontFamily: 'inherit', background: '#fff', color: '#1A1410',
}