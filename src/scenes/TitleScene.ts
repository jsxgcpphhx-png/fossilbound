import Phaser from 'phaser';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#17251d');

    this.add.circle(320, 178, 78, 0xd99c3b, 1);
    this.add.circle(320, 178, 52, 0xf8f3df, 1);
    this.add.rectangle(320, 178, 120, 18, 0x17251d, 1).setRotation(-0.3);
    this.add.rectangle(320, 178, 120, 18, 0x17251d, 1).setRotation(0.3);

    this.add.text(320, 88, 'FOSSILBOUND', {
      align: 'center',
      color: '#f8f3df',
      fontFamily: 'monospace',
      fontSize: '48px',
      fontStyle: 'bold',
      stroke: '#6c7f43',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(320, 258, 'Milestone 1 Prototype', {
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

    this.add.text(320, 410, 'Original dinosaurs, town, story, UI, and placeholder art.', {
      align: 'center',
      color: '#aebf7a',
      fontFamily: 'monospace',
      fontSize: '14px'
    }).setOrigin(0.5);

    this.input.keyboard?.once('keydown-ENTER', () => this.startGame());
    this.input.once('pointerdown', () => this.startGame());
  }

  private startGame(): void {
    this.scene.start('AmberleafTownScene');
  }
}
