import Phaser from 'phaser';
import { TILE_SIZE } from '../data/constants';

const textureExists = (scene: Phaser.Scene, key: string): boolean =>
  Boolean((scene.textures as unknown as { exists?: (textureKey: string) => boolean }).exists?.(key));

type CanvasContext = CanvasRenderingContext2D;

interface PixelCanvas {
  canvas: Phaser.CanvasTexture;
  context: CanvasContext;
}

export const SPRITE_STANDARDS = {
  overworldCharacter: TILE_SIZE,
  follower: TILE_SIZE,
  overworldCreature: TILE_SIZE,
  battleSilhouette: { width: 192, height: 128 },
  quetzalcoatlus: { width: 96, height: 64 }
} as const;

export function createOverworldCharacterTextures(scene: Phaser.Scene): void {
  createPlayerTexture(scene, 'player');
  createPlayerTexture(scene, 'lab-player');
  createDrSableTexture(scene, 'dr-sable');
  createDrSableTexture(scene, 'lab-dr-sable');
  createGenericNpcTexture(scene, 'generic-npc');
  createQuetzalcoatlusTexture(scene, 'quetzalcoatlus-placeholder');
}

export function createFollowerTexture(scene: Phaser.Scene): void {
  if (textureExists(scene, 'follower-placeholder')) {
    return;
  }

  const target = createPixelCanvas(scene, 'follower-placeholder', SPRITE_STANDARDS.follower, SPRITE_STANDARDS.follower);

  if (!target) {
    return;
  }

  const { canvas, context } = target;
  drawShadow(context, 16, 28, 24, 6);
  drawCrouchedCreature(context);
  canvas.refresh();
}

function createPlayerTexture(scene: Phaser.Scene, key: string): void {
  if (textureExists(scene, key)) {
    return;
  }

  const target = createPixelCanvas(scene, key, TILE_SIZE, TILE_SIZE);

  if (!target) {
    return;
  }

  const { canvas, context } = target;
  drawShadow(context, 16, 29, 22, 6);

  // Hat and hair, offset from the exact center so the silhouette reads as a person instead of a block.
  fill(context, '#3f2b1f', [[10, 5, 12, 2], [8, 7, 17, 3], [7, 9, 19, 2], [10, 11, 4, 3], [20, 11, 3, 4]]);
  fill(context, '#8a5d3b', [[11, 4, 10, 2], [15, 6, 8, 2]]);
  fill(context, '#d99c3b', [[8, 10, 18, 1], [18, 4, 3, 1]]);

  // Face and field scarf.
  fill(context, '#f1c27d', [[11, 10, 10, 8], [10, 13, 12, 4], [7, 20, 3, 5], [22, 19, 3, 5]]);
  fill(context, '#8a5d3b', [[10, 10, 2, 5], [20, 11, 2, 4]]);
  fill(context, '#243126', [[13, 13, 2, 1], [18, 13, 2, 1]]);

  // Jacket, satchel, legs, and boots.
  fill(context, '#1f3d5c', [[10, 18, 12, 9], [9, 20, 14, 5], [11, 27, 4, 2], [17, 27, 4, 2]]);
  fill(context, '#3f6f9d', [[11, 18, 10, 3], [12, 22, 3, 4], [18, 22, 2, 4]]);
  fill(context, '#d99c3b', [[13, 20, 7, 2], [21, 21, 2, 5], [20, 24, 4, 2]]);
  fill(context, '#17251d', [[9, 29, 6, 2], [17, 29, 6, 2]]);
  fill(context, '#f8f3df', [[10, 18, 1, 2], [7, 20, 1, 2], [23, 19, 1, 2]]);

  canvas.refresh();
}

function createDrSableTexture(scene: Phaser.Scene, key: string): void {
  if (textureExists(scene, key)) {
    return;
  }

  const target = createPixelCanvas(scene, key, TILE_SIZE, TILE_SIZE);

  if (!target) {
    return;
  }

  const { canvas, context } = target;
  drawShadow(context, 16, 29, 24, 6);
  fill(context, '#2b2422', [[9, 5, 14, 3], [7, 8, 18, 3], [8, 11, 4, 4], [20, 10, 4, 5]]);
  fill(context, '#6f4b2f', [[12, 4, 9, 2], [21, 8, 3, 3]]);
  fill(context, '#d6aa78', [[10, 10, 12, 8], [8, 20, 3, 5], [23, 20, 3, 5]]);
  fill(context, '#243126', [[12, 13, 2, 1], [19, 13, 2, 1], [15, 16, 4, 1]]);
  fill(context, '#f8f3df', [[8, 18, 16, 11], [7, 20, 4, 8], [22, 19, 4, 9]]);
  fill(context, '#ffffff', [[9, 18, 14, 2], [10, 20, 3, 7], [20, 20, 3, 7]]);
  fill(context, '#6c7f43', [[13, 20, 7, 9], [15, 19, 3, 2]]);
  fill(context, '#d99c3b', [[21, 21, 4, 5], [22, 20, 3, 1]]);
  fill(context, '#4b3525', [[10, 28, 5, 2], [18, 28, 5, 2]]);
  fill(context, '#aebf7a', [[15, 22, 2, 1], [18, 24, 1, 2]]);
  canvas.refresh();
}

