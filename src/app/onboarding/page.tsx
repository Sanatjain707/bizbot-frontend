'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getCurrentUser, destinationForUser, getAccessToken } from '@/lib/supabase'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

const TYPES = ['Beauty Salon', 'Coaching Centre', 'Clinic', 'Boutique', 'Yoga Studio', 'Spa', 'Gym', 'Other']

// Sensible starting hours so the AI has business hours from day one — the owner
// refines per-day in Settings.
const DEFAULT_HOURS = {
  mon: { open: '09:00', close: '20:00', closed: false },
  tue: { open: '09:00', close: '20:00', closed: false },
  wed: { open: '09:00', close: '20:00', closed: false },
  thu: { open: '09:00', close: '20:00', closed: false },
  fri: { open: '09:00', close: '20:00', closed: false },
  sat: { open: '09:00', close: '20:00', closed: false },
  sun: { open: '09:00', close: '20:00', closed: true },
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [authUser, setAuthUser] = useState<any>(null)
  const [data, setData] = useState({ name: '', type: 'Beauty Salon', owner_name: '', whatsapp_choice: 'managed', whatsapp_phone_id: '' })
  const [services, setServices] = useState<{ name: string; price: string }[]>([{ name: '', price: '' }])

  useEffect(() => {
    let done = false
    async function resolve(user: any) {
      if (done || !user) return
      done = true
      setAuthUser(user)
      const dest = await destinationForUser(user)
      if (dest === '/dashboard') router.replace('/dashboard')
    }
    getCurrentUser().then(user => { if (user) resolve(user) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { if (session?.user) resolve(session.user) })
    const t = setTimeout(async () => {
      if (!done) { const user = await getCurrentUser(); if (user) resolve(user); else router.replace('/signup') }
    }, 2500)
    return () => { sub.subscription.unsubscribe(); clearTimeout(t) }
  }, [router])

  function set(k: string, v: string) { setData(p => ({ ...p, [k]: v })) }
  function setService(i: number, k: 'name' | 'price', v: string) { setServices(p => p.map((s, idx) => idx === i ? { ...s, [k]: v } : s)) }
  function addService() { setServices(p => [...p, { name: '', price: '' }]) }
  function removeService(i: number) { setServices(p => p.filter((_, idx) => idx !== i)) }

  function next() {
    setErr('')
    if (step === 1 && (!data.name.trim() || !data.owner_name.trim())) { setErr('Please fill business name and your name'); return }
    setStep(step + 1)
  }

  async function finish() {
    if (saving) return
    setSaving(true); setErr('')
    localStorage.removeItem('bizId')
    try {
      const token = await getAccessToken()
      const authHeaders = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      const res = await fetch(`${BASE}/api/business/create`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: data.name, type: data.type, owner_name: data.owner_name,
          whatsapp_phone_id: data.whatsapp_choice === 'self' ? data.whatsapp_phone_id : null,
          auth_user_id: authUser?.id || null,
          email: authUser?.email || null,
        }),
      })
      const result = await res.json()
      if (!result?.id) { setErr(result.error || 'Could not create your business'); setSaving(false); return }

      // Seed services + default hours so the AI works from the first message.
      const services_list = services
        .filter(s => s.name.trim())
        .map(s => ({ name: s.name.trim(), price: Number(s.price) || 0, category: 'Services' }))
      try {
        await fetch(`${BASE}/api/business`, {
          method: 'PATCH',
          headers: { ...authHeaders, 'x-business-id': result.id },
          body: JSON.stringify({ services_list, business_hours: DEFAULT_HOURS }),
        })
      } catch (_) { /* non-fatal — they can add these in Settings */ }

      localStorage.setItem('bizId', result.id)
      router.replace('/dashboard')
      return
    } catch (e: any) {
      setErr(e.message || 'Something went wrong')
    }
    setSaving(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FBF7F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, justifyContent: 'center' }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: step >= n ? '#0A8754' : '#E5DDD5', color: step >= n ? '#fff' : '#8A7E72', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>{n}</div>
              {n < 3 && <div style={{ width: 32, height: 2, background: step > n ? '#0A8754' : '#E5DDD5' }} />}
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: 36, boxShadow: '0 12px 40px rgba(0,0,0,0.06)' }}>
          {step === 1 && (
            <>
              <h1 style={h1}>Tell us about your business</h1>
              <p style={sub}>Just the basics to get started.</p>
              <label style={lbl}>Business name *</label>
              <input value={data.name} onChange={e => set('name', e.target.value)} placeholder="Noah Wills Boutique" style={inp} />
              <label style={{ ...lbl, marginTop: 18 }}>Business type *</label>
              <select value={data.type} onChange={e => set('type', e.target.value)} style={inp}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <label style={{ ...lbl, marginTop: 18 }}>Your name *</label>
              <input value={data.owner_name} onChange={e => set('owner_name', e.target.value)} placeholder="Noah" style={inp} />
              {err && <p style={errStyle}>{err}</p>}
              <button onClick={next} style={btn}>Continue →</button>
            </>
          )}

          {step === 2 && (
            <>
              <h1 style={h1}>Your services</h1>
              <p style={sub}>Add a few with prices so BizBot can answer customers instantly. You can edit these anytime in Settings.</p>
              {services.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input value={s.name} onChange={e => setService(i, 'name', e.target.value)} placeholder="Facial" style={{ ...inp, flex: 1 }} />
                  <input value={s.price} onChange={e => setService(i, 'price', e.target.value.replace(/[^\d]/g, ''))} placeholder="4000" style={{ ...inp, width: 110 }} />
                  {services.length > 1 && (
                    <button onClick={() => removeService(i)} style={{ border: 'none', background: '#F0EBE4', borderRadius: 10, width: 42, cursor: 'pointer', color: '#8A7E72', fontSize: 16 }}>✕</button>
                  )}
                </div>
              ))}
              <button onClick={addService} style={{ background: 'none', border: 'none', color: '#0A8754', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '4px 0', marginTop: 2 }}>+ Add another</button>
              {err && <p style={errStyle}>{err}</p>}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setStep(1)} style={backBtn}>← Back</button>
                <button onClick={next} style={{ ...btn, flex: 1, marginTop: 0 }}>Continue →</button>
              </div>
              <button onClick={next} style={{ background: 'none', border: 'none', color: '#8A7E72', fontSize: 13, cursor: 'pointer', width: '100%', marginTop: 12 }}>Skip for now</button>
            </>
          )}

          {step === 3 && (
            <>
              <h1 style={h1}>Connect WhatsApp</h1>
              <p style={sub}>This is how BizBot talks to your customers.</p>
              <div onClick={() => set('whatsapp_choice', 'managed')} style={optCard(data.whatsapp_choice === 'managed')}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1A1410', marginBottom: 4 }}>✅ We&apos;ll set it up for you (recommended)</div>
                <div style={{ fontSize: 13, color: '#5C5248', lineHeight: 1.5 }}>Our team connects your WhatsApp number within 24 hours. You can explore the dashboard right away.</div>
              </div>
              <div onClick={() => set('whatsapp_choice', 'self')} style={optCard(data.whatsapp_choice === 'self')}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1A1410', marginBottom: 4 }}>🔧 I have my WhatsApp Phone Number ID</div>
                <div style={{ fontSize: 13, color: '#5C5248', lineHeight: 1.5 }}>Already set up with Meta? Enter your Phone Number ID to connect instantly.</div>
                {data.whatsapp_choice === 'self' && (
                  <input value={data.whatsapp_phone_id} onChange={e => set('whatsapp_phone_id', e.target.value)} placeholder="e.g. 123456789012345" style={{ ...inp, marginTop: 12 }} onClick={e => e.stopPropagation()} />
                )}
              </div>
              {err && <p style={errStyle}>{err}</p>}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setStep(2)} style={backBtn}>← Back</button>
                <button onClick={finish} disabled={saving} style={{ ...btn, flex: 1, marginTop: 0, opacity: saving ? 0.7 : 1 }}>{saving ? 'Setting up…' : 'Go to dashboard →'}</button>
              </div>
            </>
          )}
        </div>
        <p style={{ textAlign: 'center', fontSize: 13, color: '#8A7E72', marginTop: 18 }}>🎁 Your 30-day free trial starts now</p>
      </div>
    </div>
  )
}

const h1: any = { fontSize: 26, fontWeight: 700, color: '#1A1410', marginBottom: 6, fontFamily: "'Fraunces',serif" }
const sub: any = { fontSize: 14, color: '#8A7E72', marginBottom: 22 }
const lbl: any = { fontSize: 13, fontWeight: 600, color: '#1A1410', display: 'block', marginBottom: 6 }
const inp: any = { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.12)', fontSize: 15, outline: 'none', fontFamily: 'inherit', background: '#fff', color: '#1A1410' }
const btn: any = { width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: '#0A8754', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 24 }
const backBtn: any = { padding: '13px', borderRadius: 12, border: 'none', background: '#F0EBE4', color: '#1A1410', fontSize: 15, fontWeight: 700, cursor: 'pointer', flex: '0 0 auto', width: 100 }
const errStyle: any = { color: '#D93636', fontSize: 13, marginTop: 14 }
const optCard = (active: boolean): any => ({
  border: `2px solid ${active ? '#0A8754' : 'rgba(0,0,0,0.1)'}`,
  background: active ? 'rgba(10,135,84,0.04)' : '#fff',
  borderRadius: 14, padding: 16, marginBottom: 12, cursor: 'pointer', transition: 'all 0.15s',
})
