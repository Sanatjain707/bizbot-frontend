'use client'
import { useState } from 'react'
import { signInWithPhone, verifyOtp, saveSession } from '@/lib/supabase'
import { Button, Input } from '@/components/ui'

export default function LoginPage() {
  const [step,  setStep]  = useState<'phone' | 'otp' | 'loading'>('phone')
  const [phone, setPhone] = useState('')
  const [otp,   setOtp]   = useState('')
  const [err,   setErr]   = useState('')

  async function send() {
    if (phone.length < 10) { setErr('Enter a valid 10-digit number'); return }
    setErr(''); setStep('loading')
    const { error } = await signInWithPhone(phone)
    if (error) { setErr(error.message); setStep('phone') } else setStep('otp')
  }

  async function verify() {
    if (otp.length < 4) { setErr('Enter the OTP'); return }
    setErr(''); setStep('loading')
    const { data, error } = await verifyOtp(phone, otp)
    if (error || !data?.session) { setErr(error?.message || 'Invalid OTP. Use 999999 for test.'); setStep('otp'); return }
    saveSession(data.session)
    window.location.replace('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#08090A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00C57A] pulse-dot" />
            <span className="text-2xl font-bold text-[#E8EAED] font-[Syne]">BizBot</span>
          </div>
          <p className="text-[#5A6370] text-sm">Sign in to your dashboard</p>
        </div>

        <div className="bg-[#0F1012] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
          {step === 'phone' && (
            <div className="animate-in space-y-4">
              <Input label="Mobile number" value={phone} onChange={(e: any) => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="9876543210" type="tel" error={err} />
              <Button onClick={send} className="w-full">Send OTP →</Button>
              <p className="text-center text-xs text-[#5A6370]">Test: <span className="font-mono">8505830571</span> → OTP <span className="font-mono">999999</span></p>
            </div>
          )}
          {step === 'otp' && (
            <div className="animate-in space-y-4">
              <p className="text-sm text-[#9AA0AB]">OTP sent to <span className="text-[#E8EAED] font-medium">+91 {phone}</span></p>
              <Input label="Enter OTP" value={otp} onChange={(e: any) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="999999" error={err} />
              <Button onClick={verify} className="w-full">Verify & Sign In</Button>
              <button onClick={() => { setStep('phone'); setOtp(''); setErr('') }} className="w-full text-[#5A6370] text-sm hover:text-[#9AA0AB]">← Change number</button>
            </div>
          )}
          {step === 'loading' && (
            <div className="text-center py-6 flex items-center justify-center gap-2 text-[#9AA0AB] text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C57A] pulse-dot" /> Please wait...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
