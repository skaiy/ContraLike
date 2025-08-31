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
  private bullets!: Phaser.Physics.Arcade.Group
  private speed = 220
  private jumpVelocity = -380
  private fireCooldown = 200 // ms
  private bulletSpeed = 520
  private lastFireAt = 0
  private facing: 1 | -1 = 1

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

    // 子弹组（动态体，但不受重力）
    this.bullets = this.physics.add.group()

    // 碰撞
    this.physics.add.collider(this.player, this.ground)

    // 文本与背景
    this.add.text(20, 20, 'ContraLike - Arcade Physics + Input', { color: '#ffffff' }).setDepth(10)
    this.cameras.main.setBackgroundColor(BG_COLOR)
  }

  private spawnBullet() {
    const originX = this.player.x + (this.facing === 1 ? 14 : -14)
    const originY = this.player.y - 2
    const bullet = this.add.circle(originX, originY, 4, 0xffe066)
    this.physics.add.existing(bullet, false)
    const b = bullet.body as Phaser.Physics.Arcade.Body
    b.setAllowGravity(false)
    b.setVelocityX(this.facing * this.bulletSpeed)
    b.setCollideWorldBounds(false)
    // 添加到组，便于统一管理
    this.bullets.add(bullet)
  }

  update() {
    const body = this.player.body as Phaser.Physics.Arcade.Body
    const onGround = body.blocked.down || body.touching.down

    // 水平移动由输入抽象决定
    const ax = this.inputMgr.axisX(this.playerIdx)
    body.setVelocityX(ax * this.speed)
    if (ax !== 0) this.facing = ax > 0 ? 1 : -1

    // 跳跃
    if (onGround && this.inputMgr.isJumpDown(this.playerIdx)) {
      body.setVelocityY(this.jumpVelocity)
    }

    // 开火（带冷却）
    const now = this.time.now
    if (this.inputMgr.isFireDown(this.playerIdx) && now - this.lastFireAt >= this.fireCooldown) {
      this.spawnBullet()
      this.lastFireAt = now
    }

    // 离屏清理子弹
    for (const go of this.bullets.getChildren() as Phaser.GameObjects.GameObject[]) {
      const arc = go as Phaser.GameObjects.Arc
      if (!arc.active) continue
      if (arc.x < -20 || arc.x > GAME_WIDTH + 20 || arc.y < -20 || arc.y > GAME_HEIGHT + 20) {
        arc.destroy()
      }
    }

    // TODO: 预留与敌人的重叠检测钩子
    // this.physics.add.overlap(this.bullets, enemyGroup, (bullet, enemy) => { /* ... */ })
  }
}