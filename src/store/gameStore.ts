// ============================================
// Arrw Portfolio — Zustand Game Store
// Single store with four slices:
//   appSlice, narrativeSlice, fleetSlice, economicsSlice
// ============================================

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// ─── Types ──────────────────────────────────

export type ZoneId = 'alex' | '6oct' | 'ring_road' | '5th_settlement' | 'new_cairo' | 'downtown'

export type ZoneStatus = 'active' | 'expansion' | 'locked'

export interface Zone {
  id: ZoneId
  name: string
  nameAr: string
  status: ZoneStatus
  baseFare: number
  perKm: number
  surge: number
  payoutPct: number
  avgTrip: number
  deadMiles: number
  drivers: number
  riders: number
  landmark: string
}

export interface Driver {
  id: string
  x: number
  y: number
  z: number
  zone: ZoneId
  homeZone: ZoneId
  destinationZone?: ZoneId
  status: 'idle' | 'en-route' | 'on-trip' | 'offline'
  heading: number
  speed: number
  earnings: number
  trips: number
}

export interface Ride {
  id: string
  pickupX: number
  pickupZ: number
  dropoffX: number
  dropoffZ: number
  pickupZone: ZoneId
  dropoffZone: ZoneId
  fare: number
  distance: number
  status: 'available' | 'accepted' | 'completed' | 'expired'
  acceptedAt?: number
  expiresAt: number
  driverId?: string
}

export type GameMode = 'landing' | 'narrative' | 'simulator' | 'driver' | 'economics'

export type NarrativeLevel = 0 | 1 | 2 | 3 | 4 | 5

export interface DialogueLine {
  speaker: string
  speakerAr: string
  text: string
  textAr: string
  avatar?: string
}

// ─── Narrative Slice ────────────────────────

export interface NarrativeSlice {
  currentLevel: NarrativeLevel
  levelsUnlocked: number
  dialogueIndex: number
  dialogueActive: boolean
  currentDialogue: DialogueLine[]
  xp: number
  achievements: string[]
  playerX: number
  playerY: number
  
  setLevel: (level: NarrativeLevel) => void
  unlockLevel: (level: number) => void
  startDialogue: (lines: DialogueLine[]) => void
  advanceDialogue: () => void
  endDialogue: () => void
  addXP: (amount: number) => void
  addAchievement: (id: string) => void
  setPlayerPos: (x: number, y: number) => void
}

// ─── Fleet Slice ────────────────────────────

export interface FleetSlice {
  drivers: Driver[]
  rides: Ride[]
  activeZone: ZoneId
  simulationSpeed: number
  simulationRunning: boolean
  playerSpeed: number
  // Player world position (shared for minimap, ride system, etc.)
  playerWorldX: number
  playerWorldZ: number
  playerWorldHeading: number
  // Spatial ride system
  playerRide: Ride | null
  availableRides: Ride[]
  // Combo & scoring
  combo: number
  comboTimer: number
  totalScore: number
  highScore: number
  driverEarnings: number
  driverTrips: number

  setActiveZone: (zone: ZoneId) => void
  addDriver: (driver: Driver) => void
  updateDriver: (id: string, updates: Partial<Driver>) => void
  batchUpdateDrivers: (updates: Map<string, Partial<Driver>>) => void
  removeDriver: (id: string) => void
  addRide: (ride: Ride) => void
  updateRide: (id: string, updates: Partial<Ride>) => void
  setSimulationSpeed: (speed: number) => void
  toggleSimulation: () => void
  resetFleet: () => void
  setPlayerSpeed: (speed: number) => void
  setPlayerWorld: (x: number, z: number, heading: number) => void
  // Ride actions
  spawnPlayerRide: (ride: Ride) => void
  acceptPlayerRide: (rideId: string) => void
  completePlayerRide: (bonusMultiplier: number) => void
  failPlayerRide: () => void
  expireRides: () => void
  tickComboTimer: (delta: number) => void
}

// ─── Economics Slice ────────────────────────

export interface EconomicsSlice {
  zones: Zone[]
  globalSurge: number
  globalPayoutPct: number
  cac: number
  ltv: number
  
  updateZone: (id: ZoneId, updates: Partial<Zone>) => void
  setGlobalSurge: (surge: number) => void
  setGlobalPayout: (pct: number) => void
  setCAC: (cac: number) => void
  setLTV: (ltv: number) => void
  unlockZone: (id: ZoneId) => void
}

// ─── App-level Slice ────────────────────────

