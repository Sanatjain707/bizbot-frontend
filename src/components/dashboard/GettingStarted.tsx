'use client'
import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, Sparkles, X } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// Shows a setup checklist until the business is fully configured.
// Auto-hides once all essential steps are done.
export default function GettingStarted({ biz, servicesCount }: { biz: any; servicesCount: number }) {
  const [dismissed, setDismissed] = useState(false)

  const steps = [
    { done: !!(biz?.name && biz?.owner_name),  label: 'Add your business details', href: '/dashboard/settings' },
    { done: servicesCount > 0,                  label: 'Add your services & prices', href: '/dashboard/settings' },
    { done: !!biz?.whatsapp_phone_id,           label: 'Connect your WhatsApp number', href: '/dashboard/settings' },
    { done: !!biz?.upi_id,                      label: 'Add your UPI for payments',  href: '/dashboard/settings' },
  ]
  const doneCount = steps.filter(s => s.done).length
  const allDone = doneCount === steps.length

  // Once everything is set up, or user dismisses, hide it
  if (allDone || dismissed) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(0,197,122,0.08), rgba(0,197,122,0.02))',
      border: '1px solid rgba(0,197,122,0.2)', borderRadius: 16, padding: 20, marginBottom: 24, position: 'relative',
    }}>
      <button onClick={() => setDismissed(true)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#5A6370' }}><X size={16} /></button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Sparkles size={16} className="text-[#00C57A]" />
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#E8EAED' }}>Finish setting up BizBot</h3>
      </div>
      <p style={{ fontSize: 13, color: '#9AA0AB', marginBottom: 14 }}>{doneCount} of {steps.length} done — complete these so your AI works perfectly.</p>

      {/* Progress bar */}
      <div style={{ height: 6, background: '#1A1D20', borderRadius: 3, marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(doneCount / steps.length) * 100}%`, background: '#00C57A', borderRadius: 3, transition: 'width 0.4s' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map((s, i) => (
          <a key={i} href={s.href} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10,
            textDecoration: 'none', background: s.done ? 'transparent' : 'rgba(255,255,255,0.02)',
            opacity: s.done ? 0.6 : 1,
          }}>
            {s.done ? <CheckCircle2 size={17} className="text-[#00C57A]" /> : <Circle size={17} className="text-[#5A6370]" />}
            <span style={{ fontSize: 13.5, color: s.done ? '#5A6370' : '#E8EAED', textDecoration: s.done ? 'line-through' : 'none' }}>{s.label}</span>
            {!s.done && <span style={{ marginLeft: 'auto', fontSize: 12, color: '#00C57A', fontWeight: 600 }}>Set up →</span>}
          </a>
        ))}
      </div>
    </div>
  )
}