'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  signInWithEmail, signInWithGoogle, resetPassword,
  signInWithPhone, verifyOtp, saveSession, destinationForUser
} from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'email' | 'phone'>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')

  // If already fully set up (has a business), skip straight to dashboard.
  // Otherwise show the login form normally. Cancel flag stops the redirect
  // from firing after the user unmounts (e.g. by clicking a link).
  useEffect(() => {
    let cancelled = false
    // Friendly notice when the dashboard signed us out for inactivity.
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('reason') === 'idle') {
      setInfo("You've been signed out due to inactivity. Please sign in again.")
    }
    destinationForUser().then(dest => {
      if (!cancelled && dest === '/dashboard') router.replace('/dashboard')
    })
    return () => { cancelled = true }
  }, [])

  async function emailLogin() {
    if (!email.includes('@')) { setErr('Enter a valid email'); return }
    setErr(''); setLoading(true)
    const { data, error } = await signInWithEmail(email, password)
    if (error || !data.session) { setLoading(false); setErr(error?.message || 'Login failed'); return }
    saveSession(data.session)
    const dest = await destinationForUser(data.session.user)
    router.replace(dest)
  }

  async function google() {
    setLoading(true)
    const { error } = await signInWithGoogle()
    if (error) { setErr(error.message); setLoading(false) }
  }

  async function forgot() {
    if (!email.includes('@')) { setErr('Enter your email first'); return }
    const { error } = await resetPassword(email)
    if (error) setErr(error.message)
    else setInfo('Password reset link sent to your email.')
  }

  async function sendOtp() {
    if (phone.length < 10) { setErr('Enter a valid 10-digit number'); return }
    setErr(''); setLoading(true)
    const { error } = await signInWithPhone(phone)
    setLoading(false)
    if (error) setErr(error.message)
    else setOtpSent(true)
  }

  async function verify() {
    if (otp.length < 4) { setErr('Enter the OTP'); return }
    setErr(''); setLoading(true)
    const { data, error } = await verifyOtp(phone, otp)
    if (error || !data?.session) { setLoading(false); setErr(error?.message || 'Invalid OTP'); return }
    saveSession(data.session)
    const dest = await destinationForUser(data.session.user)
    router.replace(dest)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FBF7F0', display: 'flex', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ flex: 1, background: 'linear-gradient(150deg,#0A8754,#0d6e47)', color: '#fff', padding: '56px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} className="auth-brand">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', textDecoration: 'none' }}>
          <span style={{ fontSize: 26 }}>🤖</span>
          <span style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Fraunces',serif" }}>BizBot</span>
        </Link>
        <div>
          <h1 style={{ fontSize: 38, fontWeight: 700, lineHeight: 1.15, marginBottom: 16, fontFamily: "'Fraunces',serif" }}>Welcome back</h1>
          <p style={{ fontSize: 17, opacity: 0.9, lineHeight: 1.6, maxWidth: 380 }}>Your AI assistant has been busy. Log in to see your conversations, bookings, and payments.</p>
        </div>
        <p style={{ fontSize: 13, opacity: 0.7 }}>Made in India 🇮🇳</p>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1A1410', marginBottom: 6, fontFamily: "'Fraunces',serif" }}>Log in to BizBot</h2>
          <p style={{ fontSize: 14, color: '#8A7E72', marginBottom: 28 }}>New here? <Link href="/signup" style={{ color: '#0A8754', fontWeight: 600 }}>Create an account</Link></p>

          <button onClick={google} disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0', color: '#B5ACA0', fontSize: 13 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.1)' }} /> or <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.1)' }} />
          </div>

          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, background: '#F0EBE4', padding: 4, borderRadius: 10 }}>
            {(['email', 'phone'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setErr(''); setInfo('') }} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, background: mode === m ? '#fff' : 'transparent', color: mode === m ? '#0A8754' : '#8A7E72' }}>
                {m === 'email' ? 'Email' : 'Phone OTP'}
              </button>
            ))}
          </div>

          {mode === 'email' ? (
            <>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@business.com" style={inputStyle} />
              <input value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && emailLogin()} type="password" placeholder="Password" style={{ ...inputStyle, marginTop: 12 }} />
              <button onClick={forgot} style={{ background: 'none', border: 'none', color: '#0A8754', fontSize: 13, cursor: 'pointer', marginTop: 10, padding: 0 }}>Forgot password?</button>
              <button onClick={emailLogin} disabled={loading} style={primaryBtn(loading)}>{loading ? 'Logging in…' : 'Log in'}</button>
            </>
          ) : (
            <>
              {!otpSent ? (
                <>
                  <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="10-digit mobile number" maxLength={10} style={inputStyle} />
                  <button onClick={sendOtp} disabled={loading} style={primaryBtn(loading)}>{loading ? 'Sending…' : 'Send OTP'}</button>
                </>
              ) : (
                <>
                  <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="Enter OTP" maxLength={6} style={inputStyle} />
                  <button onClick={verify} disabled={loading} style={primaryBtn(loading)}>{loading ? 'Verifying…' : 'Verify & log in'}</button>
                  <button onClick={() => setOtpSent(false)} style={{ background: 'none', border: 'none', color: '#8A7E72', fontSize: 13, cursor: 'pointer', marginTop: 10 }}>← Change number</button>
                </>
              )}
            </>
          )}

          {err && <p style={{ color: '#D93636', fontSize: 13, marginTop: 12 }}>{err}</p>}
          {info && <p style={{ color: '#0A8754', fontSize: 13, marginTop: 12 }}>{info}</p>}
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
const primaryBtn = (loading: boolean): any => ({
  width: '100%', padding: '13px', borderRadius: 12, border: 'none',
  background: '#0A8754', color: '#fff', fontSize: 15, fontWeight: 700,
  cursor: 'pointer', marginTop: 16, opacity: loading ? 0.7 : 1,
})