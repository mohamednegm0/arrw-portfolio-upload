// ============================================
// Dialogue Overlay — Bilingual dialogue box
// ============================================

import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'

export default function DialogueOverlay() {
  const dialogueActive = useGameStore((s) => s.dialogueActive)
  const currentDialogue = useGameStore((s) => s.currentDialogue)
  const dialogueIndex = useGameStore((s) => s.dialogueIndex)
  const advanceDialogue = useGameStore((s) => s.advanceDialogue)
  const endDialogue = useGameStore((s) => s.endDialogue)
  const language = useGameStore((s) => s.language)

  if (!dialogueActive || currentDialogue.length === 0) return null

  const line = currentDialogue[dialogueIndex]
  if (!line) return null

  const isLast = dialogueIndex >= currentDialogue.length - 1
  const isArabic = language === 'ar'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex items-end justify-center p-4"
      onClick={isLast ? endDialogue : advanceDialogue}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Dialogue box */}
      <AnimatePresence mode="wait">
        <motion.div
          key={dialogueIndex}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl bg-brand-dark/95 border border-brand-surface-light rounded-xl p-4 mb-4 backdrop-blur-sm"
          dir={isArabic ? 'rtl' : 'ltr'}
        >
          {/* Speaker name */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-brand-accent/20 flex items-center justify-center text-sm">
              {line.speaker === 'Mohamed Negm' ? '🎮' :
               line.speaker === 'Mohamed Nagaty' ? '💼' :
               line.speaker === 'Adel Mamdouh' ? '📊' : '🔧'}
            </div>
            <span className={`font-bold text-brand-accent text-sm ${isArabic ? 'font-cairo' : ''}`}>
              {isArabic ? line.speakerAr : line.speaker}
            </span>
            <span className="text-gray-600 text-xs ml-auto">
              {dialogueIndex + 1}/{currentDialogue.length}
            </span>
          </div>

          {/* Dialogue text */}
          <p className={`text-gray-200 text-sm leading-relaxed ${isArabic ? 'font-cairo text-right' : ''}`}>
            {isArabic ? line.textAr : line.text}
          </p>

          {/* Continue prompt */}
          <div className={`mt-3 text-xs text-gray-500 ${isArabic ? 'text-left' : 'text-right'}`}>
            {isLast
              ? (isArabic ? '🏁 اضغط للإنهاء' : '🏁 Click to finish')
              : (isArabic ? '▶ اضغط للاستمرار' : '▶ Click to continue')
            }
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
