import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TILE_SIZE } from '../data/constants';
import { loadPlayerState, savePlayerState } from '../data/playerState';
import { createOverworldCharacterTextures } from '../systems/PixelPlaceholderSprites';
import { DialogueBox } from '../ui/DialogueBox';

const INTRO_PAGES = [
  {
    speaker: 'Field Log',
    message: 'The ferry leaves the mainland before sunrise, following amber lights along a quiet river delta.'
  },
  {
    speaker: 'Field Log',
    message: 'Ahead waits Amberleaf Town: a warm research stop built where old roots, fossil beds, and living prehistoric trails meet.'
  },
  {
    speaker: 'Dr. Sable',
    message: 'Your invitation was simple: come ready for careful field work. Observe first, travel lightly, and protect what you study.'
  },
  {
    speaker: 'Field Log',
    message: 'The creatures here are not trophies. They are neighbors, route partners, and mysteries that deserve patient notes.'
  },
  {
    speaker: 'Field Log',
    message: 'Soon, Quetzalcoatlus travel and an island base will help your team reach distant sites. For now, Amberleaf is the first landing.'
  }
] as const;

export class IntroScene extends Phaser.Scene {
  private dialogueBox?: DialogueBox;
  private pageIndex = 0;
  private advanceKeys?: Phaser.Input.Keyboard.Key[];
  private skipKeys?: Phaser.Input.Keyboard.Key[];
  private player?: Phaser.GameObjects.Sprite;
  private ferryParts: Phaser.GameObjects.GameObject[] = [];
  private fade?: Phaser.GameObjects.Rectangle;
  private skipText?: Phaser.GameObjects.Text;

  constructor() {
    super('IntroScene');
  }

  preload(): void {
    createOverworldCharacterTextures(this);
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#17251d');
    this.drawArrivalVista();
    this.dialogueBox = new DialogueBox(this, {
      y: 388,
      height: 138,
      bodyWidth: 528,
      maxLinesPerPage: 3,
      charactersPerSecond: 44
    });
    this.registerControls();
    this.startArrivalMotion();
    this.showCurrentPage();
  }

  update(time: number): void {
    this.dialogueBox?.update(time);

    if (this.skipKeys?.some((key) => Phaser.Input.Keyboard.JustDown(key))) {
      this.finishIntro();
      return;
    }

    if (this.advanceKeys?.some((key) => Phaser.Input.Keyboard.JustDown(key))) {
      this.advanceIntroText();
    }
  }

