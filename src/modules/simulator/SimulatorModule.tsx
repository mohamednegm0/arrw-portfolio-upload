// ============================================
// Simulator Module — 3D Fleet Sim + Driver Mode
// Uses React-Three-Fiber
// ============================================

import { Suspense, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { useGameStore, type Driver, type ZoneId } from '../../store/gameStore'
import FleetHUD from './FleetHUD'
import DriverHUD from './DriverHUD'
import CityBuilder from './CityBuilder'
import { BUILDING_COLLIDERS } from './CityBuilder'
import RideSystem from './RideSystem'
import RideMarkers from './RideMarkers'
import Minimap from './Minimap'
import TouchControls from './TouchControls'
import { ZONE_POSITIONS, ZONE_COLORS, ROAD_GRAPH, ADJACENCY } from './roadGraph'
import { findPath, randomRoadPoint, worldDistance, closestZone } from './pathfinding'
import { playCollisionSound } from './sounds'

// Re-export for backward compat (FleetHUD imports these)
export { ZONE_COLORS }

// ─── Taxi cab component ─────────────────────
function TaxiCab({ driver, isPlayer }: { driver: Driver; isPlayer?: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const targetPos = useRef(new THREE.Vector3(driver.x, driver.y + 0.3, driver.z))

  useFrame(() => {
    if (!meshRef.current) return
    targetPos.current.set(driver.x, driver.y + 0.3, driver.z)
    meshRef.current.position.lerp(targetPos.current, isPlayer ? 1 : 0.1)
    meshRef.current.rotation.y = driver.heading
  })

  return (
    <mesh ref={meshRef} position={[driver.x, 0.3, driver.z]} castShadow>
      {/* Car body — Z is forward */}
      <boxGeometry args={[0.6, 0.4, 1.2]} />
      <meshStandardMaterial
        color={isPlayer ? '#F6A623' : driver.status === 'on-trip' ? '#38A169' : '#E2E8F0'}
        metalness={0.3}
        roughness={0.7}
      />
      {/* Roof (offset slightly back) */}
      <mesh position={[0, 0.3, -0.1]}>
        <boxGeometry args={[0.5, 0.25, 0.6]} />
        <meshStandardMaterial
          color={isPlayer ? '#FBD38D' : '#CBD5E0'}
          metalness={0.2}
          roughness={0.8}
        />
      </mesh>
      {/* Status light */}
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial
          color={driver.status === 'idle' ? '#38A169' : driver.status === 'on-trip' ? '#F6A623' : '#E53E3E'}
          emissive={driver.status === 'idle' ? '#38A169' : driver.status === 'on-trip' ? '#F6A623' : '#E53E3E'}
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Headlights (front = +Z) */}
      <mesh position={[0.2, 0.15, 0.6]}>
        <boxGeometry args={[0.1, 0.08, 0.05]} />
        <meshStandardMaterial color="#FBD38D" emissive="#FBD38D" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[-0.2, 0.15, 0.6]}>
        <boxGeometry args={[0.1, 0.08, 0.05]} />
        <meshStandardMaterial color="#FBD38D" emissive="#FBD38D" emissiveIntensity={0.3} />
      </mesh>
      {/* Taillights (rear = -Z) */}
      <mesh position={[0.2, 0.15, -0.6]}>
        <boxGeometry args={[0.1, 0.08, 0.05]} />
        <meshStandardMaterial color="#E53E3E" emissive="#E53E3E" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[-0.2, 0.15, -0.6]}>
        <boxGeometry args={[0.1, 0.08, 0.05]} />
        <meshStandardMaterial color="#E53E3E" emissive="#E53E3E" emissiveIntensity={0.2} />
      </mesh>
    </mesh>
  )
}

// ZoneMarker removed — replaced by CityBuilder's ZoneGround

// Roads removed — replaced by CityBuilder's RoadMeshes

// ─── Fleet simulation logic (inter-zone road AI) ─

interface AIDriverState {
  waypoints: [number, number][]
  waypointIdx: number
  tripCooldown: number
  state: 'wandering' | 'traveling'
}

