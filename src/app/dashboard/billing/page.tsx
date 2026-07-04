'use client'
import { useEffect, useState } from 'react'
import { Card, Button, Badge, showToast, Skeleton } from '@/components/ui'
import { Check, Zap, Crown, Rocket, CreditCard, RefreshCw, Calendar } from 'lucide-react'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const bizId = () => (typeof window !== 'undefined' ? localStorage.getItem('bizId') || '' : '')

// Poll a few times waiting for the layout's by-user resolver to populate bizId
// (fresh OAuth landings hit this page before the layout finishes).
async function waitForBizId(maxMs = 3000): Promise<string> {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    const id = bizId()
    if (id) return id
    await new Promise(r => setTimeout(r, 100))
  }
  return ''
}

// Per-plan visual — icon + accent colour. Longer commitment = "premium" feel.
const PLAN_META: any = {
  quarterly:   { icon: Zap,    color: '#4D9EFF', accent: 'rgba(77,158,255,0.1)' },
  half_yearly: { icon: Rocket, color: '#00C57A', accent: 'rgba(0,197,122,0.1)', popular: true },
  annual:      { icon: Crown,  color: '#FFA040', accent: 'rgba(255,160,64,0.1)' },
}
const PLAN_ORDER = ['quarterly', 'half_yearly', 'annual']

