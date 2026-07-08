'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase'

interface StaffProfile {
  id: string
  user_id: string
  name: string
  role: 'admin' | 'kitchen' | 'waiter'
  avatar_url: string | null
  online: boolean
  on_duty: boolean
  last_seen: string
}

interface ConversationMember {
  id: string
  conversation_id: string
  user_id: string
}

interface Conversation {
  id: string
  title: string | null
  is_group: boolean
  created_at: string
  members?: ConversationMember[]
  last_message: {
    id: string
    message: string | null
    message_type: string
    sender_id: string
    created_at: string
  } | null
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  message: string | null
  message_type: string
  voice_url: string | null
  read_at: string | null
  created_at: string
}

const ROLE_COLORS: Record<string, string> = {
  admin: '#3b82f6',
  kitchen: '#8b5cf6',
  waiter: '#10b981',
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
}

export default function StaffMessages() {
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [profiles, setProfiles] = useState<StaffProfile[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNewChat, setShowNewChat] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize staff profile
  useEffect(() => {
    const initProfile = async () => {
      let userId = localStorage.getItem('boma_staff_user_id')
      let userName = localStorage.getItem('boma_staff_name')

      if (!userId) {
        userId = crypto.randomUUID()
        localStorage.setItem('boma_staff_user_id', userId)
      }

      try {
        const authRes = await fetch('/api/admin/auth')
        const auth = await authRes.json()
        if (!auth.authenticated || !auth.role) return

        if (!userName) {
          const nameMap: Record<string, string> = { admin: 'Admin', kitchen: 'Kitchen', waiter: `Waiter ${userId.slice(0, 4)}` }
          userName = nameMap[auth.role] || auth.role
          localStorage.setItem('boma_staff_name', userName)
        }

        const res = await fetch('/api/staff/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, name: userName, role: auth.role }),
        })
        if (res.ok) {
          const p = await res.json()
          setProfile(p)
        }

        // Load all profiles
        const profilesRes = await fetch('/api/staff/profiles')
        if (profilesRes.ok) setProfiles(await profilesRes.json())
      } catch { /* */ }
    }
    initProfile()
  }, [])

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!profile) return
    try {
      const res = await fetch(`/api/staff/conversations?user_id=${profile.user_id}`)
      if (res.ok) setConversations(await res.json())
    } catch { /* */ }
  }, [profile])

  useEffect(() => {
    if (profile) { loadConversations(); setLoading(false) }
  }, [profile, loadConversations])

  // Load messages for active conversation
  const loadMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/staff/messages?conversation_id=${convId}`)
      if (res.ok) setMessages(await res.json())
    } catch { /* */ }
  }, [])

  useEffect(() => {
    if (activeConv) loadMessages(activeConv)
  }, [activeConv, loadMessages])

  // Realtime subscription for new messages
  useEffect(() => {
    if (!activeConv) return
    const supabase = createBrowserClient()
    const channel = supabase
      .channel(`staff-messages-${activeConv}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'staff_messages', filter: `conversation_id=eq.${activeConv}` },
        (payload) => {
          const msg = payload.new as Message
          setMessages((prev) => [...prev, msg])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeConv])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Update online status
  useEffect(() => {
    if (!profile) return
    const interval = setInterval(async () => {
      await fetch('/api/staff/profiles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: profile.user_id, online: true, last_seen: new Date().toISOString() }),
      })
    }, 60000)
    return () => clearInterval(interval)
  }, [profile])

  // Set online on mount, offline on unmount
  useEffect(() => {
    if (!profile) return
    fetch('/api/staff/profiles', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: profile.user_id, online: true, last_seen: new Date().toISOString() }),
    })
    return () => {
      fetch('/api/staff/profiles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: profile.user_id, online: false }),
      })
    }
  }, [profile])

  const handleSend = async () => {
    if (!inputText.trim() || !activeConv || !profile) return
    const text = inputText.trim()
    setInputText('')
    try {
      await fetch('/api/staff/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: activeConv, sender_id: profile.user_id, message: text, message_type: 'text' }),
      })
    } catch { /* */ }
  }

  const startConversation = async () => {
    if (!profile) return
    const memberIds = [profile.user_id, ...selectedMembers]
    try {
      const res = await fetch('/api/staff/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_ids: memberIds }),
      })
      if (res.ok) {
        const conv = await res.json()
        setActiveConv(conv.id)
        setShowNewChat(false)
        setSelectedMembers([])
        loadConversations()
      }
    } catch { /* */ }
  }

  const getProfileName = (userId: string) => profiles.find(p => p.user_id === userId)?.name || userId.slice(0, 8)
  const getProfileRole = (userId: string) => profiles.find(p => p.user_id === userId)?.role || 'waiter'
  const getProfileOnline = (userId: string) => profiles.find(p => p.user_id === userId)?.online || false

  const otherProfiles = profiles.filter(p => p.user_id !== profile?.user_id)

  const activeConvData = conversations.find(c => c.id === activeConv)
  const activeConvMembers = profiles.filter(p =>
    p.user_id !== profile?.user_id &&
    conversations.find(c => c.id === activeConv)?.members?.some((m: any) => m.user_id === p.user_id)
  )

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60dvh', color: 'rgba(255,255,255,0.3)' }}>
        Loading...
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60dvh', color: 'rgba(255,255,255,0.4)', padding: '2rem', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <p>Please sign in to access messages.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: 'calc(100dvh - 100px)', display: 'flex', background: '#0f0f1a', overflow: 'hidden' }}>
      {/* Sidebar: conversations */}
      <div style={{
        width: sidebarOpen ? '300px' : '0px',
        minWidth: sidebarOpen ? '300px' : '0px',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.2s, min-width 0.2s',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>💬 Messages</span>
          <button
            onClick={() => setShowNewChat(!showNewChat)}
            style={{ padding: '0.35rem 0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#f59e0b', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            + New
          </button>
        </div>

        {showNewChat && (
          <div style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Select staff to message:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
              {otherProfiles.map((p) => (
                <label key={p.user_id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', color: selectedMembers.includes(p.user_id) ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(p.user_id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedMembers(prev => [...prev, p.user_id])
                      else setSelectedMembers(prev => prev.filter(id => id !== p.user_id))
                    }}
                    style={{ accentColor: '#f59e0b' }}
                  />
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.online ? '#10b981' : 'rgba(255,255,255,0.2)', display: 'inline-block' }} />
                  {p.name}
                  <span style={{ fontSize: '0.7rem', color: ROLE_COLORS[p.role] }}>({p.role})</span>
                </label>
              ))}
            </div>
            <button
              onClick={startConversation}
              disabled={selectedMembers.length === 0}
              style={{
                width: '100%', padding: '0.5rem', borderRadius: '8px', border: 'none',
                background: selectedMembers.length > 0 ? '#f59e0b' : 'rgba(255,255,255,0.05)',
                color: selectedMembers.length > 0 ? '#000' : 'rgba(255,255,255,0.3)',
                fontWeight: 700, cursor: selectedMembers.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: '0.85rem',
              }}
            >
              Start Conversation
            </button>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>
              No conversations yet. Start a new one!
            </div>
          )}
          {conversations.map((conv) => {
            const otherMembers = profiles.filter(p =>
              conv.members?.some((m: any) => m.user_id === p.user_id) && p.user_id !== profile?.user_id
            )
            const convName = conv.title || otherMembers.map(m => m.name).join(', ') || 'Chat'
            const lastMsgText = conv.last_message?.message || (conv.last_message?.message_type === 'voice' ? '🎤 Voice message' : '')
            const isActive = conv.id === activeConv

            return (
              <button
                key={conv.id}
                onClick={() => { setActiveConv(conv.id); setSidebarOpen(false) }}
                style={{
                  width: '100%', padding: '0.75rem 1rem', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: isActive ? 'rgba(245,158,11,0.08)' : 'transparent',
                  cursor: 'pointer', textAlign: 'left', display: 'block',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                  <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{convName}</span>
                  {conv.last_message && (
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>
                      {formatTime(conv.last_message.created_at)}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {lastMsgText}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main: chat window */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {!activeConv ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '3rem' }}>💬</span>
            <span style={{ fontSize: '0.95rem' }}>Select a conversation</span>
            <button onClick={() => setSidebarOpen(true)} style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#f59e0b', cursor: 'pointer', fontSize: '0.8rem' }}>
              Open conversations
            </button>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
              <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1.1rem', padding: 0, display: 'none' }}>
                ←
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                  {activeConvData?.title || activeConvMembers.map(m => m.name).join(', ') || 'Chat'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                  {activeConvMembers.map(m => `${m.name} (${m.role})`).join(', ')}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>
                  No messages yet. Say hello!
                </div>
              )}
              {messages.map((msg) => {
                const isMe = msg.sender_id === profile?.user_id
                const senderName = getProfileName(msg.sender_id)
                const senderRole = getProfileRole(msg.sender_id)

                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    {!isMe && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.15rem', marginLeft: '0.25rem' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: ROLE_COLORS[senderRole] || 'rgba(255,255,255,0.3)', display: 'inline-block' }} />
                        <span style={{ fontSize: '0.7rem', color: ROLE_COLORS[senderRole], fontWeight: 600 }}>{senderName}</span>
                      </div>
                    )}
                    <div style={{
                      maxWidth: '80%', padding: '0.6rem 0.9rem', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isMe ? '#f59e0b' : '#1e1e38',
                      color: isMe ? '#000' : '#fff',
                      fontSize: '0.9rem', lineHeight: 1.4, wordBreak: 'break-word',
                    }}>
                      {msg.message_type === 'voice' ? (
                        <span>🎤 Voice message {msg.voice_url && <a href={msg.voice_url} target="_blank" style={{ color: isMe ? '#000' : '#f59e0b' }}>Play</a>}</span>
                      ) : msg.message_type === 'system' ? (
                        <span style={{ fontStyle: 'italic', opacity: 0.6 }}>{msg.message}</span>
                      ) : (
                        msg.message
                      )}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', marginTop: '0.15rem', padding: '0 0.25rem' }}>
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.5rem', flexShrink: 0, background: '#16162a' }}>
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Type a message..."
                style={{
                  flex: 1, padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '0.95rem', outline: 'none',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                style={{
                  padding: '0.75rem 1.25rem', borderRadius: '12px', border: 'none',
                  background: inputText.trim() ? '#f59e0b' : 'rgba(255,255,255,0.05)',
                  color: inputText.trim() ? '#000' : 'rgba(255,255,255,0.3)',
                  fontWeight: 700, cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '0.95rem',
                }}
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
