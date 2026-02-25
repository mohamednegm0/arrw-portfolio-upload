// ============================================
// CityBuilder — Procedural low-poly Cairo city
// Roads, buildings, landmarks, ground, skybox
// ============================================

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore, type ZoneId } from '../../store/gameStore'
import { ZONE_POSITIONS, ZONE_COLORS, ROAD_SEGMENTS, ROAD_GRAPH } from './roadGraph'

// ─── Seeded PRNG ────────────────────────────

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ─── Zone color palettes for buildings ──────

const BUILDING_PALETTES: Record<ZoneId, string[]> = {
  alex:             ['#E8E8E8', '#8CBAD9', '#B8D4E8', '#D0E0EB'],
  '6oct':           ['#98D4A8', '#78B488', '#A8D8B8', '#88C498'],
  ring_road:        ['#D4C894', '#C4B874', '#E0D8A8', '#B8A858'],
  '5th_settlement': ['#C8B8D8', '#A898C0', '#D8C8E8', '#B8A8CC'],
  new_cairo:        ['#E8C898', '#D4A870', '#F0D8A8', '#C89858'],
  downtown:         ['#D4A574', '#C4956A', '#B8896A', '#D8B088'],
}

// ─── Building colliders (exported for PlayerDriver) ─

export interface BuildingCollider {
  x: number; z: number; hw: number; hd: number
}

export const BUILDING_COLLIDERS: BuildingCollider[] = []

// ─── Road meshes (merged geometry) ──────────

function RoadMeshes() {
  const { roadGeo, lineGeo } = useMemo(() => {
    const roadPositions: number[] = []
    const roadNormals: number[] = []
    const roadIndices: number[] = []
    const linePositions: number[] = []
    const lineNormals: number[] = []
    const lineIndices: number[] = []
    let roadVCount = 0
    let lineVCount = 0

    for (const seg of ROAD_SEGMENTS) {
      const dx = seg.x2 - seg.x1
      const dz = seg.z2 - seg.z1
      const len = Math.sqrt(dx * dx + dz * dz)
      if (len < 0.01) continue

      // Perpendicular direction for road width
      const nx = -dz / len
      const nz = dx / len
      const hw = 0.75 // half-width of road

      // Road surface quad (4 vertices, 2 triangles)
      const verts = [
        [seg.x1 + nx * hw, 0.02, seg.z1 + nz * hw],
        [seg.x1 - nx * hw, 0.02, seg.z1 - nz * hw],
        [seg.x2 + nx * hw, 0.02, seg.z2 + nz * hw],
        [seg.x2 - nx * hw, 0.02, seg.z2 - nz * hw],
      ] as const

      for (const v of verts) {
        roadPositions.push(v[0], v[1], v[2])
        roadNormals.push(0, 1, 0)
      }
      roadIndices.push(
        roadVCount, roadVCount + 1, roadVCount + 2,
        roadVCount + 1, roadVCount + 3, roadVCount + 2
      )
      roadVCount += 4

      // Center line (thin strip)
      const lw = 0.03
      const lineVerts = [
        [seg.x1 + nx * lw, 0.03, seg.z1 + nz * lw],
        [seg.x1 - nx * lw, 0.03, seg.z1 - nz * lw],
        [seg.x2 + nx * lw, 0.03, seg.z2 + nz * lw],
        [seg.x2 - nx * lw, 0.03, seg.z2 - nz * lw],
      ] as const

      for (const v of lineVerts) {
        linePositions.push(v[0], v[1], v[2])
        lineNormals.push(0, 1, 0)
      }
      lineIndices.push(
        lineVCount, lineVCount + 1, lineVCount + 2,
        lineVCount + 1, lineVCount + 3, lineVCount + 2
      )
      lineVCount += 4
    }

    const rGeo = new THREE.BufferGeometry()
    rGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPositions, 3))
    rGeo.setAttribute('normal', new THREE.Float32BufferAttribute(roadNormals, 3))
    rGeo.setIndex(roadIndices)

    const lGeo = new THREE.BufferGeometry()
    lGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))
    lGeo.setAttribute('normal', new THREE.Float32BufferAttribute(lineNormals, 3))
    lGeo.setIndex(lineIndices)

    return { roadGeo: rGeo, lineGeo: lGeo }
  }, [])

  return (
    <group>
      <mesh geometry={roadGeo} receiveShadow>
        <meshStandardMaterial color="#3A3A3A" roughness={0.9} />
      </mesh>
      <mesh geometry={lineGeo}>
        <meshStandardMaterial color="#FFFFFF" transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

// ─── Buildings (InstancedMesh per zone) ─────

function ZoneBuildings({ zoneId }: { zoneId: ZoneId }) {
  const palette = BUILDING_PALETTES[zoneId]
  const pos = ZONE_POSITIONS[zoneId]

  const { matrices, colors, colliders } = useMemo(() => {
    const rng = mulberry32(zoneId.charCodeAt(0) * 1000 + zoneId.charCodeAt(1) * 100)
    const count = 6 + Math.floor(rng() * 5) // 6-10 buildings
    const mats: THREE.Matrix4[] = []
    const cols: THREE.Color[] = []
    const colls: BuildingCollider[] = []

    for (let i = 0; i < count; i++) {
      const angle = rng() * Math.PI * 2
      const radius = 2.5 + rng() * 3 // outside zone center, near road
      const bx = pos[0] + Math.cos(angle) * radius
      const bz = pos[2] + Math.sin(angle) * radius

      const w = 0.8 + rng() * 1.7  // width
      const d = 0.8 + rng() * 1.7  // depth
      const h = 1 + rng() * 4      // height
      const rotY = (rng() - 0.5) * 0.5 // ±15° rotation

      const mat = new THREE.Matrix4()
      mat.compose(
        new THREE.Vector3(bx, h / 2, bz),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY),
        new THREE.Vector3(w, h, d)
      )
      mats.push(mat)

      const colorStr = palette[Math.floor(rng() * palette.length)]
      cols.push(new THREE.Color(colorStr))

      colls.push({ x: bx, z: bz, hw: w / 2 + 0.2, hd: d / 2 + 0.2 })
    }

    return { matrices: mats, colors: cols, colliders: colls }
  }, [zoneId, pos, palette])

  // Register colliders globally
  useMemo(() => {
    // Remove old colliders for this zone then add new
    const startTag = `__zone_${zoneId}`
    for (let i = BUILDING_COLLIDERS.length - 1; i >= 0; i--) {
      if ((BUILDING_COLLIDERS[i] as any).__zone === zoneId) BUILDING_COLLIDERS.splice(i, 1)
    }
    for (const c of colliders) {
      (c as any).__zone = zoneId
      BUILDING_COLLIDERS.push(c)
    }
  }, [colliders, zoneId])

  const meshRef = useRef<THREE.InstancedMesh>(null)

  useMemo(() => {
    if (!meshRef.current) return
    for (let i = 0; i < matrices.length; i++) {
      meshRef.current.setMatrixAt(i, matrices[i])
      meshRef.current.setColorAt(i, colors[i])
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [matrices, colors])

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, matrices.length]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.8} metalness={0.1} />
    </instancedMesh>
  )
}

