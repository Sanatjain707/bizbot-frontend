'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import { PlanProvider } from '@/components/dashboard/PlanBanner'
import { getCurrentUser } from '@/lib/supabase'
import { api } from '@/lib/api'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [biz, setBiz]     = useState<any>({})

  useEffect(() => {
    async function loadBiz() {
      const { data } = await api.getBusiness()
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
      if (!user) { router.replace('/login'); return }

      // Authoritatively resolve the business for THIS user via by-user.
      // This is the single source of truth — never bounce to onboarding on a
      // transient getBusiness() failure (that caused an onboarding↔dashboard loop).
      try {
        const params = new URLSearchParams()
        if (user.id) params.set('auth_user_id', user.id)
        if (user.email) params.set('email', user.email)
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        const res = await fetch(`${base}/api/business/by-user?${params.toString()}`)
        const { business } = await res.json()
        if (business?.id) {
          localStorage.setItem('bizId', business.id)
          if (typeof window !== 'undefined') sessionStorage.removeItem('onboarding-redirect')
          const active = business.plan_expires_at ? new Date(business.plan_expires_at) > new Date() : false
          setBiz({ ...business, planActive: active })
          setReady(true)
          return
        }
        // No business for this user → genuinely needs onboarding.
        // Guard against any bounce loop: only redirect if we haven't already.
        if (typeof window !== 'undefined' && !sessionStorage.getItem('onboarding-redirect')) {
          sessionStorage.setItem('onboarding-redirect', '1')
          router.replace('/onboarding')
        }
        return
      } catch (_) {
        // Network hiccup — fall back to bizId-based load rather than looping
        const ok = await loadBiz()
        if (ok) setReady(true)
        else router.replace('/onboarding')
      }
    }
    init()

    // Re-fetch business when settings are saved (updates name/type in sidebar instantly)
    const onUpdate = () => loadBiz()
    if (typeof window !== 'undefined') window.addEventListener('biz-updated', onUpdate)
    return () => { if (typeof window !== 'undefined') window.removeEventListener('biz-updated', onUpdate) }
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
      <Sidebar bizName={biz.name} bizType={biz.type} plan={biz.plan} planActive={biz.planActive} />
      <main className="ml-60 min-h-screen">
        <PlanProvider>
          <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
        </PlanProvider>
      </main>
    </div>
  )
}