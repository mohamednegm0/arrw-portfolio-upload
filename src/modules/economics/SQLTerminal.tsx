// ============================================
// SQL Terminal — Hidden advanced mode
// Uses AlaSQL to query Zustand state as tables
// ============================================

import { useState, useRef, useEffect, useCallback } from 'react'
import { useGameStore } from '../../store/gameStore'

// SQL syntax highlighting
function highlightSQL(sql: string): string {
  const keywords = /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP BY|ORDER BY|HAVING|LIMIT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|AS|AND|OR|NOT|IN|LIKE|BETWEEN|IS|NULL|COUNT|SUM|AVG|MAX|MIN|DISTINCT|UNION|ALL|CASE|WHEN|THEN|ELSE|END|DESC|ASC)\b/gi
  const strings = /('[^']*')/g
  const numbers = /\b(\d+\.?\d*)\b/g

  return sql
    .replace(keywords, '<span class="keyword">$1</span>')
    .replace(strings, '<span class="string">$1</span>')
    .replace(numbers, '<span class="number">$1</span>')
}

const EXAMPLE_QUERIES = [
  "SELECT name, baseFare, perKm, surge, payoutPct FROM zones WHERE status = 'active'",
  "SELECT name, (baseFare + perKm * avgTrip) * surge AS avgFare, deadMiles FROM zones ORDER BY avgFare DESC",
  "SELECT name, ((baseFare + perKm * avgTrip) * surge) * (1 - payoutPct/100) AS commission FROM zones",
  "SELECT name, drivers, riders, ROUND(riders * 1.0 / CASE WHEN drivers > 0 THEN drivers ELSE 1 END, 1) AS demand_ratio FROM zones",
]

export default function SQLTerminal() {
  const [query, setQuery] = useState(EXAMPLE_QUERIES[0])
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const zones = useGameStore((s) => s.zones)

  const executeQuery = useCallback(async () => {
    try {
      setError(null)
      const alasql = (await import('alasql')).default

      // Register zones as a named table so queries can use FROM zones
      const zonesData = zones.map(z => ({
        id: z.id,
        name: z.name,
        status: z.status,
        baseFare: z.baseFare,
        perKm: z.perKm,
        surge: z.surge,
        payoutPct: z.payoutPct,
        avgTrip: z.avgTrip,
        deadMiles: z.deadMiles,
        drivers: z.drivers,
        riders: z.riders,
        landmark: z.landmark,
      }))

      // Drop & recreate the zones table every execution so data stays fresh
      try { alasql('DROP TABLE IF EXISTS zones') } catch (_) { /* ignore */ }
      alasql('CREATE TABLE zones')
      alasql.tables.zones.data = zonesData

      const result = alasql(query)
      setResults(Array.isArray(result) ? result : [{ result }])
      setHistory(prev => [query, ...prev.slice(0, 19)])
      setHistoryIdx(-1)
    } catch (e: any) {
      setError(e.message || 'Query error')
      setResults([])
    }
  }, [query, zones])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      executeQuery()
    }
    if (e.key === 'ArrowUp' && e.altKey && history.length > 0) {
      e.preventDefault()
      const newIdx = Math.min(historyIdx + 1, history.length - 1)
      setHistoryIdx(newIdx)
      setQuery(history[newIdx])
    }
    if (e.key === 'ArrowDown' && e.altKey && historyIdx > 0) {
      e.preventDefault()
      const newIdx = historyIdx - 1
      setHistoryIdx(newIdx)
      setQuery(history[newIdx])
    }
  }

  // Run initial query on mount
  useEffect(() => {
    executeQuery()
  }, [])

  return (
    <div className="bg-brand-dark border border-brand-surface-light rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-brand-surface border-b border-brand-surface-light">
        <div className="flex items-center gap-2">
          <span className="text-brand-accent text-xs font-mono">SQL&gt;</span>
          <span className="text-gray-400 text-xs">AlaSQL Terminal</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            title="Example queries"
            onChange={(e) => setQuery(e.target.value)}
            className="bg-brand-dark text-gray-400 text-xs px-2 py-1 rounded border border-brand-surface-light"
            value=""
          >
            <option value="" disabled>Examples...</option>
            {EXAMPLE_QUERIES.map((q, i) => (
              <option key={i} value={q}>{q.slice(0, 50)}...</option>
            ))}
          </select>
        </div>
      </div>

      {/* Query input */}
      <div className="p-3">
        <textarea
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-gray-200 font-mono text-sm resize-none focus:outline-none placeholder-gray-600 sql-terminal"
          rows={3}
          placeholder="SELECT * FROM zones..."
          spellCheck={false}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-600">Ctrl+Enter to execute • Alt+↑/↓ for history</span>
          <button
            onClick={executeQuery}
            className="px-4 py-1.5 bg-brand-accent text-brand-dark text-xs font-bold rounded-lg hover:bg-brand-accent-light transition-colors"
          >
            ▶ Run Query
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-danger/10 border-t border-danger/20 text-danger text-xs font-mono">
          Error: {error}
        </div>
      )}

      {/* Results table */}
      {results.length > 0 && !error && (
        <div className="border-t border-brand-surface-light overflow-x-auto max-h-64">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="bg-brand-surface text-gray-400 sticky top-0">
                {Object.keys(results[0]).map(key => (
                  <th key={key} className="text-left px-3 py-2 font-medium whitespace-nowrap">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((row, i) => (
                <tr key={i} className="border-t border-brand-dark/50 hover:bg-brand-surface/30">
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="px-3 py-1.5 text-gray-300 whitespace-nowrap">
                      {val === null ? <span className="text-gray-600">NULL</span> : String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-3 py-1.5 text-xs text-gray-600 bg-brand-surface border-t border-brand-surface-light">
            {results.length} row{results.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  )
}
