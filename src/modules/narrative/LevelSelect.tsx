// ============================================
// Level Select — Grid of 6 Egyptian city levels
// ============================================

import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { LEVELS } from '../../data/dialogues'

interface Props {
  onStart: () => void
}

export default function LevelSelect({ onStart }: Props) {
  const currentLevel = useGameStore((s) => s.currentLevel)
  const levelsUnlocked = useGameStore((s) => s.levelsUnlocked)
  const setLevel = useGameStore((s) => s.setLevel)
  const language = useGameStore((s) => s.language)
  const achievements = useGameStore((s) => s.achievements)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full flex flex-col items-center justify-center p-6 overflow-auto"
    >
      <h2 className="font-pixel text-brand-accent text-lg sm:text-xl mb-2">
        {language === 'ar' ? 'اختر المرحلة' : 'SELECT LEVEL'}
      </h2>
      <p className="text-gray-500 text-sm mb-8">
        {language === 'ar'
          ? 'رحلة Arrw عبر مصر'
          : "Arrw's expansion across Egypt"}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl w-full">
        {LEVELS.map((level) => {
          const unlocked = level.id < levelsUnlocked
          const completed = achievements.includes(`level_${level.id}_complete`)

          return (
            <motion.button
              key={level.id}
              whileHover={unlocked ? { scale: 1.05 } : {}}
              whileTap={unlocked ? { scale: 0.95 } : {}}
              onClick={() => {
                if (unlocked) {
                  setLevel(level.id as any)
                  onStart()
                }
              }}
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                unlocked
                  ? completed
                    ? 'border-success bg-success/10 hover:bg-success/20 cursor-pointer'
                    : 'border-brand-surface-light bg-brand-surface hover:border-brand-accent cursor-pointer'
                  : 'border-gray-700 bg-gray-800/50 cursor-not-allowed opacity-50'
              }`}
            >
              {/* Level number */}
              <div
                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: unlocked ? level.color + '30' : '#4A5568',
                  color: unlocked ? level.color : '#718096',
                }}
              >
                {level.id + 1}
              </div>

              {/* Completion badge */}
              {completed && (
                <div className="absolute top-2 left-2 text-success text-sm">✓</div>
              )}

              {/* City name */}
              <h3
                className="font-bold text-sm mb-1"
                style={{ color: unlocked ? level.color : '#718096' }}
              >
                {language === 'ar' ? level.nameAr : level.name}
              </h3>

              {/* Subtitle */}
              <p className="text-xs text-gray-500 mb-2">
                {language === 'ar' ? level.subtitleAr : level.subtitle}
              </p>

              {/* Landmark */}
              <p className="text-xs text-gray-600">
                📍 {level.landmark}
              </p>

              {/* Lock icon */}
              {!unlocked && (
                <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-50 rounded-xl">
                  🔒
                </div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-8 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">
            {language === 'ar' ? 'التقدم' : 'Progress'}
          </span>
          <span className="text-xs text-brand-accent font-mono">
            {achievements.filter(a => a.startsWith('level_')).length}/6
          </span>
        </div>
        <div className="h-2 bg-brand-surface rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${(achievements.filter(a => a.startsWith('level_')).length / 6) * 100}%`,
            }}
            className="h-full bg-brand-accent rounded-full"
          />
        </div>
      </div>
    </motion.div>
  )
}
