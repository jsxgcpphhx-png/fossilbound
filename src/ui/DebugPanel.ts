import Phaser from 'phaser';
import type { TilePosition } from '../types/grid';
import { registerFixedUiObject } from '../systems/OverworldCamera';
import { panelTextStyle, UI_COLORS } from './theme';

export class DebugPanel {
  private readonly scene: Phaser.Scene;
  private readonly text: Phaser.GameObjects.Text;
  private readonly toggleKey?: Phaser.Input.Keyboard.Key;
  private visible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.text = registerFixedUiObject(scene, scene.add.text(12, 12, '', panelTextStyle({
      backgroundColor: 'rgba(23, 37, 29, 0.88)',
      color: UI_COLORS.parchment,
      fontSize: '9px',
      lineSpacing: 2,
      padding: { x: 8, y: 6 },
      wordWrap: { width: 176, useAdvancedWrap: true }
    })).setDepth(100).setScrollFactor(0).setVisible(false));
    this.toggleKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.T);
  }

  update(tile: TilePosition): void {
    if (this.toggleKey && Phaser.Input.Keyboard.JustDown(this.toggleKey)) {
      this.visible = !this.visible;
      this.text.setVisible(this.visible);
    }

    if (!this.visible) return;

    const mapName = this.scene.constructor.name;
    this.text.setText([
      `${mapName}`,
      `tile ${tile.x}, ${tile.y}`,
      'T toggle debug'
    ].join('\n'));
  }
}
