import Phaser from 'phaser';
import { TILE_SIZE } from '../data/constants';
import {
  OVERWORLD_ANIMATIONS,
  OVERWORLD_ATLAS_KEY,
  OVERWORLD_ATLAS_URL,
  OVERWORLD_TEXTURE_FRAMES,
  TERRAIN_TEXTURES,
  type PropTextureId,
  type TextureAtlasFrame
} from '../data/textureAtlas';

export { OVERWORLD_ATLAS_KEY as OVERWORLD_TILESET_IMAGE_KEY } from '../data/textureAtlas';
export const OVERWORLD_TILESET_LOGICAL_TILE_SIZE = TILE_SIZE;

export type TerrainTileCode = keyof typeof TERRAIN_TEXTURES;
export type PropTileCode = 'crate' | 'rock' | 'flower' | 'sign' | 'fence' | 'reeds' | 'tree' | 'house' | 'lab' | 'hut' | 'tent' | 'roost';

type PhaserTextureWithAtlasFrames = {
  setFilter(filterMode: Phaser.Textures.FilterMode): void;
  add(name: string | number, sourceIndex: number, x: number, y: number, width: number, height: number): unknown;
  has(name: string): boolean;
};

type FrameRenderable = Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;

const PROP_FRAMES: Record<PropTileCode, PropTextureId> = {
  crate: 'prop.crate',
  rock: 'prop.rock',
  flower: 'prop.flower',
  sign: 'prop.sign',
  fence: 'prop.fence',
  reeds: 'prop.reeds',
  tree: 'prop.tree',
  house: 'prop.house',
  lab: 'prop.lab',
  hut: 'prop.hut',
  tent: 'prop.tent',
  roost: 'prop.roost'
};

const FRAME_LOOKUP = new Map<string, TextureAtlasFrame>(OVERWORLD_TEXTURE_FRAMES.map((frame) => [frame.id, frame]));

export const OVERWORLD_TILESET_NOTES = [
  'Uploaded art: src/assets/tilesets/Overworld.png is treated as a texture atlas/sprite sheet, not a uniform 32x32 tileset.',
  `Logical movement and collision cells remain ${TILE_SIZE}x${TILE_SIZE}px, but visual atlas rectangles may be any size.`,
  'Frame rectangles, draw origins, draw offsets, collision-footprint notes, and water animation frames live in src/data/textureAtlas.ts.',
  'Do not use Phaser spritesheet grid slicing for this PNG unless a documented sub-region is truly uniform.'
] as const;

export function preloadOverworldTileset(scene: Phaser.Scene): void {
  if (!scene.textures.exists(OVERWORLD_ATLAS_KEY)) {
    scene.load.image(OVERWORLD_ATLAS_KEY, OVERWORLD_ATLAS_URL);
  }
}

export function configureOverworldTileset(scene: Phaser.Scene): void {
  const texture = scene.textures.get(OVERWORLD_ATLAS_KEY) as unknown as PhaserTextureWithAtlasFrames | undefined;
  if (!texture) return;

  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);

  OVERWORLD_TEXTURE_FRAMES.forEach((frame) => {
    if (!texture.has(frame.id)) {
      texture.add(frame.id, 0, frame.x, frame.y, frame.width, frame.height);
    }
  });

  registerAtlasAnimations(scene);
}

export function addTerrainTile(scene: Phaser.Scene, tileCode: string, tileX: number, tileY: number, depth = 0): FrameRenderable {
  const frameId = pickTerrainFrame(tileCode, tileX, tileY);
  const x = tileX * TILE_SIZE + TILE_SIZE / 2;
  const y = tileY * TILE_SIZE + TILE_SIZE / 2;

  if (tileCode === 'w') {
    const sprite = scene.add.sprite(x, y, OVERWORLD_ATLAS_KEY, frameId).setDepth(depth).setOrigin(0.5);
    playAnimation(sprite, 'terrain.water');
    return sprite;
  }

  return applyFramePlacement(scene.add.image(x, y, OVERWORLD_ATLAS_KEY, frameId), frameId, depth);
}