function FleetSimulation() {
  const drivers = useGameStore((s) => s.drivers)
  const simulationRunning = useGameStore((s) => s.simulationRunning)
  const simulationSpeed = useGameStore((s) => s.simulationSpeed)
  const batchUpdateDrivers = useGameStore((s) => s.batchUpdateDrivers)
  const zones = useGameStore((s) => s.zones)
  const aiStates = useRef<Map<string, AIDriverState>>(new Map())

  useFrame((_, rawDelta) => {
    if (!simulationRunning || drivers.length === 0) return
    const delta = Math.min(rawDelta, 0.05) // cap delta to avoid huge jumps

    const updates = new Map<string, Partial<Driver>>()

    drivers.forEach(driver => {
      // Initialize AI state if needed
      if (!aiStates.current.has(driver.id)) {
        const rp = randomRoadPoint(driver.zone)
        aiStates.current.set(driver.id, {
          waypoints: [[rp.x, rp.z]],
          waypointIdx: 0,
          tripCooldown: 3 + Math.random() * 8,
          state: 'wandering',
        })
      }
      const ai = aiStates.current.get(driver.id)!

      // Get current target waypoint
      if (ai.waypointIdx >= ai.waypoints.length) {
        // Reached end of path
        if (ai.state === 'traveling' && driver.destinationZone) {
          // Arrived at destination zone — switch to idle
          updates.set(driver.id, {
            status: 'idle',
            zone: driver.destinationZone,
            destinationZone: undefined,
          })
          ai.state = 'wandering'
          ai.tripCooldown = 5 + Math.random() * 10
          const rp = randomRoadPoint(driver.destinationZone)
          ai.waypoints = [[rp.x, rp.z]]
          ai.waypointIdx = 0
          return
        }
        // Wandering — pick new random intra-zone point
        const rp = randomRoadPoint(driver.zone)
        ai.waypoints = [[rp.x, rp.z]]
        ai.waypointIdx = 0
      }

      const [wx, wz] = ai.waypoints[ai.waypointIdx]
      const dx = wx - driver.x
      const dz = wz - driver.z
      const dist = Math.sqrt(dx * dx + dz * dz)

      if (dist < 0.5) {
        ai.waypointIdx++
        return
      }

      // Speed
      const speed = (ai.state === 'traveling' ? 2.0 : 0.6) * simulationSpeed
      const step = Math.min(speed * delta, dist)

      // Smooth heading
      const targetHeading = Math.atan2(dx, dz)
      const angleDiff = Math.atan2(Math.sin(targetHeading - driver.heading), Math.cos(targetHeading - driver.heading))
      const newHeading = driver.heading + angleDiff * Math.min(5 * delta, 1)

      updates.set(driver.id, {
        x: driver.x + Math.sin(newHeading) * step,
        z: driver.z + Math.cos(newHeading) * step,
        heading: newHeading,
      })

      // Trip assignment (only for idle wandering drivers)
      if (ai.state === 'wandering') {
        ai.tripCooldown -= delta
        if (ai.tripCooldown <= 0) {
          // Pick a destination zone weighted by rider count
          const currentZone = driver.zone
          const candidates = zones
            .filter(z => z.id !== currentZone && z.status === 'active')
          if (candidates.length > 0) {
            const totalRiders = candidates.reduce((s, z) => s + z.riders, 0)
            let pick = Math.random() * totalRiders
            let dest = candidates[0]
            for (const c of candidates) {
              pick -= c.riders
              if (pick <= 0) { dest = c; break }
            }

            // Check rebalancing: if zone is overloaded, send home instead
            const driversInZone = drivers.filter(d => d.zone === currentZone).length
            const seedCount = zones.find(z => z.id === currentZone)?.drivers ?? 8
            const destZone = (driversInZone > seedCount * 1.3 && driver.homeZone !== currentZone)
              ? driver.homeZone
              : dest.id

            const path = findPath(currentZone, destZone)
            ai.waypoints = path
            ai.waypointIdx = 0
            ai.state = 'traveling'
            ai.tripCooldown = 999

            updates.set(driver.id, {
              ...updates.get(driver.id),
              status: 'on-trip',
              destinationZone: destZone,
            })
          } else {
            ai.tripCooldown = 5 + Math.random() * 10
          }
        }
      }
    })

    if (updates.size > 0) {
      batchUpdateDrivers(updates)
    }
  })

  return null
}

