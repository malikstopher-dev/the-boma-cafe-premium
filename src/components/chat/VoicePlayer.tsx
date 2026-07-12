'use client'

import { useState, useRef, useEffect } from 'react'

interface VoicePlayerProps {
  url: string
  duration?: number
}

export default function VoicePlayer({ url, duration }: VoicePlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(duration || 0)
  const [speed, setSpeed] = useState(1)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio(url)
    audioRef.current = audio

    audio.addEventListener('loadedmetadata', () => {
      setTotalDuration(Math.round(audio.duration))
    })

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(Math.round(audio.currentTime))
    })

    audio.addEventListener('ended', () => {
      setPlaying(false)
      setCurrentTime(0)
    })

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [url])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      audioRef.current.play()
      setPlaying(true)
    }
  }

  const toggleSpeed = () => {
    const speeds = [1, 1.5, 2]
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length
    const nextSpeed = speeds[nextIdx]
    setSpeed(nextSpeed)
    if (audioRef.current) audioRef.current.playbackRate = nextSpeed
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
      background: 'rgba(139,92,246,0.08)', borderRadius: 12,
      border: '1px solid rgba(139,92,246,0.15)',
      minWidth: 200, maxWidth: 300,
    }}>
      {/* Play/Pause button */}
      <button
        onClick={togglePlay}
        style={{
          width: 36, height: 36, borderRadius: '50%',
          border: 'none', background: '#8B5CF6', color: '#fff',
          fontSize: 14, cursor: 'pointer', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {playing ? '⏸' : '▶'}
      </button>

      {/* Progress bar + time */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ height: 4, background: 'rgba(139,92,246,0.2)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#8B5CF6', borderRadius: 2, transition: 'width 0.1s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>{formatTime(currentTime)}</span>
          <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>{formatTime(totalDuration)}</span>
        </div>
      </div>

      {/* Speed toggle */}
      <button
        onClick={toggleSpeed}
        style={{
          padding: '2px 6px', borderRadius: 4,
          border: '1px solid rgba(139,92,246,0.3)', background: 'transparent',
          color: '#8B5CF6', fontSize: 11, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'monospace',
        }}
        title="Toggle speed"
      >
        {speed}x
      </button>
    </div>
  )
}
