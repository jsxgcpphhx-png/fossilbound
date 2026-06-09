import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TILE_SIZE } from '../data/constants';
import type { TilePosition } from '../types/grid';

export interface OverworldCameraOptions {
  mapWidth: number;
  mapHeight: number;
  target: Phaser.GameObjects.GameObject;
  zoom?: number;
  lerp?: number;
}

export function configureOverworldCamera(scene: Phaser.Scene, options: OverworldCameraOptions): void {
  const camera = scene.cameras.main;
  const worldWidth = options.mapWidth * TILE_SIZE;
  const worldHeight = options.mapHeight * TILE_SIZE;
  const zoom = options.zoom ?? 1.18;
  const lerp = options.lerp ?? 0.14;

  camera.setBounds(0, 0, worldWidth, worldHeight);
  camera.setZoom(zoom);
  camera.startFollow(options.target, false, lerp, lerp);
  camera.fadeIn(260, 23, 37, 29);
}

export function fadeToScene(
  scene: Phaser.Scene,
  sceneKey: string,
  duration = 220,
  onMidpoint?: () => void
): void {
  scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    onMidpoint?.();
    scene.scene.start(sceneKey);
  });
  scene.cameras.main.fadeOut(duration, 23, 37, 29);
}

export function tileCenter(tile: TilePosition): { x: number; y: number } {
  return {
    x: tile.x * TILE_SIZE + TILE_SIZE / 2,
    y: tile.y * TILE_SIZE + TILE_SIZE / 2
  };
}

export function addFixedLocationLabel(scene: Phaser.Scene, text: string): void {
  const label = scene.add.text(GAME_WIDTH / 2, 46, text, {
    backgroundColor: 'rgba(248, 243, 223, 0.92)',
    color: '#2d4632',
    fontFamily: 'monospace',
    fontSize: '20px',
    fontStyle: 'bold',
    padding: { x: 16, y: 8 }
  }).setOrigin(0.5).setDepth(100).setScrollFactor(0);

  scene.tweens.add({
    targets: label,
    alpha: 0,
    delay: 1400,
    duration: 700,
    onComplete: () => label.destroy()
  });
}

export function readableUiBottomY(): number {
  return GAME_HEIGHT - 90;
}
