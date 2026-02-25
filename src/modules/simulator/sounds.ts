// ============================================
// Synth Audio — Web Audio API sound effects
// No external files needed — pure synthesis
// ============================================

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// ─── Pickup sound (ascending arpeggio) ──────
export function playPickupSound() {
  try {
    const ac = getCtx()
    const now = ac.currentTime
    const notes = [523.25, 659.25, 783.99] // C5, E5, G5

    notes.forEach((freq, i) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.type = 'square'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.15, now + i * 0.08)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2)
      osc.connect(gain).connect(ac.destination)
      osc.start(now + i * 0.08)
      osc.stop(now + i * 0.08 + 0.25)
    })
  } catch { /* ignore audio errors */ }
}

// ─── Complete ride sound (triumphant chord) ─
export function playCompleteSound() {
  try {
    const ac = getCtx()
    const now = ac.currentTime
    const freqs = [261.63, 329.63, 392.0, 523.25] // C4, E4, G4, C5

    freqs.forEach((freq) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
      osc.connect(gain).connect(ac.destination)
      osc.start(now)
      osc.stop(now + 0.7)
    })

    // High sparkle
    const sparkle = ac.createOscillator()
    const sg = ac.createGain()
    sparkle.type = 'sine'
    sparkle.frequency.setValueAtTime(1046.5, now + 0.1)
    sparkle.frequency.exponentialRampToValueAtTime(2093, now + 0.3)
    sg.gain.setValueAtTime(0.08, now + 0.1)
    sg.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
    sparkle.connect(sg).connect(ac.destination)
    sparkle.start(now + 0.1)
    sparkle.stop(now + 0.6)
  } catch { /* ignore */ }
}

// ─── Combo break sound (descending buzz) ────
export function playComboBreakSound() {
  try {
    const ac = getCtx()
    const now = ac.currentTime
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(400, now)
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.3)
    gain.gain.setValueAtTime(0.1, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    osc.connect(gain).connect(ac.destination)
    osc.start(now)
    osc.stop(now + 0.35)
  } catch { /* ignore */ }
}

// ─── Speed bonus ping ───────────────────────
export function playSpeedBonus() {
  try {
    const ac = getCtx()
    const now = ac.currentTime
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, now)
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15)
    gain.gain.setValueAtTime(0.1, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
    osc.connect(gain).connect(ac.destination)
    osc.start(now)
    osc.stop(now + 0.25)
  } catch { /* ignore */ }
}

// ─── Ride expired buzz ──────────────────────
export function playExpireSound() {
  try {
    const ac = getCtx()
    const now = ac.currentTime

    for (let i = 0; i < 2; i++) {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.type = 'square'
      osc.frequency.value = 200
      gain.gain.setValueAtTime(0.08, now + i * 0.15)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.1)
      osc.connect(gain).connect(ac.destination)
      osc.start(now + i * 0.15)
      osc.stop(now + i * 0.15 + 0.12)
    }
  } catch { /* ignore */ }
}

// ─── Collision thud ─────────────────────────
export function playCollisionSound() {
  try {
    const ac = getCtx()
    const now = ac.currentTime
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(80, now)
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.15)
    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
    osc.connect(gain).connect(ac.destination)
    osc.start(now)
    osc.stop(now + 0.2)
  } catch { /* ignore */ }
}
