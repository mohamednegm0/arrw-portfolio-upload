// ============================================
// Economics Module — Visual Control Panel
// Sliders, gauges, zone comparison
// Hidden SQL terminal at bottom
// ============================================

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useGameStore, type ZoneId } from '../../store/gameStore'
import {
  calcFare, calcCommission,
  calcLTVtoCACRatio,
  formatEGP, formatPct, getZoneSummary,
} from '../../core/economics'
import SQLTerminal from './SQLTerminal'

export default function EconomicsModule() {
  const zones = useGameStore((s) => s.zones)
  const updateZone = useGameStore((s) => s.updateZone)
  const globalSurge = useGameStore((s) => s.globalSurge)
  const setGlobalSurge = useGameStore((s) => s.setGlobalSurge)
  const globalPayoutPct = useGameStore((s) => s.globalPayoutPct)
  const setGlobalPayout = useGameStore((s) => s.setGlobalPayout)
  const cac = useGameStore((s) => s.cac)
  const setCAC = useGameStore((s) => s.setCAC)
  const ltv = useGameStore((s) => s.ltv)
  const setLTV = useGameStore((s) => s.setLTV)
  const showSQL = useGameStore((s) => s.showSQL)
  const toggleSQL = useGameStore((s) => s.toggleSQL)
  const language = useGameStore((s) => s.language)
  const [selectedZone, setSelectedZone] = useState<ZoneId>('alex')

  const zone = zones.find(z => z.id === selectedZone)!
  const summary = useMemo(() => getZoneSummary(zone, globalSurge, globalPayoutPct), [zone, globalSurge, globalPayoutPct])
  const ltvCacRatio = calcLTVtoCACRatio(ltv, cac)

  const activeZones = zones.filter(z => z.status === 'active')
  const allZoneSummaries = useMemo(
    () => zones.filter(z => z.status !== 'locked').map(z => ({
      ...getZoneSummary(z, globalSurge, globalPayoutPct),
      zone: z,
    })),
    [zones, globalSurge, globalPayoutPct]
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full overflow-auto p-4 md:p-6"
    >
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          📊 {language === 'ar' ? 'لوحة التحكم الاقتصادية' : 'Economics Control Panel'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {language === 'ar'
            ? 'غيّر المعاملات وشوف التأثير في الحقيقي'
            : 'Adjust parameters and see real-time impact on unit economics'}
        </p>
      </div>

      {/* Top KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPICard
          label="LTV"
          value={formatEGP(ltv)}
          color="text-success"
          subtitle="Customer Lifetime Value"
        />
        <KPICard
          label="CAC"
          value={formatEGP(cac)}
          color="text-danger"
          subtitle="Acquisition Cost"
        />
        <KPICard
          label="LTV:CAC"
          value={`${ltvCacRatio}x`}
          color={ltvCacRatio >= 3 ? 'text-success' : ltvCacRatio >= 2 ? 'text-warning' : 'text-danger'}
          subtitle={ltvCacRatio >= 3 ? 'Healthy' : ltvCacRatio >= 2 ? 'Caution' : 'Danger'}
        />
        <KPICard
          label="Active Zones"
          value={`${activeZones.length}/6`}
          color="text-brand-accent"
          subtitle="Markets Live"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Global controls */}
        <div className="space-y-4">
          <div className="bg-brand-surface rounded-xl p-4 border border-brand-surface-light">
            <h3 className="font-bold text-white text-sm mb-4">Global Controls</h3>

            <SliderControl
              label="Global Surge"
              value={globalSurge}
              min={1}
              max={3}
              step={0.1}
              format={(v) => `${v.toFixed(1)}x`}
              onChange={setGlobalSurge}
              color="#F6A623"
            />

            <SliderControl
              label="Payout %"
              value={globalPayoutPct}
              min={50}
              max={85}
              step={1}
              format={(v) => formatPct(v)}
              onChange={setGlobalPayout}
              color="#38A169"
            />

            <SliderControl
              label="CAC (EGP)"
              value={cac}
              min={50}
              max={500}
              step={10}
              format={(v) => formatEGP(v)}
              onChange={setCAC}
              color="#E53E3E"
            />

            <SliderControl
              label="LTV (EGP)"
              value={ltv}
              min={100}
              max={1500}
              step={10}
              format={(v) => formatEGP(v)}
              onChange={setLTV}
              color="#38A169"
            />
          </div>

          {/* Zone selector */}
          <div className="bg-brand-surface rounded-xl p-4 border border-brand-surface-light">
            <h3 className="font-bold text-white text-sm mb-3">Zone Focus</h3>
            <div className="flex flex-wrap gap-1.5">
              {zones.filter(z => z.status !== 'locked').map(z => (
                <button
                  key={z.id}
                  onClick={() => setSelectedZone(z.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    z.id === selectedZone
                      ? 'bg-brand-accent text-brand-dark'
                      : 'bg-brand-dark text-gray-400 hover:text-white'
                  }`}
                >
                  {z.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Zone detail */}
        <div className="bg-brand-surface rounded-xl p-4 border border-brand-surface-light">
          <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
            📍 {zone.name}
            <span className="text-xs text-gray-500 font-cairo">{zone.nameAr}</span>
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
              zone.status === 'active' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
            }`}>
              {zone.status}
            </span>
          </h3>

          {/* Zone sliders */}
          <SliderControl
            label="Base Fare"
            value={zone.baseFare}
            min={5}
            max={30}
            step={0.5}
            format={(v) => `${v} EGP`}
            onChange={(v) => updateZone(selectedZone, { baseFare: v })}
            color="#4299E1"
          />
          <SliderControl
            label="Per KM"
            value={zone.perKm}
            min={1}
            max={8}
            step={0.25}
            format={(v) => `${v} EGP/km`}
            onChange={(v) => updateZone(selectedZone, { perKm: v })}
            color="#4299E1"
          />
          <SliderControl
            label="Surge"
            value={zone.surge}
            min={1}
            max={3}
            step={0.1}
            format={(v) => `${v.toFixed(1)}x`}
            onChange={(v) => updateZone(selectedZone, { surge: v })}
            color="#F6A623"
          />
          <SliderControl
            label="Dead Miles"
            value={zone.deadMiles}
            min={0}
            max={10}
            step={0.1}
            format={(v) => `${v.toFixed(1)} km`}
            onChange={(v) => updateZone(selectedZone, { deadMiles: v })}
            color="#E53E3E"
          />

          {/* Computed metrics */}
          <div className="mt-4 pt-4 border-t border-brand-surface-light space-y-2 text-xs">
            <MetricRow label="Avg Fare" value={formatEGP(summary.avgFare)} />
            <MetricRow label="Driver Payout" value={formatEGP(summary.driverPayout)} />
            <MetricRow label="Arrw Commission" value={formatEGP(summary.arrwCommission)} color="text-success" />
            <MetricRow label="Dead Mile Cost" value={formatEGP(summary.deadMileCost)} color="text-danger" />
            <MetricRow
              label="Net Revenue/Trip"
              value={formatEGP(summary.netRevenuePerTrip)}
              color={summary.profitablePerTrip ? 'text-success' : 'text-danger'}
              highlight
            />
          </div>
        </div>

        {/* Right: Zone comparison table */}
        <div className="bg-brand-surface rounded-xl p-4 border border-brand-surface-light overflow-x-auto">
          <h3 className="font-bold text-white text-sm mb-4">Zone Comparison</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-brand-surface-light">
                <th className="text-left py-2">Zone</th>
                <th className="text-right py-2">Fare</th>
                <th className="text-right py-2">Net/Trip</th>
                <th className="text-right py-2">Profit?</th>
              </tr>
            </thead>
            <tbody>
              {allZoneSummaries.map(s => (
                <tr
                  key={s.zone.id}
                  className={`border-b border-brand-dark/50 cursor-pointer hover:bg-brand-dark/30 ${
                    s.zone.id === selectedZone ? 'bg-brand-dark/50' : ''
                  }`}
                  onClick={() => setSelectedZone(s.zone.id)}
                >
                  <td className="py-2 text-white">{s.zoneName}</td>
                  <td className="py-2 text-right font-mono text-gray-300">{formatEGP(s.avgFare)}</td>
                  <td className={`py-2 text-right font-mono ${s.profitablePerTrip ? 'text-success' : 'text-danger'}`}>
                    {formatEGP(s.netRevenuePerTrip)}
                  </td>
                  <td className="py-2 text-right">{s.profitablePerTrip ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SQL Terminal toggle */}
      <div className="mt-6">
        <button
          onClick={toggleSQL}
          className="text-xs text-gray-600 hover:text-brand-accent transition-colors flex items-center gap-1"
        >
          {showSQL ? '▼' : '▶'} Advanced: SQL Terminal
        </button>
        {showSQL && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-2"
          >
            <SQLTerminal />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Slider Component ───────────────────────
function SliderControl({
  label, value, min, max, step, format, onChange, color,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
  color: string
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs font-mono font-bold" style={{ color }}>
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        title={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${((value - min) / (max - min)) * 100}%, #2D3B4D ${((value - min) / (max - min)) * 100}%, #2D3B4D 100%)`,
        }}
      />
    </div>
  )
}

// ─── KPI Card ───────────────────────────────
function KPICard({
  label, value, color, subtitle,
}: {
  label: string
  value: string
  color: string
  subtitle: string
}) {
  return (
    <div className="bg-brand-surface rounded-xl p-3 border border-brand-surface-light">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-lg font-bold font-mono ${color}`}>{value}</div>
      <div className="text-xs text-gray-600 mt-1">{subtitle}</div>
    </div>
  )
}

// ─── Metric Row ─────────────────────────────
function MetricRow({
  label, value, color = 'text-white', highlight = false,
}: {
  label: string
  value: string
  color?: string
  highlight?: boolean
}) {
  return (
    <div className={`flex justify-between ${highlight ? 'pt-2 border-t border-brand-accent/20' : ''}`}>
      <span className="text-gray-400">{label}</span>
      <span className={`font-mono font-bold ${color}`}>{value}</span>
    </div>
  )
}
