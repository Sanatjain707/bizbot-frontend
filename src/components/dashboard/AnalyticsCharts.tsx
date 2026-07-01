'use client'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { Card } from '@/components/ui'
import { BarChart3 } from 'lucide-react'

// ── Shared theme ──────────────────────────────────────
const AXIS = '#5A6370'
const GRID = 'rgba(255,255,255,0.06)'
export const PALETTE = {
  green: '#00C57A', blue: '#4D9EFF', amber: '#FFA040', purple: '#A87EFF', red: '#FF5A5A',
}
const STATUS_COLORS: Record<string, string> = {
  Booked: PALETTE.green, Completed: PALETTE.blue, Cancelled: PALETTE.red, 'No-show': PALETTE.amber,
}

export const rupee = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const shortDate = (d: string) => {
  const [y, m, day] = (d || '').split('-')
  if (!day) return d
  const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(m) - 1]
  return `${Number(day)} ${mon}`
}
const hourLabel = (h: number) => {
  const ap = h < 12 ? 'am' : 'pm'; const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}${ap}`
}

// ── Dark tooltip ──────────────────────────────────────
function TT({ active, payload, label, money }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#141618] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-[#9AA0AB] mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs font-medium" style={{ color: p.color || p.fill }}>
          {p.name}: {money ? rupee(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

// ── Card shell with title + empty state ───────────────
export function ChartCard({ title, subtitle, empty, className = '', children }: any) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[#E8EAED]">{title}</h3>
        {subtitle && <p className="text-xs text-[#5A6370] mt-0.5">{subtitle}</p>}
      </div>
      {empty ? (
        <div className="h-[220px] flex flex-col items-center justify-center text-center">
          <BarChart3 size={22} className="text-[#3A4048] mb-2" />
          <p className="text-xs text-[#5A6370]">No data yet for this range</p>
        </div>
      ) : children}
    </Card>
  )
}

const isEmpty = (rows: any[], key: string) => !rows?.length || rows.every(r => !Number(r[key]))

// ── Line: engagement over time (customers/day) ────────
export function EngagementLine({ data, height = 220 }: { data: any[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} width={32} />
        <Tooltip content={<TT />} cursor={{ stroke: GRID }} labelFormatter={(v: any) => shortDate(v)} />
        <Line type="monotone" dataKey="customers" name="Customers" stroke={PALETTE.green} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ── Donut: appointments by status ─────────────────────
export function StatusDonut({ data, height = 220 }: { data: any[]; height?: number }) {
  const total = data.reduce((s, d) => s + Number(d.value || 0), 0)
  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="55%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="status" innerRadius="58%" outerRadius="88%" paddingAngle={2} stroke="none">
            {data.map((d, i) => <Cell key={i} fill={STATUS_COLORS[d.status] || PALETTE.green} />)}
          </Pie>
          <Tooltip content={<TT />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: STATUS_COLORS[d.status] }} />
            <span className="text-xs text-[#9AA0AB] flex-1">{d.status}</span>
            <span className="text-xs font-medium text-[#E8EAED]">{d.value}</span>
            <span className="text-xs text-[#5A6370] w-9 text-right">{total ? Math.round((d.value / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Bars: revenue trend ───────────────────────────────
export function RevenueBars({ data, height = 220 }: { data: any[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="bucket" tickFormatter={shortDate} tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} minTickGap={16} />
        <YAxis tickFormatter={(v) => v >= 1000 ? `₹${v / 1000}k` : `₹${v}`} tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} width={44} />
        <Tooltip content={<TT money />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} labelFormatter={(v: any) => shortDate(v)} />
        <Bar dataKey="revenue" name="Revenue" fill={PALETTE.green} radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Line: cumulative customer growth ──────────────────
export function CustomerGrowthLine({ data, height = 220 }: { data: any[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} width={32} />
        <Tooltip content={<TT />} cursor={{ stroke: GRID }} labelFormatter={(v: any) => shortDate(v)} />
        <Line type="monotone" dataKey="total" name="Total customers" stroke={PALETTE.purple} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ── Bars: busiest hours (IST) ─────────────────────────
export function HoursBars({ data, height = 220 }: { data: any[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="hour" tickFormatter={hourLabel} tick={{ fontSize: 10, fill: AXIS }} axisLine={false} tickLine={false} minTickGap={8} interval={2} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} width={32} />
        <Tooltip content={<TT />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} labelFormatter={(h: any) => `${hourLabel(h)} (IST)`} />
        <Bar dataKey="value" name="Bookings" fill={PALETTE.blue} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Bars: busiest weekdays ────────────────────────────
export function WeekdayBars({ data, height = 220 }: { data: any[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} width={32} />
        <Tooltip content={<TT />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="value" name="Bookings" fill={PALETTE.amber} radius={[3, 3, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Horizontal bars: top services ─────────────────────
export function TopServicesBars({ data, height = 220 }: { data: any[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="service" tick={{ fontSize: 11, fill: '#9AA0AB' }} axisLine={false} tickLine={false} width={90} />
        <Tooltip content={<TT />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="value" name="Bookings" fill={PALETTE.purple} radius={[0, 4, 4, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export { isEmpty }
