'use client'
import { useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/supabase'

// Idle-logout hook. Mount once at the dashboard root.
//
// Behaviour:
//  - Any of these events count as activity: mousemove, mousedown, keydown,
//    touchstart, scroll. Activity is throttled to at most 1 write / 5s to
//    keep localStorage quiet.
//  - Activity timestamp lives in localStorage → shared across tabs. Working
//    in ANY tab keeps every dashboard tab alive.
//  - At idleMs since last activity, calls signOut() and redirects to
//    /login?reason=idle so the login page can show a friendly notice.
//  - If ANOTHER tab signs out (bizbot-session cleared), this tab redirects
//    to /login too.
//
// Default idle window comes from NEXT_PUBLIC_IDLE_TIMEOUT_MIN so ops can
// dial it without a code change.

const ACTIVITY_KEY = 'bizbot-last-activity'
const THROTTLE_MS  = 5_000

function envMin(name: string, fallback: number): number {
  const raw = process.env[name as any]
  const n = raw ? Number(raw) : NaN
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export function useIdleLogout(opts?: { idleMs?: number }) {
  const router = useRouter()
  const idleMs = opts?.idleMs ?? envMin('NEXT_PUBLIC_IDLE_TIMEOUT_MIN', 60) * 60_000

  const lastActivityWriteRef = useRef(0)
  const loggingOutRef = useRef(false)

  const touch = useCallback(() => {
    const now = Date.now()
    if (now - lastActivityWriteRef.current < THROTTLE_MS) return
    lastActivityWriteRef.current = now
    try { localStorage.setItem(ACTIVITY_KEY, String(now)) } catch (_) {}
  }, [])

  const logoutNow = useCallback(async () => {
    if (loggingOutRef.current) return
    loggingOutRef.current = true
    try { await signOut() } catch (_) {}
    router.replace('/login?reason=idle')
  }, [router])

  useEffect(() => {
    // Seed activity so a fresh mount doesn't immediately trigger logout.
    try {
      if (!localStorage.getItem(ACTIVITY_KEY)) {
        localStorage.setItem(ACTIVITY_KEY, String(Date.now()))
      }
    } catch (_) {}

    const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(e => window.addEventListener(e, touch, { passive: true }))

    function onStorage(e: StorageEvent) {
      // Another tab signed out or switched user → mirror.
      if (e.key === 'bizbot-session' && !e.newValue) {
        router.replace('/login')
      }
    }
    window.addEventListener('storage', onStorage)

    // Re-check when the tab comes back to the foreground. setInterval slows
    // in background tabs, so long sleeps could otherwise miss the threshold.
    function onVisibility() { if (document.visibilityState === 'visible') check() }
    document.addEventListener('visibilitychange', onVisibility)

    function check() {
      let lastRaw: string | null = null
      try { lastRaw = localStorage.getItem(ACTIVITY_KEY) } catch (_) {}
      const last = Number(lastRaw) || Date.now()
      if (Date.now() - last >= idleMs) logoutNow()
    }

    check()
    const interval = setInterval(check, 30_000)   // no warning modal → 30s is plenty

    return () => {
      events.forEach(e => window.removeEventListener(e, touch))
      window.removeEventListener('storage', onStorage)
      document.removeEventListener('visibilitychange', onVisibility)
      clearInterval(interval)
    }
  }, [idleMs, touch, logoutNow, router])
}
