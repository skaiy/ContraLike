import './style.css'
import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT, BG_COLOR } from './core/constants'
import { BootScene, MainScene } from './scenes/scenes'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'app',
  backgroundColor: BG_COLOR,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 900 },
      debug: false,
    },
  },
  scene: [BootScene, MainScene],
}

new Phaser.Game(config)
