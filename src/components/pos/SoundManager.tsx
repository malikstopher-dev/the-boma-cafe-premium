'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type SoundType = 'new-order' | 'ready' | 'cancelled' | 'bar-order' | 'kitchen-order'

interface SoundContextValue {
  soundOn: boolean
  toggleSound: () => void
  playSound: (type: SoundType) => void
}

const SoundContext = createContext<SoundContextValue>({ soundOn: true, toggleSound: () => {}, playSound: () => {} })

export function useSound() {
  return useContext(SoundContext)
}

function createOscillator(freq: number, type: OscillatorType, duration: number, volume: number) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = freq
    osc.type = type
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  } catch { /* audio not available */ }
}

function playKitchenNewOrder() {
  // Deep bell sound for kitchen
  createOscillator(440, 'sine', 0.5, 0.3)
  setTimeout(() => createOscillator(554, 'sine', 0.4, 0.2), 150)
}

function playBarNewOrder() {
  // Light chime for bar (cocktail glass feel)
  createOscillator(880, 'triangle', 0.3, 0.2)
  setTimeout(() => createOscillator(1100, 'triangle', 0.25, 0.15), 100)
  setTimeout(() => createOscillator(1320, 'sine', 0.2, 0.1), 200)
}

function playReadyChime() {
  // Success chime
  createOscillator(660, 'triangle', 0.6, 0.2)
}

function playCancelledSound() {
  // Low descending tone
  createOscillator(330, 'sawtooth', 0.3, 0.15)
  setTimeout(() => createOscillator(220, 'sawtooth', 0.4, 0.1), 150)
}

function playGenericNewOrder() {
  // Default ding
  createOscillator(880, 'sine', 0.4, 0.25)
}

const SOUND_MAP: Record<SoundType, () => void> = {
  'new-order': playGenericNewOrder,
  'kitchen-order': playKitchenNewOrder,
  'bar-order': playBarNewOrder,
  'ready': playReadyChime,
  'cancelled': playCancelledSound,
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const [soundOn, setSoundOn] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pos_sound_on')
      return stored !== null ? stored === 'true' : true
    }
    return true
  })

  const toggleSound = useCallback(() => {
    setSoundOn(prev => {
      const next = !prev
      localStorage.setItem('pos_sound_on', String(next))
      return next
    })
  }, [])

  const playSound = useCallback((type: SoundType) => {
    if (!soundOn) return
    SOUND_MAP[type]?.()
  }, [soundOn])

  return (
    <SoundContext.Provider value={{ soundOn, toggleSound, playSound }}>
      {children}
    </SoundContext.Provider>
  )
}