// ─── Zone ground glow + label ───────────────

function ZoneGround({ zoneId }: { zoneId: ZoneId }) {
  const pos = ZONE_POSITIONS[zoneId]
  const color = ZONE_COLORS[zoneId]
  const zone = useGameStore((s) => s.zones.find(z => z.id === zoneId))
  const drivers = useGameStore((s) => s.drivers)
  const activeZone = useGameStore((s) => s.activeZone)
  const setActiveZone = useGameStore((s) => s.setActiveZone)
  const ringRef = useRef<THREE.Mesh>(null)
  const isActive = activeZone === zoneId

  const liveDriverCount = drivers.filter(d => d.zone === zoneId).length

  useFrame(({ clock }) => {
    if (!ringRef.current) return
    const mat = ringRef.current.material as THREE.MeshStandardMaterial
    mat.opacity = 0.15 + Math.sin(clock.elapsedTime * 2) * 0.12
  })

  if (!zone) return null

  return (
    <group position={pos}>
      {/* Ground fill */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} onClick={() => setActiveZone(zoneId)}>
        <circleGeometry args={[4, 32]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={isActive ? 0.1 : 0.04}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Pulsing rim */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.8, 4.1, 32]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Zone label */}
      <Text
        position={[0, 0.1, -4.5]}
        fontSize={0.5}
        color={color}
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf"
      >
        {zone.name}
      </Text>
      {/* Live driver count */}
      <Text
        position={[0, 0.1, 4.5]}
        fontSize={0.35}
        color="#A0AEC0"
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf"
      >
        {`${liveDriverCount} drivers • ${zone.riders} riders`}
      </Text>
    </group>
  )
}

// ─── Landmarks ──────────────────────────────

