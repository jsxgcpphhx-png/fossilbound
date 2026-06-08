import Phaser from 'phaser';
import { TILE_SIZE } from '../data/constants';
import { getCreatureByInstanceId, loadPlayerState } from '../data/playerState';
import { createFollowerTexture } from './PixelPlaceholderSprites';
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

function toWorld(tileCoordinate: number): number {
  return tileCoordinate * TILE_SIZE + TILE_SIZE / 2;
}
