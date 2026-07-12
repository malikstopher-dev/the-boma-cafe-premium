'use client'

import { useState, useRef } from 'react'
import VoiceRecorder from './VoiceRecorder'

interface MessageInputProps {
  onSendText: (message: string) => void
  onSendVoice: (blob: Blob, duration: number) => void
  disabled?: boolean
}

export default function MessageInput({ onSendText, onSendVoice, disabled }: MessageInputProps) {
  const [text, setText] = useState('')
  const [mode, setMode] = useState<'text' | 'voice'>('text')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSendText(trimmed)
    setText('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleVoiceComplete = (blob: Blob, duration: number) => {
    onSendVoice(blob, duration)
    setMode('text')
  }

  if (mode === 'voice') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
        <VoiceRecorder
          onRecordingComplete={handleVoiceComplete}
          onCancel={() => setMode('text')}
        />
        <button
          onClick={() => setMode('text')}
          style={{
            padding: '8px 12px', borderRadius: 8,
            border: '1px solid #E5E7EB', background: 'transparent',
            color: '#94A3B8', fontSize: 13, cursor: 'pointer',
          }}
        >
          Type instead
        </button>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px',
      borderTop: '1px solid #E5E7EB',
      background: '#FFFFFF',
    }}>
      {/* Voice button */}
      <button
        onClick={() => setMode('voice')}
        disabled={disabled}
        style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '1px solid #E5E7EB', background: 'transparent',
          color: '#94A3B8', fontSize: 18, cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, opacity: disabled ? 0.5 : 1,
        }}
        title="Voice message"
      >
        🎤
      </button>

      {/* Text input */}
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={disabled}
        style={{
          flex: 1, padding: '10px 14px', borderRadius: 20,
          border: '1px solid #E5E7EB', background: '#F8F9FB',
          color: '#0F172A', fontSize: 14, outline: 'none',
          fontFamily: 'inherit',
        }}
      />

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        style={{
          width: 40, height: 40, borderRadius: '50%',
          border: 'none',
          background: text.trim() ? '#0F766E' : '#E5E7EB',
          color: text.trim() ? '#FFFFFF' : '#94A3B8',
          fontSize: 16, cursor: text.trim() ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'all 0.15s',
        }}
      >
        ➤
      </button>
    </div>
  )
}
