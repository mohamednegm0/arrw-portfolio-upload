// ============================================
// Minimap — 2D canvas overlay showing city overview
// Roads, zones, AI drivers, player, ride markers
// ============================================

import { useRef, useEffect, useCallback } from 'react'
import { useGameStore } from '../../store/gameStore'
import { ZONE_POSITIONS, ZONE_COLORS, ROAD_SEGMENTS } from './roadGraph'

const MAP_SIZE = 160 // px
const WORLD_MIN_X = -25
const WORLD_MAX_X = 20
const WORLD_MIN_Z = -20
const WORLD_MAX_Z = 10
const WORLD_W = WORLD_MAX_X - WORLD_MIN_X
const WORLD_H = WORLD_MAX_Z - WORLD_MIN_Z

function worldToMap(wx: number, wz: number): [number, number] {
  const mx = ((wx - WORLD_MIN_X) / WORLD_W) * MAP_SIZE
  const my = ((wz - WORLD_MIN_Z) / WORLD_H) * MAP_SIZE
  return [mx, my]
}

export default function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const state = useGameStore.getState()
    if (state.gameMode !== 'driver') return

    // Clear
    ctx.fillStyle = 'rgba(15, 27, 45, 0.85)'
    ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE)

    // Draw roads
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    for (const seg of ROAD_SEGMENTS) {
      const [mx1, my1] = worldToMap(seg.x1, seg.z1)
      const [mx2, my2] = worldToMap(seg.x2, seg.z2)
      ctx.beginPath()
      ctx.moveTo(mx1, my1)
      ctx.lineTo(mx2, my2)
      ctx.stroke()
    }

    // Draw zone dots
    for (const [zoneId, pos] of Object.entries(ZONE_POSITIONS)) {
      const [mx, my] = worldToMap(pos[0], pos[2])
      ctx.fillStyle = ZONE_COLORS[zoneId as keyof typeof ZONE_COLORS] || '#ECC94B'
      ctx.globalAlpha = 0.6
      ctx.beginPath()
      ctx.arc(mx, my, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }

    // Draw AI drivers as tiny dots
    ctx.fillStyle = 'rgba(246, 166, 35, 0.5)'
    for (const driver of state.drivers) {
      const [mx, my] = worldToMap(driver.x, driver.z)
      ctx.beginPath()
      ctx.arc(mx, my, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw available ride pickups (green)
    for (const ride of state.availableRides) {
      if (ride.status !== 'available') continue
      const [mx, my] = worldToMap(ride.pickupX, ride.pickupZ)
      ctx.fillStyle = '#22C55E'
      ctx.beginPath()
      ctx.arc(mx, my, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw active ride dropoff (red)
    if (state.playerRide?.status === 'accepted') {
      const [mx, my] = worldToMap(state.playerRide.dropoffX, state.playerRide.dropoffZ)
      ctx.fillStyle = '#EF4444'
      ctx.beginPath()
      ctx.arc(mx, my, 4, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw player as arrow
    const [px, py] = worldToMap(state.playerWorldX, state.playerWorldZ)
    const heading = state.playerWorldHeading
    ctx.save()
    ctx.translate(px, py)
    ctx.rotate(-heading) // canvas Y is down, world heading is CW from +Z
    ctx.fillStyle = '#F6A623'
    ctx.beginPath()
    ctx.moveTo(0, -5)
    ctx.lineTo(-3, 4)
    ctx.lineTo(3, 4)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, MAP_SIZE, MAP_SIZE)

    animRef.current = requestAnimationFrame(draw)
  }, [])

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw])

  const gameMode = useGameStore((s) => s.gameMode)
  if (gameMode !== 'driver') return null

  return (
    <canvas
      ref={canvasRef}
      width={MAP_SIZE}
      height={MAP_SIZE}
      className="absolute bottom-4 right-3 rounded-lg pointer-events-none z-20"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
