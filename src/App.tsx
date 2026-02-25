// ============================================
// Arrw Portfolio — Main App
// Routes between Landing, Narrative, Simulator, Economics
// ============================================

import { AnimatePresence } from 'framer-motion'
import { useGameStore } from './store/gameStore'
import Landing from './modules/landing/Landing'
import NarrativeModule from './modules/narrative/NarrativeModule'
import SimulatorModule from './modules/simulator/SimulatorModule'
import EconomicsModule from './modules/economics/EconomicsModule'
import TopNav from './components/TopNav'

export default function App() {
  const gameMode = useGameStore((s) => s.gameMode)

  return (
    <div className="w-full h-full flex flex-col bg-brand-dark overflow-hidden">
      {gameMode !== 'landing' && <TopNav />}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {gameMode === 'landing' && <Landing key="landing" />}
          {gameMode === 'narrative' && <NarrativeModule key="narrative" />}
          {(gameMode === 'simulator' || gameMode === 'driver') && (
            <SimulatorModule key="simulator" />
          )}
          {gameMode === 'economics' && <EconomicsModule key="economics" />}
        </AnimatePresence>
      </div>
    </div>
  )
}