export interface AppSlice {
  gameMode: GameMode
  language: 'en' | 'ar'
  showSQL: boolean
  onboardingComplete: boolean
  
  setGameMode: (mode: GameMode) => void
  setLanguage: (lang: 'en' | 'ar') => void
  toggleSQL: () => void
  completeOnboarding: () => void
}

// ─── Combined Store ─────────────────────────

export type GameStore = NarrativeSlice & FleetSlice & EconomicsSlice & AppSlice

// ─── Zone seed data ─────────────────────────

const INITIAL_ZONES: Zone[] = [
  {
    id: 'alex', name: 'Alexandria', nameAr: 'الإسكندرية',
    status: 'active', baseFare: 12, perKm: 3.5, surge: 1.0,
    payoutPct: 75, avgTrip: 8.2, deadMiles: 3.1,
    drivers: 45, riders: 120, landmark: 'Bibliotheca'
  },
  {
    id: '6oct', name: '6th October', nameAr: '٦ أكتوبر',
    status: 'active', baseFare: 10, perKm: 3.0, surge: 1.0,
    payoutPct: 75, avgTrip: 6.5, deadMiles: 4.2,
    drivers: 32, riders: 85, landmark: 'Dream Park'
  },
  {
    id: 'ring_road', name: 'Ring Road', nameAr: 'الدائري',
    status: 'active', baseFare: 15, perKm: 2.5, surge: 1.2,
    payoutPct: 70, avgTrip: 15.0, deadMiles: 5.5,
    drivers: 28, riders: 60, landmark: 'Ring Road Interchange'
  },
  {
    id: '5th_settlement', name: '5th Settlement', nameAr: 'التجمع الخامس',
    status: 'active', baseFare: 18, perKm: 4.0, surge: 1.0,
    payoutPct: 72, avgTrip: 5.8, deadMiles: 2.8,
    drivers: 20, riders: 55, landmark: 'AUC Campus'
  },
  {
    id: 'new_cairo', name: 'New Cairo', nameAr: 'القاهرة الجديدة',
    status: 'active', baseFare: 14, perKm: 3.5, surge: 1.1,
    payoutPct: 73, avgTrip: 7.0, deadMiles: 3.5,
    drivers: 25, riders: 70, landmark: 'Cairo Festival City'
  },
  {
    id: 'downtown', name: 'Downtown Cairo', nameAr: 'وسط البلد',
    status: 'active', baseFare: 8, perKm: 4.5, surge: 1.8,
    payoutPct: 68, avgTrip: 3.2, deadMiles: 1.5,
    drivers: 50, riders: 180, landmark: 'Tahrir Square'
  },
]