// ─── Player driving controls ────────────────
const GAME_KEYS = new Set(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'])

function PlayerDriver() {
  const gameMode = useGameStore((s) => s.gameMode)
  const setPlayerSpeed = useGameStore((s) => s.setPlayerSpeed)
  const setPlayerWorld = useGameStore((s) => s.setPlayerWorld)
  const meshRef = useRef<THREE.Mesh>(null)
  const playerState = useRef({ x: 0, y: 0.3, z: -15, heading: 0, speed: 0 })
  const keysRef = useRef<Set<string>>(new Set())
  const camTarget = useRef(new THREE.Vector3())
  const screenShake = useRef(0)
  const { camera } = useThree()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (GAME_KEYS.has(key)) e.preventDefault()
      keysRef.current.add(key)
    }
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase())
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useFrame((_, rawDelta) => {
    if (gameMode !== 'driver' || !meshRef.current) return
    const delta = Math.min(rawDelta, 0.05)

    const keys = keysRef.current
    const p = playerState.current
    const accel = 8
    const maxSpeed = 15
    const turnSpeed = 2.5

    // Remember previous position for collision rollback
    const prevX = p.x
    const prevZ = p.z

    // Acceleration
    if (keys.has('w') || keys.has('arrowup')) {
      p.speed = Math.min(p.speed + accel * delta, maxSpeed)
    } else if (keys.has('s') || keys.has('arrowdown')) {
      p.speed = Math.max(p.speed - accel * delta, -maxSpeed / 2)
    } else {
      // Frame-independent friction
      p.speed *= Math.pow(0.02, delta)
    }

    // Speed-dependent turning
    const speedRatio = Math.min(Math.abs(p.speed) / maxSpeed, 1)
    const turnRate = turnSpeed * (0.3 + 0.7 * speedRatio)

    if (keys.has('a') || keys.has('arrowleft')) {
      p.heading += turnRate * delta * (p.speed >= 0 ? 1 : -1)
    }
    if (keys.has('d') || keys.has('arrowright')) {
      p.heading -= turnRate * delta * (p.speed >= 0 ? 1 : -1)
    }

    // Move
    p.x += Math.sin(p.heading) * p.speed * delta
    p.z += Math.cos(p.heading) * p.speed * delta

    // Boundary clamp
    p.x = Math.max(-24.5, Math.min(19.5, p.x))
    p.z = Math.max(-19.5, Math.min(9.5, p.z))

    // Building collision
    for (const c of BUILDING_COLLIDERS) {
      if (Math.abs(p.x - c.x) < c.hw + 0.3 && Math.abs(p.z - c.z) < c.hd + 0.6) {
        p.x = prevX
        p.z = prevZ
        p.speed *= -0.3
        screenShake.current = 0.3
        playCollisionSound()
        break
      }
    }

    // Update mesh
    meshRef.current.position.set(p.x, 0.3, p.z)
    meshRef.current.rotation.y = p.heading

    // Sync to store
    setPlayerSpeed(Math.abs(p.speed))
    setPlayerWorld(p.x, p.z, p.heading)

    // Camera follow
    const camDist = 8
    const camHeight = 5
    camTarget.current.set(
      p.x - Math.sin(p.heading) * camDist,
      camHeight,
      p.z - Math.cos(p.heading) * camDist
    )
    camera.position.lerp(camTarget.current, 0.08)
    camera.lookAt(p.x, 0, p.z)

    // Screen shake
    if (screenShake.current > 0) {
      screenShake.current -= delta
      camera.position.x += Math.sin(screenShake.current * 40) * 0.15
    }
  })

  if (gameMode !== 'driver') return null

  return (
    <mesh ref={meshRef} position={[0, 0.3, -15]} castShadow>
      {/* Car body — Z is forward */}
      <boxGeometry args={[0.6, 0.4, 1.2]} />
      <meshStandardMaterial color="#F6A623" metalness={0.4} roughness={0.5} />
      {/* Roof */}
      <mesh position={[0, 0.3, -0.1]}>
        <boxGeometry args={[0.5, 0.25, 0.6]} />
        <meshStandardMaterial color="#FBD38D" metalness={0.2} roughness={0.8} />
      </mesh>
      {/* Headlights (front = +Z) */}
      <pointLight position={[0.2, 0.2, 0.7]} color="#FBD38D" intensity={2} distance={5} />
      <pointLight position={[-0.2, 0.2, 0.7]} color="#FBD38D" intensity={2} distance={5} />
    </mesh>
  )
}

