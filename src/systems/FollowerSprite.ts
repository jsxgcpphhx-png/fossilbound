import Phaser from 'phaser';
import { TILE_SIZE } from '../data/constants';
import { getCreatureByInstanceId, loadPlayerState } from '../data/playerState';
import type { TilePosition } from '../types/grid';

export class FollowerSprite {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private tile: TilePosition;

  constructor(scene: Phaser.Scene, startTile: TilePosition) {
    createFollowerTexture(scene);
    this.tile = { ...startTile };
    this.sprite = scene.add.sprite(toWorld(startTile.x), toWorld(startTile.y), 'follower-placeholder').setDepth(4);
  }

  static shouldCreate(): boolean {
    const state = loadPlayerState();
    return Boolean(getCreatureByInstanceId(state, state.followCreatureId));
  }

  moveTo(tile: TilePosition): void {
    if (this.tile.x === tile.x && this.tile.y === tile.y) {
      return;
    }

    this.tile = { ...tile };
    this.sprite.scene.tweens.add({
      targets: this.sprite,
      x: toWorld(tile.x),
      y: toWorld(tile.y),
      duration: 140,
      ease: 'Sine.easeInOut'
    });
  }
}

function createFollowerTexture(scene: Phaser.Scene): void {
  if ((scene.textures as unknown as { exists?: (key: string) => boolean }).exists?.('follower-placeholder')) {
    return;
  }

  const canvas = scene.textures.createCanvas('follower-placeholder', TILE_SIZE, TILE_SIZE);
  const context = canvas?.getContext();

  if (!canvas || !context) {
    return;
  }

  context.fillStyle = '#00000033';
  context.fillRect(5, 26, 22, 5);
  context.fillStyle = '#243126';
  context.beginPath();
  context.ellipse(14, 18, 9, 11, -0.15, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.ellipse(22, 12, 6, 5, 0.2, 0, Math.PI * 2);
  context.fill();
  context.fillRect(6, 19, 5, 8);
  context.fillRect(18, 20, 5, 8);
  context.fillStyle = '#d99c3b';
  context.beginPath();
  context.moveTo(19, 9);
  context.lineTo(26, 3);
  context.lineTo(24, 11);
  context.fill();
  context.fillRect(24, 12, 2, 2);
  canvas.refresh();
}

function toWorld(tileCoordinate: number): number {
  return tileCoordinate * TILE_SIZE + TILE_SIZE / 2;
}
