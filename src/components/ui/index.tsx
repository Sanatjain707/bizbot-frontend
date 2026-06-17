'use client'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

// ── Button ────────────────────────────────────────────
export function Button({
  children, onClick, variant = 'primary', size = 'md',
  disabled = false, loading = false, icon: Icon, className = '', type = 'button'
}: any) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all focus-ring disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes: any = {
    xs:  'px-2.5 py-1.5 text-xs',
    sm:  'px-3 py-2 text-xs',
    md:  'px-4 py-2.5 text-sm',
    lg:  'px-5 py-3 text-sm',
    xl:  'px-6 py-3.5 text-base',
  }
  const variants: any = {
    primary:  'bg-[#00C57A] hover:bg-[#00d986] text-black font-semibold',
    secondary:'bg-[#1A1D20] hover:bg-[#202428] text-[#E8EAED] border border-[rgba(255,255,255,0.08)]',
    ghost:    'bg-transparent hover:bg-[#1A1D20] text-[#9AA0AB] hover:text-[#E8EAED]',
    danger:   'bg-[rgba(255,90,90,0.12)] hover:bg-[rgba(255,90,90,0.2)] text-[#FF5A5A] border border-[rgba(255,90,90,0.2)]',
    outline:  'bg-transparent border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] text-[#E8EAED]',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {loading ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full spin" /> : Icon && <Icon size={14} />}
      {children}
    </button>
  )
}

// ── Card ──────────────────────────────────────────────
export function Card({ children, className = '', hover = false, onClick }: any) {
  return (
    <div onClick={onClick}
      className={`bg-[#0F1012] border border-[rgba(255,255,255,0.06)] rounded-2xl ${hover ? 'hover:border-[rgba(255,255,255,0.12)] cursor-pointer transition-all' : ''} ${className}`}>
      {children}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────
export function Badge({ children, variant = 'default', size = 'sm' }: any) {
  const variants: any = {
    default:  'bg-[#1A1D20] text-[#9AA0AB] border-[rgba(255,255,255,0.08)]',
    green:    'bg-[rgba(0,197,122,0.12)] text-[#00C57A] border-[rgba(0,197,122,0.2)]',
    red:      'bg-[rgba(255,90,90,0.12)] text-[#FF5A5A] border-[rgba(255,90,90,0.2)]',
    amber:    'bg-[rgba(255,160,64,0.12)] text-[#FFA040] border-[rgba(255,160,64,0.2)]',
    blue:     'bg-[rgba(77,158,255,0.12)] text-[#4D9EFF] border-[rgba(77,158,255,0.2)]',
    purple:   'bg-[rgba(168,126,255,0.12)] text-[#A87EFF] border-[rgba(168,126,255,0.2)]',
  }
  const sizes: any = { xs: 'text-xs px-1.5 py-0.5', sm: 'text-xs px-2 py-0.5', md: 'text-sm px-2.5 py-1' }
  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  )
}

// ── Input ─────────────────────────────────────────────
export function Input({ label, placeholder, value, onChange, type = 'text', hint, error, icon: Icon, className = '', ...props }: any) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-xs font-medium text-[#9AA0AB]">{label}</label>}
      <div className="relative">
        {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A6370]" />}
        <input type={type} value={value} onChange={onChange} placeholder={placeholder}
          className={`w-full bg-[#141618] border ${error ? 'border-[rgba(255,90,90,0.5)]' : 'border-[rgba(255,255,255,0.08)]'} rounded-xl ${Icon ? 'pl-9' : 'pl-3.5'} pr-3.5 py-2.5 text-sm text-[#E8EAED] placeholder:text-[#5A6370] outline-none focus:border-[rgba(0,197,122,0.5)] transition-all`}
          {...props} />
      </div>
      {error && <p className="text-xs text-[#FF5A5A]">{error}</p>}
      {hint && !error && <p className="text-xs text-[#5A6370]">{hint}</p>}
    </div>
  )
}

// ── Textarea ──────────────────────────────────────────
export function Textarea({ label, placeholder, value, onChange, rows = 3, hint, className = '' }: any) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-xs font-medium text-[#9AA0AB]">{label}</label>}
      <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
        className="w-full bg-[#141618] border border-[rgba(255,255,255,0.08)] rounded-xl px-3.5 py-2.5 text-sm text-[#E8EAED] placeholder:text-[#5A6370] outline-none focus:border-[rgba(0,197,122,0.5)] transition-all resize-none" />
      {hint && <p className="text-xs text-[#5A6370]">{hint}</p>}
    </div>
  )
}

