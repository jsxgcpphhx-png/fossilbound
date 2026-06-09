import Phaser from 'phaser';
import { TILE_SIZE } from '../data/constants';
import type { Direction, TilePosition } from '../types/grid';

const OFFSETS: Record<Direction, TilePosition> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

interface GridMoverOptions {
  sprite: Phaser.GameObjects.Sprite;
  startTile: TilePosition;
  canEnterTile: (tile: TilePosition) => boolean;
  onMoveComplete?: (tile: TilePosition) => void;
}

export class GridMover {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly canEnterTile: (tile: TilePosition) => boolean;
  private readonly onMoveComplete?: (tile: TilePosition) => void;
  private tile: TilePosition;
  private moving = false;
  private facing: Direction = 'down';

  constructor(options: GridMoverOptions) {
    this.sprite = options.sprite;
    this.tile = { ...options.startTile };
    this.canEnterTile = options.canEnterTile;
    this.onMoveComplete = options.onMoveComplete;
    this.sprite.setPosition(this.toWorld(this.tile.x), this.toWorld(this.tile.y));
  }

  get gameObject(): Phaser.GameObjects.Sprite {
    return this.sprite;
  }

  get currentTile(): TilePosition {
    return { ...this.tile };
  }

  get facingDirection(): Direction {
    return this.facing;
  }

  tryMove(direction: Direction): void {
    if (this.moving) {
      return;
    }

    this.facing = direction;
    const offset = OFFSETS[direction];
    const destination = {
      x: this.tile.x + offset.x,
      y: this.tile.y + offset.y
    };

    if (!this.canEnterTile(destination)) {
      this.bump(direction);
      return;
    }

    this.moving = true;
    this.tile = destination;
    this.sprite.scene.tweens.add({
      targets: this.sprite,
      x: this.toWorld(destination.x),
      y: this.toWorld(destination.y),
      duration: 140,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.moving = false;
        this.onMoveComplete?.(this.currentTile);
      }
    });
  }

  getFacingTile(): TilePosition {
    const offset = OFFSETS[this.facing];
    return {
      x: this.tile.x + offset.x,
      y: this.tile.y + offset.y
    };
  }

  isMoving(): boolean {
    return this.moving;
  }

  private bump(direction: Direction): void {
    const offset = OFFSETS[direction];
    this.sprite.scene.tweens.add({
      targets: this.sprite,
      x: this.sprite.x + offset.x * 4,
      y: this.sprite.y + offset.y * 4,
      duration: 45,
      yoyo: true,
      ease: 'Quad.easeOut'
    });
  }

  private toWorld(tileCoordinate: number): number {
    return tileCoordinate * TILE_SIZE + TILE_SIZE / 2;
  }
}