function createGenericNpcTexture(scene: Phaser.Scene, key: string): void {
  if (textureExists(scene, key)) {
    return;
  }

  const target = createPixelCanvas(scene, key, TILE_SIZE, TILE_SIZE);

  if (!target) {
    return;
  }

  const { canvas, context } = target;
  drawShadow(context, 16, 29, 22, 6);
  fill(context, '#4f321f', [[10, 6, 12, 3], [9, 9, 14, 2], [10, 11, 2, 3], [21, 11, 2, 3]]);
  fill(context, '#e5b47a', [[11, 10, 10, 8], [8, 20, 3, 5], [23, 20, 3, 5]]);
  fill(context, '#243126', [[13, 13, 2, 1], [18, 13, 2, 1]]);
  fill(context, '#6c7f43', [[9, 18, 14, 10], [10, 27, 5, 2], [18, 27, 5, 2]]);
  fill(context, '#aebf7a', [[10, 18, 12, 3], [11, 22, 3, 3], [19, 22, 2, 3]]);
  fill(context, '#2d4632', [[10, 29, 5, 2], [18, 29, 5, 2]]);
  fill(context, '#d99c3b', [[8, 19, 2, 2], [23, 19, 2, 2]]);
  canvas.refresh();
}

function createQuetzalcoatlusTexture(scene: Phaser.Scene, key: string): void {
  if (textureExists(scene, key)) {
    return;
  }

  const target = createPixelCanvas(scene, key, SPRITE_STANDARDS.quetzalcoatlus.width, SPRITE_STANDARDS.quetzalcoatlus.height);

  if (!target) {
    return;
  }

  const { canvas, context } = target;
  drawShadow(context, 48, 56, 72, 9);

  // Long wings and grounded carrier posture.
  fill(context, '#17251d', [[43, 23, 13, 24], [50, 16, 27, 8], [69, 12, 10, 6], [30, 29, 18, 8], [38, 46, 5, 9], [55, 45, 5, 10]]);
  fill(context, '#273529', [[14, 17, 34, 12], [56, 18, 30, 11], [2, 24, 32, 7], [66, 25, 30, 7]]);
  fill(context, '#45613d', [[18, 20, 28, 5], [58, 21, 25, 5], [5, 26, 28, 3], [68, 27, 24, 3], [45, 25, 9, 17]]);
  fill(context, '#6c7f43', [[50, 18, 21, 3], [72, 13, 8, 2], [44, 25, 4, 10]]);
  fill(context, '#d99c3b', [[75, 14, 18, 4], [78, 18, 10, 3], [54, 32, 7, 3]]);
  fill(context, '#f0c878', [[75, 13, 5, 2], [73, 16, 2, 2], [15, 19, 7, 2]]);
  fill(context, '#8a6a3d', [[37, 52, 10, 3], [53, 52, 11, 3], [40, 47, 2, 6], [57, 47, 2, 6]]);
  fill(context, '#f8f3df', [[71, 15, 2, 1], [51, 20, 2, 1]]);

  canvas.refresh();
}

function drawCrouchedCreature(context: CanvasContext): void {
  fill(context, '#17251d', [[8, 18, 17, 8], [6, 21, 7, 5], [21, 13, 5, 8], [24, 11, 4, 3], [4, 20, 5, 3], [10, 24, 3, 5], [20, 24, 3, 5]]);
  fill(context, '#2d4632', [[10, 16, 13, 5], [22, 12, 4, 4], [8, 22, 16, 2]]);
  fill(context, '#45613d', [[11, 15, 10, 2], [13, 18, 8, 2], [22, 13, 3, 1]]);
  fill(context, '#d99c3b', [[24, 10, 4, 2], [23, 14, 2, 1], [6, 19, 3, 1]]);
  fill(context, '#f0c878', [[22, 12, 1, 1], [18, 16, 2, 1]]);
}

function createPixelCanvas(scene: Phaser.Scene, key: string, width: number, height: number): PixelCanvas | undefined {
  const canvas = scene.textures.createCanvas(key, width, height);
  const context = canvas?.getContext();

  if (!canvas || !context) {
    return undefined;
  }

  context.imageSmoothingEnabled = false;
  return { canvas, context };
}

function drawShadow(context: CanvasContext, x: number, y: number, width: number, height: number): void {
  context.fillStyle = '#00000038';
  context.beginPath();
  context.ellipse(x, y, width / 2, height / 2, 0, 0, Math.PI * 2);
  context.fill();
}

function fill(context: CanvasContext, color: string, rects: [number, number, number, number][]): void {
  context.fillStyle = color;
  rects.forEach(([x, y, width, height]) => context.fillRect(x, y, width, height));
}
