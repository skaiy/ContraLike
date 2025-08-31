import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT, BG_COLOR } from '../core/constants'
import InputManager, { type PlayerIndex } from '../core/input/InputManager'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot')
  }
  preload() {}
  create() {
    this.scene.start('main')
  }
}

export class MainScene extends Phaser.Scene {
  private inputMgr!: InputManager
  private playerIdx: PlayerIndex = 1
  private player!: Phaser.GameObjects.Arc
  private ground!: Phaser.GameObjects.Rectangle
  private speed = 220
  private jumpVelocity = -380

  constructor() {
    super('main')
  }

  create() {
    // 输入抽象
    this.inputMgr = new InputManager(this)

    // 世界与物理
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT)

    // 地面（静态体）
    this.ground = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 20,
      GAME_WIDTH,
      40,
      0x334455,
      0.8
    )
    this.physics.add.existing(this.ground, true)

    // 玩家（动态体）
    this.player = this.add.circle(100, GAME_HEIGHT - 50, 12, 0x00ff99)
    this.physics.add.existing(this.player, false)
    const pBody = this.player.body as Phaser.Physics.Arcade.Body
    pBody.setCollideWorldBounds(true)
    pBody.setBounce(0)
    pBody.setAllowGravity(true)

    // 碰撞
    this.physics.add.collider(this.player, this.ground)

    // 文本与背景
    this.add.text(20, 20, 'ContraLike - Arcade Physics + Input', { color: '#ffffff' }).setDepth(10)
    this.cameras.main.setBackgroundColor(BG_COLOR)
  }

  update() {
    const body = this.player.body as Phaser.Physics.Arcade.Body
    const onGround = body.blocked.down || body.touching.down

    // 水平移动由输入抽象决定
    const ax = this.inputMgr.axisX(this.playerIdx)
    body.setVelocityX(ax * this.speed)

    // 跳跃
    if (onGround && this.inputMgr.isJumpDown(this.playerIdx)) {
      body.setVelocityY(this.jumpVelocity)
    }
  }
}