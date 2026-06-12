'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { api } from '@/lib/api'
import { MessageSquare, Bot, User } from 'lucide-react'

function Avatar({ name, phone }: { name?: string; phone?: string }) {
  const cols = [
    'bg-emerald-500/20 text-emerald-300',
    'bg-blue-500/20 text-blue-300',
    'bg-purple-500/20 text-purple-300',
    'bg-amber-500/20 text-amber-300',
  ]
  const p   = phone || ''
  const c   = cols[p.charCodeAt(p.length - 1) % cols.length]
  const ini = name
    ? name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : p.slice(-2)
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${c}`}>
      {ini}
    </div>
  )
}

export default function ConversationsPage() {
  const [convos,      setConvos]      = useState<any[]>([])
  const [selected,    setSelected]    = useState<any>(null)
  const [messages,    setMessages]    = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [loadMsgs,    setLoadMsgs]    = useState(false)

  // Refs for auto-scroll and polling
  const bottomRef      = useRef<HTMLDivElement>(null)
  const selectedRef    = useRef<any>(null)
  const messagesRef    = useRef<any[]>([])
  const pollingRef     = useRef<NodeJS.Timeout | null>(null)

  // Keep refs in sync
  selectedRef.current  = selected
  messagesRef.current  = messages

  // ── Scroll to bottom of messages ──────────────────
  function scrollToBottom(smooth = true) {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({
        behavior: smooth ? 'smooth' : 'instant'
      })
    }, 50)
  }

  // ── Load messages for a conversation ──────────────
  async function loadMessages(customerId: string, jumpToBottom = true) {
    const { data } = await api.getMessages(customerId)
    if (data) {
      setMessages(data)
      if (jumpToBottom) scrollToBottom(false) // instant on first load
    }
  }

  // ── Select a conversation ──────────────────────────
  async function selectConvo(c: any) {
    setSelected(c)
    setLoadMsgs(true)
    await loadMessages(c.id, true)
    setLoadMsgs(false)
  }

  // ── Refresh conversations list silently ───────────
  const refreshConvos = useCallback(async () => {
    const { data } = await api.getConversations()
    if (!data) return
    setConvos(data)

    // If a conversation is selected, refresh its messages too
    const cur = selectedRef.current
    if (cur) {
      const { data: msgs } = await api.getMessages(cur.id)
      if (!msgs) return

      const prevCount = messagesRef.current.length
      const newCount  = msgs.length

      if (newCount > prevCount) {
        // New messages arrived — update and scroll to bottom
        setMessages(msgs)
        scrollToBottom(true) // smooth scroll for new messages
      }
    }
  }, [])

  // ── Initial load ──────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data } = await api.getConversations()
      if (data) {
        setConvos(data)
        if (data.length > 0) {
          setSelected(data[0])
          await loadMessages(data[0].id, true)
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  // ── Auto-refresh every 4 seconds ──────────────────
  useEffect(() => {
    pollingRef.current = setInterval(refreshConvos, 4000)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [refreshConvos])

  function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="animate-in max-w-6xl">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-white mb-1">Conversations</h1>
        <p className="text-sm text-zinc-500">
          All WhatsApp chats · Auto-refreshes every 4 seconds
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex"
        style={{ height: '75vh' }}>

        {/* ── Left: conversation list ── */}
        <div className="w-72 border-r border-zinc-800 flex flex-col flex-shrink-0">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <p className="text-xs text-zinc-500 font-medium">{convos.length} conversations</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse" />
              <span className="text-xs text-zinc-600">Live</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-10 text-zinc-600 text-xs">Loading...</div>
            ) : convos.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare size={24} className="text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-600 text-xs">No conversations yet</p>
                <p className="text-zinc-700 text-xs mt-1">Send a WhatsApp message to start</p>
              </div>
            ) : (
              convos.map((c: any) => (
                <button key={c.id} onClick={() => selectConvo(c)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left border-b border-zinc-800/50 ${
                    selected?.id === c.id
                      ? 'bg-emerald-500/5 border-l-2 border-l-emerald-500'
                      : 'hover:bg-zinc-800/50'
                  }`}>
                  <Avatar name={c.name} phone={c.phone} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs font-semibold text-white truncate">
                        {c.name || c.phone}
                      </p>
                      <p className="text-xs text-zinc-600 ml-1 flex-shrink-0">{c.last_time}</p>
                    </div>
                    <p className="text-xs text-zinc-500 truncate">{c.last_msg}</p>
                  </div>
                  {c.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-black text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {c.unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Right: message thread ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare size={32} className="text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-600 text-sm">Select a conversation</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/50">
                <Avatar name={selected.name} phone={selected.phone} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">
                    {selected.name || selected.phone}
                  </p>
                  <p className="text-xs text-zinc-500 font-mono">{selected.phone}</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <Bot size={11} className="text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-medium">AI handling</span>
                </div>
              </div>

              {/* Messages — scrollable, lands at bottom */}
              <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4"
                style={{ background: '#0d0d10' }}>

                {loadMsgs ? (
                  <div className="text-center py-10 text-zinc-600 text-xs">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-10 text-zinc-700 text-xs">
                    No messages yet
                  </div>
                ) : (
                  <>
                    {messages.map((m: any) => {
                      const isBot = m.role === 'assistant'
                      return (
                        <div key={m.id}
                          className={`flex items-end gap-2 ${isBot ? 'flex-row-reverse' : 'flex-row'}`}>

                          {/* Icon */}
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-1 ${
                            isBot ? 'bg-emerald-500/20' : 'bg-zinc-700'
                          }`}>
                            {isBot
                              ? <Bot size={12} className="text-emerald-400" />
                              : <User size={12} className="text-zinc-400" />
                            }
                          </div>

                          {/* Bubble */}
                          <div className={`flex flex-col ${isBot ? 'items-end' : 'items-start'} max-w-xs lg:max-w-sm xl:max-w-md`}>
                            <p className="text-xs text-zinc-600 mb-1 px-1">
                              {isBot ? 'BizBot AI' : (selected.name || 'Customer')}
                            </p>
                            <div className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                              isBot
                                ? 'bg-emerald-600 text-white rounded-2xl rounded-br-sm'
                                : 'bg-zinc-700 text-zinc-100 rounded-2xl rounded-bl-sm'
                            }`}>
                              {m.content}
                            </div>
                            <p className="text-xs text-zinc-600 mt-1 px-1">
                              {formatTime(m.created_at)}
                            </p>
                          </div>
                        </div>
                      )
                    })}

                    {/* ✅ Invisible div at bottom — scroll target */}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-2.5 border-t border-zinc-800 bg-zinc-900/50 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse" />
                <p className="text-xs text-zinc-600">
                  Auto-refreshing · BizBot AI handling this conversation · Read-only view
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
