import Phaser from 'phaser';
import type { TilePosition } from '../types/grid';

export class DebugPanel {
  private readonly text: Phaser.GameObjects.Text;
  private readonly toggleKey?: Phaser.Input.Keyboard.Key;
  private visible = false;

  constructor(scene: Phaser.Scene) {
    this.text = scene.add.text(12, 12, '', {
      backgroundColor: 'rgba(23, 37, 29, 0.78)',
      color: '#f8f3df',
      fontFamily: 'monospace',
      fontSize: '10px',
      lineSpacing: 3,
      padding: { x: 8, y: 5 },
      wordWrap: { width: 210 }
    }).setDepth(100).setScrollFactor(0).setVisible(false);
    this.toggleKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);
  }

  update(tile: TilePosition): void {
    if (this.toggleKey && Phaser.Input.Keyboard.JustDown(this.toggleKey)) {
      this.visible = !this.visible;
      this.text.setVisible(this.visible);
    }

    this.text.setText([
      'Debug overlay',
      `tile (${tile.x}, ${tile.y})`,
      'D toggle · P Travel Team'
    ].join('\n'));
  }
}
