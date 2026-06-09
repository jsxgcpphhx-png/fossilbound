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
  const zoom = options.zoom ?? 1.32;
  const lerp = options.lerp ?? 0.1;

  camera.setBounds(0, 0, worldWidth, worldHeight);
  camera.setZoom(zoom);
  camera.setRoundPixels(true);
  camera.startFollow(options.target, true, lerp, lerp);
  configureFixedUiCamera(scene);
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
  const label = registerFixedUiObject(scene, scene.add.text(GAME_WIDTH / 2, 46, text, {
    backgroundColor: 'rgba(248, 243, 223, 0.92)',
    color: '#2d4632',
    fontFamily: 'monospace',
    fontSize: '20px',
    fontStyle: 'bold',
    padding: { x: 16, y: 8 }
  }).setOrigin(0.5).setDepth(100).setScrollFactor(0));

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


export function configureFixedUiCamera(scene: Phaser.Scene): Phaser.Cameras.Scene2D.Camera {
  const sceneWithUiCamera = scene as Phaser.Scene & { fixedUiCamera?: Phaser.Cameras.Scene2D.Camera };

  if (sceneWithUiCamera.fixedUiCamera) {
    return sceneWithUiCamera.fixedUiCamera;
  }

  const worldObjects = [...scene.children.list];
  const uiCamera = scene.cameras.add(0, 0, GAME_WIDTH, GAME_HEIGHT, false, `${scene.scene.key}-fixed-ui`);
  uiCamera.setZoom(1);
  uiCamera.setScroll(0, 0);
  uiCamera.ignore(worldObjects);
  sceneWithUiCamera.fixedUiCamera = uiCamera;
  return uiCamera;
}

export function registerFixedUiObject<T extends Phaser.GameObjects.GameObject>(scene: Phaser.Scene, gameObject: T): T {
  const uiCamera = (scene as Phaser.Scene & { fixedUiCamera?: Phaser.Cameras.Scene2D.Camera }).fixedUiCamera;

  if (uiCamera) {
    scene.cameras.main.ignore(gameObject);
  }

  return gameObject;
}