  private drawArrivalVista(): void {
    this.add.rectangle(320, 240, GAME_WIDTH, GAME_HEIGHT, 0x223324);
    this.add.rectangle(320, 124, GAME_WIDTH, 248, 0x203a42);
    this.add.circle(112, 78, 36, 0xd99c3b, 0.82);
    this.add.rectangle(320, 312, GAME_WIDTH, 176, 0x4f8cad);
    this.add.rectangle(320, 356, GAME_WIDTH, 92, 0x2d4632, 0.42);

    for (let x = -20; x < GAME_WIDTH + 40; x += 44) {
      this.add.triangle(x, 168, 0, 54, 42, 8, 84, 54, 0x243b2a, 0.92);
      this.add.triangle(x + 18, 188, 0, 44, 35, 4, 70, 44, 0x35522f, 0.9);
    }

    this.add.rectangle(320, 284, GAME_WIDTH, 44, 0xd6ad6a, 0.88);
    this.add.rectangle(320, 292, GAME_WIDTH, 6, 0xf0c878, 0.8);
    this.drawTinyAmberleafTown();
    this.drawDockAndRoost();

    this.ferryParts = [
      this.add.rectangle(-72, 330, 96, 18, 0x6f4b2f).setStrokeStyle(2, 0x3f2b1f).setDepth(4),
      this.add.rectangle(-90, 314, 38, 22, 0x8a6a3d).setStrokeStyle(2, 0x3f2b1f).setDepth(4),
      this.add.triangle(-46, 316, 0, 22, 18, -24, 36, 22, 0xf8f3df, 0.92).setDepth(4),
      this.add.rectangle(-72, 342, 118, 4, 0xf0c878, 0.62).setDepth(4)
    ];

    this.player = this.add.sprite(286, 306, 'player').setDepth(7);
    this.player.alpha = 0;
    const quetzalcoatlus = this.add.sprite(510, 230, 'quetzalcoatlus-placeholder').setDepth(3);
    quetzalcoatlus.alpha = 0.82;

    this.skipText = this.add.text(320, 24, 'Opening Field Arrival · Space/Enter next · Hold S to skip', {
      align: 'center',
      backgroundColor: 'rgba(23, 37, 29, 0.72)',
      color: '#f8f3df',
      fontFamily: 'monospace',
      fontSize: '13px',
      padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setDepth(20);

    this.fade = this.add.rectangle(320, 240, GAME_WIDTH, GAME_HEIGHT, 0x17251d, 1).setDepth(50);
    this.tweens.add({ targets: this.fade, alpha: 0, duration: 900 });
  }

  private drawTinyAmberleafTown(): void {
    const houses = [
      { x: 238, y: 250, wall: 0xbf7d36, roof: 0x6f4b2f },
      { x: 306, y: 246, wall: 0xd6ad6a, roof: 0x8a6a3d },
      { x: 382, y: 252, wall: 0xbf7d36, roof: 0x593928 }
    ];

    houses.forEach((house) => {
      this.add.rectangle(house.x, house.y, 42, 28, house.wall).setStrokeStyle(2, 0x593928);
      this.add.rectangle(house.x, house.y - 18, 50, 12, house.roof).setStrokeStyle(2, 0x593928);
      this.add.rectangle(house.x - 7, house.y + 8, 9, 16, 0x2d1f16);
      this.add.rectangle(house.x + 10, house.y, 7, 7, 0xf0c878);
    });

    for (let x = 188; x <= 438; x += 42) {
      this.add.circle(x, 260, 12, 0x386641);
      this.add.circle(x + 6, 254, 8, 0x2f6f3e);
      this.add.rectangle(x, 270, 5, 14, 0x7a4f2b);
    }
  }

  private drawDockAndRoost(): void {
    for (let x = 236; x <= 384; x += TILE_SIZE) {
      this.add.rectangle(x, 322, 28, 8, 0x8a6a3d).setStrokeStyle(1, 0x593928);
    }

    this.add.rectangle(504, 270, 76, 12, 0x8a6a3d).setStrokeStyle(2, 0x593928);
    this.add.rectangle(482, 252, 6, 36, 0x6f4b2f);
    this.add.rectangle(526, 252, 6, 36, 0x6f4b2f);
    this.add.text(504, 292, 'future roost', {
      color: '#f0c878',
      fontFamily: 'monospace',
      fontSize: '10px'
    }).setOrigin(0.5);
  }

  private startArrivalMotion(): void {
    if (this.ferryParts.length === 0 || !this.player) {
      return;
    }

    this.tweens.add({ targets: this.ferryParts, x: '+=358', duration: 4200, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: this.player, alpha: 1, y: 294, delay: 3300, duration: 900, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: this.skipText, alpha: 0.42, duration: 900, yoyo: true, repeat: -1 });
  }

  private showCurrentPage(): void {
    const page = INTRO_PAGES[this.pageIndex];
    this.dialogueBox?.show(page.speaker, page.message);
  }

  private advanceIntroText(): void {
    if (!this.dialogueBox) {
      return;
    }

    if (this.dialogueBox.isTyping()) {
      this.dialogueBox.advance();
      return;
    }

    if (this.pageIndex < INTRO_PAGES.length - 1) {
      this.pageIndex += 1;
      this.showCurrentPage();
      return;
    }

    this.finishIntro();
  }

  private finishIntro(): void {
    const state = loadPlayerState({ currentMap: 'AmberleafTownScene', currentPosition: { x: 9, y: 9 } });
    savePlayerState({
      ...state,
      currentMap: 'AmberleafTownScene',
      currentPosition: { x: 9, y: 9 },
      storyFlags: { ...state.storyFlags, openingIntroSeen: true }
    });

    if (this.fade) {
      this.fade.alpha = 0;
      this.fade.setDepth(80);
      this.tweens.add({
        targets: this.fade,
        alpha: 1,
        duration: 420,
        onComplete: () => this.scene.start('AmberleafTownScene')
      });
      return;
    }

    this.scene.start('AmberleafTownScene');
  }

  private registerControls(): void {
    const keyboard = this.input.keyboard;

    if (!keyboard) {
      return;
    }

    this.advanceKeys = [
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    ];
    this.skipKeys = [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)];
  }
}
