import Phaser from 'phaser'

export type PlayerIndex = 1 | 2

export class InputManager {
  private scene: Phaser.Scene
  private keys: Record<
    PlayerIndex,
    {
      left: Phaser.Input.Keyboard.Key
      right: Phaser.Input.Keyboard.Key
      up: Phaser.Input.Keyboard.Key
      down: Phaser.Input.Keyboard.Key
      jump: Phaser.Input.Keyboard.Key
      fire: Phaser.Input.Keyboard.Key
    }
  >

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    const kbd = scene.input.keyboard!

    this.keys = {
      1: {
        left: kbd.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: kbd.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        up: kbd.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: kbd.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        // P1 支持 W 或 Space 跳跃；J 作为开火
        jump: kbd.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        fire: kbd.addKey(Phaser.Input.Keyboard.KeyCodes.J),
      },
      2: {
        left: kbd.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
        right: kbd.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
        up: kbd.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
        down: kbd.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
        // P2 使用方向键，上方向作为跳跃
        jump: kbd.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
        fire: kbd.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ZERO),
      },
    }
  }

  axisX(player: PlayerIndex): number {
    const k = this.keys[player]
    let x = 0
    if (k.left.isDown) x -= 1
    if (k.right.isDown) x += 1
    return x
  }

  isJumpDown(player: PlayerIndex): boolean {
    const k = this.keys[player]
    // P1: W 或 Space 均可跳；P2: Up
    return k.jump.isDown || k.up.isDown
  }

  isFireDown(player: PlayerIndex): boolean {
    return this.keys[player].fire.isDown
  }
}

export default InputManager