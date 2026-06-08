import Phaser from 'phaser';
import { TILE_SIZE } from '../data/constants';

const textureExists = (scene: Phaser.Scene, key: string): boolean =>
  Boolean((scene.textures as unknown as { exists?: (textureKey: string) => boolean }).exists?.(key));

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

  const canvas = scene.textures.createCanvas('follower-placeholder', TILE_SIZE, TILE_SIZE);
  const context = canvas?.getContext();

  if (!canvas || !context) {
    return;
  }

  context.imageSmoothingEnabled = false;
  context.fillStyle = '#00000038';
  context.beginPath();
  context.ellipse(15, 28, 12, 3, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#203328';
  context.fillRect(9, 17, 15, 8);
  context.fillRect(7, 20, 6, 5);
  context.fillRect(21, 13, 5, 6);
  context.fillRect(24, 11, 3, 3);
  context.fillRect(5, 19, 5, 3);
  context.fillRect(10, 24, 3, 5);
  context.fillRect(20, 24, 3, 5);
  context.fillStyle = '#39543a';
  context.fillRect(10, 15, 13, 5);
  context.fillRect(21, 12, 4, 3);
  context.fillStyle = '#d99c3b';
  context.fillRect(24, 10, 4, 2);
  context.fillRect(23, 13, 2, 1);
  context.fillStyle = '#f0c878';
  context.fillRect(22, 12, 1, 1);
  canvas.refresh();
}

function createPlayerTexture(scene: Phaser.Scene, key: string): void {
  if (textureExists(scene, key)) {
    return;
  }

  const canvas = scene.textures.createCanvas(key, TILE_SIZE, TILE_SIZE);
  const context = canvas?.getContext();

  if (!canvas || !context) {
    return;
  }

  context.imageSmoothingEnabled = false;
  context.fillStyle = '#00000038';
  context.beginPath();
  context.ellipse(16, 29, 10, 3, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#5a3f2d';
  context.fillRect(9, 5, 14, 5);
  context.fillRect(7, 8, 18, 4);
  context.fillStyle = '#f1c27d';
  context.fillRect(10, 10, 12, 8);
  context.fillStyle = '#8a5d3b';
  context.fillRect(9, 10, 3, 4);
  context.fillRect(20, 10, 3, 4);
  context.fillStyle = '#274c77';
  context.fillRect(10, 18, 12, 10);
  context.fillStyle = '#3f6f9d';
  context.fillRect(11, 18, 10, 3);
  context.fillStyle = '#d99c3b';
  context.fillRect(13, 20, 6, 2);
  context.fillStyle = '#f1c27d';
  context.fillRect(7, 19, 3, 7);
  context.fillRect(22, 19, 3, 7);
  context.fillStyle = '#1f2d3a';
  context.fillRect(10, 26, 5, 3);
  context.fillRect(17, 26, 5, 3);
  context.fillStyle = '#f8f3df';
  context.fillRect(9, 29, 6, 2);
  context.fillRect(17, 29, 6, 2);
  canvas.refresh();
}

function createDrSableTexture(scene: Phaser.Scene, key: string): void {
  if (textureExists(scene, key)) {
    return;
  }

  const canvas = scene.textures.createCanvas(key, TILE_SIZE, TILE_SIZE);
  const context = canvas?.getContext();

  if (!canvas || !context) {
    return;
  }

  context.imageSmoothingEnabled = false;
  context.fillStyle = '#00000038';
  context.beginPath();
  context.ellipse(16, 29, 11, 3, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#3c2f2f';
  context.fillRect(8, 5, 16, 6);
  context.fillRect(7, 9, 18, 3);
  context.fillStyle = '#d6aa78';
  context.fillRect(10, 10, 12, 8);
  context.fillStyle = '#f8f3df';
  context.fillRect(8, 18, 16, 11);
  context.fillStyle = '#ffffff';
  context.fillRect(9, 18, 14, 3);
  context.fillStyle = '#6c7f43';
  context.fillRect(13, 20, 6, 9);
  context.fillStyle = '#d99c3b';
  context.fillRect(21, 20, 4, 7);
  context.fillStyle = '#7a4f2b';
  context.fillRect(10, 28, 5, 2);
  context.fillRect(18, 28, 5, 2);
  context.fillStyle = '#243126';
  context.fillRect(12, 13, 2, 1);
  context.fillRect(19, 13, 2, 1);
  canvas.refresh();
}

function createGenericNpcTexture(scene: Phaser.Scene, key: string): void {
  if (textureExists(scene, key)) {
    return;
  }

  const canvas = scene.textures.createCanvas(key, TILE_SIZE, TILE_SIZE);
  const context = canvas?.getContext();

  if (!canvas || !context) {
    return;
  }

  context.imageSmoothingEnabled = false;
  context.fillStyle = '#00000038';
  context.beginPath();
  context.ellipse(16, 29, 10, 3, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#6f4b2f';
  context.fillRect(10, 6, 12, 5);
  context.fillStyle = '#e5b47a';
  context.fillRect(10, 10, 12, 8);
  context.fillStyle = '#7f8f42';
  context.fillRect(9, 18, 14, 10);
  context.fillStyle = '#aebf7a';
  context.fillRect(10, 18, 12, 3);
  context.fillStyle = '#f0c878';
  context.fillRect(7, 20, 3, 6);
  context.fillRect(23, 20, 3, 6);
  context.fillStyle = '#2d4632';
  context.fillRect(10, 27, 5, 3);
  context.fillRect(18, 27, 5, 3);
  canvas.refresh();
}

function createQuetzalcoatlusTexture(scene: Phaser.Scene, key: string): void {
  if (textureExists(scene, key)) {
    return;
  }

  const canvas = scene.textures.createCanvas(key, 96, 64);
  const context = canvas?.getContext();

  if (!canvas || !context) {
    return;
  }

  context.imageSmoothingEnabled = false;
  context.fillStyle = '#00000030';
  context.beginPath();
  context.ellipse(48, 56, 34, 5, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#273529';
  context.fillRect(44, 24, 11, 24);
  context.fillRect(50, 16, 26, 9);
  context.fillRect(69, 12, 10, 6);
  context.fillRect(29, 28, 18, 9);
  context.fillRect(38, 46, 5, 9);
  context.fillRect(54, 45, 5, 10);
  context.fillStyle = '#314634';
  context.fillRect(14, 17, 34, 12);
  context.fillRect(56, 18, 30, 11);
  context.fillStyle = '#45613d';
  context.fillRect(2, 23, 32, 8);
  context.fillRect(66, 25, 30, 7);
  context.fillStyle = '#d99c3b';
  context.fillRect(77, 13, 14, 4);
  context.fillRect(79, 17, 6, 3);
  context.fillStyle = '#f0c878';
  context.fillRect(71, 14, 2, 2);
  canvas.refresh();
}
