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
  private targets: Phaser.GameObjects.Rectangle[] = []
  private uiText!: Phaser.GameObjects.Text
  private totalTargets = 0
  private destroyedTargets = 0
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

    // 目标（占位敌人）
    this.spawnTargets()

    // 文本与背景
    this.add.text(20, 20, 'ContraLike - Arcade Physics + Input', { color: '#ffffff' }).setDepth(10)
    this.uiText = this.add.text(20, 44, '', { color: '#ffffff' }).setDepth(10)
    this.updateUI()
    this.cameras.main.setBackgroundColor(BG_COLOR)
  }

  private spawnTargets() {
    const xs = [420, 540, 660]
    const y = GAME_HEIGHT - 60
    for (const x of xs) {
      const rect = this.add.rectangle(x, y, 26, 26, 0xff6666)
      this.physics.add.existing(rect, true)
      rect.setData('hp', 3)
      this.targets.push(rect)
      this.totalTargets += 1
      // 为每个目标注册 overlap（子弹击中目标）
      this.physics.add.overlap(this.bullets, rect, (b, t) => {
        const bullet = b as Phaser.GameObjects.Arc
        const target = t as Phaser.GameObjects.Rectangle
        // 命中：销毁子弹并对目标造成伤害
        if (bullet.active) bullet.destroy()
        this.damageTarget(target)
      })
    }
  }

  private damageTarget(target: Phaser.GameObjects.Rectangle) {
    const hp: number = (target.getData('hp') as number) ?? 1
    const next = Math.max(0, hp - 1)
    target.setData('hp', next)

    // 轻微屏幕震动以强化命中反馈
    this.cameras.main.shake(80, 0.002)
    // 命中火花
    this.createHitEffect(target.x, target.y)

    // 根据血量调整颜色
    if (next === 2) target.fillColor = 0xff4444
    if (next === 1) target.fillColor = 0xff2222
    if (next <= 0) {
      target.destroy()
      this.destroyedTargets += 1
      // 全部目标被清除时显示提示
      if (this.destroyedTargets >= this.totalTargets && this.totalTargets > 0) {
        const banner = this.add
          .text(GAME_WIDTH / 2, 80, 'Stage Clear!', { color: '#ffff88' })
          .setOrigin(0.5)
          .setDepth(20)
          .setAlpha(0)
        this.tweens.add({
          targets: banner,
          alpha: 1,
          duration: 250,
          yoyo: true,
          hold: 600,
          repeat: 1,
          onComplete: () => banner.destroy(),
        })
      }
    }
    this.updateUI()
  }

  private updateUI() {
    this.uiText.setText(`Targets: ${this.destroyedTargets}/${this.totalTargets}`)
  }

  // 开火的枪口闪光效果
  private createMuzzleFlash(x: number, y: number) {
    const flash = this.add.circle(x, y, 6, 0xffffaa).setAlpha(0.9)
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.8,
      duration: 120,
      onComplete: () => flash.destroy(),
    })
  }

  // 命中火花：少量无重力的粒子短暂飞散
  private createHitEffect(x: number, y: number) {
    for (let i = 0; i < 6; i++) {
      const p = this.add.circle(x, y, 2, 0xffcc88)
      this.physics.add.existing(p, false)
      const body = p.body as Phaser.Physics.Arcade.Body
      body.setAllowGravity(false)
      const angle = Math.random() * Math.PI * 2
      const speed = 140 + Math.random() * 80
      body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
      this.tweens.add({ targets: p, alpha: 0, duration: 220, onComplete: () => p.destroy() })
    }
  }

  private spawnBullet() {
    const originX = this.player.x + (this.facing === 1 ? 14 : -14)
    const originY = this.player.y - 2
    // 枪口闪光
    this.createMuzzleFlash(originX, originY)

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
    if (ax !== 0) this.facing = (ax as 1 | -1) > 0 ? 1 : -1

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

    // TODO: 预留与更完善的敌人系统对接（当前 targets 为占位示例）
  }
}