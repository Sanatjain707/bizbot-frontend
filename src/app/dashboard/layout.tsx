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
      const user = await getCurrentUser()
      if (cancelled) return
      if (!user) { router.replace('/login'); return }

      try {
        const params = new URLSearchParams()
        if (user.id) params.set('auth_user_id', user.id)
        if (user.email) params.set('email', user.email)
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        const res = await fetch(`${base}/api/business/by-user?${params.toString()}`)
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
      } catch (_) {
        if (cancelled) return
        const ok = await loadBiz()
        if (cancelled) return
        if (ok) setReady(true)
        else router.replace('/onboarding')
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