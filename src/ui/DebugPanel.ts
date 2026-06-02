import Phaser from 'phaser';
import type { TilePosition } from '../types/grid';

export class DebugPanel {
  private readonly text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.text = scene.add.text(12, 12, '', {
      backgroundColor: 'rgba(23, 37, 29, 0.8)',
      color: '#f8f3df',
      fontFamily: 'monospace',
      fontSize: '14px',
      padding: { x: 8, y: 6 }
    });
  }

  update(tile: TilePosition): void {
    this.text.setText(`Debug\nTile: (${tile.x}, ${tile.y})`);
  }
}