// ─── Store Creation ─────────────────────────

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    // ── App Slice ───────────
    gameMode: 'landing',
    language: 'en',
    showSQL: false,
    onboardingComplete: false,
    
    setGameMode: (mode) => set({ gameMode: mode }),
    setLanguage: (lang) => set({ language: lang }),
    toggleSQL: () => set((s) => ({ showSQL: !s.showSQL })),
    completeOnboarding: () => set({ onboardingComplete: true }),
    
    // ── Narrative Slice ─────
    currentLevel: 0,
    levelsUnlocked: 1,
    dialogueIndex: 0,
    dialogueActive: false,
    currentDialogue: [],
    xp: 0,
    achievements: [],
    playerX: 0,
    playerY: 0,
    
    setLevel: (level) => set({ currentLevel: level }),
    unlockLevel: (level) => set((s) => ({
      levelsUnlocked: Math.max(s.levelsUnlocked, level + 1)
    })),
    startDialogue: (lines) => set({
      dialogueActive: true,
      currentDialogue: lines,
      dialogueIndex: 0,
    }),
    advanceDialogue: () => {
      const { dialogueIndex, currentDialogue } = get()
      if (dialogueIndex < currentDialogue.length - 1) {
        set({ dialogueIndex: dialogueIndex + 1 })
      } else {
        set({ dialogueActive: false, currentDialogue: [], dialogueIndex: 0 })
      }
    },
    endDialogue: () => set({ dialogueActive: false, currentDialogue: [], dialogueIndex: 0 }),
    addXP: (amount) => set((s) => ({ xp: s.xp + amount })),
    addAchievement: (id) => set((s) => ({
      achievements: s.achievements.includes(id) ? s.achievements : [...s.achievements, id]
    })),
    setPlayerPos: (x, y) => set({ playerX: x, playerY: y }),
    
    // ── Fleet Slice ─────────
    drivers: [],
    rides: [],
    activeZone: 'alex',
    simulationSpeed: 1,
    simulationRunning: true, // auto-start
    playerSpeed: 0,
    playerWorldX: 0,
    playerWorldZ: -15,
    playerWorldHeading: 0,
    playerRide: null,
    availableRides: [],
    combo: 0,
    comboTimer: 0,
    totalScore: 0,
    highScore: Number(typeof window !== 'undefined' ? localStorage.getItem('arrw_highscore') ?? '0' : '0'),
    driverEarnings: 0,
    driverTrips: 0,
    
    setActiveZone: (zone) => set({ activeZone: zone }),
    addDriver: (driver) => set((s) => ({ drivers: [...s.drivers, driver] })),
    updateDriver: (id, updates) => set((s) => ({
      drivers: s.drivers.map(d => d.id === id ? { ...d, ...updates } : d)
    })),
    batchUpdateDrivers: (updates) => set((s) => ({
      drivers: s.drivers.map(d => {
        const u = updates.get(d.id)
        return u ? { ...d, ...u } : d
      })
    })),
    removeDriver: (id) => set((s) => ({
      drivers: s.drivers.filter(d => d.id !== id)
    })),
    addRide: (ride) => set((s) => ({ rides: [...s.rides, ride] })),
    updateRide: (id, updates) => set((s) => ({
      rides: s.rides.map(r => r.id === id ? { ...r, ...updates } : r)
    })),
    setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),
    toggleSimulation: () => set((s) => ({ simulationRunning: !s.simulationRunning })),
    resetFleet: () => set({ drivers: [], rides: [], simulationRunning: false }),
    setPlayerSpeed: (speed) => set({ playerSpeed: speed }),
    setPlayerWorld: (x, z, heading) => set({ playerWorldX: x, playerWorldZ: z, playerWorldHeading: heading }),
    
    // ── Ride actions ────────
    spawnPlayerRide: (ride) => set((s) => ({
      availableRides: s.availableRides.length >= 3 ? s.availableRides : [...s.availableRides, ride]
    })),
    acceptPlayerRide: (rideId) => set((s) => {
      const ride = s.availableRides.find(r => r.id === rideId)
      if (!ride) return {}
      return {
        playerRide: { ...ride, status: 'accepted' as const, acceptedAt: Date.now() },
        availableRides: s.availableRides.filter(r => r.id !== rideId),
      }
    }),
    completePlayerRide: (bonusMultiplier) => set((s) => {
      if (!s.playerRide) return {}
      const earned = Math.round(s.playerRide.fare * bonusMultiplier)
      const newCombo = s.combo + 1
      const newScore = s.totalScore + earned
      const newHigh = Math.max(s.highScore, newScore)
      try { localStorage.setItem('arrw_highscore', String(newHigh)) } catch {}
      return {
        playerRide: null,
        combo: newCombo,
        comboTimer: 45,
        totalScore: newScore,
        highScore: newHigh,
        driverEarnings: s.driverEarnings + s.playerRide.fare,
        driverTrips: s.driverTrips + 1,
        xp: s.xp + 25,
      }
    }),
    failPlayerRide: () => set({ playerRide: null, combo: 0, comboTimer: 0 }),
    expireRides: () => set((s) => ({
      availableRides: s.availableRides.filter(r => Date.now() < r.expiresAt)
    })),
    tickComboTimer: (delta) => set((s) => {
      if (s.comboTimer <= 0 || s.combo === 0) return {}
      const newTimer = s.comboTimer - delta
      if (newTimer <= 0) return { combo: 0, comboTimer: 0 }
      return { comboTimer: newTimer }
    }),
    
    // ── Economics Slice ─────
    zones: INITIAL_ZONES,
    globalSurge: 1.0,
    globalPayoutPct: 75,
    cac: 150,
    ltv: 480,
    
    updateZone: (id, updates) => set((s) => ({
      zones: s.zones.map(z => z.id === id ? { ...z, ...updates } : z)
    })),
    setGlobalSurge: (surge) => set({ globalSurge: surge }),
    setGlobalPayout: (pct) => set({ globalPayoutPct: pct }),
    setCAC: (cac) => set({ cac }),
    setLTV: (ltv) => set({ ltv }),
    unlockZone: (id) => set((s) => ({
      zones: s.zones.map(z => z.id === id ? { ...z, status: 'active' as ZoneStatus } : z)
    })),
  }))
)
