import Phaser from 'phaser';
import type { EncounterPreview } from '../data/encounters';

export class EncounterScene extends Phaser.Scene {
  private encounter?: EncounterPreview;
  private fleeKeys?: Phaser.Input.Keyboard.Key[];

  constructor() {
    super('EncounterScene');
  }

  init(data: EncounterPreview): void {
    this.encounter = data;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#17251d');

    const encounter = this.encounter;

    if (!encounter) {
      this.scene.start('FernTrailScene');
      return;
    }

    this.add.rectangle(320, 240, 640, 480, 0x17251d);
    this.add.rectangle(320, 240, 574, 410, 0xf8f3df).setStrokeStyle(5, 0x2d4632);
    this.add.text(320, 74, 'Placeholder Encounter', {
      align: 'center',
      color: '#2d4632',
      fontFamily: 'monospace',
      fontSize: '26px',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(320, 114, 'A prehistoric creature appeared!', {
      align: 'center',
      color: '#6f4b2f',
      fontFamily: 'monospace',
      fontSize: '20px'
    }).setOrigin(0.5);

    this.drawSilhouette(320, 226);

    this.add.text(320, 328, encounter.creatureName, {
      align: 'center',
      color: '#17251d',
      fontFamily: 'monospace',
      fontSize: '28px',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(320, 356, `Sprite path: ${encounter.spritePath}`, {
      align: 'center',
      color: '#6c7f43',
      fontFamily: 'monospace',
      fontSize: '12px',
      wordWrap: { width: 500 }
    }).setOrigin(0.5);

    this.add.text(196, 414, 'Observe\n(placeholder)', {
      align: 'center',
      backgroundColor: 'rgba(108, 127, 67, 0.18)',
      color: '#6c7f43',
      fontFamily: 'monospace',
      fontSize: '18px',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);

    this.add.text(444, 414, 'Flee\nEnter / F / Click', {
      align: 'center',
      backgroundColor: 'rgba(217, 156, 59, 0.28)',
      color: '#2d4632',
      fontFamily: 'monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      padding: { x: 24, y: 10 }
    }).setOrigin(0.5);
    this.input.once('pointerdown', () => this.flee());
    this.fleeKeys = [
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F),
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    ];
  }

  update(): void {
    if (this.fleeKeys?.some((key) => Phaser.Input.Keyboard.JustDown(key))) {
      this.flee();
    }
  }

  private drawSilhouette(x: number, y: number): void {
    this.add.rectangle(x, y + 38, 210, 34, 0x000000, 0.14);
    this.add.circle(x - 44, y, 39, 0x243126);
    this.add.rectangle(x - 2, y, 92, 74, 0x243126);
    this.add.circle(x + 78, y - 24, 31, 0x243126);
    this.add.rectangle(x + 120, y - 24, 42, 20, 0x243126).setRotation(0.15);
    this.add.rectangle(x - 86, y + 2, 88, 20, 0x243126).setRotation(-0.22);
    this.add.rectangle(x - 44, y + 48, 16, 56, 0x243126).setRotation(0.08);
    this.add.rectangle(x + 34, y + 48, 16, 56, 0x243126).setRotation(-0.08);
    this.add.circle(x + 94, y - 30, 3, 0xf0c878);
  }

  private flee(): void {
    this.scene.start(this.encounter?.returnScene ?? 'FernTrailScene');
  }
}
