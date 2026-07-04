'use client'
import { useEffect, useState, createContext, useContext } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

type PlanState = {
  state: 'trial' | 'paid' | 'expired' | 'loading'
  daysLeft: number
  plan: string
  wabaStatus: string
}

const PlanContext = createContext<PlanState>({ state: 'loading', daysLeft: 0, plan: '', wabaStatus: 'pending' })
export const usePlan = () => useContext(PlanContext)

export function PlanProvider({ children }: { children: any }) {
  const [plan, setPlan] = useState<PlanState>({ state: 'loading', daysLeft: 0, plan: '', wabaStatus: 'pending' })

  async function load() {
    try {
      const bizId = typeof window !== 'undefined' ? localStorage.getItem('bizId') : null
      if (!bizId) return
      const res = await fetch(`${API}/api/business/plan-status`, { headers: { 'x-business-id': bizId } })
      const d = await res.json()
      if (d.state) setPlan({ state: d.state, daysLeft: d.daysLeft, plan: d.plan, wabaStatus: d.wabaStatus })
    } catch (_) {}
  }
  useEffect(() => {
    let cancelled = false
    async function loadWhenReady() {
      // First-page-load races: the layout writes bizId AFTER by-user resolves;
      // banner mount can beat it. Retry until bizId is set (or the layout
      // dispatches biz-updated) so the banner appears on time, not 60s later.
      for (let i = 0; i < 30; i++) {
        if (cancelled) return
        if (localStorage.getItem('bizId')) { await load(); return }
        await new Promise(r => setTimeout(r, 200))
      }
      await load()
    }
    loadWhenReady()
    const t = setInterval(load, 60000)
    // Refresh immediately after settings save (business updated event).
    const onUpdate = () => { if (!cancelled) load() }
    window.addEventListener('biz-updated', onUpdate)
    return () => {
      cancelled = true
      clearInterval(t)
      window.removeEventListener('biz-updated', onUpdate)
    }
  }, [])

  return (
    <PlanContext.Provider value={plan}>
      <PlanBanner plan={plan} />
      {children}
    </PlanContext.Provider>
  )
}

function PlanBanner({ plan }: { plan: PlanState }) {
  if (plan.state === 'loading' || plan.state === 'paid') return null

  // Expired — red lock banner
  if (plan.state === 'expired') {
    return (
      <div style={banner('#3A1414', '#FF6B6B')}>
        <span><strong>Your {plan.plan === 'trial' ? 'free trial' : 'plan'} has ended.</strong> Your AI has paused replying to customers. Upgrade to reactivate.</span>
        <a href="/dashboard/billing" style={btn('#FF5A5A')}>Upgrade now</a>
      </div>
    )
  }

  // Trial — show countdown, more urgent when ≤7 days
  if (plan.state === 'trial') {
    const urgent = plan.daysLeft <= 7
    return (
      <div style={banner(urgent ? '#3A2E14' : '#0F1A14', urgent ? '#FFC857' : '#00C57A')}>
        <span>
          {urgent ? '⏳ ' : '🎉 '}
          <strong>{plan.daysLeft} {plan.daysLeft === 1 ? 'day' : 'days'} left</strong> in your free trial.
          {urgent ? ' Upgrade now to keep BizBot running for your customers.' : ' Enjoying BizBot? Pick a plan anytime.'}
        </span>
        <a href="/dashboard/billing" style={btn(urgent ? '#FFC857' : '#00C57A')}>{urgent ? 'Upgrade' : 'View plans'}</a>
      </div>
    )
  }
  return null
}

const banner = (bg: string, accent: string): any => ({
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
  background: bg, color: accent, padding: '10px 20px', fontSize: 13.5,
  borderBottom: `1px solid ${accent}33`, flexWrap: 'wrap',
})
const btn = (bg: string): any => ({
  background: bg, color: '#1A1410', padding: '6px 16px', borderRadius: 8,
  fontWeight: 700, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap',
})