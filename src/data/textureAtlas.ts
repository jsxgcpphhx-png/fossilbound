import { TILE_SIZE } from './constants';
import type { DepthMode, WorldRenderLayer } from '../systems/WorldDepth';

export const OVERWORLD_ATLAS_KEY = 'overworld-texture-atlas';
export const OVERWORLD_ATLAS_URL = new URL('../assets/tilesets/Overworld.png', import.meta.url).href;

export type AtlasTextureId =
  | TerrainTextureId
  | PropTextureId
  | AnimatedTextureId;

export type TerrainTextureId =
  | 'terrain.border'
  | 'terrain.grass.a'
  | 'terrain.grass.b'
  | 'terrain.grass.c'
  | 'terrain.marsh.a'
  | 'terrain.path.a'
  | 'terrain.path.b'
  | 'terrain.boardwalk.a'
  | 'terrain.dirt.a'
  | 'terrain.stone.a'
  | 'terrain.fern.a'
  | 'terrain.brush.a'
  | 'terrain.flower-ground.a'
  | 'terrain.reed-ground.a';

export type PropTextureId =
  | 'prop.crate'
  | 'prop.rock'
  | 'prop.flower'
  | 'prop.sign'
  | 'prop.fence'
  | 'prop.reeds'
  | 'prop.tree'
  | 'prop.house'
  | 'prop.lab'
  | 'prop.hut'
  | 'prop.tent'
  | 'prop.roost';

export type AnimatedTextureId = 'terrain.water';

export interface TextureAtlasFrame {
  id: AtlasTextureId | string;
  /** Top-left source rectangle coordinate in src/assets/tilesets/Overworld.png. */
  x: number;
  y: number;
  /** Source rectangle size in atlas pixels. This is visual size, not collision size. */
  width: number;
  height: number;
  /** Phaser render origin. Terrain usually uses center; upright props usually sit on their bottom edge. */
  origin?: { x: number; y: number };
  /** Pixel offset from the logical tile center when drawing this frame. */
  drawOffset?: { x: number; y: number };
  /** Render layer used by the world-depth helper. Ground tiles remain fixed; props usually y-sort by foot position. */
  layer?: WorldRenderLayer;
  /** fixed keeps terrain flat, ySort compares bottom/foot y, foreground/background reserve explicit overlap bands. */
  depthMode?: DepthMode;
  /** Extra pixels added to the calculated visual foot y before y-sorting. */
  visualFootOffsetY?: number;
  /** Pixel offset from the logical tile center when drawing this frame. */
  drawOffsetX?: number;
  drawOffsetY?: number;
  /** Explicit aliases for origin.x/origin.y for map/object authoring docs. */
  originX?: number;
  originY?: number;
  /** Optional logical footprint, in movement-grid cells, for documentation and future collision helpers. */
  collisionFootprint?: { width: number; height: number; offsetX?: number; offsetY?: number };
  blocksMovement?: boolean;
  overlapsPlayer?: boolean;
  splitForegroundFrameId?: string;
  notes?: string;
}

export interface AnimatedAtlasDefinition {
  id: AnimatedTextureId;
  frameIds: string[];
  frameRate: number;
  repeat: number;
}

const fromGrid = (
  id: TextureAtlasFrame['id'],
  column: number,
  row: number,
  options: Omit<TextureAtlasFrame, 'id' | 'x' | 'y' | 'width' | 'height'> & Partial<Pick<TextureAtlasFrame, 'width' | 'height'>> = {}
): TextureAtlasFrame => ({
  id,
  x: column * TILE_SIZE,
  y: row * TILE_SIZE,
  width: options.width ?? TILE_SIZE,
  height: options.height ?? TILE_SIZE,
  origin: options.origin,
  drawOffset: options.drawOffset,
  layer: options.layer,
  depthMode: options.depthMode,
  visualFootOffsetY: options.visualFootOffsetY,
  drawOffsetX: options.drawOffset?.x,
  drawOffsetY: options.drawOffset?.y,
  originX: options.origin?.x,
  originY: options.origin?.y,
  collisionFootprint: options.collisionFootprint,
  blocksMovement: options.blocksMovement,
  overlapsPlayer: options.overlapsPlayer,
  splitForegroundFrameId: options.splitForegroundFrameId,
  notes: options.notes ?? 'Approximate atlas rectangle carried forward from the old grid index; adjust x/y/width/height here if the source art boundary is refined.'
});

