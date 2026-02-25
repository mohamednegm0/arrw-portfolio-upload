// ============================================
// Fleet HUD — Mission Control overlay
// ============================================

import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { calcFare, calcCommission, formatEGP, formatPct } from '../../core/economics'
import { ZONE_COLORS } from './SimulatorModule'
import { closestZone } from './pathfinding'

// Zone display names for the trip feed
const ZONE_NAMES: Record<string, string> = {
  alex: 'Alexandria',
  '6oct': '6th October',
  ring_road: 'Ring Road',
  downtown: 'Downtown',
  '5th_settlement': '5th Settlement',
  new_cairo: 'New Cairo',
}

export default function FleetHUD() {
  const zones = useGameStore((s) => s.zones)
  const activeZone = useGameStore((s) => s.activeZone)
  const setActiveZone = useGameStore((s) => s.setActiveZone)
  const drivers = useGameStore((s) => s.drivers)
  const simulationRunning = useGameStore((s) => s.simulationRunning)
  const toggleSimulation = useGameStore((s) => s.toggleSimulation)
  const simulationSpeed = useGameStore((s) => s.simulationSpeed)
  const setSimulationSpeed = useGameStore((s) => s.setSimulationSpeed)
  const setGameMode = useGameStore((s) => s.setGameMode)

  const zone = zones.find(z => z.id === activeZone)

  // Dynamic zone counts from actual driver positions
  const zoneCounts: Record<string, { total: number; onTrip: number; idle: number }> = {}
  for (const z of zones) {
    const zd = drivers.filter(d => d.zone === z.id)
    zoneCounts[z.id] = {
      total: zd.length,
      onTrip: zd.filter(d => d.status === 'on-trip').length,
      idle: zd.filter(d => d.status === 'idle').length,
    }
  }

  const zc = zoneCounts[activeZone] || { total: 0, onTrip: 0, idle: 0 }
  const utilization = zc.total > 0 ? Math.round((zc.onTrip / zc.total) * 100) : 0

  // Live trip feed: show drivers currently on-trip with destinations
  const trippingDrivers = drivers
    .filter(d => d.status === 'on-trip' && d.destinationZone)
    .slice(0, 5)

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Top bar */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between pointer-events-auto">
        {/* Zone selector pills */}
        <div className="flex flex-wrap gap-1.5">
          {zones.filter(z => z.status !== 'locked').map(z => (
            <button
              key={z.id}
              onClick={() => setActiveZone(z.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                z.id === activeZone
                  ? 'bg-brand-accent text-brand-dark'
                  : 'bg-brand-dark/80 text-gray-400 hover:text-white border border-brand-surface-light'
              }`}
            >
              {z.name}
              <span className="ml-1 text-[10px] opacity-70">
                ({zoneCounts[z.id]?.total || 0})
              </span>
            </button>
          ))}
        </div>

        {/* Sim controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSimulation}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              simulationRunning
                ? 'bg-danger text-white'
                : 'bg-success text-white'
            }`}
          >
            {simulationRunning ? '⏸ Pause' : '▶ Play'}
          </button>
          <select
            title="Simulation speed"
            value={simulationSpeed}
            onChange={(e) => setSimulationSpeed(Number(e.target.value))}
            className="bg-brand-dark/80 text-gray-300 text-xs px-2 py-1.5 rounded-lg border border-brand-surface-light"
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={5}>5x</option>
          </select>
        </div>
      </div>

      {/* Zone info panel (left) */}
      {zone && (
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          key={activeZone}
          className="absolute left-3 top-16 w-64 bg-brand-dark/90 border border-brand-surface-light rounded-xl p-4 pointer-events-auto backdrop-blur-sm"
        >
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ZONE_COLORS[zone.id] || '#ECC94B' }} />
            {zone.name}
            <span className="text-xs text-gray-500 ml-auto">{zone.nameAr}</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Fare</span>
              <span className="text-white font-mono">
                {formatEGP(calcFare(zone.baseFare, zone.perKm, zone.avgTrip, zone.surge))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Commission</span>
              <span className="text-success font-mono">
                {formatEGP(calcCommission(calcFare(zone.baseFare, zone.perKm, zone.avgTrip, zone.surge), zone.payoutPct))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Surge</span>
              <span className="text-brand-accent font-mono">{zone.surge}x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Dead Miles</span>
              <span className="text-danger font-mono">{zone.deadMiles} km</span>
            </div>

            <hr className="border-brand-surface-light" />

            {/* Utilization gauge */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-400">Utilization</span>
                <span className={`font-mono ${utilization > 70 ? 'text-success' : utilization > 40 ? 'text-warning' : 'text-danger'}`}>
                  {formatPct(utilization)}
                </span>
              </div>
              <div className="h-1.5 bg-brand-surface rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${utilization}%`,
                    backgroundColor: utilization > 70 ? '#38A169' : utilization > 40 ? '#D69E2E' : '#E53E3E',
                  }}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Active Drivers</span>
              <span className="text-white font-mono">{zc.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">On Trip</span>
              <span className="text-success font-mono">{zc.onTrip}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Idle</span>
              <span className="text-warning font-mono">{zc.idle}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Driver mode button */}
      <div className="absolute bottom-4 right-4 pointer-events-auto flex items-center gap-3">
        {/* Live trip feed */}
        {trippingDrivers.length > 0 && (
          <div className="bg-brand-dark/90 border border-brand-surface-light rounded-xl p-3 w-56">
            <div className="text-xs text-gray-500 mb-2 font-bold">Live Trips</div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {trippingDrivers.map(d => (
                <div key={d.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 truncate w-16">{d.id.split('-')[0]}</span>
                  <span className="text-white">→</span>
                  <span className="text-brand-accent truncate">
                    {ZONE_NAMES[d.destinationZone || ''] || 'Cruising'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        <button
          onClick={() => setGameMode('driver')}
          className="px-4 py-2 bg-brand-accent text-brand-dark font-bold rounded-xl hover:bg-brand-accent-light transition-all text-sm shadow-lg shadow-brand-accent/20"
        >
          🏎️ Switch to Driver Mode
        </button>
      </div>
    </div>
  )
}
