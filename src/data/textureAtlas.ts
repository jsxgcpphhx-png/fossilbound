import { TILE_SIZE } from './constants';

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
  /** Optional logical footprint, in movement-grid cells, for documentation and future collision helpers. */
  collisionFootprint?: { width: number; height: number; offsetX?: number; offsetY?: number };
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
  collisionFootprint: options.collisionFootprint,
  notes: options.notes ?? 'Approximate atlas rectangle carried forward from the old grid index; adjust x/y/width/height here if the source art boundary is refined.'
});

export const OVERWORLD_TEXTURE_FRAMES: TextureAtlasFrame[] = [
  fromGrid('terrain.border', 0, 17),
  fromGrid('terrain.grass.a', 0, 0),
  fromGrid('terrain.grass.b', 1, 0),
  fromGrid('terrain.grass.c', 15, 29),
  fromGrid('terrain.marsh.a', 0, 7),
  fromGrid('terrain.path.a', 0, 30),
  fromGrid('terrain.path.b', 1, 30),
  fromGrid('terrain.boardwalk.a', 2, 18),
  fromGrid('terrain.dirt.a', 13, 16),
  fromGrid('terrain.stone.a', 23, 18),
  fromGrid('terrain.fern.a', 38, 1),
  fromGrid('terrain.brush.a', 0, 33),
  fromGrid('terrain.flower-ground.a', 0, 34),
  fromGrid('terrain.reed-ground.a', 38, 1),

  fromGrid('terrain.water.frame.0', 16, 0),
  fromGrid('terrain.water.frame.1', 17, 0),
  fromGrid('terrain.water.frame.2', 18, 0),
  fromGrid('terrain.water.frame.3', 16, 1),

  fromGrid('prop.crate', 18, 16, { origin: { x: 0.5, y: 1 }, drawOffset: { x: 0, y: 16 }, collisionFootprint: { width: 1, height: 1 } }),
  fromGrid('prop.rock', 14, 11, { origin: { x: 0.5, y: 1 }, drawOffset: { x: 0, y: 16 }, collisionFootprint: { width: 1, height: 1 } }),
  fromGrid('prop.flower', 38, 1, { origin: { x: 0.5, y: 1 }, drawOffset: { x: 0, y: 16 }, collisionFootprint: { width: 1, height: 1 } }),
  fromGrid('prop.sign', 23, 22, { origin: { x: 0.5, y: 1 }, drawOffset: { x: 0, y: 16 }, collisionFootprint: { width: 1, height: 1 } }),
  fromGrid('prop.fence', 2, 18, { origin: { x: 0.5, y: 1 }, drawOffset: { x: 0, y: 16 }, collisionFootprint: { width: 1, height: 1 } }),
  fromGrid('prop.reeds', 38, 1, { origin: { x: 0.5, y: 1 }, drawOffset: { x: 0, y: 16 }, collisionFootprint: { width: 1, height: 1 } }),
  fromGrid('prop.tree', 5, 17, { width: 64, height: 64, origin: { x: 0.5, y: 1 }, drawOffset: { x: 0, y: 16 }, collisionFootprint: { width: 1, height: 1 }, notes: 'Large upright prop: visual art may extend above the one-cell collision footprint.' }),
  fromGrid('prop.house', 7, 2, { width: 96, height: 96, origin: { x: 0.5, y: 1 }, drawOffset: { x: 0, y: 48 }, collisionFootprint: { width: 3, height: 3 }, notes: 'Approximate full building rectangle; refine to the exact house art bounds in the PNG as needed.' }),
  fromGrid('prop.lab', 23, 18, { width: 96, height: 96, origin: { x: 0.5, y: 1 }, drawOffset: { x: 0, y: 48 }, collisionFootprint: { width: 3, height: 3 }, notes: 'Approximate full lab/building rectangle replacing the prior cropped/scaled region call.' }),
  fromGrid('prop.hut', 7, 2, { width: 64, height: 64, origin: { x: 0.5, y: 1 }, drawOffset: { x: 0, y: 32 }, collisionFootprint: { width: 2, height: 2 } }),
  fromGrid('prop.tent', 3, 27, { width: 64, height: 64, origin: { x: 0.5, y: 1 }, drawOffset: { x: 0, y: 32 }, collisionFootprint: { width: 2, height: 2 } }),
  fromGrid('prop.roost', 26, 9, { width: 96, height: 96, origin: { x: 0.5, y: 1 }, drawOffset: { x: 0, y: 48 }, collisionFootprint: { width: 3, height: 2 } })
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
