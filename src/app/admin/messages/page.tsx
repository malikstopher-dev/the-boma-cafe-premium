'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/admin/design-system/PageHeader'
import { ConversationList, ChatWindow } from '@/components/chat'
import { useToast } from '@/components/admin/design-system/Toast'

interface StaffProfile {
  id: string
  user_id: string
  name: string
  role: string
}

export default function AdminMessagesPage() {
  const [staffProfiles, setStaffProfiles] = useState<Record<string, { name: string; role: string }>>({})
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [currentUserName, setCurrentUserName] = useState<string>('')
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [showNewChat, setShowNewChat] = useState(false)
  const [staffList, setStaffList] = useState<StaffProfile[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])
  const { error: showError } = useToast()

  // Load current user info
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('/api/staff/session')
        if (res.ok) {
          const data = await res.json()
          if (data.authenticated) {
            setCurrentUserId(data.staff.id)
            setCurrentUserName(data.staff.name)
          }
        }
      } catch { /* ignore */ }
    }
    loadUser()
  }, [])

  // Load staff profiles
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const res = await fetch('/api/staff/list')
        if (res.ok) {
          const data = await res.json()
          const profiles: Record<string, { name: string; role: string }> = {}
          const list: StaffProfile[] = []
          for (const s of data.staff || []) {
            profiles[s.id] = { name: s.name, role: s.role }
            list.push({ id: s.id, user_id: s.id, name: s.name, role: s.role })
          }
          setStaffProfiles(profiles)
          setStaffList(list)
        }
      } catch { /* ignore */ }
    }
    loadProfiles()
  }, [])

  // Create new conversation
  const handleCreateConversation = async () => {
    if (selectedStaff.length < 1) {
      showError('Select at least one staff member')
      return
    }

    const memberIds = [currentUserId, ...selectedStaff]
    try {
      const res = await fetch('/api/staff/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_ids: memberIds }),
      })
      if (res.ok) {
        const conv = await res.json()
        setSelectedConversation(conv.id)
        setShowNewChat(false)
        setSelectedStaff([])
      }
    } catch {
      showError('Failed to create conversation')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      <PageHeader title="Messages" description="Chat with staff" />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB' }}>
        {/* Left: Conversation list */}
        <div style={{
          width: 320, borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column',
          flexShrink: 0,
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>
            <button
              onClick={() => setShowNewChat(!showNewChat)}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                border: '1px solid #0F766E', background: showNewChat ? '#ECFDF5' : 'transparent',
                color: '#0F766E', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {showNewChat ? '← Back' : '+ New Chat'}
            </button>
          </div>

          {showNewChat ? (
            /* New chat form */
            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
              <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 12 }}>Select staff to chat with:</p>
              {staffList.filter(s => s.id !== currentUserId).map(staff => (
                <label key={staff.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                  borderRadius: 8, cursor: 'pointer',
                  background: selectedStaff.includes(staff.id) ? '#ECFDF5' : 'transparent',
                  marginBottom: 4,
                }}>
                  <input
                    type="checkbox"
                    checked={selectedStaff.includes(staff.id)}
                    onChange={e => {
                      if (e.target.checked) setSelectedStaff(prev => [...prev, staff.id])
                      else setSelectedStaff(prev => prev.filter(id => id !== staff.id))
                    }}
                  />
                  <span style={{ fontSize: 14 }}>{staff.name}</span>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>{staff.role}</span>
                </label>
              ))}
              <button
                onClick={handleCreateConversation}
                disabled={selectedStaff.length === 0}
                style={{
                  width: '100%', marginTop: 12, padding: '10px 16px', borderRadius: 8,
                  border: 'none', background: selectedStaff.length > 0 ? '#0F766E' : '#E5E7EB',
                  color: selectedStaff.length > 0 ? '#fff' : '#94A3B8',
                  fontSize: 14, fontWeight: 600, cursor: selectedStaff.length > 0 ? 'pointer' : 'default',
                }}
              >
                Start Chat
              </button>
            </div>
          ) : (
            /* Conversation list */
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {currentUserId && (
                <ConversationList
                  currentUserId={currentUserId}
                  staffProfiles={staffProfiles}
                  onSelect={setSelectedConversation}
                  selectedId={selectedConversation || undefined}
                />
              )}
            </div>
          )}
        </div>

        {/* Right: Chat window */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedConversation && currentUserId ? (
            <ChatWindow
              conversationId={selectedConversation}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              staffProfiles={staffProfiles}
              onClose={() => setSelectedConversation(null)}
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                <p style={{ fontSize: 16, fontWeight: 600 }}>Select a conversation</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>Or start a new chat</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
