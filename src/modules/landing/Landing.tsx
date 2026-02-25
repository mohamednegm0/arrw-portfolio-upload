// ============================================
// Landing Page — Hero with animated entry
// ============================================

import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'

export default function Landing() {
  const setGameMode = useGameStore((s) => s.setGameMode)
  const setLanguage = useGameStore((s) => s.setLanguage)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-dark via-brand-navy/30 to-brand-dark" />
      
      {/* Animated grid overlay */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(246,166,35,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(246,166,35,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center max-w-2xl px-6">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', bounce: 0.4, delay: 0.2 }}
          className="w-20 h-20 bg-brand-accent rounded-2xl flex items-center justify-center mx-auto mb-6 glow-amber"
        >
          <span className="text-3xl font-bold text-brand-dark">A</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-4xl sm:text-5xl font-bold text-white mb-3"
        >
          Arrw <span className="text-brand-accent">Portfolio</span>
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-gray-400 text-lg mb-2"
        >
          Interactive Mobility Simulator
        </motion.p>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-gray-500 text-sm mb-8"
        >
          by <span className="text-brand-accent">Mohamed Negm</span> — for Adel Mamdouh, Growth & Commercial Director
        </motion.p>

        {/* Action buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <button
            onClick={() => setGameMode('narrative')}
            className="px-6 py-3 bg-brand-accent text-brand-dark font-bold rounded-xl hover:bg-brand-accent-light transition-all hover:scale-105 active:scale-95 shadow-lg shadow-brand-accent/20"
          >
            🎮 Start Story Mode
          </button>
          <button
            onClick={() => setGameMode('simulator')}
            className="px-6 py-3 bg-brand-surface text-white font-bold rounded-xl border border-brand-surface-light hover:border-brand-accent transition-all hover:scale-105 active:scale-95"
          >
            🚗 Fleet Simulator
          </button>
          <button
            onClick={() => setGameMode('economics')}
            className="px-6 py-3 bg-brand-surface text-white font-bold rounded-xl border border-brand-surface-light hover:border-brand-accent transition-all hover:scale-105 active:scale-95"
          >
            📊 Unit Economics
          </button>
        </motion.div>

        {/* Language switcher */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-6 flex items-center justify-center gap-2"
        >
          <button
            onClick={() => setLanguage('en')}
            className="px-3 py-1 text-sm text-gray-400 hover:text-brand-accent transition-colors"
          >
            English
          </button>
          <span className="text-gray-600">|</span>
          <button
            onClick={() => setLanguage('ar')}
            className="px-3 py-1 text-sm text-gray-400 hover:text-brand-accent transition-colors font-cairo"
          >
            عربي
          </button>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mt-8 text-xs text-gray-600"
        >
          6 Egyptian cities • Real-time fleet simulation • Unit economics engine • Crazy Taxi driver mode
        </motion.p>
      </div>

      {/* Floating decorative elements */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        className="absolute bottom-20 left-10 w-3 h-3 bg-brand-accent/30 rounded-full"
      />
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 1 }}
        className="absolute top-20 right-16 w-2 h-2 bg-brand-accent/20 rounded-full"
      />
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.5 }}
        className="absolute bottom-32 right-24 w-4 h-4 bg-info/20 rounded-full"
      />
    </motion.div>
  )
}
