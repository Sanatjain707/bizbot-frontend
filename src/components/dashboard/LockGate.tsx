'use client'
import { usePlan } from './PlanBanner'

// Wrap any action button/control. When the plan is expired, it greys out,
// blocks clicks, and shows an upgrade hint. Reads stay fully usable.
export default function LockGate({ children, hint = 'Upgrade to use this' }: { children: any; hint?: string }) {
  const plan = usePlan()
  const locked = plan.state === 'expired'

  if (!locked) return children

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} title={hint}>
      <div style={{ opacity: 0.45, pointerEvents: 'none', filter: 'grayscale(0.5)' }}>{children}</div>
      <a href="/dashboard/billing" style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: '#FF6B6B', textDecoration: 'none',
        background: 'rgba(8,9,10,0.4)', borderRadius: 10,
      }}>🔒</a>
    </div>
  )
}