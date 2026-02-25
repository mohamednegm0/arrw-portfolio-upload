// ============================================
// RideSystem — Core Crazy Taxi game loop
// Spawns rides near player, checks proximity for
// pickup/dropoff, manages combo timer, expires old rides
// ============================================

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore, type ZoneId } from '../../store/gameStore'
import { randomRoadPoint, worldDistance, closestZone } from './pathfinding'
import { ZONE_POSITIONS } from './roadGraph'
import { playPickupSound, playCompleteSound, playComboBreakSound, playExpireSound } from './sounds'

const PICKUP_RADIUS = 2.5
const DROPOFF_RADIUS = 3.0
const RIDE_EXPIRE_SEC = 45
const SPAWN_INTERVAL = 6 // seconds between new ride spawns
const MAX_AVAILABLE = 3  // max simultaneous available rides
const SPAWN_RANGE = 15   // rides spawn within this distance of player

const ZONE_IDS: ZoneId[] = ['alex', '6oct', 'ring_road', 'downtown', '5th_settlement', 'new_cairo']

let rideIdCounter = 0

export default function RideSystem() {
  const spawnPlayerRide = useGameStore((s) => s.spawnPlayerRide)
  const acceptPlayerRide = useGameStore((s) => s.acceptPlayerRide)
  const completePlayerRide = useGameStore((s) => s.completePlayerRide)
  const failPlayerRide = useGameStore((s) => s.failPlayerRide)
  const expireRides = useGameStore((s) => s.expireRides)
  const tickComboTimer = useGameStore((s) => s.tickComboTimer)

  const spawnTimer = useRef(3) // spawn first ride after 3s

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1)
    const state = useGameStore.getState()
    if (state.gameMode !== 'driver') return

    const px = state.playerWorldX
    const pz = state.playerWorldZ
    const now = Date.now()

    // ── Combo timer tick ──
    tickComboTimer(delta)

    // ── Expire old rides ──
    expireRides()

    // ── Check pickup proximity for available rides ──
    for (const ride of state.availableRides) {
      if (ride.status === 'available') {
        const dist = worldDistance(px, pz, ride.pickupX, ride.pickupZ)
        if (dist < PICKUP_RADIUS) {
          acceptPlayerRide(ride.id)
          playPickupSound()
          break // only pick up one per frame
        }
      }
    }

    // ── Check dropoff proximity for active ride ──
    if (state.playerRide && state.playerRide.status === 'accepted') {
      const ride = state.playerRide
      const dist = worldDistance(px, pz, ride.dropoffX, ride.dropoffZ)
      if (dist < DROPOFF_RADIUS) {
        // Bonus multiplier based on speed of completion
        const elapsed = (now - (ride.acceptedAt || now)) / 1000
        const timeBonus = Math.max(1, 3 - elapsed / 15) // 3x if fast, decays to 1x
        completePlayerRide(timeBonus)
        playCompleteSound()
      }
    }

    // ── Check if active ride expired ──
    if (state.playerRide && state.playerRide.status === 'accepted') {
      const ride = state.playerRide
      if (ride.expiresAt && now > ride.expiresAt) {
        failPlayerRide()
        playComboBreakSound()
      }
    }

    // ── Spawn new rides periodically ──
    spawnTimer.current -= delta
    if (spawnTimer.current <= 0 && state.availableRides.length < MAX_AVAILABLE) {
      spawnTimer.current = SPAWN_INTERVAL + Math.random() * 3

      // Pick a pickup zone near the player
      const playerZone = closestZone(px, pz)
      const pickupZone = playerZone

      // Pick a different dropoff zone
      const otherZones = ZONE_IDS.filter((z) => z !== pickupZone)
      const dropoffZone = otherZones[Math.floor(Math.random() * otherZones.length)]

      // Get positions on roads in those zones
      const pickup = randomRoadPoint(pickupZone)
      const dropoff = randomRoadPoint(dropoffZone)

      // Ensure pickup is within range of player
      if (worldDistance(px, pz, pickup.x, pickup.z) > SPAWN_RANGE) {
        // Place pickup closer to player on the nearest road
        const nearPickup = randomRoadPoint(playerZone)
        pickup.x = nearPickup.x
        pickup.z = nearPickup.z
      }

      const dist = worldDistance(pickup.x, pickup.z, dropoff.x, dropoff.z)
      const fare = 50 + Math.floor(dist * 5)

      rideIdCounter++
      spawnPlayerRide({
        id: `ride-${rideIdCounter}-${now}`,
        pickupX: pickup.x,
        pickupZ: pickup.z,
        dropoffX: dropoff.x,
        dropoffZ: dropoff.z,
        pickupZone,
        dropoffZone,
        fare,
        distance: dist,
        status: 'available',
        expiresAt: now + RIDE_EXPIRE_SEC * 1000,
      })
    }
  })

  return null
}
