import Phaser from 'phaser';
import { EARLY_GAME_DINOSAURS } from '../data/dinosaurs';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1f2f24');

    this.add.rectangle(320, 240, 640, 480, 0x2d4632, 1);
    this.add.circle(320, 178, 82, 0xd99c3b, 1);
    this.add.circle(320, 178, 55, 0xf8f3df, 1);
    this.add.rectangle(320, 178, 126, 18, 0x1f2f24, 1).setRotation(-0.3);
    this.add.rectangle(320, 178, 126, 18, 0x1f2f24, 1).setRotation(0.3);
    this.add.rectangle(320, 214, 140, 12, 0x8a6a3d, 0.5);
    this.add.circle(274, 188, 18, 0x243126, 1);
    this.add.rectangle(300, 188, 62, 24, 0x243126, 1);
    this.add.rectangle(346, 180, 38, 16, 0x243126, 1);
    this.add.rectangle(363, 166, 8, 24, 0x243126, 1).setRotation(0.55);
    this.add.rectangle(288, 206, 9, 25, 0x243126, 1);
    this.add.rectangle(333, 206, 9, 25, 0x243126, 1);

    this.add.text(320, 88, 'FOSSILBOUND', {
      align: 'center',
      color: '#f8f3df',
      fontFamily: 'monospace',
      fontSize: '48px',
      fontStyle: 'bold',
      stroke: '#8a6a3d',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(320, 258, 'Visual Pipeline Prototype', {
      color: '#d99c3b',
      fontFamily: 'monospace',
      fontSize: '22px'
    }).setOrigin(0.5);

    const startText = this.add.text(320, 330, 'Press Enter or Click to Start', {
      color: '#f8f3df',
      fontFamily: 'monospace',
      fontSize: '20px'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0.35,
      duration: 700,
      yoyo: true,
      repeat: -1
    });

    const rosterPreview = EARLY_GAME_DINOSAURS.map((dinosaur) => dinosaur.displayName).join(' • ');

    this.add.text(320, 400, 'Naturalistic prehistoric creatures; placeholder silhouettes only.', {
      align: 'center',
      color: '#f0c878',
      fontFamily: 'monospace',
      fontSize: '14px'
    }).setOrigin(0.5);

    this.add.text(320, 424, rosterPreview, {
      align: 'center',
      color: '#aebf7a',
      fontFamily: 'monospace',
      fontSize: '11px'
    }).setOrigin(0.5);

    this.input.keyboard?.once('keydown-ENTER', () => this.startGame());
    this.input.once('pointerdown', () => this.startGame());
  }

  private startGame(): void {
    this.scene.start('AmberleafTownScene');
  }
}
