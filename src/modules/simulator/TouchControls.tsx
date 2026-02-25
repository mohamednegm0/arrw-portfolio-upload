// ============================================
// TouchControls — Virtual joystick for mobile
// Transparent overlay with left-side joystick
// ============================================

import { useRef, useEffect, useCallback } from 'react'
import { useGameStore } from '../../store/gameStore'

const JOYSTICK_SIZE = 120
const KNOB_SIZE = 48

// We expose keyboard-like state that PlayerDriver already reads
// by dispatching synthetic keyboard events
function simulateKey(key: string, down: boolean) {
  window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { key, bubbles: true }))
}

export default function TouchControls() {
  const gameMode = useGameStore((s) => s.gameMode)
  const joystickRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const activeTouch = useRef<number | null>(null)
  const origin = useRef({ x: 0, y: 0 })
  const activeKeys = useRef(new Set<string>())

  const clearKeys = useCallback(() => {
    for (const k of activeKeys.current) simulateKey(k, false)
    activeKeys.current.clear()
  }, [])

  const setKey = useCallback((key: string, active: boolean) => {
    if (active && !activeKeys.current.has(key)) {
      activeKeys.current.add(key)
      simulateKey(key, true)
    } else if (!active && activeKeys.current.has(key)) {
      activeKeys.current.delete(key)
      simulateKey(key, false)
    }
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (activeTouch.current !== null) return
    const touch = e.changedTouches[0]
    activeTouch.current = touch.identifier
    const rect = joystickRef.current!.getBoundingClientRect()
    origin.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      if (touch.identifier !== activeTouch.current) continue

      const dx = touch.clientX - origin.current.x
      const dy = touch.clientY - origin.current.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const maxDist = JOYSTICK_SIZE / 2 - KNOB_SIZE / 2

      const clampedDist = Math.min(dist, maxDist)
      const angle = Math.atan2(dy, dx)
      const nx = Math.cos(angle) * clampedDist
      const ny = Math.sin(angle) * clampedDist

      if (knobRef.current) {
        knobRef.current.style.transform = `translate(${nx}px, ${ny}px)`
      }

      // Map to WASD
      const threshold = maxDist * 0.3
      setKey('w', dy < -threshold)
      setKey('s', dy > threshold)
      setKey('a', dx < -threshold)
      setKey('d', dx > threshold)
    }
  }, [setKey])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouch.current) {
        activeTouch.current = null
        if (knobRef.current) {
          knobRef.current.style.transform = 'translate(0px, 0px)'
        }
        clearKeys()
      }
    }
  }, [clearKeys])

  // Detect touch device
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  if (gameMode !== 'driver' || !isTouchDevice) return null

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {/* Joystick area (bottom left) */}
      <div
        ref={joystickRef}
        className="absolute bottom-24 left-8 pointer-events-auto"
        style={{ width: JOYSTICK_SIZE, height: JOYSTICK_SIZE }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* Base ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-white/20"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          }}
        />
        {/* Knob */}
        <div
          ref={knobRef}
          className="absolute rounded-full bg-white/30 border border-white/40"
          style={{
            width: KNOB_SIZE,
            height: KNOB_SIZE,
            left: (JOYSTICK_SIZE - KNOB_SIZE) / 2,
            top: (JOYSTICK_SIZE - KNOB_SIZE) / 2,
            transition: 'transform 0.05s ease-out',
          }}
        />
      </div>

      {/* Direction labels */}
      <div className="absolute bottom-44 left-8 text-xs text-white/30 text-center" style={{ width: JOYSTICK_SIZE }}>
        ▲
      </div>
      <div className="absolute bottom-16 left-8 text-xs text-white/30 text-center" style={{ width: JOYSTICK_SIZE }}>
        ▼
      </div>
    </div>
  )
}