function Landmarks() {
  return (
    <group>
      {/* Downtown — Tahrir Obelisk */}
      <group position={[5, 0, -3]}>
        <mesh position={[0, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.3, 3, 8]} />
          <meshStandardMaterial color="#D4A574" roughness={0.6} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <circleGeometry args={[2, 32]} />
          <meshStandardMaterial color="#888" roughness={0.9} />
        </mesh>
        <pointLight position={[0, 3.5, 0]} color="#F56565" intensity={0.5} distance={8} />
      </group>

      {/* Alexandria — Lighthouse */}
      <group position={[-20, 0, -15]}>
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[0.8, 1, 0.8]} />
          <meshStandardMaterial color="#E8E8E8" roughness={0.7} />
        </mesh>
        <mesh position={[0, 3, 0]} castShadow>
          <coneGeometry args={[0.4, 2, 8]} />
          <meshStandardMaterial color="#8CBAD9" roughness={0.6} />
        </mesh>
        <pointLight position={[0, 4.5, 0]} color="#4299E1" intensity={0.5} distance={8} />
      </group>

      {/* Ring Road — Interchange loop */}
      <group position={[0, 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
          <torusGeometry args={[1.5, 0.12, 8, 24]} />
          <meshStandardMaterial color="#ECC94B" roughness={0.6} emissive="#ECC94B" emissiveIntensity={0.1} />
        </mesh>
        <pointLight position={[0, 1, 0]} color="#ECC94B" intensity={0.4} distance={8} />
      </group>

      {/* 5th Settlement — AUC Gate */}
      <group position={[12, 0, -8]}>
        {/* Two pillars */}
        <mesh position={[-0.6, 1, 0]} castShadow>
          <boxGeometry args={[0.3, 2, 0.3]} />
          <meshStandardMaterial color="#C8B8D8" roughness={0.6} />
        </mesh>
        <mesh position={[0.6, 1, 0]} castShadow>
          <boxGeometry args={[0.3, 2, 0.3]} />
          <meshStandardMaterial color="#C8B8D8" roughness={0.6} />
        </mesh>
        {/* Cross beam */}
        <mesh position={[0, 2.1, 0]} castShadow>
          <boxGeometry args={[1.8, 0.25, 0.35]} />
          <meshStandardMaterial color="#A898C0" roughness={0.6} />
        </mesh>
        <pointLight position={[0, 2.5, 0]} color="#9F7AEA" intensity={0.4} distance={8} />
      </group>

      {/* New Cairo — Mall facade */}
      <group position={[15, 0, 5]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[3, 1.2, 1.5]} />
          <meshStandardMaterial color="#E8C898" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0, 1.3, 0]}>
          <boxGeometry args={[2.6, 0.15, 1.2]} />
          <meshStandardMaterial color="#D4A870" roughness={0.6} />
        </mesh>
        <pointLight position={[0, 2, 0]} color="#ED8936" intensity={0.4} distance={8} />
      </group>

      {/* 6th October — Ferris wheel base */}
      <group position={[-10, 0, 5]}>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 0.3, 16]} />
          <meshStandardMaterial color="#78B488" roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <torusGeometry args={[1.2, 0.06, 6, 16]} />
          <meshStandardMaterial color="#48BB78" roughness={0.6} emissive="#48BB78" emissiveIntensity={0.15} />
        </mesh>
        <pointLight position={[0, 2, 0]} color="#48BB78" intensity={0.4} distance={8} />
      </group>
    </group>
  )
}

// ─── Ground + Skybox ────────────────────────

function GroundAndSky() {
  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[120, 100]} />
        <meshStandardMaterial color="#1A1612" roughness={1} />
      </mesh>

      {/* Sky sphere (gradient) */}
      <mesh>
        <sphereGeometry args={[90, 32, 16]} />
        <meshBasicMaterial color="#0F1B2D" side={THREE.BackSide} />
      </mesh>

      {/* Boundary glow walls (subtle) */}
      {/* Left wall (x = -25) */}
      <mesh position={[-25, 0.25, -5]}>
        <boxGeometry args={[0.1, 0.5, 35]} />
        <meshStandardMaterial color="#FF0000" transparent opacity={0.04} emissive="#FF0000" emissiveIntensity={0.3} />
      </mesh>
      {/* Right wall (x = 20) */}
      <mesh position={[20, 0.25, -5]}>
        <boxGeometry args={[0.1, 0.5, 35]} />
        <meshStandardMaterial color="#FF0000" transparent opacity={0.04} emissive="#FF0000" emissiveIntensity={0.3} />
      </mesh>
      {/* Back wall (z = -20) */}
      <mesh position={[-2.5, 0.25, -20]}>
        <boxGeometry args={[45, 0.5, 0.1]} />
        <meshStandardMaterial color="#FF0000" transparent opacity={0.04} emissive="#FF0000" emissiveIntensity={0.3} />
      </mesh>
      {/* Front wall (z = 10) */}
      <mesh position={[-2.5, 0.25, 10]}>
        <boxGeometry args={[45, 0.5, 0.1]} />
        <meshStandardMaterial color="#FF0000" transparent opacity={0.04} emissive="#FF0000" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}

// ─── Main export ────────────────────────────

const ALL_ZONES: ZoneId[] = ['alex', '6oct', 'ring_road', '5th_settlement', 'new_cairo', 'downtown']

export default function CityBuilder() {
  return (
    <group>
      <GroundAndSky />
      <RoadMeshes />
      {ALL_ZONES.map(z => (
        <ZoneBuildings key={z} zoneId={z} />
      ))}
      {ALL_ZONES.map(z => (
        <ZoneGround key={z} zoneId={z} />
      ))}
      <Landmarks />
    </group>
  )
}
