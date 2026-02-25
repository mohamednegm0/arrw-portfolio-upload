// ============================================
// Narrative Module — Phaser 2D Side-Scroller
// React wrapper that mounts Phaser game
// ============================================

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { LEVELS } from '../../data/dialogues'
import LevelSelect from './LevelSelect'
import DialogueOverlay from './DialogueOverlay'

export default function NarrativeModule() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const currentLevel = useGameStore((s) => s.currentLevel)
  const dialogueActive = useGameStore((s) => s.dialogueActive)
  const [showLevelSelect, setShowLevelSelect] = useState(true)
  const [phaserReady, setPhaserReady] = useState(false)
  const [levelComplete, setLevelComplete] = useState(false)

  const returnToLevels = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.destroy(true)
      gameRef.current = null
    }
    setLevelComplete(false)
    setShowLevelSelect(true)
  }, [])

  useEffect(() => {
    if (showLevelSelect || !containerRef.current) return

    let destroyed = false

    const initPhaser = async () => {
      const Phaser = (await import('phaser')).default
      
      if (destroyed || !containerRef.current) return

      const level = LEVELS[currentLevel]
      if (!level) return

      // Create the Phaser game
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: containerRef.current,
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        pixelArt: true,
        backgroundColor: '#0F1B2D',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { x: 0, y: 800 },
            debug: false,
          },
        },
        scene: {
          preload: function (this: Phaser.Scene) {
            // Generate textures programmatically
            const gfx = this.add.graphics()
            
            // Player sprite (16x24 amber character)
            gfx.fillStyle(0xF6A623, 1)
            gfx.fillRect(0, 0, 16, 24)
            gfx.fillStyle(0x1A365D, 1)
            gfx.fillRect(4, 4, 3, 3) // eye left
            gfx.fillRect(9, 4, 3, 3) // eye right
            gfx.generateTexture('player', 16, 24)
            gfx.clear()

            // Ground tile
            gfx.fillStyle(0x2D3B4D, 1)
            gfx.fillRect(0, 0, 32, 32)
            gfx.fillStyle(0x1E2A3A, 1)
            gfx.fillRect(0, 0, 32, 2)
            gfx.generateTexture('ground', 32, 32)
            gfx.clear()

            // Building
            const buildColor = parseInt(level.color.replace('#', ''), 16)
            gfx.fillStyle(buildColor, 0.6)
            gfx.fillRect(0, 0, 48, 80)
            gfx.fillStyle(0xFFFFFF, 0.3)
            for (let row = 0; row < 4; row++) {
              for (let col = 0; col < 2; col++) {
                gfx.fillRect(8 + col * 18, 8 + row * 18, 12, 12)
              }
            }
            gfx.generateTexture('building', 48, 80)
            gfx.clear()

            // NPC sprite
            gfx.fillStyle(0x3182CE, 1)
            gfx.fillRect(0, 0, 16, 24)
            gfx.fillStyle(0xFFFFFF, 1)
            gfx.fillRect(4, 4, 3, 3)
            gfx.fillRect(9, 4, 3, 3)
            gfx.generateTexture('npc', 16, 24)
            gfx.clear()

            // Nissan Sunny (car)
            gfx.fillStyle(0xE2E8F0, 1)
            gfx.fillRect(0, 4, 40, 16)
            gfx.fillStyle(0x4299E1, 0.6)
            gfx.fillRect(6, 0, 12, 8)
            gfx.fillRect(22, 0, 12, 8)
            gfx.fillStyle(0x1A1A1A, 1)
            gfx.fillCircle(10, 22, 5)
            gfx.fillCircle(30, 22, 5)
            gfx.generateTexture('car', 40, 24)
            gfx.clear()

            // Coin / collectible
            gfx.fillStyle(0xF6A623, 1)
            gfx.fillCircle(6, 6, 6)
            gfx.fillStyle(0xFBD38D, 1)
            gfx.fillCircle(6, 6, 3)
            gfx.generateTexture('coin', 12, 12)
            gfx.clear()

            // Landmark indicator
            gfx.fillStyle(buildColor, 0.8)
            gfx.fillRect(0, 0, 64, 96)
            gfx.fillStyle(0xFFFFFF, 0.5)
            gfx.fillRect(16, 8, 32, 40)
            gfx.fillStyle(buildColor, 1)
            gfx.fillTriangle(32, 0, 0, 20, 64, 20)
            gfx.generateTexture('landmark', 64, 96)
            gfx.clear()

            gfx.destroy()
          },

          create: function (this: Phaser.Scene) {
            const { width, height } = this.scale
            const store = useGameStore.getState()

            // World bounds — 4 screens wide
            const worldWidth = width * 4
            this.physics.world.setBounds(0, 0, worldWidth, height)

            // Ground
            const groundGroup = this.physics.add.staticGroup()
            for (let x = 0; x < worldWidth; x += 32) {
              groundGroup.create(x + 16, height - 16, 'ground')
            }

            // Buildings (decorative background)
            for (let i = 0; i < 15; i++) {
              const bx = 200 + i * 250 + Math.random() * 100
              const by = height - 32 - 40
              this.add.image(bx, by, 'building').setAlpha(0.4).setDepth(0)
            }

            // Landmark at 3/4 through level
            const landmarkX = worldWidth * 0.75
            this.add.image(landmarkX, height - 32 - 48, 'landmark').setDepth(0)
            
            // Landmark text
            this.add.text(landmarkX, height - 32 - 110, level.landmark, {
              fontFamily: '"Press Start 2P"',
              fontSize: '8px',
              color: level.color,
              align: 'center',
            }).setOrigin(0.5).setDepth(1)

            // Coins
            const coinGroup = this.physics.add.staticGroup()
            for (let i = 0; i < 20; i++) {
              const cx = 300 + i * (worldWidth / 22)
              const cy = height - 80 - Math.random() * 80
              coinGroup.create(cx, cy, 'coin')
            }

            // NPC for dialogue trigger
            const npcX = worldWidth * 0.5
            const npc = this.physics.add.staticSprite(npcX, height - 32 - 12, 'npc')
            
            // Exclamation mark
            this.add.text(npcX, height - 32 - 38, '!', {
              fontFamily: '"Press Start 2P"',
              fontSize: '12px',
              color: '#F6A623',
            }).setOrigin(0.5).setDepth(5)

            // Car at the end
            const car = this.physics.add.staticSprite(worldWidth * 0.9, height - 32 - 12, 'car')

            // Player
            const player = this.physics.add.sprite(80, height - 80, 'player')
            player.setCollideWorldBounds(true)
            player.setBounce(0.1)
            player.setDepth(3)
            this.physics.add.collider(player, groundGroup)

            // Camera follows player
            this.cameras.main.startFollow(player, true, 0.08, 0.08)
            this.cameras.main.setBounds(0, 0, worldWidth, height)

            // Coin collection
            this.physics.add.overlap(player, coinGroup, (_p, coin) => {
              ;(coin as Phaser.Physics.Arcade.Sprite).destroy()
              useGameStore.getState().addXP(10)
            })

            // NPC dialogue trigger
            let npcTriggered = false
            this.physics.add.overlap(player, npc, () => {
              if (!npcTriggered && !useGameStore.getState().dialogueActive) {
                npcTriggered = true
                useGameStore.getState().startDialogue(level.dialogues)
                useGameStore.getState().addXP(50)
              }
            })

            // Car = level complete
            let carTriggered = false
            this.physics.add.overlap(player, car, () => {
              if (carTriggered) return
              carTriggered = true
              const s = useGameStore.getState()
              if (s.currentLevel < 5) {
                s.unlockLevel(s.currentLevel + 1)
                s.addXP(100)
                s.addAchievement(`level_${s.currentLevel}_complete`)
              } else {
                s.addAchievement('all_levels_complete')
                s.addXP(500)
              }
              // Show "Level Complete" text in Phaser
              const { width: w, height: h } = this.scale
              this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.5)
                .setScrollFactor(0).setDepth(50)
              this.add.text(w / 2, h / 2 - 20, '🏁 Level Complete!', {
                fontFamily: '"Press Start 2P"',
                fontSize: '18px',
                color: '#F6A623',
              }).setOrigin(0.5).setScrollFactor(0).setDepth(51)
              this.add.text(w / 2, h / 2 + 20, `+${s.currentLevel < 5 ? 100 : 500} XP`, {
                fontFamily: '"Press Start 2P"',
                fontSize: '12px',
                color: '#38A169',
              }).setOrigin(0.5).setScrollFactor(0).setDepth(51)
              player.setVelocity(0, 0)
              player.body!.enable = false
              // Auto-return to level select after 2s
              setLevelComplete(true)
              setTimeout(() => returnToLevels(), 2500)
            })

            // HUD text
            const hudText = this.add.text(16, 16, '', {
              fontFamily: '"Press Start 2P"',
              fontSize: '10px',
              color: '#F6A623',
            }).setScrollFactor(0).setDepth(10)

            // Level title
            this.add.text(width / 2, 40, level.name, {
              fontFamily: '"Press Start 2P"',
              fontSize: '14px',
              color: level.color,
            }).setOrigin(0.5).setScrollFactor(0).setDepth(10)

            this.add.text(width / 2, 60, level.subtitle, {
              fontFamily: 'Inter',
              fontSize: '12px',
              color: '#A0AEC0',
            }).setOrigin(0.5).setScrollFactor(0).setDepth(10)

            // Controls
            const cursors = this.input.keyboard?.createCursorKeys() ?? null
            const wasd = this.input.keyboard?.addKeys('W,A,S,D') as Record<string, Phaser.Input.Keyboard.Key> | null

            // Store references for update
            ;(this as any)._player = player
            ;(this as any)._cursors = cursors
            ;(this as any)._wasd = wasd
            ;(this as any)._hudText = hudText

            // Touch controls for mobile
            this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
              if (pointer.x < width / 3) {
                ;(this as any)._touchLeft = true
              } else if (pointer.x > (width * 2) / 3) {
                ;(this as any)._touchRight = true
              } else {
                ;(this as any)._touchJump = true
              }
            })
            this.input.on('pointerup', () => {
              ;(this as any)._touchLeft = false
              ;(this as any)._touchRight = false
              ;(this as any)._touchJump = false
            })

            setPhaserReady(true)
          },

          update: function (this: Phaser.Scene) {
            const player = (this as any)._player as Phaser.Physics.Arcade.Sprite
            const cursors = (this as any)._cursors as Phaser.Types.Input.Keyboard.CursorKeys
            const wasd = (this as any)._wasd as Record<string, Phaser.Input.Keyboard.Key>
            const hudText = (this as any)._hudText as Phaser.GameObjects.Text

            if (!player || !cursors) return

            // Don't move during dialogue
            if (useGameStore.getState().dialogueActive) {
              player.setVelocityX(0)
              return
            }

            const speed = 200
            const left = cursors.left?.isDown || wasd.A?.isDown || (this as any)._touchLeft
            const right = cursors.right?.isDown || wasd.D?.isDown || (this as any)._touchRight
            const jump = cursors.up?.isDown || wasd.W?.isDown || (this as any)._touchJump

            if (left) {
              player.setVelocityX(-speed)
              player.setFlipX(true)
            } else if (right) {
              player.setVelocityX(speed)
              player.setFlipX(false)
            } else {
              player.setVelocityX(0)
            }

            if (jump && player.body?.blocked.down) {
              player.setVelocityY(-400)
            }

            // Update HUD
            const s = useGameStore.getState()
            hudText.setText(`XP: ${s.xp}  Level: ${s.currentLevel + 1}/6`)

            // Update player position in store
            s.setPlayerPos(player.x, player.y)
          },
        },
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
      }

      if (!destroyed && containerRef.current) {
        gameRef.current = new Phaser.Game(config)
      }
    }

    initPhaser()

    return () => {
      destroyed = true
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [showLevelSelect, currentLevel])

  if (showLevelSelect) {
    return <LevelSelect onStart={() => setShowLevelSelect(false)} />
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full relative"
    >
      {/* Phaser container */}
      <div
        ref={containerRef}
        id="phaser-container"
        className="w-full h-full"
      />

      {/* Dialogue overlay */}
      <AnimatePresence>
        {dialogueActive && <DialogueOverlay />}
      </AnimatePresence>

      {/* Back to level select */}
      <button
        onClick={returnToLevels}
        className="absolute top-3 left-3 z-20 px-3 py-1.5 bg-brand-dark/80 text-gray-400 text-xs rounded-lg border border-brand-surface-light hover:border-brand-accent hover:text-brand-accent transition-colors"
      >
        ← Levels
      </button>

      {/* Mobile touch hints */}
      {phaserReady && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 sm:hidden z-20">
          <div className="px-4 py-2 bg-brand-dark/80 rounded-lg text-gray-500 text-xs">
            ← Tap left to move left
          </div>
          <div className="px-4 py-2 bg-brand-dark/80 rounded-lg text-gray-500 text-xs">
            Tap center to jump
          </div>
          <div className="px-4 py-2 bg-brand-dark/80 rounded-lg text-gray-500 text-xs">
            Tap right to move right →
          </div>
        </div>
      )}
    </motion.div>
  )
}
