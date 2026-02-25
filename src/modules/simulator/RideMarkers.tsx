// ============================================
// RideMarkers — 3D pickup/dropoff indicators
// Green pulsing cylinder for pickups, red for dropoff,
// direction line from player to target
// ============================================

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../../store/gameStore'

const UP = new THREE.Vector3(0, 1, 0)

// ─── Pulsing pillar marker ──────────────────
function PillarMarker({ x, z, color, label }: { x: number; z: number; color: string; label: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!meshRef.current || !ringRef.current) return
    const t = clock.getElapsedTime()
    // Pulse scale
    const pulse = 1 + Math.sin(t * 3) * 0.2
    meshRef.current.scale.set(1, pulse, 1)
    // Ring expand
    const ringScale = 1 + ((t * 0.5) % 1) * 2
    ringRef.current.scale.set(ringScale, 1, ringScale)
    ;(ringRef.current.material as THREE.MeshBasicMaterial).opacity = 1 - ((t * 0.5) % 1)
  })

  return (
    <group position={[x, 0, z]}>
      {/* Main pillar */}
      <mesh ref={meshRef}>
        <cylinderGeometry args={[0.3, 0.5, 3, 8]} />
        <meshStandardMaterial color={color} transparent opacity={0.7} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      {/* Ring pulse */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.5, 0.7, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* Overhead light */}
      <pointLight position={[0, 3, 0]} color={color} intensity={3} distance={8} />
      {/* Label sprite would go here — using a simple diamond indicator instead */}
      <mesh position={[0, 4, 0]}>
        <octahedronGeometry args={[0.3]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
    </group>
  )
}

// ─── Direction line from player to target ───
function DirectionLine({ targetX, targetZ, color }: { targetX: number; targetZ: number; color: string }) {
  const lineRef = useRef<THREE.Line>(null)

  useFrame(() => {
    if (!lineRef.current) return
    const state = useGameStore.getState()
    const px = state.playerWorldX
    const pz = state.playerWorldZ

    const positions = new Float32Array([px, 1, pz, targetX, 1, targetZ])
    lineRef.current.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    lineRef.current.geometry.attributes.position.needsUpdate = true
    lineRef.current.computeLineDistances()
  })

  // Create initial geometry + material
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 1, 0, targetX, 1, targetZ], 3))
  const mat = new THREE.LineDashedMaterial({ color, dashSize: 0.5, gapSize: 0.3, transparent: true, opacity: 0.6 })
  const line = new THREE.Line(geo, mat)
  line.computeLineDistances()

  return <primitive ref={lineRef} object={line} />
}

// ─── Main RideMarkers component ─────────────
export default function RideMarkers() {
  const gameMode = useGameStore((s) => s.gameMode)
  const availableRides = useGameStore((s) => s.availableRides)
  const playerRide = useGameStore((s) => s.playerRide)

  if (gameMode !== 'driver') return null

  return (
    <group>
      {/* Available ride pickup markers (green) */}
      {availableRides
        .filter((r) => r.status === 'available')
        .map((ride) => (
          <PillarMarker
            key={ride.id}
            x={ride.pickupX}
            z={ride.pickupZ}
            color="#22C55E"
            label="PICKUP"
          />
        ))}

      {/* Active ride — show dropoff marker (red/orange) + direction line */}
      {playerRide && playerRide.status === 'accepted' && (
        <>
          <PillarMarker
            x={playerRide.dropoffX}
            z={playerRide.dropoffZ}
            color="#EF4444"
            label="DROPOFF"
          />
          <DirectionLine
            targetX={playerRide.dropoffX}
            targetZ={playerRide.dropoffZ}
            color="#EF4444"
          />
        </>
      )}

      {/* If no active ride, show direction lines to nearest available pickup */}
      {!playerRide &&
        availableRides
          .filter((r) => r.status === 'available')
          .slice(0, 1) // just the nearest hint
          .map((ride) => (
            <DirectionLine
              key={`dir-${ride.id}`}
              targetX={ride.pickupX}
              targetZ={ride.pickupZ}
              color="#22C55E"
            />
          ))}
    </group>
  )
}