export const OVERWORLD_TEXTURE_FRAMES: TextureAtlasFrame[] = [
  fromGrid('terrain.border', 0, 17, { layer: 'ground', depthMode: 'fixed' }),
  fromGrid('terrain.grass.a', 0, 0, { layer: 'ground', depthMode: 'fixed' }),
  fromGrid('terrain.grass.b', 1, 0, { layer: 'ground', depthMode: 'fixed' }),
  fromGrid('terrain.grass.c', 15, 29, { layer: 'ground', depthMode: 'fixed' }),
  fromGrid('terrain.marsh.a', 0, 7, { layer: 'water', depthMode: 'fixed' }),
  fromGrid('terrain.path.a', 0, 30, { layer: 'path', depthMode: 'fixed' }),
  fromGrid('terrain.path.b', 1, 30, { layer: 'path', depthMode: 'fixed' }),
  fromGrid('terrain.boardwalk.a', 2, 18, { layer: 'path', depthMode: 'fixed' }),
  fromGrid('terrain.dirt.a', 13, 16, { layer: 'path', depthMode: 'fixed' }),
  fromGrid('terrain.stone.a', 23, 18, { layer: 'path', depthMode: 'fixed' }),
  fromGrid('terrain.fern.a', 38, 1, { layer: 'groundDecorations', depthMode: 'fixed' }),
  fromGrid('terrain.brush.a', 0, 33, { layer: 'groundDecorations', depthMode: 'fixed' }),
  fromGrid('terrain.flower-ground.a', 0, 34, { layer: 'groundDecorations', depthMode: 'fixed' }),
  fromGrid('terrain.reed-ground.a', 38, 1, { layer: 'groundDecorations', depthMode: 'fixed' }),

  fromGrid('terrain.water.frame.0', 16, 0, { layer: 'water', depthMode: 'fixed' }),
  fromGrid('terrain.water.frame.1', 17, 0, { layer: 'water', depthMode: 'fixed' }),
  fromGrid('terrain.water.frame.2', 18, 0, { layer: 'water', depthMode: 'fixed' }),
  fromGrid('terrain.water.frame.3', 16, 1, { layer: 'water', depthMode: 'fixed' }),

  fromGrid('prop.crate', 18, 16, { origin: { x: 0.5, y: 1 }, drawOffset: { x: 0, y: 16 }, collisionFootprint: { width: 1, height: 1 }, layer: 'lowProps', depthMode: 'ySort', blocksMovement: true }),
  fromGrid('prop.rock', 14, 11, { origin: { x: 0.5, y: 1 }, drawOffset: { x: 0, y: 16 }, collisionFootprint: { width: 1, height: 1 }, layer: 'lowProps', depthMode: 'ySort', blocksMovement: true }),
  fromGrid('prop.flower', 38, 1, { origin: { x: 0.5, y: 1 }, drawOffset: { x: 0, y: 16 }, collisionFootprint: { width: 1, height: 1 }, layer: 'groundDecorations', depthMode: 'ySort', blocksMovement: false, overlapsPlayer: true }),
  fromGrid('prop.sign', 23, 22, { origin: { x: 0.5, y: 1 }, drawOffset: { x: 0, y: 16 }, collisionFootprint: { width: 1, height: 1 }, layer: 'lowProps', depthMode: 'ySort', blocksMovement: true }),
  fromGrid('prop.fence', 2, 18, { origin: { x: 0.5, y: 1 }, drawOffset: { x: 0, y: 16 }, collisionFootprint: { width: 1, height: 1 }, layer: 'lowProps', depthMode: 'ySort', blocksMovement: true }),
  fromGrid('prop.reeds', 38, 1, { origin: { x: 0.5, y: 1 }, drawOffset: { x: 0, y: 16 }, collisionFootprint: { width: 1, height: 1 }, layer: 'lowProps', depthMode: 'ySort', blocksMovement: false, overlapsPlayer: true }),
  fromGrid('prop.tree', 5, 17, { width: 64, height: 64, origin: { x: 0.5, y: 1 }, drawOffset: { x: 0, y: 16 }, collisionFootprint: { width: 1, height: 1 }, layer: 'ySortedWorld', depthMode: 'ySort', blocksMovement: true, overlapsPlayer: true, notes: 'Large upright prop: visual art may extend above the one-cell collision footprint.' }),
  fromGrid('prop.house', 7, 2, { width: 96, height: 96, origin: { x: 0.5, y: 1 }, drawOffset: { x: 0, y: 48 }, collisionFootprint: { width: 3, height: 3 }, layer: 'ySortedWorld', depthMode: 'ySort', blocksMovement: true, overlapsPlayer: true, notes: 'Approximate full building rectangle; refine to the exact house art bounds in the PNG as needed.' }),
  fromGrid('prop.lab', 23, 18, { width: 96, height: 96, origin: { x: 0.5, y: 1 }, drawOffset: { x: 0, y: 48 }, collisionFootprint: { width: 3, height: 3 }, layer: 'ySortedWorld', depthMode: 'ySort', blocksMovement: true, overlapsPlayer: true, notes: 'Approximate full lab/building rectangle replacing the prior cropped/scaled region call.' }),
  fromGrid('prop.hut', 7, 2, { width: 64, height: 64, origin: { x: 0.5, y: 1 }, drawOffset: { x: 0, y: 32 }, collisionFootprint: { width: 2, height: 2 }, layer: 'ySortedWorld', depthMode: 'ySort', blocksMovement: true, overlapsPlayer: true }),
  fromGrid('prop.tent', 3, 27, { width: 64, height: 64, origin: { x: 0.5, y: 1 }, drawOffset: { x: 0, y: 32 }, collisionFootprint: { width: 2, height: 2 }, layer: 'ySortedWorld', depthMode: 'ySort', blocksMovement: true, overlapsPlayer: true }),
  fromGrid('prop.roost', 26, 9, { width: 96, height: 96, origin: { x: 0.5, y: 1 }, drawOffset: { x: 0, y: 48 }, collisionFootprint: { width: 3, height: 2 }, layer: 'ySortedWorld', depthMode: 'ySort', blocksMovement: true, overlapsPlayer: true })
];

export const TERRAIN_TEXTURES: Record<string, string[]> = {
  B: ['terrain.border'],
  g: ['terrain.grass.a', 'terrain.grass.b', 'terrain.grass.c'],
  p: ['terrain.path.a', 'terrain.path.b'],
  d: ['terrain.dirt.a'],
  h: ['terrain.grass.a'],
  s: ['terrain.stone.a'],
  n: ['terrain.grass.b'],
  q: ['terrain.grass.c'],
  w: ['terrain.water.frame.0', 'terrain.water.frame.1', 'terrain.water.frame.2', 'terrain.water.frame.3'],
  f: ['terrain.boardwalk.a'],
  t: ['terrain.grass.a'],
  F: ['terrain.flower-ground.a'],
  R: ['terrain.reed-ground.a'],
  r: ['terrain.brush.a'],
  G: ['terrain.fern.a'],
  m: ['terrain.marsh.a']
};

export const OVERWORLD_ANIMATIONS: AnimatedAtlasDefinition[] = [
  {
    id: 'terrain.water',
    frameIds: ['terrain.water.frame.0', 'terrain.water.frame.1', 'terrain.water.frame.2', 'terrain.water.frame.3'],
    frameRate: 3,
    repeat: -1
  }
];