export default function BillingPage() {
  const [plans,   setPlans]   = useState<any>({})
  const [current, setCurrent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mode,    setMode]    = useState<'subscription' | 'one_time'>('subscription')
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    // Cancel flag stops the polling loop firing toasts / setState after the
    // user navigates away.
    let cancelled = false

    async function pollStatus() {
      for (let i = 0; i < 6; i++) {
        await new Promise(r => setTimeout(r, 2500))
        if (cancelled) return
        try {
          const id = await waitForBizId()
          if (!id) continue
          const res  = await fetch(`${BASE}/api/billing/status`, { headers: { 'x-business-id': id } })
          if (cancelled) return
          const data = await res.json()
          if (data.active) {
            showToast('Plan activated! 🎉', 'success')
            if (!cancelled) load()
            return
          }
        } catch (_) {}
      }
      if (!cancelled) load()
    }

    async function bootstrap() {
      const params = new URLSearchParams(window.location.search)
      if (params.get('status') === 'success') {
        showToast('Payment successful! Activating your plan...', 'success')
        window.history.replaceState({}, '', '/dashboard/billing')
        pollStatus()
      }
      // Wait for the layout's by-user resolver to write bizId before fetching
      // plans — fresh OAuth land can hit this page before that finishes.
      await waitForBizId()
      if (!cancelled) load()
    }

    bootstrap()
    return () => { cancelled = true }
  }, [])

  async function load() {
    try {
      const id = bizId()
      if (!id) { setLoading(false); return }
      const res  = await fetch(`${BASE}/api/billing/plans`, { headers: { 'x-business-id': id } })
      const data = await res.json()
      setPlans(data.plans || {})
      setCurrent(data.current || null)
    } catch (e) {
      showToast('Failed to load plans', 'error')
    }
    setLoading(false)
  }

  async function checkout(planKey: string) {
    setProcessing(planKey)
    try {
      const res = await fetch(`${BASE}/api/billing/checkout`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-business-id': bizId() },
        body:    JSON.stringify({ plan: planKey, mode }),
      })
      const data = await res.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl  // redirect to Razorpay
      } else {
        showToast(data.error || 'Checkout failed', 'error')
      }
    } catch (e) {
      showToast('Could not start checkout', 'error')
    }
    setProcessing(null)
  }

  const planKeys = PLAN_ORDER
  const isActive = current?.active
  const currentPlan = current?.plan
  const currentPlanLabel = currentPlan && plans[currentPlan]?.name ? plans[currentPlan].name : currentPlan

  function daysLeft() {
    if (!current?.expiresAt) return 0
    return Math.max(0, Math.ceil((new Date(current.expiresAt).getTime() - Date.now()) / 86400000))
  }

  return (
    <div className="animate-up max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#E8EAED] mb-1 font-[Syne]">Plans & Billing</h1>
        <p className="text-sm text-[#5A6370]">Choose a plan or renew your subscription</p>
      </div>

      {/* Current plan status */}
      {loading ? (
        <Skeleton className="h-20 w-full mb-6" />
      ) : isActive ? (
        <Card className="p-5 mb-6 bg-gradient-to-r from-[rgba(0,197,122,0.08)] to-transparent border-[rgba(0,197,122,0.2)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[rgba(0,197,122,0.15)] flex items-center justify-center"><Check size={18} className="text-[#00C57A]" /></div>
              <div>
                <p className="text-sm font-semibold text-[#E8EAED]">You're on the <span className="text-[#00C57A]">{currentPlanLabel}</span> plan</p>
                <p className="text-xs text-[#5A6370] flex items-center gap-1.5 mt-0.5"><Calendar size={11} /> {daysLeft()} days left · renews {new Date(current.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
              </div>
            </div>
            <Badge variant="green">Active</Badge>
          </div>
        </Card>
      ) : (
        <Card className="p-5 mb-6 bg-gradient-to-r from-[rgba(255,160,64,0.08)] to-transparent border-[rgba(255,160,64,0.2)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(255,160,64,0.15)] flex items-center justify-center"><CreditCard size={18} className="text-[#FFA040]" /></div>
            <div>
              <p className="text-sm font-semibold text-[#E8EAED]">No active plan</p>
              <p className="text-xs text-[#5A6370]">Choose a plan below to activate BizBot</p>
            </div>
          </div>
        </Card>
      )}

      {/* Billing mode toggle */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="inline-flex p-1 bg-[#141618] rounded-xl border border-[rgba(255,255,255,0.06)]">
          <button onClick={() => setMode('subscription')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${mode === 'subscription' ? 'bg-[#00C57A] text-black' : 'text-[#9AA0AB]'}`}>
            <RefreshCw size={12} /> Auto-renew
          </button>
          <button onClick={() => setMode('one_time')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${mode === 'one_time' ? 'bg-[#00C57A] text-black' : 'text-[#9AA0AB]'}`}>
            <CreditCard size={12} /> One-time payment
          </button>
        </div>
      </div>

      {/* Plans */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-80 w-full" />)}</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {planKeys.map(key => {
            const plan = plans[key]
            const meta = PLAN_META[key]
            if (!plan) return null
            const Icon = meta.icon
            const popular = plan.popular ?? meta.popular
            const isCurrent = currentPlan === key && isActive
            return (
              <Card key={key} className={`p-5 relative ${popular ? 'border-[#00C57A]' : ''}`}>
                {popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#00C57A] text-black text-xs font-bold px-3 py-0.5 rounded-full">POPULAR</div>
                )}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: meta.accent }}>
                  <Icon size={18} style={{ color: meta.color }} />
                </div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-[#E8EAED]">{plan.name}</p>
                  {plan.savingsPct > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: meta.accent, color: meta.color }}>
                      Save {plan.savingsPct}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#5A6370] mb-3">{plan.tagline || `${plan.months} months`}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#E8EAED] font-[Syne]">₹{plan.price.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-[#5A6370]">/ {plan.months} months</span>
                </div>
                <p className="text-xs text-[#5A6370] mt-1 mb-4">≈ ₹{plan.effectiveMonthly?.toLocaleString('en-IN')} per month</p>
                <div className="space-y-2 mb-5">
                  {plan.features.map((f: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check size={13} className="text-[#00C57A] mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-[#9AA0AB]">{f}</span>
                    </div>
                  ))}
                </div>
                {isCurrent ? (
                  <Button variant="secondary" size="sm" className="w-full" disabled>Current Plan</Button>
                ) : (
                  <Button
                    variant={popular ? 'primary' : 'outline'}
                    size="sm" className="w-full"
                    loading={processing === key}
                    onClick={() => checkout(key)}>
                    {currentPlan && currentPlan !== 'none' ? 'Switch Plan' : 'Get Started'}
                  </Button>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Note */}
      <p className="text-center text-xs text-[#5A6370] mt-6">
        {mode === 'subscription'
          ? 'Auto-renews at the end of each plan period. Cancel anytime from Razorpay.'
          : 'Pay upfront for the full plan period. Renew manually when it expires.'}
        {' '}Message costs (Meta rates) billed separately.
      </p>
    </div>
  )
}