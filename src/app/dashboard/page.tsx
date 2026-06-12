'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Calendar, MessageSquare, CreditCard, Users } from 'lucide-react'

function Card({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</span>
        <div className={`p-1.5 rounded-lg ${color}`}><Icon size={14} /></div>
      </div>
      <div className="text-2xl font-semibold text-white mb-1">{value}</div>
      {sub && <div className="text-xs text-zinc-500">{sub}</div>}
    </div>
  )
}

function Avatar({ name, phone }: any) {
  const cols = ['bg-emerald-500/20 text-emerald-300','bg-blue-500/20 text-blue-300','bg-purple-500/20 text-purple-300','bg-amber-500/20 text-amber-300']
  const c    = cols[(phone||'').charCodeAt((phone||'').length-1) % cols.length]
  const ini  = name ? name.split(' ').map((w:string)=>w[0]).join('').toUpperCase().slice(0,2) : (phone||'??').slice(-2)
  return <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${c}`}>{ini}</div>
}

const STATUS_CLS: Record<string,string> = {
  confirmed: 'bg-emerald-500/10 text-emerald-400',
  done:      'bg-zinc-700/50 text-zinc-400',
  cancelled: 'bg-red-500/10 text-red-400',
  no_show:   'bg-amber-500/10 text-amber-400',
}

export default function DashboardPage() {
  const [stats,  setStats]  = useState<any>(null)
  const [appts,  setAppts]  = useState<any[]>([])
  const [convos, setConvos] = useState<any[]>([])
  const [loading,setLoading]= useState(true)

  const today = new Date().toLocaleDateString('en-IN',{ weekday:'long', day:'numeric', month:'long', year:'numeric' })

  useEffect(() => {
    async function load() {
      const [s,a,c] = await Promise.all([api.getStats(), api.getTodayAppointments(), api.getConversations()])
      if (s.data) setStats(s.data)
      if (a.data) setAppts(a.data)
      if (c.data) setConvos(c.data)
      setLoading(false)
    }
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-2 text-zinc-500 text-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse" />Loading...
      </div>
    </div>
  )

  return (
    <div className="animate-in max-w-5xl">
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold text-white mb-1">Good morning 👋</h1>
          <p className="text-sm text-zinc-500">{today}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse" />
          <span className="text-xs text-emerald-400 font-medium">AI Active</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-7">
        <Card label="Today's Appointments" value={stats?.todayAppointments??0} sub="Booked via WhatsApp" icon={Calendar} color="text-emerald-400 bg-emerald-400/10" />
        <Card label="Pending Payments" value={`₹${(stats?.pendingPayments??0).toLocaleString('en-IN')}`} sub="Awaiting collection" icon={CreditCard} color="text-amber-400 bg-amber-400/10" />
        <Card label="AI Replies Today" value={stats?.aiRepliesToday??0} sub="100% automated" icon={MessageSquare} color="text-blue-400 bg-blue-400/10" />
        <Card label="New Enquiries" value={stats?.newCustomersToday??0} sub="Responded instantly" icon={Users} color="text-purple-400 bg-purple-400/10" />
      </div>

      <div className="grid grid-cols-5 gap-5">
        <div className="col-span-3 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Today's Appointments</h2>
            <a href="/dashboard/appointments" className="text-xs text-emerald-400 hover:text-emerald-300">View all →</a>
          </div>
          {appts.length === 0 ? (
            <div className="text-center py-10">
              <Calendar size={28} className="text-zinc-700 mx-auto mb-2" />
              <p className="text-sm text-zinc-600">No appointments today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {appts.slice(0,6).map((a:any) => (
                <div key={a.id} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors">
                  <Avatar name={a.customers?.name} phone={a.customers?.phone} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{a.customers?.name||a.customers?.phone}</p>
                    <p className="text-xs text-zinc-500 truncate">{a.service}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-zinc-400 mb-1">{new Date(a.appointment_time).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLS[a.status]||STATUS_CLS.done}`}>{a.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Live Conversations</h2>
            <a href="/dashboard/conversations" className="text-xs text-emerald-400 hover:text-emerald-300">View all →</a>
          </div>
          {convos.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare size={28} className="text-zinc-700 mx-auto mb-2" />
              <p className="text-sm text-zinc-600">No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {convos.slice(0,7).map((c:any) => (
                <a key={c.id} href="/dashboard/conversations"
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg transition-colors cursor-pointer ${c.unread>0?'bg-emerald-500/5 border border-emerald-500/10':'hover:bg-zinc-800'}`}>
                  <Avatar name={c.name} phone={c.phone} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-white truncate">{c.name||c.phone}</p>
                      <p className="text-xs text-zinc-600 ml-1">{c.last_time}</p>
                    </div>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{c.last_msg}</p>
                  </div>
                  {c.unread>0 && <span className="w-4 h-4 rounded-full bg-emerald-500 text-black text-xs font-bold flex items-center justify-center">{c.unread}</span>}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
