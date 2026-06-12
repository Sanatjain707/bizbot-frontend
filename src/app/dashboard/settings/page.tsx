'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Save, Bot, Clock, CreditCard, Phone } from 'lucide-react'

const inp = "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-emerald-500/50 transition-colors"
const ta  = "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-emerald-500/50 transition-colors resize-none"

function Section({ title, icon: Icon, children }: any) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800">
        <Icon size={14} className="text-emerald-400" />
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Field({ label, hint, children }: any) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-zinc-600 mt-1.5">{hint}</p>}
    </div>
  )
}

export default function SettingsPage() {
  const [biz,    setBiz]    = useState<any>({})
  const [loading,setLoading]= useState(true)
  const [saving, setSaving] = useState(false)
  const [toast,  setToast]  = useState('')

  useEffect(() => {
    api.getBusiness().then(({data}) => { if(data) setBiz(data); setLoading(false) })
  }, [])

  const set = (k: string, v: string) => setBiz((p: any) => ({...p, [k]: v}))

  async function save() {
    setSaving(true)
    const {error} = await api.updateBusiness(biz)
    setToast(error ? 'Failed to save — try again' : '✓ Settings saved!')
    setTimeout(() => setToast(''), 3000)
    setSaving(false)
  }

  if (loading) return <div className="text-center py-20 text-zinc-600 text-sm">Loading settings...</div>

  return (
    <div className="animate-in max-w-2xl">
      {toast && (
        <div className={`fixed bottom-6 right-6 text-sm font-medium px-4 py-2.5 rounded-xl z-50 animate-in shadow-lg ${toast.startsWith('✓')?'bg-emerald-500 text-black':'bg-red-500 text-white'}`}>
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white mb-1">Settings</h1>
          <p className="text-sm text-zinc-500">Configure your business and AI agent</p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
          <Save size={14} />{saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <Section title="Business Information" icon={Bot}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Business Name">
            <input className={inp} value={biz.name||''} onChange={e=>set('name',e.target.value)} placeholder="Priya Beauty Parlour" />
          </Field>
          <Field label="Business Type">
            <select className={inp} value={biz.type||''} onChange={e=>set('type',e.target.value)}>
              <option value="">Select type</option>
              {['Beauty Salon','Coaching Centre','Yoga Studio','Clinic','Home Service','Tailor','Fitness Centre','Other'].map(t=>(
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Owner Name">
            <input className={inp} value={biz.owner_name||''} onChange={e=>set('owner_name',e.target.value)} placeholder="Your name" />
          </Field>
        </div>
        <Field label="Services Offered" hint="BizBot uses this to answer 'what services do you offer?'">
          <input className={inp} value={biz.services||''} onChange={e=>set('services',e.target.value)} placeholder="Facial, Haircut, Manicure, Pedicure, Threading" />
        </Field>
      </Section>

      <Section title="Pricing & Payments" icon={CreditCard}>
        <Field label="Price List" hint="Format: Service ₹Price — AI quotes these exactly to customers">
          <textarea className={ta} rows={3} value={biz.pricing||''} onChange={e=>set('pricing',e.target.value)}
            placeholder="Facial ₹800, Haircut ₹300, Manicure ₹500, Threading ₹50" />
        </Field>
        <Field label="UPI ID" hint="AI sends this when customers ask how to pay">
          <input className={inp} value={biz.upi_id||''} onChange={e=>set('upi_id',e.target.value)} placeholder="yourname@upi" />
        </Field>
      </Section>

      <Section title="Hours & Location" icon={Clock}>
        <Field label="Working Hours" hint="Shared when customers ask about timings">
          <input className={inp} value={biz.working_hours||''} onChange={e=>set('working_hours',e.target.value)} placeholder="9am - 8pm, Monday to Saturday" />
        </Field>
        <Field label="Address" hint="Shared when customers ask for directions">
          <textarea className={ta} rows={2} value={biz.location||''} onChange={e=>set('location',e.target.value)}
            placeholder="Shop 12, Green Market, Lajpat Nagar, New Delhi - 110024" />
        </Field>
      </Section>

      <Section title="WhatsApp Connection" icon={Phone}>
        <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 pulse flex-shrink-0" />
          <div>
            <p className="text-sm text-white font-medium">WhatsApp number connected</p>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">Phone ID: {biz.whatsapp_phone_id || 'Not configured'}</p>
          </div>
        </div>
        <p className="text-xs text-zinc-600 mt-3">To change your WhatsApp number, update WHATSAPP_PHONE_ID in backend .env and restart the server.</p>
      </Section>
    </div>
  )
}
