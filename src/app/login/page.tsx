'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
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

export default function LoginPage() {
  const [step,  setStep]  = useState<'phone' | 'otp' | 'loading' | 'success'>('phone')
  const [phone, setPhone] = useState('')
  const [otp,   setOtp]   = useState('')
  const [err,   setErr]   = useState('')

  async function sendOtp() {
    if (phone.length < 10) { setErr('Enter a valid 10-digit number'); return }
    setErr(''); setStep('loading')
    const formatted = `+91${phone}`
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted })
    if (error) { setErr(error.message); setStep('phone') }
    else setStep('otp')
  }

  async function verify() {
    if (otp.length < 4) { setErr('Enter the OTP'); return }
    setErr(''); setStep('loading')

    const formatted = `+91${phone}`
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formatted,
      token: otp,
      type: 'sms',
    })

    if (error || !data?.session) {
      setErr(error?.message || 'Invalid OTP. Use 999999 for test number.')
      setStep('otp')
      return
    }

    // ✅ Manually store session so dashboard can read it
    localStorage.setItem('bizbot-session', JSON.stringify({
      access_token:  data.session.access_token,
      refresh_token: data.session.refresh_token,
      user:          data.session.user,
      expires_at:    data.session.expires_at,
    }))

    setStep('success')
    // Hard redirect — full page load so localStorage is available
    setTimeout(() => { window.location.replace('/dashboard') }, 300)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 pulse" />
            <span className="text-2xl font-bold text-white">BizBot</span>
          </div>
          <p className="text-zinc-500 text-sm">Sign in to your dashboard</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

          {step === 'phone' && (
            <div className="animate-in">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Mobile number</label>
              <div className="flex items-center bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden focus-within:border-emerald-500 transition-colors mb-4">
                <span className="px-3 text-zinc-400 text-sm border-r border-zinc-700 py-3 select-none">+91</span>
                <input type="tel" maxLength={10} value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g,''))}
                  onKeyDown={e => e.key==='Enter' && sendOtp()}
                  placeholder="9876543210" autoFocus
                  className="flex-1 bg-transparent px-3 py-3 text-white text-sm outline-none placeholder:text-zinc-600" />
              </div>
              {err && <p className="text-red-400 text-xs mb-3 bg-red-500/10 px-3 py-2 rounded-lg">{err}</p>}
              <button onClick={sendOtp}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-2.5 rounded-xl text-sm transition-colors">
                Send OTP →
              </button>
              <p className="text-center text-xs text-zinc-600 mt-3">
                Test: <span className="text-zinc-500 font-mono">8505830571</span> → OTP: <span className="text-zinc-500 font-mono">999999</span>
              </p>
            </div>
          )}

          {step === 'otp' && (
            <div className="animate-in">
              <p className="text-sm text-zinc-400 mb-1">OTP sent to <span className="text-white font-medium">+91 {phone}</span></p>
              <p className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg mb-3">
                Using test number? Enter <strong>999999</strong>
              </p>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 mt-3">Enter OTP</label>
              <input type="text" maxLength={6} value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g,''))}
                onKeyDown={e => e.key==='Enter' && verify()}
                placeholder="999999" autoFocus
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-center text-xl font-mono tracking-widest outline-none focus:border-emerald-500 mb-4" />
              {err && <p className="text-red-400 text-xs mb-3 bg-red-500/10 px-3 py-2 rounded-lg">{err}</p>}
              <button onClick={verify}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-2.5 rounded-xl text-sm transition-colors mb-3">
                Verify & Sign In
              </button>
              <button onClick={() => { setStep('phone'); setOtp(''); setErr('') }}
                className="w-full text-zinc-500 text-sm hover:text-zinc-300 transition-colors">
                ← Change number
              </button>
            </div>
          )}

          {(step === 'loading' || step === 'success') && (
            <div className="text-center py-6">
              <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse" />
                {step === 'success' ? 'Login successful! Redirecting...' : 'Please wait...'}
              </div>
              {step === 'success' && (
                <p className="text-xs text-emerald-500">Taking you to your dashboard</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