export function addPropTile(scene: Phaser.Scene, prop: PropTileCode, tileX: number, tileY: number, depth = 4): Phaser.GameObjects.Image {
  const frameId = PROP_FRAMES[prop];
  const { x, y } = frameWorldPosition(frameId, tileX, tileY);
  return applyFramePlacement(scene.add.image(x, y, OVERWORLD_ATLAS_KEY, frameId), frameId, depth);
}

export function addAtlasTexture(
  scene: Phaser.Scene,
  frameId: string,
  tileX: number,
  tileY: number,
  depth = 5
): Phaser.GameObjects.Image {
  const { x, y } = frameWorldPosition(frameId, tileX, tileY);
  return applyFramePlacement(scene.add.image(x, y, OVERWORLD_ATLAS_KEY, frameId), frameId, depth);
}

/**
 * Compatibility helper for older scene code. Prefer adding a named atlas frame in
 * src/data/textureAtlas.ts and then drawing it with addAtlasTexture/addPropTile.
 */
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
  const texture = scene.textures.get(OVERWORLD_ATLAS_KEY) as unknown as PhaserTextureWithAtlasFrames;
  const frameId = `runtime.region.${sourceX}.${sourceY}.${sourceWidth}.${sourceHeight}`;
  if (!texture.has(frameId)) texture.add(frameId, 0, sourceX, sourceY, sourceWidth, sourceHeight);

  const image = scene.add.image(worldX, worldY, OVERWORLD_ATLAS_KEY, frameId).setDepth(depth).setOrigin(0.5);
  if (displayWidth !== sourceWidth || displayHeight !== sourceHeight) {
    // Kept only for legacy callers. New atlas mappings should preserve source size.
    image.setDisplaySize(displayWidth, displayHeight);
  }
  return image;
}

function pickTerrainFrame(tileCode: string, tileX: number, tileY: number): string {
  const frames = TERRAIN_TEXTURES[tileCode] ?? TERRAIN_TEXTURES.g;
  const seed = Math.abs(tileX * 37 + tileY * 53 + tileCode.charCodeAt(0)) % frames.length;
  return frames[seed];
}

function frameWorldPosition(frameId: string, tileX: number, tileY: number): { x: number; y: number } {
  const frame = FRAME_LOOKUP.get(frameId);
  const offset = frame?.drawOffset ?? { x: 0, y: 0 };
  return {
    x: tileX * TILE_SIZE + TILE_SIZE / 2 + offset.x,
    y: tileY * TILE_SIZE + TILE_SIZE / 2 + offset.y
  };
}

function applyFramePlacement<T extends FrameRenderable>(gameObject: T, frameId: string, depth: number): T {
  const frame = FRAME_LOOKUP.get(frameId);
  const origin = frame?.origin ?? { x: 0.5, y: 0.5 };
  return gameObject.setDepth(depth).setOrigin(origin.x, origin.y) as T;
}

function registerAtlasAnimations(scene: Phaser.Scene): void {
  const animationManager = (scene as unknown as {
    anims?: {
      exists?: (key: string) => boolean;
      create?: (config: { key: string; frames: Array<{ key: string; frame: string }>; frameRate: number; repeat: number }) => unknown;
    };
  }).anims;

  OVERWORLD_ANIMATIONS.forEach((animation) => {
    if (!animationManager?.exists?.(animation.id)) {
      animationManager?.create?.({
        key: animation.id,
        frames: animation.frameIds.map((frame) => ({ key: OVERWORLD_ATLAS_KEY, frame })),
        frameRate: animation.frameRate,
        repeat: animation.repeat
      });
    }
  });
}

function playAnimation(sprite: Phaser.GameObjects.Sprite, key: string): void {
  (sprite as unknown as { play?: (animationKey: string) => unknown }).play?.(key);
}
