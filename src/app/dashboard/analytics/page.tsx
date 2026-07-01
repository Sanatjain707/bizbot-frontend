'use client'
import { useEffect, useState } from 'react'
import { api, downloadAnalyticsCsv } from '@/lib/api'
import { Card, StatCard, Select, Button, Badge, SkeletonCard, Skeleton, EmptyState, showToast } from '@/components/ui'
import {
  ChartCard, EngagementLine, StatusDonut, RevenueBars, CustomerGrowthLine,
  HoursBars, WeekdayBars, TopServicesBars, isEmpty, rupee,
} from '@/components/dashboard/AnalyticsCharts'
import { BarChart3, MessageSquare, Calendar, CreditCard, Users, Zap, Download, TrendingUp } from 'lucide-react'

const RANGE_OPTIONS = [
  { value: '7',  label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom range' },
]

export default function AnalyticsPage() {
  const [mode, setMode]       = useState('30')
  const [from, setFrom]       = useState('')
  const [to, setTo]           = useState('')
  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const query = () => (mode === 'custom' && from && to) ? `from=${from}&to=${to}` : `preset=${mode === 'custom' ? '30' : mode}`

  useEffect(() => {
    if (mode === 'custom' && (!from || !to)) return   // wait for both custom dates
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data: d, error } = await api.getAnalytics(query())
      if (cancelled) return
      if (error) showToast(error, 'error')
      else setData(d)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [mode, from, to])

  async function exportCsv() {
    setExporting(true)
    try { await downloadAnalyticsCsv(query()); showToast('CSV downloaded', 'success') }
    catch (e: any) { showToast(e.message || 'Export failed', 'error') }
    setExporting(false)
  }

  const c = data?.charts
  const k = data?.kpis
  const ins = data?.insights

  return (
    <div className="animate-up">
      {/* Header + controls */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-[#E8EAED] mb-1 font-[Syne]">Analytics</h1>
          <p className="text-sm text-[#5A6370]">{data?.range?.label ? `Showing ${data.range.label} · IST` : 'Your business at a glance'}</p>
        </div>
        <div className="flex items-end gap-2 flex-wrap">
          <Select value={mode} onChange={(e: any) => setMode(e.target.value)} options={RANGE_OPTIONS} className="w-40" />
          {mode === 'custom' && (
            <>
              <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-[#9AA0AB]">From</label>
                <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="bg-[#141618] border border-[rgba(255,255,255,0.08)] rounded-xl px-3 py-2.5 text-sm text-[#E8EAED] outline-none focus:border-[rgba(0,197,122,0.5)]" /></div>
              <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-[#9AA0AB]">To</label>
                <input type="date" value={to} onChange={e => setTo(e.target.value)} className="bg-[#141618] border border-[rgba(255,255,255,0.08)] rounded-xl px-3 py-2.5 text-sm text-[#E8EAED] outline-none focus:border-[rgba(0,197,122,0.5)]" /></div>
            </>
          )}
          <Button variant="secondary" icon={Download} onClick={exportCsv} loading={exporting} disabled={!data?.hasData}>Export CSV</Button>
        </div>
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-5 gap-3 mb-6">{[1,2,3,4,5].map(i => <SkeletonCard key={i} />)}</div>
      ) : !data?.hasData ? (
        <Card className="py-6">
          <EmptyState icon={BarChart3} title="No analytics yet"
            desc="As BizBot handles chats, bookings and payments, your KPIs and charts will appear here. Try a wider date range if you have older data." />
        </Card>
      ) : (
        <div className={loading ? 'opacity-60 transition-opacity' : ''}>
          {/* KPI cards */}
          <div className="grid grid-cols-5 gap-3 mb-5">
            <StatCard label="Customers engaged" value={k.customersEngaged.value} sub="Messaged you" trend={k.customersEngaged.changePct ?? undefined} icon={MessageSquare} color="green" />
            <StatCard label="Appointments" value={k.appointments.value} sub="Booked" trend={k.appointments.changePct ?? undefined} icon={Calendar} color="blue" />
            <StatCard label="Revenue collected" value={rupee(k.revenueCollected.value)} sub={`${rupee(k.revenuePending.value)} pending`} trend={k.revenueCollected.changePct ?? undefined} icon={CreditCard} color="green" />
            <StatCard label="New customers" value={k.newCustomers.value} sub="Added this period" trend={k.newCustomers.changePct ?? undefined} icon={Users} color="purple" />
            <StatCard label="AI messages" value={k.aiMessages.value} sub="Sent by BizBot" trend={k.aiMessages.changePct ?? undefined} icon={Zap} color="amber" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <ChartCard title="Customer engagement" subtitle="Distinct customers who messaged, per day" className="col-span-2" empty={isEmpty(c.engagementOverTime, 'messages')}>
              <EngagementLine data={c.engagementOverTime} />
            </ChartCard>

            <ChartCard title="Appointments by status" empty={isEmpty(c.appointmentsByStatus, 'value')}>
              <StatusDonut data={c.appointmentsByStatus} />
            </ChartCard>
            <ChartCard title="Revenue trend" subtitle={`Collected, by ${c.revenueTrendUnit}`} empty={isEmpty(c.revenueTrend, 'revenue')}>
              <RevenueBars data={c.revenueTrend} />
            </ChartCard>

            <ChartCard title="Customer growth" subtitle="Cumulative total customers" className="col-span-2"
              empty={!c.customerGrowth?.length || c.customerGrowth[c.customerGrowth.length - 1].total === 0}>
              <CustomerGrowthLine data={c.customerGrowth} />
            </ChartCard>

            <ChartCard title="Busiest hours" subtitle="When appointments happen (IST)" empty={isEmpty(c.busiestHours, 'value')}>
              <HoursBars data={c.busiestHours} />
            </ChartCard>
            <ChartCard title="Busiest days" subtitle="Bookings by weekday" empty={isEmpty(c.busiestWeekdays, 'value')}>
              <WeekdayBars data={c.busiestWeekdays} />
            </ChartCard>

            <ChartCard title="Top services" subtitle="Most booked" className="col-span-2" empty={!c.topServices?.length}>
              <TopServicesBars data={c.topServices} height={Math.max(160, c.topServices.length * 34)} />
            </ChartCard>
          </div>

          {/* Insight tiles */}
          <div className="grid grid-cols-4 gap-3">
            <InsightTile label="Repeat customers" value={`${ins.repeatVsNew.repeatPct}%`}
              sub={`${ins.repeatVsNew.repeat} repeat · ${ins.repeatVsNew.new} new`} icon={Users} />
            <InsightTile label="No-show rate" value={`${ins.noShowRate.pct}%`}
              sub={ins.noShowRate.concluded ? `${ins.noShowRate.noShow} no-show of ${ins.noShowRate.concluded} concluded appts` : 'No concluded appointments yet'} icon={Calendar} />
            <InsightTile label="Avg revenue / customer" value={rupee(ins.avgRevenuePerCustomer)}
              sub="Per paying customer" icon={CreditCard} />
            <InsightTile label="Re-engagement" value={`${ins.reengagement.pct}%`}
              sub={ins.reengagement.reEngaged ? `${ins.reengagement.returned} of ${ins.reengagement.reEngaged} returned` : 'None sent yet'} icon={TrendingUp} estimate />
          </div>
        </div>
      )}
    </div>
  )
}

function InsightTile({ label, value, sub, icon: Icon, estimate }: any) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={13} className="text-[#5A6370]" />
        <span className="text-xs font-medium text-[#5A6370] uppercase tracking-wider">{label}</span>
        {estimate && <Badge variant="default" size="xs">estimate</Badge>}
      </div>
      <div className="text-2xl font-bold text-[#E8EAED] font-[Syne] mb-1">{value}</div>
      <p className="text-xs text-[#5A6370]">{sub}</p>
    </Card>
  )
}
