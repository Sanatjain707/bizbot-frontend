'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { api } from '@/lib/api'
import { Avatar, Badge, EmptyState, Skeleton, showToast, Input, Toggle } from '@/components/ui'
import { MessageSquare, Bot, User, Send, Search, Bell, BellOff } from 'lucide-react'
import { formatISTDateTime } from '@/lib/dateTime'

export default function ConversationsPage() {
  const [convos,   setConvos]   = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [loadMsgs, setLoadMsgs] = useState(false)
  const [search,   setSearch]   = useState('')
  const [reply,    setReply]    = useState('')
  const [sending,  setSending]  = useState(false)
  const [aiEnabled,setAiEnabled]= useState(true)
  const [notifsOn, setNotifsOn] = useState(false)

  const bottomRef      = useRef<HTMLDivElement>(null)
  const selectedRef    = useRef<any>(null)
  const msgIdsRef      = useRef<Set<string>>(new Set())
  const totalUnreadRef = useRef(0)
  const notifsOnRef    = useRef(false)
  selectedRef.current = selected
  notifsOnRef.current = notifsOn
  msgIdsRef.current = new Set(messages.map(m => m.id))

  function scrollToBottom(smooth = true) {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' }), 50)
  }

  // ── Browser notifications ───────────────────────────
  async function enableNotifs() {
    if (!('Notification' in window)) { showToast('Notifications not supported', 'error'); return }
    const perm = await Notification.requestPermission()
    if (perm === 'granted') { setNotifsOn(true); showToast('Notifications enabled', 'success') }
    else showToast('Notifications blocked', 'error')
  }

  function notify(title: string, body: string) {
    if (notifsOnRef.current && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' })
    }
  }

  async function loadMessages(cid: string, jump = true) {
    const { data } = await api.getMessages(cid)
    if (data) { setMessages(data); if (jump) scrollToBottom(false) }
  }

  async function selectConvo(c: any) {
    setSelected(c); setLoadMsgs(true)
    setAiEnabled(c.ai_enabled !== false)
    await loadMessages(c.id, true)
    setLoadMsgs(false)
  }

  // Refresh doesn't depend on notifsOn (we read it from a ref) so the polling
  // interval isn't torn down + rebuilt every time the user toggles alerts.
  const refresh = useCallback(async () => {
    const { data } = await api.getConversations()
    if (data) {
      setConvos(data)
      const totalUnread = data.reduce((s: number, c: any) => s + (c.unread || 0), 0)
      if (totalUnread > totalUnreadRef.current) {
        const newest = data.find((c: any) => c.unread > 0)
        if (newest) notify(`New message from ${newest.name || newest.phone}`, newest.last_msg)
      }
      totalUnreadRef.current = totalUnread
    }
    // Capture the selected conversation BEFORE the second await — otherwise
    // if the user clicks a different chat while getMessages() is in flight,
    // we'd merge messages from the wrong customer into the current view.
    const cur = selectedRef.current
    if (!cur) return
    const targetId = cur.id
    const { data: msgs } = await api.getMessages(targetId)
    if (!msgs) return
    // If the user switched chats during the fetch, drop the result.
    if (selectedRef.current?.id !== targetId) return
    // Compare by message-id set instead of raw length — length alone missed
    // same-count reorders and locked in optimistic "temp-" bubbles forever
    // (temp id is never present on the server, so length matched).
    const seen = msgIdsRef.current
    const hasNew    = msgs.some((m: any) => !seen.has(m.id))
    const hasFewer  = msgs.length < seen.size
    const droppedTemp = Array.from(seen).some((id: any) => typeof id === 'string' && id.startsWith('temp-'))
    if (hasNew || hasFewer || droppedTemp) {
      setMessages(msgs)
      if (hasNew) scrollToBottom(true)
    }
  }, [])

  // Initial load runs ONCE — never re-triggered by notifsOn toggling.
  useEffect(() => {
    let cancelled = false
    async function init() {
      const { data } = await api.getConversations()
      if (cancelled) return
      if (data) {
        setConvos(data)
        if (data.length) {
          setSelected(data[0])
          setAiEnabled(data[0].ai_enabled !== false)
          await loadMessages(data[0].id, true)
        }
      }
      if (!cancelled) setLoading(false)
    }
    init()
    return () => { cancelled = true }
  }, [])

  // Polling lives in its own effect so it can restart cleanly without
  // stampeding init(). Refresh is stable (no deps) so this runs once.
  useEffect(() => {
    const t = setInterval(refresh, 4000)
    return () => clearInterval(t)
  }, [refresh])

  async function toggleAI(enabled: boolean) {
    if (!selected) return
    setAiEnabled(enabled)
    await api.toggleAI(selected.id, enabled)
    showToast(enabled ? 'AI enabled for this chat' : 'AI paused — you reply manually', 'success')
  }

  async function sendReply() {
    if (!reply.trim() || !selected) return
    setSending(true)
    const text = reply.trim()
    setReply('')
    setMessages(prev => [...prev, { id: 'temp-' + Date.now(), role: 'assistant', content: text, created_at: new Date().toISOString() }])
    scrollToBottom(true)
    const { error } = await api.sendManualMessage(selected.id, text)
    if (error) showToast('Failed to send', 'error')
    else { showToast('Message sent', 'success'); await loadMessages(selected.id, true) }
    setSending(false)
  }

  const filtered = convos.filter(c => !search || (c.name || '').toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search))

  return (
    <div className="animate-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#E8EAED] mb-1 font-[Syne]">Conversations</h1>
          <p className="text-sm text-[#5A6370]">All WhatsApp chats · Auto-refreshes every 4 seconds</p>
        </div>
        <button onClick={notifsOn ? () => setNotifsOn(false) : enableNotifs}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${notifsOn ? 'bg-[rgba(0,197,122,0.1)] text-[#00C57A] border border-[rgba(0,197,122,0.2)]' : 'bg-[#141618] text-[#9AA0AB] border border-[rgba(255,255,255,0.06)]'}`}>
          {notifsOn ? <Bell size={13} /> : <BellOff size={13} />}
          {notifsOn ? 'Alerts on' : 'Enable alerts'}
        </button>
      </div>

      <div className="bg-[#0F1012] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden flex" style={{ height: '74vh' }}>
        {/* List */}
        <div className="w-72 border-r border-[rgba(255,255,255,0.06)] flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-[rgba(255,255,255,0.06)]">
            <Input icon={Search} placeholder="Search chats..." value={search} onChange={(e: any) => setSearch(e.target.value)} />
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-3 space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <EmptyState icon={MessageSquare} title="No chats" desc="Messages appear here" />
            ) : filtered.map((c: any) => (
              <button key={c.id} onClick={() => selectConvo(c)}
                className={`w-full flex items-center gap-3 px-3 py-3.5 text-left border-b border-[rgba(255,255,255,0.03)] transition-all ${selected?.id === c.id ? 'bg-[rgba(0,197,122,0.06)] border-l-2 border-l-[#00C57A]' : 'hover:bg-[#141618]'}`}>
                <Avatar name={c.name} phone={c.phone} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#E8EAED] truncate">{c.name || c.phone}</p>
                    <p className="text-xs text-[#5A6370] ml-1">{c.last_time}</p>
                  </div>
                  <p className="text-xs text-[#5A6370] truncate mt-0.5">{c.last_msg}</p>
                </div>
                {c.unread > 0 && <span className="w-5 h-5 rounded-full bg-[#00C57A] text-black text-xs font-bold flex items-center justify-center">{c.unread}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon={MessageSquare} title="Select a conversation" desc="Choose a chat to view messages" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-5 py-3 border-b border-[rgba(255,255,255,0.06)]">
                <Avatar name={selected.name} phone={selected.phone} size="md" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#E8EAED]">{selected.name || selected.phone}</p>
                  <p className="text-xs text-[#5A6370] font-mono">{selected.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#5A6370]">AI</span>
                  <Toggle checked={aiEnabled} onChange={toggleAI} />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4" style={{ background: '#0A0B0C' }}>
                {loadMsgs ? (
                  <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-2/3" />)}</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-10 text-[#5A6370] text-xs">No messages yet</div>
                ) : (
                  <>
                    {messages.map((m: any) => {
                      const isBot = m.role === 'assistant'
                      return (
                        <div key={m.id} className={`flex items-end gap-2 ${isBot ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-1 ${isBot ? 'bg-[rgba(0,197,122,0.15)]' : 'bg-[#2A2F35]'}`}>
                            {isBot ? <Bot size={12} className="text-[#00C57A]" /> : <User size={12} className="text-[#9AA0AB]" />}
                          </div>
                          <div className={`flex flex-col ${isBot ? 'items-end' : 'items-start'} max-w-md`}>
                            <p className="text-xs text-[#5A6370] mb-1 px-1">{isBot ? 'BizBot AI' : (selected.name || 'Customer')}</p>
                            <div className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${isBot ? 'bg-[#00875A] text-white rounded-2xl rounded-br-sm' : 'bg-[#2A2F35] text-[#E8EAED] rounded-2xl rounded-bl-sm'}`}>{m.content}</div>
                            <p className="text-xs text-[#5A6370] mt-1 px-1">{formatISTDateTime(m.created_at).time}</p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.06)] flex items-center gap-2">
                <input value={reply} onChange={e => setReply(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
                  placeholder={aiEnabled ? 'Send a message (AI is also active)...' : 'AI paused — type your reply...'}
                  className="flex-1 bg-[#141618] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-2.5 text-sm text-[#E8EAED] placeholder:text-[#5A6370] outline-none focus:border-[rgba(0,197,122,0.5)]" />
                <button onClick={sendReply} disabled={sending || !reply.trim()}
                  className="w-10 h-10 rounded-xl bg-[#00C57A] hover:bg-[#00d986] disabled:opacity-40 flex items-center justify-center transition-all">
                  {sending ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full spin" /> : <Send size={15} className="text-black" />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
