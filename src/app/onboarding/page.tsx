'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button, Input, Textarea, Select, showToast } from '@/components/ui'
import { Building2, Sparkles, Clock, Phone, Check, ArrowRight, ArrowLeft } from 'lucide-react'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState({
    name: '', type: 'Beauty Salon', owner_name: '',
    services: '', pricing: '',
    working_hours: '9am - 8pm, Monday to Saturday', location: '', upi_id: '',
    whatsapp_phone_id: '',
  })

  function set(k: string, v: string) { setData(p => ({ ...p, [k]: v })) }

  const steps = [
    { n: 1, label: 'Business', icon: Building2 },
    { n: 2, label: 'Services', icon: Sparkles },
    { n: 3, label: 'Hours',    icon: Clock },
    { n: 4, label: 'WhatsApp', icon: Phone },
  ]

  function next() {
    if (step === 1 && (!data.name || !data.owner_name)) { showToast('Fill business name and owner', 'error'); return }
    if (step === 2 && (!data.services || !data.pricing)) { showToast('Fill services and pricing', 'error'); return }
    setStep(s => Math.min(4, s + 1))
  }

  async function finish() {
    setSaving(true)
    try {
      const res = await fetch(`${BASE}/api/business/create`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      })
      const result = await res.json()
      if (result?.id) {
        localStorage.setItem('bizId', result.id)
        showToast('Business created! Welcome to BizBot 🎉', 'success')
        router.push('/dashboard')
      } else {
        showToast(result.error || 'Failed to create business', 'error')
      }
    } catch (e) {
      showToast('Something went wrong', 'error')
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-[#08090A] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00C57A] pulse-dot" />
            <span className="text-2xl font-bold text-[#E8EAED] font-[Syne]">BizBot</span>
          </div>
          <p className="text-[#5A6370] text-sm">Let's set up your business in 4 quick steps</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-8 px-4">
          {steps.map((s, i) => {
            const Icon = s.icon
            const done = step > s.n
            const active = step === s.n
            return (
              <div key={s.n} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${done ? 'bg-[#00C57A] text-black' : active ? 'bg-[rgba(0,197,122,0.15)] text-[#00C57A] border-2 border-[#00C57A]' : 'bg-[#141618] text-[#5A6370]'}`}>
                    {done ? <Check size={16} /> : <Icon size={15} />}
                  </div>
                  <span className={`text-xs ${active ? 'text-[#00C57A]' : 'text-[#5A6370]'}`}>{s.label}</span>
                </div>
                {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${done ? 'bg-[#00C57A]' : 'bg-[#1A1D20]'}`} />}
              </div>
            )
          })}
        </div>

        <Card className="p-6">
          {step === 1 && (
            <div className="animate-in space-y-4">
              <h2 className="text-base font-semibold text-[#E8EAED] mb-2">Tell us about your business</h2>
              <Input label="Business Name *" value={data.name} onChange={(e: any) => set('name', e.target.value)} placeholder="Priya Beauty Parlour" />
              <Select label="Business Type" value={data.type} onChange={(e: any) => set('type', e.target.value)} options={[{value:'Beauty Salon',label:'Beauty Salon'},{value:'Coaching Centre',label:'Coaching Centre'},{value:'Yoga Studio',label:'Yoga Studio'},{value:'Clinic',label:'Clinic'},{value:'Home Service',label:'Home Service'},{value:'Other',label:'Other'}]} />
              <Input label="Owner Name *" value={data.owner_name} onChange={(e: any) => set('owner_name', e.target.value)} placeholder="Priya Sharma" />
            </div>
          )}
          {step === 2 && (
            <div className="animate-in space-y-4">
              <h2 className="text-base font-semibold text-[#E8EAED] mb-2">Your services & pricing</h2>
              <Input label="Services Offered *" value={data.services} onChange={(e: any) => set('services', e.target.value)} placeholder="Facial, Haircut, Manicure, Pedicure" hint="What you offer — AI uses this to answer customers" />
              <Textarea label="Price List *" value={data.pricing} onChange={(e: any) => set('pricing', e.target.value)} placeholder="Facial ₹800, Haircut ₹300, Manicure ₹500" hint="AI quotes these exact prices" />
            </div>
          )}
          {step === 3 && (
            <div className="animate-in space-y-4">
              <h2 className="text-base font-semibold text-[#E8EAED] mb-2">Hours, location & payment</h2>
              <Input label="Working Hours" value={data.working_hours} onChange={(e: any) => set('working_hours', e.target.value)} />
              <Textarea label="Address" value={data.location} onChange={(e: any) => set('location', e.target.value)} rows={2} placeholder="Shop 12, Lajpat Nagar, New Delhi" />
              <Input label="UPI ID" value={data.upi_id} onChange={(e: any) => set('upi_id', e.target.value)} placeholder="yourname@upi" hint="For collecting payments" />
            </div>
          )}
          {step === 4 && (
            <div className="animate-in space-y-4">
              <h2 className="text-base font-semibold text-[#E8EAED] mb-2">Connect WhatsApp</h2>
              <Input label="WhatsApp Phone Number ID *" value={data.whatsapp_phone_id} onChange={(e: any) => set('whatsapp_phone_id', e.target.value)} placeholder="From Meta Developer dashboard" hint="Meta Developer → WhatsApp → API Setup → Phone number ID" />
              <div className="bg-[#141618] rounded-xl p-4 text-xs text-[#9AA0AB] leading-relaxed">
                <p className="font-medium text-[#E8EAED] mb-2">How to get your Phone Number ID:</p>
                1. Go to developers.facebook.com<br />
                2. Your app → WhatsApp → API Setup<br />
                3. Copy the "Phone number ID" value<br />
                4. Paste it above
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[rgba(255,255,255,0.06)]">
            {step > 1 ? (
              <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => setStep(s => s - 1)}>Back</Button>
            ) : <div />}
            {step < 4 ? (
              <Button size="sm" onClick={next}>Next <ArrowRight size={14} /></Button>
            ) : (
              <Button size="sm" loading={saving} onClick={finish}>Finish Setup 🎉</Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
