'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Calendar } from 'lucide-react'

const STATUSES = ['all','confirmed','done','cancelled','no_show']
const CLS: Record<string,string> = {
  confirmed:'bg-emerald-500/10 text-emerald-400',
  done:'bg-zinc-700/50 text-zinc-400',
  cancelled:'bg-red-500/10 text-red-400',
  no_show:'bg-amber-500/10 text-amber-400',
}

export default function AppointmentsPage() {
  const [appts,    setAppts]    = useState<any[]>([])
  const [filter,   setFilter]   = useState('all')
  const [loading,  setLoading]  = useState(true)
  const [updating, setUpdating] = useState<string|null>(null)

  useEffect(() => {
    api.getAllAppointments().then(({data}) => { if(data) setAppts(data); setLoading(false) })
  }, [])

  async function update(id: string, status: string) {
    setUpdating(id)
    await api.updateAppointmentStatus(id, status)
    setAppts(prev => prev.map(a => a.id===id ? {...a,status} : a))
    setUpdating(null)
  }

  const list    = filter==='all' ? appts : appts.filter(a=>a.status===filter)
  const counts  = STATUSES.reduce((acc,s) => ({...acc,[s]:s==='all'?appts.length:appts.filter(a=>a.status===s).length}),{} as any)

  return (
    <div className="animate-in max-w-5xl">
      <div className="mb-6"><h1 className="text-xl font-semibold text-white mb-1">Appointments</h1><p className="text-sm text-zinc-500">All bookings made via WhatsApp AI</p></div>

      <div className="flex gap-2 mb-5 overflow-x-auto">
        {STATUSES.map(s => (
          <button key={s} onClick={()=>setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${filter===s?'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20':'text-zinc-500 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'}`}>
            {s.replace('_',' ')} <span className={`px-1.5 py-0.5 rounded text-xs ${filter===s?'bg-emerald-500/20':'bg-zinc-800'}`}>{counts[s]}</span>
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-20 text-zinc-600 text-sm">Loading...</div>
      : list.length===0 ? <div className="text-center py-20"><Calendar size={32} className="text-zinc-700 mx-auto mb-2"/><p className="text-zinc-600 text-sm">No appointments found</p></div>
      : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Customer','Service','Date & Time','Status','Actions'].map(h=>(
                  <th key={h} className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((a:any) => {
                const dt = new Date(a.appointment_time)
                return (
                  <tr key={a.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-3"><p className="text-sm font-medium text-white">{a.customers?.name||'—'}</p><p className="text-xs text-zinc-500">{a.customers?.phone}</p></td>
                    <td className="px-4 py-3 text-sm text-zinc-300">{a.service||'—'}</td>
                    <td className="px-4 py-3"><p className="text-sm text-zinc-300">{dt.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p><p className="text-xs text-zinc-500">{dt.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</p></td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CLS[a.status]||CLS.done}`}>{a.status.replace('_',' ')}</span></td>
                    <td className="px-4 py-3">
                      {a.status==='confirmed' && (
                        <div className="flex gap-2">
                          <button onClick={()=>update(a.id,'done')} disabled={!!updating} className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 disabled:opacity-50">{updating===a.id?'...':'✓ Done'}</button>
                          <button onClick={()=>update(a.id,'no_show')} disabled={!!updating} className="text-xs px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg hover:bg-amber-500/20 disabled:opacity-50">No show</button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
