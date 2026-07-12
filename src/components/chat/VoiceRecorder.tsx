'use client'

import { useState, useRef, useCallback } from 'react'

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void
  onCancel: () => void
  maxDuration?: number // seconds
}

export default function VoiceRecorder({ onRecordingComplete, onCancel, maxDuration = 60 }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [paused, setPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const dur = Math.round((Date.now() - startTimeRef.current) / 1000)
        onRecordingComplete(blob, dur)
      }

      mediaRecorder.start(100) // collect data every 100ms
      startTimeRef.current = Date.now()
      setRecording(true)
      setPaused(false)
      setDuration(0)

      timerRef.current = setInterval(() => {
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
        setDuration(elapsed)
        if (elapsed >= maxDuration) stopRecording()
      }, 200)
    } catch (err) {
      setError('Microphone access denied')
      console.error('VoiceRecorder error:', err)
    }
  }, [maxDuration, onRecordingComplete])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) clearInterval(timerRef.current)
    setRecording(false)
    setPaused(false)
  }, [])

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.ondataavailable = null
      mediaRecorderRef.current.onstop = null
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) clearInterval(timerRef.current)
    chunksRef.current = []
    setRecording(false)
    setPaused(false)
    setDuration(0)
    onCancel()
  }, [onCancel])

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>
        <span style={{ color: '#EF4444', fontSize: 13 }}>{error}</span>
        <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 13 }}>Dismiss</button>
      </div>
    )
  }

  if (!recording) {
    return (
      <button
        onClick={startRecording}
        style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '2px solid #EF4444', background: 'rgba(239,68,68,0.1)',
          color: '#EF4444', fontSize: 20, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title="Record voice message"
      >
        🎤
      </button>
    )
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
      background: 'rgba(239,68,68,0.08)', borderRadius: 12,
      border: '1px solid rgba(239,68,68,0.2)',
    }}>
      {/* Waveform visualization (simplified) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 24 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 3,
              height: `${8 + Math.random() * 16}px`,
              background: '#EF4444',
              borderRadius: 2,
              animation: `pulse 0.5s ease-in-out ${i * 0.05}s infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* Duration */}
      <span style={{ fontFamily: 'monospace', fontSize: 14, color: '#EF4444', fontWeight: 600, minWidth: 40 }}>
        {formatDuration(duration)}
      </span>

      {/* Max duration indicator */}
      <span style={{ fontSize: 11, color: '#94A3B8' }}>/ {formatDuration(maxDuration)}</span>

      {/* Stop button */}
      <button
        onClick={stopRecording}
        style={{
          width: 36, height: 36, borderRadius: '50%',
          border: 'none', background: '#EF4444', color: '#fff',
          fontSize: 16, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title="Stop and send"
      >
        ■
      </button>

      {/* Cancel button */}
      <button
        onClick={cancelRecording}
        style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '1px solid rgba(239,68,68,0.3)', background: 'transparent',
          color: '#EF4444', fontSize: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title="Cancel"
      >
        ✕
      </button>

      <style>{`@keyframes pulse { from { opacity: 0.4; } to { opacity: 1; } }`}</style>
    </div>
  )
}
