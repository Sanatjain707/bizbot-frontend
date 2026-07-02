'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import { PlanProvider } from '@/components/dashboard/PlanBanner'
import { getCurrentUser } from '@/lib/supabase'
import { useIdleLogout } from '@/hooks/useIdleLogout'
import { api } from '@/lib/api'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [biz, setBiz]     = useState<any>({})
  const [openAlerts, setOpenAlerts] = useState(0)
  const [fatalError, setFatalError] = useState<string | null>(null)

  // Poll the open-alerts count so the sidebar badge stays fresh without
  // requiring the user to sit on the alerts page.
  useEffect(() => {
    if (!ready) return
    let cancelled = false
    async function fetchCount() {
      const { data } = await api.getBookingAlertsCount()
      if (!cancelled) setOpenAlerts(data?.open || 0)
    }
    fetchCount()
    const t = setInterval(fetchCount, 30_000)
    return () => { cancelled = true; clearInterval(t) }
  }, [ready])

  useEffect(() => {
    // Guard against setState / redirect after unmount — the user can hit Back
    // between the two async awaits below, otherwise we'd log "setState on
    // unmounted" and worse, could stampede them to /onboarding by accident.
    let cancelled = false

    async function loadBiz() {
      const { data } = await api.getBusiness()
      if (cancelled) return false
      if (data?.id) {
        localStorage.setItem('bizId', data.id)
        const active = data.plan_expires_at ? new Date(data.plan_expires_at) > new Date() : false
        setBiz({ ...data, planActive: active })
        return true
      }
      return false
    }

    async function init() {
      // getCurrentUser() throws if Supabase env vars are missing/malformed.
      // Without a catch, `ready` stays false and the page hangs on the
      // "Loading BizBot..." spinner forever — surface it instead.
      let user
      try {
        user = await getCurrentUser()
      } catch (err: any) {
        if (cancelled) return
        console.error('getCurrentUser failed:', err)
        setFatalError(`Auth service unreachable. Check NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. (${err?.message || 'unknown'})`)
        return
      }
      if (cancelled) return
      if (!user) { router.replace('/login'); return }

      try {
        const params = new URLSearchParams()
        if (user.id) params.set('auth_user_id', user.id)
        if (user.email) params.set('email', user.email)
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        // AbortController timeout — without it, an unreachable backend
        // hangs the fetch (and therefore the whole layout) indefinitely.
        // 10s is longer than any real by-user call but short enough that
        // a misconfigured NEXT_PUBLIC_API_URL surfaces quickly.
        const ac = new AbortController()
        const timeout = setTimeout(() => ac.abort(), 10_000)
        let res: Response
        try {
          res = await fetch(`${base}/api/business/by-user?${params.toString()}`, { signal: ac.signal })
        } finally {
          clearTimeout(timeout)
        }
        if (!res.ok) throw new Error(`by-user ${res.status}`)
        const { business } = await res.json()
        if (cancelled) return
        if (business?.id) {
          localStorage.setItem('bizId', business.id)
          sessionStorage.removeItem('onboarding-redirect')
          const active = business.plan_expires_at ? new Date(business.plan_expires_at) > new Date() : false
          setBiz({ ...business, planActive: active })
          setReady(true)
          return
        }
        // Genuinely needs onboarding — but only redirect if we haven't already
        // to break any onboarding↔dashboard loop.
        if (!sessionStorage.getItem('onboarding-redirect')) {
          sessionStorage.setItem('onboarding-redirect', '1')
          router.replace('/onboarding')
        }
        return
      } catch (err: any) {
        if (cancelled) return
        // Network hiccup — try the plain getBusiness fallback before giving up.
        const ok = await loadBiz()
        if (cancelled) return
        if (ok) { setReady(true); return }
        // If loadBiz also failed, we truly can't reach the backend — show
        // an actionable error instead of the infinite spinner + accidental
        // redirect to /onboarding.
        setFatalError(`Can't reach the API. Check NEXT_PUBLIC_API_URL in Vercel env vars. (${err?.message || 'unknown'})`)
      }
    }
    init()

    const onUpdate = () => { if (!cancelled) loadBiz() }
    window.addEventListener('biz-updated', onUpdate)
    return () => {
      cancelled = true
      window.removeEventListener('biz-updated', onUpdate)
    }
  }, [router])

  if (fatalError) return (
    <div className="min-h-screen bg-[#08090A] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-[rgba(255,90,90,0.12)] flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h1 className="text-lg font-semibold text-[#E8EAED] mb-2">Dashboard couldn't load</h1>
        <p className="text-sm text-[#9AA0AB] mb-5 break-words">{fatalError}</p>
        <div className="flex gap-2 justify-center">
          <a href="/login" className="text-sm text-[#00C57A] hover:underline">Back to sign-in</a>
          <span className="text-[#5A6370]">·</span>
          <button onClick={() => window.location.reload()} className="text-sm text-[#00C57A] hover:underline">Reload</button>
        </div>
      </div>
    </div>
  )

  if (!ready) return (
    <div className="min-h-screen bg-[#08090A] flex items-center justify-center">
      <div className="flex items-center gap-2.5 text-[#5A6370] text-sm">
        <span className="w-2 h-2 rounded-full bg-[#00C57A] pulse-dot" />
        Loading BizBot...
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#08090A]">
      <Sidebar bizName={biz.name} bizType={biz.type} plan={biz.plan} planActive={biz.planActive} openAlerts={openAlerts} />
      <main className="ml-60 min-h-screen">
        <PlanProvider>
          <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
        </PlanProvider>
      </main>
      <IdleWatch />
    </div>
  )
}

// Mounted only inside the ready branch so the idle timer starts *after* the
// user has actually landed on the dashboard — not while the by-user resolver
// is still running.
function IdleWatch() {
  useIdleLogout()
  return null
}