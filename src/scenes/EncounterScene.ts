import Phaser from 'phaser';
import { EARLY_GAME_DINOSAURS, type DinosaurDefinition } from '../data/dinosaurs';
import type { EncounterResult } from '../data/encounters';
import { updatePlayerPosition, type MapId } from '../data/playerState';
import type { TilePosition } from '../types/grid';

interface EncounterSceneData {
  encounter?: EncounterResult;
  returnMap?: MapId;
  returnPosition?: TilePosition;
}

export class EncounterScene extends Phaser.Scene {
  private encounter?: EncounterResult;
  private returnMap: MapId = 'FernTrailScene';
  private returnPosition: TilePosition = { x: 2, y: 7 };
  private selectedOptionIndex = 1;
  private optionTexts: Phaser.GameObjects.Text[] = [];
  private enterKey?: Phaser.Input.Keyboard.Key;
  private spaceKey?: Phaser.Input.Keyboard.Key;
  private upKey?: Phaser.Input.Keyboard.Key;
  private downKey?: Phaser.Input.Keyboard.Key;
  private wKey?: Phaser.Input.Keyboard.Key;
  private sKey?: Phaser.Input.Keyboard.Key;

  constructor() {
    super('EncounterScene');
  }

  init(data: EncounterSceneData): void {
    this.encounter = data.encounter;
    this.returnMap = data.returnMap ?? 'FernTrailScene';
    this.returnPosition = data.returnPosition ?? { x: 2, y: 7 };
  }

  create(): void {
    const dinosaur = this.encounter?.dinosaur ?? EARLY_GAME_DINOSAURS[0];

    this.cameras.main.setBackgroundColor('#17251d');
    this.drawBackground();
    this.drawCreatureCard(dinosaur);
    this.registerControls();
    this.refreshOptions();
  }

  update(): void {
    if (this.isPreviousPressed() || this.isNextPressed()) {
      this.selectedOptionIndex = this.selectedOptionIndex === 0 ? 1 : 0;
      this.refreshOptions();
      return;
    }

    if (this.isConfirmPressed()) {
      if (this.selectedOptionIndex === 1) {
        this.flee();
      }
    }
  }

  private drawBackground(): void {
    this.add.rectangle(320, 240, 640, 480, 0x2d4632, 1);
    this.add.rectangle(320, 330, 640, 300, 0x243b2a, 0.8);
    this.add.circle(502, 126, 54, 0xd99c3b, 0.45);
    this.add.rectangle(320, 388, 596, 120, 0xf8f3df, 1).setStrokeStyle(4, 0x2d4632);
    this.add.text(54, 344, 'A prehistoric creature appeared!', {
      color: '#17251d',
      fontFamily: 'monospace',
      fontSize: '22px',
      fontStyle: 'bold'
    });
    this.add.text(54, 374, 'This is a placeholder encounter shell. No battles, attacks, damage, or capture yet.', {
      color: '#6c7f43',
      fontFamily: 'monospace',
      fontSize: '15px',
      wordWrap: { width: 520 }
    });
  }

  private drawCreatureCard(dinosaur: DinosaurDefinition): void {
    this.add.rectangle(320, 185, 372, 230, 0xf8f3df, 0.94).setStrokeStyle(4, 0x8a6a3d);
    this.add.ellipse(320, 214, 190, 42, 0x000000, 0.12);
    this.add.circle(260, 172, 28, 0x243126, 1);
    this.add.rectangle(326, 172, 118, 34, 0x243126, 1);
    this.add.rectangle(398, 156, 52, 18, 0x243126, 1).setRotation(-0.18);
    this.add.rectangle(292, 206, 12, 34, 0x243126, 1);
    this.add.rectangle(356, 206, 12, 34, 0x243126, 1);
    this.add.text(320, 78, dinosaur.displayName, {
      align: 'center',
      color: '#f8f3df',
      fontFamily: 'monospace',
      fontSize: '30px',
      fontStyle: 'bold',
      stroke: '#2d4632',
      strokeThickness: 4
    }).setOrigin(0.5);
    this.add.text(320, 270, `Placeholder sprite path:\n${dinosaur.overworldSpritePath}`, {
      align: 'center',
      color: '#2d4632',
      fontFamily: 'monospace',
      fontSize: '14px'
    }).setOrigin(0.5);
  }

  private registerControls(): void {
    const keyboard = this.input.keyboard;

    if (!keyboard) {
      return;
    }

    this.enterKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.upKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.downKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.wKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.sKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
  }

  private refreshOptions(): void {
    if (this.optionTexts.length === 0) {
      this.optionTexts = [
        this.add.text(400, 414, '', { color: '#17251d', fontFamily: 'monospace', fontSize: '20px' }),
        this.add.text(400, 442, '', { color: '#17251d', fontFamily: 'monospace', fontSize: '20px' })
      ];
    }

    ['Observe', 'Flee'].forEach((option, index) => {
      const marker = this.selectedOptionIndex === index ? '▶ ' : '  ';
      this.optionTexts[index].setText(`${marker}${option}`);
    });
  }

  private flee(): void {
    updatePlayerPosition(this.returnMap, this.returnPosition);
    this.scene.start(this.returnMap);
  }

  private isConfirmPressed(): boolean {
    return Boolean(
      (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) ||
        (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey))
    );
  }

  private isPreviousPressed(): boolean {
    return Boolean(
      (this.upKey && Phaser.Input.Keyboard.JustDown(this.upKey)) ||
        (this.wKey && Phaser.Input.Keyboard.JustDown(this.wKey))
    );
  }

  private isNextPressed(): boolean {
    return Boolean(
      (this.downKey && Phaser.Input.Keyboard.JustDown(this.downKey)) ||
        (this.sKey && Phaser.Input.Keyboard.JustDown(this.sKey))
    );
  }
}
