'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'

interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  message: string | null
  message_type: 'text' | 'voice' | 'system'
  voice_url: string | null
  voice_duration: number | null
  created_at: string
}

interface ChatWindowProps {
  conversationId: string
  currentUserId: string
  currentUserName: string
  staffProfiles: Record<string, { name: string; role: string }>
  onClose?: () => void
}

export default function ChatWindow({ conversationId, currentUserId, currentUserName, staffProfiles, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await fetch(`/api/staff/messages?conversation_id=${conversationId}&limit=100`)
        if (res.ok) {
          const data = await res.json()
          setMessages(data)
        }
      } catch (err) {
        console.error('Failed to load messages:', err)
      } finally {
        setLoading(false)
      }
    }
    loadMessages()
  }, [conversationId])

  // Realtime subscription
  useEffect(() => {
    const supabase = createBrowserClient()
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'staff_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const newMsg = payload.new as ChatMessage
        setMessages(prev => [...prev, newMsg])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send text message
  const handleSendText = useCallback(async (text: string) => {
    setSending(true)
    try {
      const res = await fetch('/api/staff/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          sender_id: currentUserId,
          message: text,
          message_type: 'text',
        }),
      })
      if (!res.ok) console.error('Failed to send message')
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSending(false)
    }
  }, [conversationId, currentUserId])

  // Upload voice and send
  const handleSendVoice = useCallback(async (blob: Blob, duration: number) => {
    setSending(true)
    try {
      // Upload voice file to Supabase Storage
      const fileName = `voice-${Date.now()}.webm`
      const filePath = `voice-notes/${conversationId}/${fileName}`

      const uploadRes = await fetch('/api/staff/voice-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          file_name: fileName,
          file_type: 'audio/webm',
        }),
      })

      if (!uploadRes.ok) {
        console.error('Failed to get upload URL')
        return
      }

      const { upload_url, public_url } = await uploadRes.json()

      // Upload the actual file
      await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': 'audio/webm' },
        body: blob,
      })

      // Send message with voice URL
      await fetch('/api/staff/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          sender_id: currentUserId,
          message_type: 'voice',
          voice_url: public_url,
          voice_duration: duration,
        }),
      })
    } catch (err) {
      console.error('Failed to send voice:', err)
    } finally {
      setSending(false)
    }
  }, [conversationId, currentUserId])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#F8F9FB', fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onClose && (
            <button onClick={onClose} style={{
              background: 'none', border: 'none', color: '#94A3B8',
              fontSize: 18, cursor: 'pointer', padding: 4,
            }}>←</button>
          )}
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>
              {Object.values(staffProfiles).map(p => p.name).join(', ') || 'Chat'}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#94A3B8' }}>Loading...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#94A3B8' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
            <p>No messages yet</p>
            <p style={{ fontSize: 12 }}>Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender_id === currentUserId}
              senderName={staffProfiles[msg.sender_id]?.name}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSendText={handleSendText}
        onSendVoice={handleSendVoice}
        disabled={sending}
      />
    </div>
  )
}
