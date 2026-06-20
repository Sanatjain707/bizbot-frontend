'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, Button, Input, Textarea, Select, Badge, showToast, Divider } from '@/components/ui'
import ServicesManager from '@/components/dashboard/ServicesManager'
import HoursLocation from '@/components/dashboard/HoursLocation'
import { Save, Bot, Clock, CreditCard, Phone, Building2, Sparkles } from 'lucide-react'

export default function SettingsPage() {
  const [biz,     setBiz]     = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    async function loadSettings() {
      // Try the normal way first (uses bizId header)
      let { data } = await api.getBusiness()
      // Fallback: if that's empty, resolve via the logged-in user (same as layout)
      if (!data?.id) {
        try {
          const { getCurrentUser } = await import('@/lib/supabase')
          const user = await getCurrentUser()
          if (user) {
            const params = new URLSearchParams()
            if (user.id) params.set('auth_user_id', user.id)
            if (user.email) params.set('email', user.email)
            const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
            const res = await fetch(`${base}/api/business/by-user?${params.toString()}`)
            const j = await res.json()
            if (j.business?.id) {
              localStorage.setItem('bizId', j.business.id)
              data = j.business
            }
          }
        } catch (_) {}
      }
      if (data) setBiz(data)
      setLoading(false)
    }
    loadSettings()
  }, [])

  function set(k: string, v: any) { setBiz((p: any) => ({ ...p, [k]: v })) }

  async function save() {
    setSaving(true)
    const { error } = await api.updateBusiness(biz)
    showToast(error ? 'Failed to save' : 'Settings saved', error ? 'error' : 'success')
    setSaving(false)
    if (!error) {
      // Tell the layout/sidebar to re-fetch so the new name & details show immediately
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('biz-updated'))
    }
  }

  if (loading) return <div className="text-center py-20 text-[#5A6370] text-sm">Loading settings...</div>

  return (
    <div className="animate-up max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-bold text-[#E8EAED] mb-1 font-[Syne]">Settings</h1><p className="text-sm text-[#5A6370]">Configure your business and AI</p></div>
        <Button icon={Save} onClick={save} loading={saving}>Save Changes</Button>
      </div>

      {/* Business Info */}
      <Card className="p-5 mb-4">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[rgba(255,255,255,0.06)]"><Building2 size={15} className="text-[#00C57A]" /><h2 className="text-sm font-semibold text-[#E8EAED]">Business Information</h2></div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Business Name" value={biz.name || ''} onChange={(e: any) => set('name', e.target.value)} placeholder="Priya Beauty Parlour" />
          <Select label="Business Type" value={biz.type || ''} onChange={(e: any) => set('type', e.target.value)} options={[{value:'',label:'Select'},{value:'Beauty Salon',label:'Beauty Salon'},{value:'Coaching Centre',label:'Coaching Centre'},{value:'Yoga Studio',label:'Yoga Studio'},{value:'Clinic',label:'Clinic'},{value:'Home Service',label:'Home Service'},{value:'Other',label:'Other'}]} />
          <Input label="Owner Name" value={biz.owner_name || ''} onChange={(e: any) => set('owner_name', e.target.value)} placeholder="Priya Sharma" className="col-span-2" />
        </div>
      </Card>

      {/* Services table */}
      <ServicesManager services={biz.services_list || []} onChange={(list) => set('services_list', list as any)} />

      {/* Payment */}
      <Card className="p-5 mb-4">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[rgba(255,255,255,0.06)]"><CreditCard size={15} className="text-[#FFA040]" /><h2 className="text-sm font-semibold text-[#E8EAED]">Payment</h2></div>
        <div className="space-y-4">
          <Input label="UPI ID" value={biz.upi_id || ''} onChange={(e: any) => set('upi_id', e.target.value)} placeholder="yourname@upi" hint="Shared when customers ask how to pay" />
          <Input label="Payment reminder after (days)" type="number" value={biz.payment_reminder_days ?? 3} onChange={(e: any) => set('payment_reminder_days', e.target.value)} placeholder="3" hint="Send a polite payment reminder this many days after it's due" />
        </div>
      </Card>

      {/* Hours & Location */}
      <HoursLocation biz={biz} set={set} />

      {/* AI Personality */}
      <Card className="p-5 mb-4">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[rgba(255,255,255,0.06)]"><Sparkles size={15} className="text-[#A87EFF]" /><h2 className="text-sm font-semibold text-[#E8EAED]">AI Personality</h2></div>
        <div className="space-y-4">
          <Select label="Tone" value={biz.ai_tone || 'friendly'} onChange={(e: any) => set('ai_tone', e.target.value)} options={[{value:'friendly',label:'Friendly & Warm'},{value:'formal',label:'Formal & Professional'},{value:'casual',label:'Casual Hinglish'}]} />
          <Textarea label="Custom Instructions (optional)" value={biz.ai_instructions || ''} onChange={(e: any) => set('ai_instructions', e.target.value)} placeholder="e.g. Always mention our Sunday discount. Never promise same-day delivery." hint="Extra rules for the AI to follow" />
        </div>
      </Card>

      {/* WhatsApp Connection */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[rgba(255,255,255,0.06)]"><Phone size={15} className="text-[#00C57A]" /><h2 className="text-sm font-semibold text-[#E8EAED]">WhatsApp Connection</h2></div>
        <div className="flex items-center gap-3 p-3 bg-[#141618] rounded-xl mb-4">
          <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: biz.whatsapp_phone_id ? '#00C57A' : '#FFA040' }} />
          <div className="flex-1">
            <p className="text-sm text-[#E8EAED] font-medium">{biz.whatsapp_phone_id ? 'Connected' : 'Not connected yet'}</p>
            <p className="text-xs text-[#5A6370]">{biz.whatsapp_phone_id ? 'BizBot is live on your WhatsApp' : 'Add your Phone Number ID below, or we\'ll connect it for you within 24h'}</p>
          </div>
          <Badge variant={biz.whatsapp_phone_id ? 'green' : 'amber'}>{biz.whatsapp_phone_id ? 'Active' : 'Pending'}</Badge>
        </div>
        <Input label="WhatsApp Phone Number ID" value={biz.whatsapp_phone_id || ''} onChange={(e: any) => set('whatsapp_phone_id', e.target.value)} placeholder="e.g. 123456789012345" hint="From Meta → WhatsApp → API Setup. Leave blank if you want us to set it up." />
      </Card>
    </div>
  )
}