// ── Select ────────────────────────────────────────────
export function Select({ label, value, onChange, options, className = '' }: any) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-xs font-medium text-[#9AA0AB]">{label}</label>}
      <select value={value} onChange={onChange}
        className="w-full bg-[#141618] border border-[rgba(255,255,255,0.08)] rounded-xl px-3.5 py-2.5 text-sm text-[#E8EAED] outline-none focus:border-[rgba(0,197,122,0.5)] transition-all appearance-none">
        {options.map((o: any) => (
          <option key={o.value} value={o.value} className="bg-[#141618]">{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ── Avatar ────────────────────────────────────────────
export function Avatar({ name, phone, size = 'md', className = '' }: any) {
  const colors = [
    'bg-[rgba(0,197,122,0.15)] text-[#00C57A]',
    'bg-[rgba(77,158,255,0.15)] text-[#4D9EFF]',
    'bg-[rgba(168,126,255,0.15)] text-[#A87EFF]',
    'bg-[rgba(255,160,64,0.15)] text-[#FFA040]',
    'bg-[rgba(255,90,90,0.15)] text-[#FF5A5A]',
  ]
  const p   = phone || name || '?'
  const c   = colors[p.charCodeAt(p.length - 1) % colors.length]
  const ini = name
    ? name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : p.slice(-2)
  const sizes: any = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base', xl: 'w-14 h-14 text-lg' }
  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${c} ${className}`}>
      {ini}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────
export function Skeleton({ className = '' }: any) {
  return <div className={`skeleton ${className}`} />
}

export function SkeletonCard() {
  return (
    <Card className="p-5">
      <Skeleton className="h-3 w-24 mb-4" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-32" />
    </Card>
  )
}

// ── Modal ─────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }: any) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open || !mounted) return null
  const maxW: any = { sm: 420, md: 560, lg: 720, xl: 960 }

  const modal = (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, overflowY: 'auto',
    }}>
      <div onClick={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: maxW[size],
        maxHeight: '90vh', overflowY: 'auto',
        background: '#0F1012', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          position: 'sticky', top: 0, background: '#0F1012', zIndex: 1,
        }}>
          <h3 style={{ fontWeight: 600, color: '#E8EAED', fontSize: 16 }}>{title}</h3>
          <button onClick={onClose} style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#5A6370' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: '20px 24px' }}>{children}</div>
      </div>
    </div>
  )

  // Portal into body so no parent transform/overflow can trap it
  return createPortal(modal, document.body)
}

// ── Toast ─────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info' | 'warning'
interface ToastItem { id: string; message: string; type: ToastType }

let toastFn: ((msg: string, type?: ToastType) => void) | null = null
export function showToast(msg: string, type: ToastType = 'success') {
  toastFn?.(msg, type)
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    toastFn = (message, type = 'success') => {
      const id = Math.random().toString(36).slice(2)
      setToasts(prev => [...prev, { id, message, type }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
    }
    return () => { toastFn = null }
  }, [])

  const icons: any = { success: CheckCircle, error: AlertCircle, info: Info, warning: AlertTriangle }
  const colors: any = {
    success: 'bg-[#00C57A] text-black',
    error:   'bg-[#FF5A5A] text-white',
    info:    'bg-[#4D9EFF] text-white',
    warning: 'bg-[#FFA040] text-black',
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map(t => {
        const Icon = icons[t.type]
        return (
          <div key={t.id} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-lg animate-up ${colors[t.type]}`}>
            <Icon size={15} />
            {t.message}
          </div>
        )
      })}
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────
export function StatCard({ label, value, sub, icon: Icon, color = 'green', trend }: any) {
  const colors: any = {
    green:  { bg: 'bg-[rgba(0,197,122,0.1)]',   text: 'text-[#00C57A]', val: 'text-[#E8EAED]' },
    amber:  { bg: 'bg-[rgba(255,160,64,0.1)]',  text: 'text-[#FFA040]', val: 'text-[#E8EAED]' },
    blue:   { bg: 'bg-[rgba(77,158,255,0.1)]',  text: 'text-[#4D9EFF]', val: 'text-[#E8EAED]' },
    purple: { bg: 'bg-[rgba(168,126,255,0.1)]', text: 'text-[#A87EFF]', val: 'text-[#E8EAED]' },
    red:    { bg: 'bg-[rgba(255,90,90,0.1)]',   text: 'text-[#FF5A5A]', val: 'text-[#E8EAED]' },
  }
  const c = colors[color]
  return (
    <Card className="p-5 hover:border-[rgba(255,255,255,0.1)] transition-all">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-[#5A6370] uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-lg ${c.bg}`}><Icon size={14} className={c.text} /></div>
      </div>
      <div className={`text-2xl font-bold mb-1 font-[Syne] ${c.val}`}>{value}</div>
      <div className="flex items-center justify-between">
        {sub && <span className="text-xs text-[#5A6370]">{sub}</span>}
        {trend && <span className={`text-xs font-medium ${trend > 0 ? 'text-[#00C57A]' : 'text-[#FF5A5A]'}`}>{trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>}
      </div>
    </Card>
  )
}

// ── Empty state ───────────────────────────────────────
export function EmptyState({ icon: Icon, title, desc, action }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#141618] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mb-4">
        <Icon size={24} className="text-[#5A6370]" />
      </div>
      <h3 className="text-sm font-semibold text-[#E8EAED] mb-1">{title}</h3>
      <p className="text-xs text-[#5A6370] max-w-xs mb-4">{desc}</p>
      {action}
    </div>
  )
}

// ── Toggle ────────────────────────────────────────────
export function Toggle({ checked, onChange, label }: any) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div onClick={() => onChange(!checked)}
        className={`relative w-10 h-5.5 rounded-full transition-all ${checked ? 'bg-[#00C57A]' : 'bg-[#2A2F35]'}`}
        style={{ height: '22px' }}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? 'left-5' : 'left-0.5'}`} />
      </div>
      {label && <span className="text-sm text-[#9AA0AB]">{label}</span>}
    </label>
  )
}

// ── Divider ───────────────────────────────────────────
export function Divider({ className = '' }: any) {
  return <div className={`h-px bg-[rgba(255,255,255,0.06)] ${className}`} />
}

// ── Section header ────────────────────────────────────
export function SectionHeader({ title, action }: any) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-semibold text-[#E8EAED]">{title}</h2>
      {action}
    </div>
  )
}