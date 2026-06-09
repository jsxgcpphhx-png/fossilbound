import Phaser from 'phaser';
import type { TilePosition } from '../types/grid';
import { panelTextStyle, UI_COLORS } from './theme';

export class DebugPanel {
  private readonly text: Phaser.GameObjects.Text;
  private readonly toggleKey?: Phaser.Input.Keyboard.Key;
  private visible = false;

  constructor(scene: Phaser.Scene) {
    this.text = scene.add.text(12, 12, '', panelTextStyle({
      backgroundColor: 'rgba(23, 37, 29, 0.88)',
      color: UI_COLORS.parchment,
      fontSize: '10px',
      lineSpacing: 4,
      padding: { x: 10, y: 7 },
      wordWrap: { width: 224, useAdvancedWrap: true }
    })).setDepth(100).setScrollFactor(0).setVisible(false);
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
      'D toggle · P Travel Team',
      'Text is cleared and wrapped every frame.'
    ].join('\n'));
  }
}
