// ============================================
// Driver HUD — Crazy Taxi mode overlay
// Consumes spatial ride system from store
// ============================================

import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { formatEGP } from '../../core/economics'
import { ZONE_POSITIONS } from './roadGraph'
import { worldDistance } from './pathfinding'

// Zone display names
const ZONE_NAMES: Record<string, string> = {
  alex: 'Alexandria',
  '6oct': '6th October',
  ring_road: 'Ring Road',
  downtown: 'Downtown Cairo',
  '5th_settlement': '5th Settlement',
  new_cairo: 'New Cairo',
}

export default function DriverHUD() {
  const setGameMode = useGameStore((s) => s.setGameMode)
  const playerSpeed = useGameStore((s) => s.playerSpeed)
  const playerRide = useGameStore((s) => s.playerRide)
  const availableRides = useGameStore((s) => s.availableRides)
  const combo = useGameStore((s) => s.combo)
  const comboTimer = useGameStore((s) => s.comboTimer)
  const totalScore = useGameStore((s) => s.totalScore)
  const highScore = useGameStore((s) => s.highScore)
  const driverEarnings = useGameStore((s) => s.driverEarnings)
  const driverTrips = useGameStore((s) => s.driverTrips)
  const playerWorldX = useGameStore((s) => s.playerWorldX)
  const playerWorldZ = useGameStore((s) => s.playerWorldZ)

  // Convert speed (units/sec) to km/h display
  const displaySpeed = Math.round(playerSpeed * 3.6)

  // Calculate distance to current target
  const targetDist = playerRide?.status === 'accepted'
    ? worldDistance(playerWorldX, playerWorldZ, playerRide.dropoffX, playerRide.dropoffZ)
    : null

  // Time remaining on active ride
  const timeLeft = playerRide?.expiresAt
    ? Math.max(0, Math.round((playerRide.expiresAt - Date.now()) / 1000))
    : null

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Top bar: back button + score + combo */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
        <button
          onClick={() => setGameMode('simulator')}
          className="px-3 py-1.5 bg-brand-dark/80 text-gray-400 text-xs rounded-lg border border-brand-surface-light hover:border-brand-accent hover:text-brand-accent transition-colors"
        >
          ← Mission Control
        </button>

        {/* Score + High Score */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-brand-dark/80 rounded-lg border border-brand-surface-light text-center">
            <div className="text-xs text-gray-500">Score</div>
            <div className="text-sm font-bold font-mono text-brand-accent">{Math.round(totalScore)}</div>
          </div>
          <div className="px-3 py-1.5 bg-brand-dark/80 rounded-lg border border-brand-surface-light text-center">
            <div className="text-xs text-gray-500">Best</div>
            <div className="text-sm font-bold font-mono text-yellow-400">{Math.round(highScore)}</div>
          </div>
        </div>
      </div>

      {/* Combo indicator (top center) */}
      <AnimatePresence>
        {combo > 1 && (
          <motion.div
            key={`combo-${combo}`}
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="absolute top-14 left-1/2 -translate-x-1/2 text-center"
          >
            <div className="text-4xl font-black text-yellow-400 drop-shadow-lg">
              {combo}x COMBO
            </div>
            {/* Combo timer bar */}
            <div className="mt-1 w-32 mx-auto h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-yellow-400 rounded-full"
                initial={{ width: '100%' }}
                animate={{ width: `${Math.max(0, (comboTimer / 10) * 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speedometer (bottom center) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="bg-brand-dark/90 border border-brand-surface-light rounded-2xl px-6 py-3 flex items-center gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold font-mono text-white">{displaySpeed}</div>
            <div className="text-xs text-gray-500">km/h</div>
          </div>
          <div className="w-px h-10 bg-brand-surface-light" />
          <div className="text-center">
            <div className="text-lg font-bold font-mono text-brand-accent">{formatEGP(driverEarnings)}</div>
            <div className="text-xs text-gray-500">Earnings</div>
          </div>
          <div className="w-px h-10 bg-brand-surface-light" />
          <div className="text-center">
            <div className="text-lg font-bold font-mono text-success">{driverTrips}</div>
            <div className="text-xs text-gray-500">Trips</div>
          </div>
        </div>
      </div>

      {/* Controls hint (bottom left) */}
      <div className="absolute bottom-4 left-3 pointer-events-none">
        <div className="bg-brand-dark/80 rounded-lg px-3 py-2 text-xs text-gray-500 space-y-1">
          <div><span className="text-gray-400 font-mono">W/↑</span> Accelerate</div>
          <div><span className="text-gray-400 font-mono">S/↓</span> Brake</div>
          <div><span className="text-gray-400 font-mono">A/←</span> Turn Left</div>
          <div><span className="text-gray-400 font-mono">D/→</span> Turn Right</div>
        </div>
      </div>

      {/* Active ride (right side) */}
      <AnimatePresence>
        {playerRide && playerRide.status === 'accepted' && (
          <motion.div
            key="active-ride"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            className="absolute right-3 top-16 w-60 bg-brand-dark/90 border border-success/30 rounded-xl p-3 pointer-events-none"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-success font-bold">🚗 Active Ride</span>
              {timeLeft !== null && (
                <span className={`text-xs font-mono font-bold ${timeLeft < 10 ? 'text-red-400 animate-pulse' : 'text-gray-400'}`}>
                  {timeLeft}s
                </span>
              )}
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Dropoff</span>
                <span className="text-white font-bold">{ZONE_NAMES[playerRide.dropoffZone] || playerRide.dropoffZone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Distance</span>
                <span className="text-white font-mono">{targetDist ? `${targetDist.toFixed(1)} units` : '...'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fare</span>
                <span className="text-brand-accent font-bold">{formatEGP(playerRide.fare)}</span>
              </div>
            </div>
            {/* Distance progress */}
            {targetDist !== null && playerRide.distance > 0 && (
              <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-success rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(0, Math.min(100, (1 - targetDist / playerRide.distance) * 100))}%` }}
                />
              </div>
            )}
            <div className="mt-2 text-xs text-center text-success/60">
              Drive to the red marker!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Available rides (right side, below active ride or at top) */}
      <div className={`absolute right-3 ${playerRide?.status === 'accepted' ? 'top-72' : 'top-16'} w-60 space-y-2 pointer-events-none`}>
        <AnimatePresence>
          {availableRides
            .filter((r) => r.status === 'available')
            .slice(0, 3)
            .map((ride) => {
              const dist = worldDistance(playerWorldX, playerWorldZ, ride.pickupX, ride.pickupZ)
              const rideTimeLeft = Math.max(0, Math.round((ride.expiresAt - Date.now()) / 1000))
              return (
                <motion.div
                  key={ride.id}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  className="bg-brand-dark/90 border border-brand-surface-light rounded-xl p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-green-400 font-bold">
                      📍 {ZONE_NAMES[ride.pickupZone] || ride.pickupZone}
                    </span>
                    <span className="text-xs text-gray-500">{rideTimeLeft}s</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-1">
                    → {ZONE_NAMES[ride.dropoffZone] || ride.dropoffZone}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-brand-accent">{formatEGP(ride.fare)}</span>
                    <span className="text-xs text-gray-500">{dist.toFixed(0)}m away</span>
                  </div>
                  <div className="mt-1 text-xs text-center text-green-400/60">
                    Drive to green marker to pickup!
                  </div>
                  {/* Timer bar */}
                  <div className="mt-1.5 h-1 bg-brand-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-400 rounded-full transition-all duration-1000"
                      style={{ width: `${(rideTimeLeft / 45) * 100}%` }}
                    />
                  </div>
                </motion.div>
              )
            })}
        </AnimatePresence>

        {/* No rides hint */}
        {availableRides.filter((r) => r.status === 'available').length === 0 && !playerRide && (
          <div className="bg-brand-dark/80 rounded-xl p-3 text-center">
            <div className="text-xs text-gray-500">Waiting for ride requests...</div>
            <div className="text-xs text-gray-600 mt-1">Drive around the city!</div>
          </div>
        )}
      </div>
    </div>
  )
}
