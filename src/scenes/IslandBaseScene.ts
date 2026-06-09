import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../data/constants';
import { getCreatureByInstanceId, getCreatureSummaryLine, getFossilProgressSummary, loadPlayerState, returnFromIslandBase } from '../data/playerState';
import { createOverworldCharacterTextures } from '../systems/PixelPlaceholderSprites';

export class IslandBaseScene extends Phaser.Scene {
  private returnKeys?: Phaser.Input.Keyboard.Key[];

  constructor() {
    super('IslandBaseScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#18334a');
    createOverworldCharacterTextures(this);
    this.drawPlaceholderIslandBase();
    this.registerControls();
  }

  update(): void {
    if (this.returnKeys?.some((key) => Phaser.Input.Keyboard.JustDown(key))) {
      const state = returnFromIslandBase();
      this.scene.start(state.currentMap);
    }
  }

  private drawPlaceholderIslandBase(): void {
    const state = loadPlayerState();
    const storedNames = state.islandStorageCreatureIds
      .map((creatureId) => getCreatureByInstanceId(state, creatureId))
      .filter((creature): creature is NonNullable<typeof creature> => Boolean(creature))
      .map((creature) => `• ${getCreatureSummaryLine(creature)}`);

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x4f8cad);
    this.add.circle(320, 258, 210, 0xd6ad6a);
    this.add.circle(250, 220, 86, 0x739f4f);
    this.add.circle(390, 270, 112, 0x6c7f43);
    this.add.rectangle(318, 210, 180, 74, 0x8a6a3d).setStrokeStyle(4, 0x593928);
    this.add.rectangle(318, 168, 208, 34, 0x6f4b2f).setStrokeStyle(3, 0x593928);
    this.add.rectangle(318, 238, 36, 42, 0x2d1f16);
    this.add.sprite(452, 132, 'quetzalcoatlus-placeholder').setDepth(2);
    this.add.rectangle(452, 164, 104, 10, 0x000000, 0.16).setDepth(1);
    this.add.text(320, 44, 'Island Base — placeholder storage scaffold', {
      align: 'center',
      backgroundColor: 'rgba(248, 243, 223, 0.92)',
      color: '#2d4632',
      fontFamily: 'monospace',
      fontSize: '20px',
      fontStyle: 'bold',
      padding: { x: 14, y: 8 }
    }).setOrigin(0.5);
    this.add.text(66, 306, [
      'Quetzalcoatlus carries you toward your island base.',
      '',
      'This placeholder scene represents home storage for non-traveling creatures.',
      `Stored placeholder creatures: ${state.islandStorageCreatureIds.length}`,
      storedNames.length > 0 ? storedNames.slice(0, 6).join('\n') : '• none yet',
      '',
      `Tranq gun upgrade placeholder: Lv.${state.tranqGunUpgradeLevel}`,
      'Fossil progress debug:',
      getFossilProgressSummary(state).slice(0, 3).map((line) => `• ${line}`).join('\n'),
      '',
      'Press Space / E / Esc to return to the previous map.'
    ].join('\n'), {
      backgroundColor: 'rgba(248, 243, 223, 0.94)',
      color: '#17251d',
      fontFamily: 'monospace',
      fontSize: '15px',
      lineSpacing: 7,
      padding: { x: 12, y: 10 },
      wordWrap: { width: 500 }
    });
  }

  private registerControls(): void {
    const keyboard = this.input.keyboard;

    if (!keyboard) {
      return;
    }

    this.returnKeys = [
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    ];
  }
}
