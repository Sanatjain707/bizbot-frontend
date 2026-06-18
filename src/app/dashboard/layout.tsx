'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import { PlanProvider } from '@/components/dashboard/PlanBanner'
import { isLoggedIn } from '@/lib/supabase'
import { api } from '@/lib/api'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [biz, setBiz]     = useState<any>({})

  useEffect(() => {
    async function init() {
      if (!isLoggedIn()) { router.replace('/login'); return }
      const { data } = await api.getBusiness()
      if (data?.id) {
        localStorage.setItem('bizId', data.id)
        const active = data.plan_expires_at ? new Date(data.plan_expires_at) > new Date() : false
        setBiz({ ...data, planActive: active })
      } else {
        // No business yet → send to onboarding
        router.replace('/onboarding'); return
      }
      setReady(true)
    }
    init()
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