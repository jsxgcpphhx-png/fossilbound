import Phaser from 'phaser';
import { TILE_SIZE } from '../data/constants';

const TILESET_URL = new URL('../assets/tilesets/Overworld.png', import.meta.url).href;

export const OVERWORLD_TILESET_IMAGE_KEY = 'overworld-tileset-image';
export const OVERWORLD_TILESET_SHEET_KEY = 'overworld-tileset-sheet';
export const OVERWORLD_TILESET_TILE_SIZE = 32;
export const OVERWORLD_TILESET_COLUMNS = 40;
export const OVERWORLD_TILESET_ROWS = 36;
export const OVERWORLD_TILESET_WIDTH = OVERWORLD_TILESET_COLUMNS * OVERWORLD_TILESET_TILE_SIZE;
export const OVERWORLD_TILESET_HEIGHT = OVERWORLD_TILESET_ROWS * OVERWORLD_TILESET_TILE_SIZE;

export type TerrainTileCode = 'B' | 'g' | 'p' | 'd' | 'h' | 's' | 'n' | 'q' | 'w' | 'f' | 't' | 'F' | 'R' | 'r' | 'G' | 'm';
export type PropTileCode = 'crate' | 'rock' | 'flower' | 'sign' | 'fence' | 'reeds' | 'tree' | 'house' | 'lab' | 'hut' | 'tent' | 'roost';

function frame(column: number, row: number): number {
  return row * OVERWORLD_TILESET_COLUMNS + column;
}

const TERRAIN_FRAMES: Record<TerrainTileCode, number[]> = {
  B: [frame(0, 17), frame(1, 17), frame(2, 17), frame(0, 18)],
  g: [frame(0, 0), frame(1, 0), frame(0, 7), frame(1, 7), frame(15, 29)],
  p: [frame(0, 30), frame(1, 30), frame(0, 31), frame(1, 31)],
  d: [frame(13, 16), frame(14, 16), frame(13, 17), frame(14, 17)],
  h: [frame(7, 2), frame(8, 2), frame(7, 3), frame(8, 3)],
  s: [frame(23, 18), frame(24, 18), frame(23, 19), frame(24, 19)],
  n: [frame(3, 27), frame(4, 27), frame(3, 28), frame(4, 28)],
  q: [frame(31, 10), frame(32, 10), frame(31, 11), frame(32, 11)],
  w: [frame(16, 0), frame(17, 0), frame(18, 0), frame(16, 1), frame(17, 1)],
  f: [frame(2, 18), frame(3, 18)],
  t: [frame(5, 17), frame(6, 17), frame(5, 18), frame(6, 18)],
  F: [frame(0, 34), frame(1, 34), frame(2, 34)],
  R: [frame(38, 1), frame(39, 1), frame(38, 2)],
  r: [frame(0, 33), frame(1, 33), frame(2, 33)],
  G: [frame(38, 1), frame(39, 1), frame(38, 2), frame(1, 34)],
  m: [frame(0, 7), frame(1, 7), frame(0, 8), frame(1, 8)]
};

const PROP_FRAMES: Record<PropTileCode, number> = {
  crate: frame(18, 16),
  rock: frame(14, 11),
  flower: frame(38, 1),
  sign: frame(23, 22),
  fence: frame(2, 18),
  reeds: frame(38, 1),
  tree: frame(5, 17),
  house: frame(7, 2),
  lab: frame(23, 18),
  hut: frame(7, 2),
  tent: frame(3, 27),
  roost: frame(26, 9)
};

export const OVERWORLD_TILESET_NOTES = [
  'Uploaded tileset: src/assets/tilesets/Overworld.png',
  `Image dimensions: ${OVERWORLD_TILESET_WIDTH}x${OVERWORLD_TILESET_HEIGHT}px`,
  `Tile grid: ${OVERWORLD_TILESET_COLUMNS} columns x ${OVERWORLD_TILESET_ROWS} rows of ${OVERWORLD_TILESET_TILE_SIZE}px tiles`,
  'Usable tiles include grass, dirt paths, cliffs, water, wood planks, stone, fences, houses, huts, tents, fountains/roost pieces, trees, flowers, reeds, rocks, crates, signs, market/castle props, and roof pieces.'
] as const;

export function preloadOverworldTileset(scene: Phaser.Scene): void {
  if (!scene.textures.exists(OVERWORLD_TILESET_IMAGE_KEY)) {
    scene.load.image(OVERWORLD_TILESET_IMAGE_KEY, TILESET_URL);
  }

  if (!scene.textures.exists(OVERWORLD_TILESET_SHEET_KEY)) {
    scene.load.spritesheet(OVERWORLD_TILESET_SHEET_KEY, TILESET_URL, {
      frameWidth: OVERWORLD_TILESET_TILE_SIZE,
      frameHeight: OVERWORLD_TILESET_TILE_SIZE,
      spacing: 0,
      margin: 0
    });
  }
}

export function configureOverworldTileset(scene: Phaser.Scene): void {
  [OVERWORLD_TILESET_IMAGE_KEY, OVERWORLD_TILESET_SHEET_KEY].forEach((textureKey) => {
    const texture = scene.textures.get(textureKey);
    texture?.setFilter(Phaser.Textures.FilterMode.NEAREST);
  });
}

export function addTerrainTile(scene: Phaser.Scene, tileCode: string, tileX: number, tileY: number, depth = 0): Phaser.GameObjects.Image {
  const code = normalizeTerrainCode(tileCode);
  const frames = TERRAIN_FRAMES[code];
  const seed = Math.abs(tileX * 37 + tileY * 53 + tileCode.charCodeAt(0)) % frames.length;
  return scene.add.image(tileX * TILE_SIZE + TILE_SIZE / 2, tileY * TILE_SIZE + TILE_SIZE / 2, OVERWORLD_TILESET_SHEET_KEY, frames[seed])
    .setDisplaySize(TILE_SIZE, TILE_SIZE)
    .setDepth(depth)
    .setOrigin(0.5);
}

export function addPropTile(scene: Phaser.Scene, prop: PropTileCode, tileX: number, tileY: number, depth = 4): Phaser.GameObjects.Image {
  return scene.add.image(tileX * TILE_SIZE + TILE_SIZE / 2, tileY * TILE_SIZE + TILE_SIZE / 2, OVERWORLD_TILESET_SHEET_KEY, PROP_FRAMES[prop])
    .setDisplaySize(TILE_SIZE, TILE_SIZE)
    .setDepth(depth)
    .setOrigin(0.5);
}

export function addTilesetRegion(
  scene: Phaser.Scene,
  sourceX: number,
  sourceY: number,
  sourceWidth: number,
  sourceHeight: number,
  worldX: number,
  worldY: number,
  displayWidth = sourceWidth,
  displayHeight = sourceHeight,
  depth = 5
): Phaser.GameObjects.Image {
  return scene.add.image(worldX, worldY, OVERWORLD_TILESET_IMAGE_KEY)
    .setCrop(sourceX, sourceY, sourceWidth, sourceHeight)
    .setDisplaySize(displayWidth, displayHeight)
    .setDepth(depth)
    .setOrigin(0.5);
}

function normalizeTerrainCode(tileCode: string): TerrainTileCode {
  if (tileCode in TERRAIN_FRAMES) {
    return tileCode as TerrainTileCode;
  }

  return 'g';
}
