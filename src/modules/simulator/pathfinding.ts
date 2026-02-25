// ============================================
// Pathfinding — Dijkstra, snap-to-road, utils
// ============================================

import type { ZoneId } from '../../store/gameStore'
import { ROAD_GRAPH, ROAD_SEGMENTS, ADJACENCY, ZONE_POSITIONS } from './roadGraph'

// ─── Dijkstra (memoized) ────────────────────

const pathCache = new Map<string, [number, number][]>()

function cacheKey(from: ZoneId, to: ZoneId): string {
  return `${from}->${to}`
}

/**
 * Find shortest road path from one zone to another.
 * Returns array of [x, z] waypoints including start and end zone positions.
 */
export function findPath(from: ZoneId, to: ZoneId): [number, number][] {
  if (from === to) {
    const n = ROAD_GRAPH.nodes[from]
    return [[n.x, n.z]]
  }

  const key = cacheKey(from, to)
  if (pathCache.has(key)) return pathCache.get(key)!

  // Dijkstra
  const dist: Partial<Record<ZoneId, number>> = {}
  const prev: Partial<Record<ZoneId, { zone: ZoneId; edgeIdx: number }>> = {}
  const visited = new Set<ZoneId>()

  const ALL: ZoneId[] = ['alex', '6oct', 'ring_road', '5th_settlement', 'new_cairo', 'downtown']
  ALL.forEach(z => { dist[z] = Infinity })
  dist[from] = 0

  for (let i = 0; i < ALL.length; i++) {
    // pick unvisited with smallest dist
    let u: ZoneId | null = null
    let best = Infinity
    for (const z of ALL) {
      if (!visited.has(z) && dist[z]! < best) {
        best = dist[z]!
        u = z
      }
    }
    if (!u || u === to) break
    visited.add(u)

    for (const adj of ADJACENCY[u]) {
      if (visited.has(adj.neighbor)) continue
      const alt = dist[u]! + adj.distance
      if (alt < dist[adj.neighbor]!) {
        dist[adj.neighbor] = alt
        prev[adj.neighbor] = { zone: u, edgeIdx: adj.edgeIdx }
      }
    }
  }

  // Reconstruct zone path
  const zonePath: { zone: ZoneId; edgeIdx: number }[] = []
  let cur: ZoneId = to
  while (prev[cur]) {
    zonePath.unshift({ zone: cur, edgeIdx: prev[cur]!.edgeIdx })
    cur = prev[cur]!.zone
  }

  // Build waypoint list from road edges
  const waypoints: [number, number][] = []
  const startNode = ROAD_GRAPH.nodes[from]
  waypoints.push([startNode.x, startNode.z])

  let currentZone = from
  for (const step of zonePath) {
    const edge = ROAD_GRAPH.edges[step.edgeIdx]
    // Determine direction: are we going from→to or to→from?
    const forward = edge.from === currentZone
    const edgeWaypoints = forward ? [...edge.waypoints] : [...edge.waypoints].reverse()

    for (const wp of edgeWaypoints) {
      waypoints.push(wp)
    }

    const endNode = ROAD_GRAPH.nodes[step.zone]
    waypoints.push([endNode.x, endNode.z])
    currentZone = step.zone
  }

  pathCache.set(key, waypoints)
  return waypoints
}

// Pre-warm cache for all pairs
const ALL_ZONES: ZoneId[] = ['alex', '6oct', 'ring_road', '5th_settlement', 'new_cairo', 'downtown']
for (const a of ALL_ZONES) {
  for (const b of ALL_ZONES) {
    if (a !== b) findPath(a, b)
  }
}

// ─── Snap to road ───────────────────────────

/**
 * Find closest point on any road segment to given position.
 */