// ─── Spawn fleet drivers on mount ───────────
function SpawnDrivers() {
  const addDriver = useGameStore((s) => s.addDriver)
  const toggleSimulation = useGameStore((s) => s.toggleSimulation)
  const zones = useGameStore((s) => s.zones)
  const drivers = useGameStore((s) => s.drivers)
  const simulationRunning = useGameStore((s) => s.simulationRunning)

  useEffect(() => {
    if (drivers.length > 0) return // Already spawned

    zones.forEach(zone => {
      if (zone.status !== 'active') return
      for (let i = 0; i < Math.min(zone.drivers, 8); i++) {
        const pt = randomRoadPoint(zone.id)
        addDriver({
          id: `${zone.id}-${i}`,
          x: pt.x,
          y: 0,
          z: pt.z,
          zone: zone.id,
          homeZone: zone.id,
          status: Math.random() > 0.5 ? 'idle' : 'on-trip',
          heading: Math.random() * Math.PI * 2,
          speed: 0,
          earnings: Math.random() * 200,
          trips: Math.floor(Math.random() * 10),
        })
      }
    })

    // Auto-start simulation
    if (!simulationRunning) toggleSimulation()
  }, [])

  return null
}

// ─── Main Simulator Component ───────────────
export default function SimulatorModule() {
  const gameMode = useGameStore((s) => s.gameMode)
  const drivers = useGameStore((s) => s.drivers)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Auto-focus the canvas wrapper when entering driver mode
  useEffect(() => {
    if (gameMode === 'driver' && wrapperRef.current) {
      wrapperRef.current.focus()
    }
  }, [gameMode])

  return (
    <motion.div
      ref={wrapperRef}
      tabIndex={0}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full relative outline-none"
    >
      <Canvas
        shadows
        camera={{
          position: gameMode === 'driver' ? [0, 5, -7] : [0, 30, 30],
          fov: gameMode === 'driver' ? 65 : 50,
        }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#0F1B2D']} />
        <fog attach="fog" args={['#0F1B2D', 50, 120]} />

        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[20, 30, 10]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <Suspense fallback={null}>
          {/* Low-poly city: roads, buildings, landmarks, ground, sky */}
          <CityBuilder />

          {/* Fleet drivers */}
          {drivers.map(driver => (
            <TaxiCab key={driver.id} driver={driver} />
          ))}

          {/* Simulation logic */}
          <FleetSimulation />
          <SpawnDrivers />

          {/* Player driver (only in driver mode) */}
          <PlayerDriver />

          {/* Ride system + markers (driver mode only) */}
          <RideSystem />
          <RideMarkers />

          {/* Controls (Mission Control only) */}
          {gameMode === 'simulator' && (
            <OrbitControls
              maxPolarAngle={Math.PI / 2.5}
              minDistance={10}
              maxDistance={60}
              enablePan
            />
          )}
        </Suspense>
      </Canvas>

      {/* HUD overlay */}
      {gameMode === 'simulator' && <FleetHUD />}
      {gameMode === 'driver' && <DriverHUD />}
      {gameMode === 'driver' && <Minimap />}
      {gameMode === 'driver' && <TouchControls />}
    </motion.div>
  )
}
