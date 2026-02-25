// ============================================
// Road Graph — Zone positions, road network data
// Single source of truth for all spatial data
// ============================================

import type { ZoneId } from '../../store/gameStore'

// ─── Zone world positions ───────────────────

export const ZONE_POSITIONS: Record<ZoneId, [number, number, number]> = {
  alex:            [-20, 0, -15],
  '6oct':          [-10, 0,   5],
  ring_road:       [  0, 0,   0],
  '5th_settlement':[12,  0,  -8],
  new_cairo:       [15,  0,   5],
  downtown:        [ 5,  0,  -3],
}

export const ZONE_COLORS: Record<ZoneId, string> = {
  alex:             '#4299E1',
  '6oct':           '#48BB78',
  ring_road:        '#ECC94B',
  '5th_settlement': '#9F7AEA',
  new_cairo:        '#ED8936',
  downtown:         '#F56565',
}

// ─── Road graph types ───────────────────────

export interface RoadNode {
  id: ZoneId
  x: number
  z: number
}

export interface RoadEdge {
  from: ZoneId
  to: ZoneId
  waypoints: [number, number][]  // [x, z] intermediate bends
  distance: number               // sum of segment lengths
  width: number
}

export interface RoadGraphData {
  nodes: Record<ZoneId, RoadNode>
  edges: RoadEdge[]
}

// ─── Helper: segment distance ───────────────

function dist(x1: number, z1: number, x2: number, z2: number): number {
  const dx = x2 - x1
  const dz = z2 - z1
  return Math.sqrt(dx * dx + dz * dz)
}

function computeEdgeDistance(from: [number, number], to: [number, number], waypoints: [number, number][]): number {
  const all: [number, number][] = [from, ...waypoints, to]
  let total = 0
  for (let i = 0; i < all.length - 1; i++) {
    total += dist(all[i][0], all[i][1], all[i + 1][0], all[i + 1][1])
  }
  return total
}

// ─── Build graph ────────────────────────────

const nodes: Record<ZoneId, RoadNode> = {} as Record<ZoneId, RoadNode>
for (const [id, pos] of Object.entries(ZONE_POSITIONS)) {
  nodes[id as ZoneId] = { id: id as ZoneId, x: pos[0], z: pos[2] }
}

// 8 bidirectional edges forming a connected city road network
const rawEdges: { from: ZoneId; to: ZoneId; waypoints: [number, number][] }[] = [
  { from: 'alex',           to: '6oct',           waypoints: [[-15, -5]] },
  { from: '6oct',           to: 'ring_road',      waypoints: [[-5, 2]] },
  { from: 'ring_road',      to: 'downtown',       waypoints: [] },
  { from: 'downtown',       to: '5th_settlement', waypoints: [[8, -5]] },
  { from: '5th_settlement', to: 'new_cairo',      waypoints: [[14, -1]] },
  { from: 'ring_road',      to: '5th_settlement', waypoints: [[6, -4]] },
  { from: '6oct',           to: 'downtown',       waypoints: [[-3, 2]] },
  { from: 'new_cairo',      to: 'downtown',       waypoints: [[10, 1]] },
]

const edges: RoadEdge[] = rawEdges.map(e => {
  const fromN = nodes[e.from]
  const toN = nodes[e.to]
  return {
    ...e,
    width: 1.5,
    distance: computeEdgeDistance([fromN.x, fromN.z], [toN.x, toN.z], e.waypoints),
  }
})

export const ROAD_GRAPH: RoadGraphData = { nodes, edges }

// ─── Flat segment list (for rendering, snap, minimap) ─

export interface RoadSegment {
  x1: number; z1: number; x2: number; z2: number
  edgeIdx: number
}

export const ROAD_SEGMENTS: RoadSegment[] = []

edges.forEach((edge, edgeIdx) => {
  const fromN = nodes[edge.from]
  const toN = nodes[edge.to]
  const all: [number, number][] = [[fromN.x, fromN.z], ...edge.waypoints, [toN.x, toN.z]]
  for (let i = 0; i < all.length - 1; i++) {
    ROAD_SEGMENTS.push({
      x1: all[i][0], z1: all[i][1],
      x2: all[i + 1][0], z2: all[i + 1][1],
      edgeIdx,
    })
  }
})

// ─── Adjacency list (for pathfinding) ───────

export const ADJACENCY: Record<ZoneId, { neighbor: ZoneId; distance: number; edgeIdx: number }[]> = {} as any

const ALL_ZONES: ZoneId[] = ['alex', '6oct', 'ring_road', '5th_settlement', 'new_cairo', 'downtown']
ALL_ZONES.forEach(z => { ADJACENCY[z] = [] })

edges.forEach((edge, idx) => {
  ADJACENCY[edge.from].push({ neighbor: edge.to, distance: edge.distance, edgeIdx: idx })
  ADJACENCY[edge.to].push({ neighbor: edge.from, distance: edge.distance, edgeIdx: idx })
})