export function snapToRoad(x: number, z: number): { x: number; z: number; dist: number; edgeIdx: number } {
  let bestDist = Infinity
  let bestX = x
  let bestZ = z
  let bestEdge = 0

  for (const seg of ROAD_SEGMENTS) {
    const dx = seg.x2 - seg.x1
    const dz = seg.z2 - seg.z1
    const lenSq = dx * dx + dz * dz
    if (lenSq === 0) continue

    let t = ((x - seg.x1) * dx + (z - seg.z1) * dz) / lenSq
    t = Math.max(0, Math.min(1, t))

    const px = seg.x1 + t * dx
    const pz = seg.z1 + t * dz
    const d = worldDistance(x, z, px, pz)

    if (d < bestDist) {
      bestDist = d
      bestX = px
      bestZ = pz
      bestEdge = seg.edgeIdx
    }
  }

  return { x: bestX, z: bestZ, dist: bestDist, edgeIdx: bestEdge }
}

// ─── Random point on a road near a zone ─────

// Seeded PRNG for determinism
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Get a random point on a road connected to the given zone.
 * Uses Math.random() — not deterministic.
 */
export function randomRoadPoint(zoneId: ZoneId): { x: number; z: number } {
  const adj = ADJACENCY[zoneId]
  if (adj.length === 0) {
    const pos = ZONE_POSITIONS[zoneId]
    return { x: pos[0], z: pos[2] }
  }

  // Pick a random edge connected to this zone
  const chosen = adj[Math.floor(Math.random() * adj.length)]
  const edge = ROAD_GRAPH.edges[chosen.edgeIdx]
  const fromN = ROAD_GRAPH.nodes[edge.from]
  const toN = ROAD_GRAPH.nodes[edge.to]

  // All points along this edge
  const all: [number, number][] = [[fromN.x, fromN.z], ...edge.waypoints, [toN.x, toN.z]]

  // Pick a random segment within the edge
  const segIdx = Math.floor(Math.random() * (all.length - 1))
  const t = 0.1 + Math.random() * 0.8 // avoid exact endpoints

  return {
    x: all[segIdx][0] + t * (all[segIdx + 1][0] - all[segIdx][0]),
    z: all[segIdx][1] + t * (all[segIdx + 1][1] - all[segIdx][1]),
  }
}

/**
 * Get a deterministic random point near a zone using a seed.
 */
export function seededRandomRoadPoint(zoneId: ZoneId, seed: number): { x: number; z: number } {
  const rng = mulberry32(seed)
  const adj = ADJACENCY[zoneId]
  if (adj.length === 0) {
    const pos = ZONE_POSITIONS[zoneId]
    return { x: pos[0], z: pos[2] }
  }

  const chosen = adj[Math.floor(rng() * adj.length)]
  const edge = ROAD_GRAPH.edges[chosen.edgeIdx]
  const fromN = ROAD_GRAPH.nodes[edge.from]
  const toN = ROAD_GRAPH.nodes[edge.to]
  const all: [number, number][] = [[fromN.x, fromN.z], ...edge.waypoints, [toN.x, toN.z]]
  const segIdx = Math.floor(rng() * (all.length - 1))
  const t = 0.1 + rng() * 0.8

  return {
    x: all[segIdx][0] + t * (all[segIdx + 1][0] - all[segIdx][0]),
    z: all[segIdx][1] + t * (all[segIdx + 1][1] - all[segIdx][1]),
  }
}

// ─── Utility ────────────────────────────────

export function worldDistance(x1: number, z1: number, x2: number, z2: number): number {
  const dx = x2 - x1
  const dz = z2 - z1
  return Math.sqrt(dx * dx + dz * dz)
}

/**
 * Get the closest zone to a world position.
 */
export function closestZone(x: number, z: number): ZoneId {
  let best: ZoneId = 'ring_road'
  let bestDist = Infinity
  for (const [id, pos] of Object.entries(ZONE_POSITIONS)) {
    const d = worldDistance(x, z, pos[0], pos[2])
    if (d < bestDist) {
      bestDist = d
      best = id as ZoneId
    }
  }
  return best
}
