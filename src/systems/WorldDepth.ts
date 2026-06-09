import Phaser from 'phaser';
import { TILE_SIZE } from '../data/constants';

export const WORLD_RENDER_LAYERS = {
  ground: 0,
  water: 20,
  path: 40,
  groundDecorations: 80,
  lowProps: 400,
  ySortedWorld: 1_000,
  tallObjectForeground: 4_000,
  canopyRoofForeground: 5_000,
  weatherAmbient: 8_000,
  screenSpaceUi: 10_000
} as const;

export type WorldRenderLayer = keyof typeof WORLD_RENDER_LAYERS;
export type DepthMode = 'fixed' | 'ySort' | 'foreground' | 'background';

export interface DepthMetadata {
  layer?: WorldRenderLayer;
  depthMode?: DepthMode;
  visualFootOffsetY?: number;
  overlapsPlayer?: boolean;
}

export interface DepthOptions extends DepthMetadata {
  depth?: number;
}

export type DepthableGameObject = Phaser.GameObjects.GameObject & {
  x: number;
  y: number;
  setDepth(depth: number): DepthableGameObject;
  setData?(key: string, value: unknown): DepthableGameObject;
};

export function worldLayerDepth(layer: WorldRenderLayer): number {
  return WORLD_RENDER_LAYERS[layer];
}

export function footYForTile(tileY: number, visualFootOffsetY = 0): number {
  return tileY * TILE_SIZE + TILE_SIZE + visualFootOffsetY;
}

export function resolveWorldDepth(y: number, metadata: DepthMetadata = {}): number {
  const layer = metadata.layer ?? 'ySortedWorld';
  const baseLayer = worldLayerDepth(layer);

  switch (metadata.depthMode ?? 'ySort') {
    case 'fixed':
      return baseLayer;
    case 'background':
      return baseLayer - 200 + y * 0.001;
    case 'foreground':
      return worldLayerDepth('tallObjectForeground') + y;
    case 'ySort':
    default:
      return baseLayer + y + (metadata.visualFootOffsetY ?? 0);
  }
}

export function applyWorldDepth<T extends DepthableGameObject>(gameObject: T, metadata: DepthMetadata = {}): T {
  const depth = resolveWorldDepth(gameObject.y, metadata);
  gameObject.setDepth(depth);
  gameObject.setData?.('worldDepthMode', metadata.depthMode ?? 'ySort');
  gameObject.setData?.('worldLayer', metadata.layer ?? 'ySortedWorld');
  gameObject.setData?.('visualFootOffsetY', metadata.visualFootOffsetY ?? 0);
  return gameObject;
}

export function updateWorldDepth<T extends DepthableGameObject>(gameObject: T, metadata: DepthMetadata = {}): T {
  return applyWorldDepth(gameObject, metadata);
}

export function actorDepthMetadata(): DepthMetadata {
  return { layer: 'ySortedWorld', depthMode: 'ySort', visualFootOffsetY: TILE_SIZE / 2 };
}

export function uiDepth(offset = 0): number {
  return WORLD_RENDER_LAYERS.screenSpaceUi + offset;
}
