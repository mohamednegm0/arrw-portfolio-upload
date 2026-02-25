// ============================================
// TopNav — Mode switching navigation bar
// ============================================

import { motion } from 'framer-motion'
import { useGameStore, type GameMode } from '../store/gameStore'

const MODES: { mode: GameMode; label: string; icon: string }[] = [
  { mode: 'narrative', label: 'Story', icon: '📖' },
  { mode: 'simulator', label: 'Fleet Sim', icon: '🚗' },
  { mode: 'driver', label: 'Driver Mode', icon: '🏎️' },
  { mode: 'economics', label: 'Economics', icon: '📊' },
]

export default function TopNav() {
  const gameMode = useGameStore((s) => s.gameMode)
  const setGameMode = useGameStore((s) => s.setGameMode)
  const xp = useGameStore((s) => s.xp)
  const language = useGameStore((s) => s.language)
  const setLanguage = useGameStore((s) => s.setLanguage)

  return (
    <nav className="flex items-center justify-between px-4 py-2 bg-brand-surface border-b border-brand-surface-light z-50">
      {/* Logo */}
      <button
        onClick={() => setGameMode('landing')}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center font-bold text-brand-dark text-sm">
          A
        </div>
        <span className="font-semibold text-white hidden sm:block">Arrw Portfolio</span>
      </button>

      {/* Mode tabs */}
      <div className="flex items-center gap-1">
        {MODES.map(({ mode, label, icon }) => (
          <button
            key={mode}
            onClick={() => setGameMode(mode)}
            className={`relative px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              gameMode === mode
                ? 'text-brand-accent'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="mr-1">{icon}</span>
            <span className="hidden sm:inline">{label}</span>
            {gameMode === mode && (
              <motion.div
                layoutId="navIndicator"
                className="absolute inset-0 bg-brand-accent/10 border border-brand-accent/30 rounded-lg"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Right: XP + Lang */}
      <div className="flex items-center gap-3">
        {/* XP Badge */}
        <div className="flex items-center gap-1.5 bg-brand-dark px-2.5 py-1 rounded-full">
          <span className="text-brand-accent text-xs">⭐</span>
          <span className="text-xs font-mono text-brand-accent">{xp} XP</span>
        </div>

        {/* Language toggle */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="px-2 py-1 text-xs rounded border border-brand-surface-light hover:border-brand-accent transition-colors text-gray-400 hover:text-brand-accent"
        >
          {language === 'en' ? 'عربي' : 'EN'}
        </button>
      </div>
    </nav>
  )
}
