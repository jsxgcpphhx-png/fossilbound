import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TILE_SIZE } from '../data/constants';
import { loadPlayerState, selectStarter, updatePlayerLocation } from '../data/playerState';
import { STARTER_OPTIONS, type StarterOption } from '../data/starters';
import { GridMover } from '../systems/GridMover';
import { DebugPanel } from '../ui/DebugPanel';
import { DialogueBox } from '../ui/DialogueBox';
import { PartyMenu } from '../ui/PartyMenu';
import type { Direction, TilePosition } from '../types/grid';

const MAP_WIDTH = GAME_WIDTH / TILE_SIZE;
const MAP_HEIGHT = GAME_HEIGHT / TILE_SIZE;
const LAB_START_TILE: TilePosition = { x: 8, y: 13 };
const TOWN_RETURN_TILE: TilePosition = { x: 6, y: 5 };
const EXIT_TILE: TilePosition = { x: 8, y: 14 };
const DR_SABLE_TILE: TilePosition = { x: 9, y: 4 };
const STARTER_TABLE_TILES: TilePosition[] = [
  { x: 5, y: 8 },
  { x: 6, y: 8 },
  { x: 7, y: 8 },
  { x: 9, y: 8 },
  { x: 10, y: 8 },
  { x: 11, y: 8 },
  { x: 13, y: 8 },
  { x: 14, y: 8 },
  { x: 15, y: 8 }
];
const STARTER_DISPLAY_TILES: TilePosition[] = [
  { x: 6, y: 7 },
  { x: 10, y: 7 },
  { x: 14, y: 7 }
];

const LAB_TERRAIN = [
  'BBBBBBBBBBBBBBBBBBBB',
  'BffffffffffffffffffB',
  'BfccccfffffffccccffB',
  'BfcfffffffffffffcffB',
  'BfcfffffffffffffcffB',
  'BffffffffffffffffffB',
  'BfffpppppppppppffffB',
  'BfffpppppppppppffffB',
  'BfffsssssssssssffffB',
  'BfffpppppppppppffffB',
  'BffffffffffffffffffB',
  'BffffffffffffffffffB',
  'BffffffffffffffffffB',
  'BfffffffpppffffffffB',
  'BBBBBBBB BBBBBBBBBBB'
] as const;

export class DrSableLabScene extends Phaser.Scene {
  private player?: GridMover;
  private debugPanel?: DebugPanel;
  private dialogueBox?: DialogueBox;
  private partyMenu?: PartyMenu;
  private movementKeys?: Record<Direction, Phaser.Input.Keyboard.Key[]>;
  private interactKeys?: Phaser.Input.Keyboard.Key[];
  private partyKeys?: Phaser.Input.Keyboard.Key[];
  private closeKeys?: Phaser.Input.Keyboard.Key[];
  private selectionKeys?: {
    left: Phaser.Input.Keyboard.Key[];
    right: Phaser.Input.Keyboard.Key[];
    confirm: Phaser.Input.Keyboard.Key[];
  };
  private starterSelectionGroup?: Phaser.GameObjects.Group;
  private starterSelectionText?: Phaser.GameObjects.Text;
  private starterSelectionOpen = false;
  private starterSelectionIndex = 0;

  constructor() {
    super('DrSableLabScene');
  }

  preload(): void {
    this.createPlaceholderSprites();
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#2d251f');
    const savedStartTile = this.getValidStartTile(this.getLabStartTile());
    updatePlayerLocation('DrSableLabScene', savedStartTile);
    this.drawLab();
    this.createDrSable();
    this.createStarterDisplays();

    const playerSprite = this.add.sprite(0, 0, 'player').setDepth(7);
    this.player = new GridMover({
      sprite: playerSprite,
      startTile: savedStartTile,
      canEnterTile: (tile) => this.canEnterTile(tile),
      onMoveComplete: (tile) => this.handleMoveComplete(tile)
    });

    this.debugPanel = new DebugPanel(this);
    this.dialogueBox = new DialogueBox(this);
    this.partyMenu = new PartyMenu(this);
    this.createStarterSelectionUi();
    this.registerControls();
    this.addLocationLabel();
  }

  update(): void {
    if (!this.player || !this.debugPanel || !this.dialogueBox || !this.partyMenu) {
      return;
    }

    this.debugPanel.update(this.player.currentTile);

    if (this.starterSelectionOpen) {
      this.handleStarterSelectionInput();
      return;
    }

    if (this.isPartyMenuPressed()) {
      this.dialogueBox.hide();
      this.partyMenu.toggle();
      return;
    }

    if (this.partyMenu.isOpen()) {
      if (this.isMenuClosePressed()) {
        this.partyMenu.hide();
      }
      return;
    }

    if (this.isInteractPressed()) {
      if (this.dialogueBox.isOpen()) {
        this.dialogueBox.hide();
      } else {
        this.tryInteract();
      }
      return;
    }

    if (this.dialogueBox.isOpen() || this.player.isMoving()) {
      return;
    }

    const direction = this.getPressedDirection();

    if (direction) {
      this.player.tryMove(direction);
    }
  }

  private createPlaceholderSprites(): void {
    this.createPlayerTexture();
    this.createDrSableTexture();
    STARTER_OPTIONS.forEach((starter) => this.createStarterTexture(starter.id));
  }

  private createPlayerTexture(): void {
    const canvas = this.textures.createCanvas('player', TILE_SIZE, TILE_SIZE);
    const context = canvas?.getContext();

    if (!canvas || !context) {
      return;
    }

    context.fillStyle = '#00000033';
    context.fillRect(7, 27, 18, 4);
    context.fillStyle = '#274c77';
    context.fillRect(9, 10, 14, 18);
    context.fillStyle = '#8a6a3d';
    context.fillRect(7, 8, 18, 7);
    context.fillStyle = '#f1c27d';
    context.fillRect(10, 4, 12, 10);
    context.fillStyle = '#d99c3b';
    context.fillRect(12, 15, 8, 3);
    context.fillStyle = '#f8f3df';
    context.fillRect(8, 27, 6, 4);
    context.fillRect(18, 27, 6, 4);
    canvas.refresh();
  }

  private createDrSableTexture(): void {
    const canvas = this.textures.createCanvas('dr-sable-lab', TILE_SIZE, TILE_SIZE);
    const context = canvas?.getContext();

    if (!canvas || !context) {
      return;
    }

    context.fillStyle = '#00000033';
    context.fillRect(6, 28, 20, 4);
    context.fillStyle = '#3c2f2f';
    context.fillRect(8, 5, 16, 8);
    context.fillStyle = '#d6aa78';
    context.fillRect(10, 8, 12, 10);
    context.fillStyle = '#f8f3df';
    context.fillRect(7, 17, 18, 13);
    context.fillStyle = '#6c7f43';
    context.fillRect(13, 19, 6, 9);
    context.fillStyle = '#d99c3b';
    context.fillRect(21, 19, 3, 8);
    canvas.refresh();
  }

  private createStarterTexture(starterId: StarterOption['id']): void {
    const canvas = this.textures.createCanvas(`starter-${starterId}`, TILE_SIZE, TILE_SIZE);
    const context = canvas?.getContext();

    if (!canvas || !context) {
      return;
    }

    context.fillStyle = '#00000033';
    context.fillRect(4, 27, 24, 4);
    context.fillStyle = '#243126';

    if (starterId === 'triceratops') {
      context.fillRect(7, 17, 17, 8);
      context.fillRect(20, 13, 8, 11);
      context.fillRect(25, 12, 6, 2);
      context.fillRect(24, 16, 6, 2);
      context.fillRect(9, 24, 4, 6);
      context.fillRect(19, 24, 4, 6);
    } else if (starterId === 'velociraptor') {
      context.fillRect(8, 17, 17, 7);
      context.fillRect(23, 15, 8, 5);
      context.fillRect(2, 16, 9, 3);
      context.fillRect(12, 23, 4, 7);
      context.fillRect(22, 23, 4, 7);
      context.fillStyle = '#d59a3a';
      context.fillRect(13, 14, 10, 2);
    } else {
      context.fillRect(14, 14, 5, 11);
      context.fillRect(2, 18, 13, 3);
      context.fillRect(18, 18, 12, 3);
      context.fillRect(18, 13, 8, 3);
      context.fillRect(24, 9, 6, 3);
      context.fillStyle = '#d59a3a';
      context.fillRect(7, 17, 18, 1);
    }

    canvas.refresh();
  }

  private drawLab(): void {
    for (let y = 0; y < MAP_HEIGHT; y += 1) {
      for (let x = 0; x < MAP_WIDTH; x += 1) {
        const tile = LAB_TERRAIN[y][x];
        const centerX = x * TILE_SIZE + TILE_SIZE / 2;
        const centerY = y * TILE_SIZE + TILE_SIZE / 2;

        this.add.rectangle(centerX, centerY, TILE_SIZE, TILE_SIZE, this.getTileColor(tile));
        this.add.rectangle(centerX, centerY + 12, TILE_SIZE, 8, 0x000000, 0.06);
        this.add.rectangle(centerX, centerY, TILE_SIZE, TILE_SIZE, 0x000000, 0).setStrokeStyle(1, 0x000000, 0.08);

        if (tile === 'c') {
          this.add.rectangle(centerX, centerY + 2, 28, 18, 0x6f4b2f);
          this.add.rectangle(centerX, centerY - 7, 28, 5, 0xd99c3b);
        }

        if (tile === 's') {
          this.add.rectangle(centerX, centerY + 3, 28, 18, 0x8a6a3d);
          this.add.rectangle(centerX, centerY - 7, 28, 5, 0xf0c878);
        }
      }
    }

    this.add.rectangle(EXIT_TILE.x * TILE_SIZE + TILE_SIZE / 2, EXIT_TILE.y * TILE_SIZE + 4, 32, 8, 0xd99c3b);
    this.add.text(274, 430, 'Exit to Amberleaf Town', {
      color: '#f8f3df',
      fontFamily: 'monospace',
      fontSize: '12px'
    }).setDepth(4);
  }

  private getTileColor(tile: string): number {
    switch (tile) {
      case 'B':
        return 0x3b2d24;
      case 'c':
        return 0x5b4634;
      case 's':
        return 0x7a4f2b;
      case 'p':
        return 0xd6ad6a;
      default:
        return 0xc7a071;
    }
  }

  private createDrSable(): void {
    this.add.sprite(
      DR_SABLE_TILE.x * TILE_SIZE + TILE_SIZE / 2,
      DR_SABLE_TILE.y * TILE_SIZE + TILE_SIZE / 2,
      'dr-sable-lab'
    ).setDepth(7);
    this.add.text(DR_SABLE_TILE.x * TILE_SIZE - 28, DR_SABLE_TILE.y * TILE_SIZE - 30, 'Dr. Sable', {
      backgroundColor: 'rgba(23, 37, 29, 0.78)',
      color: '#f8f3df',
      fontFamily: 'monospace',
      fontSize: '12px',
      padding: { x: 4, y: 2 }
    }).setDepth(8);
  }

  private createStarterDisplays(): void {
    STARTER_OPTIONS.forEach((starter, index) => {
      const tile = STARTER_DISPLAY_TILES[index];

      if (!tile) {
        return;
      }

      this.add.sprite(tile.x * TILE_SIZE + TILE_SIZE / 2, tile.y * TILE_SIZE + TILE_SIZE / 2, `starter-${starter.id}`).setDepth(6);
      this.add.text(tile.x * TILE_SIZE - 31, tile.y * TILE_SIZE - 27, starter.displayName, {
        backgroundColor: 'rgba(248, 243, 223, 0.85)',
        color: '#2d4632',
        fontFamily: 'monospace',
        fontSize: '10px',
        padding: { x: 3, y: 2 }
      }).setDepth(8);
    });
  }

  private createStarterSelectionUi(): void {
    const overlay = this.add.rectangle(320, 240, 640, 480, 0x17251d, 0.35).setDepth(30);
    const panel = this.add.rectangle(320, 240, 580, 350, 0xf8f3df, 1).setStrokeStyle(4, 0x8a6a3d).setDepth(31);
    const header = this.add.rectangle(320, 92, 580, 48, 0x2d4632, 1).setDepth(32);
    const title = this.add.text(64, 78, 'Choose Your Starter Companion', {
      color: '#f8f3df',
      fontFamily: 'monospace',
      fontSize: '21px',
      fontStyle: 'bold'
    }).setDepth(33);

    this.starterSelectionText = this.add.text(68, 128, '', {
      color: '#17251d',
      fontFamily: 'monospace',
      fontSize: '15px',
      lineSpacing: 7,
      wordWrap: { width: 520 }
    }).setDepth(33);

    const prompt = this.add.text(80, 394, 'Arrow keys: choose   Enter / Space: confirm   Esc: close', {
      color: '#6c7f43',
      fontFamily: 'monospace',
      fontSize: '13px'
    }).setDepth(33);

    this.starterSelectionGroup = this.add.group([overlay, panel, header, title, this.starterSelectionText, prompt]);
    this.hideStarterSelection();
  }

  private addLocationLabel(): void {
    const label = this.add.text(320, 46, 'Dr. Sable\'s Lab', {
      backgroundColor: 'rgba(248, 243, 223, 0.92)',
      color: '#2d4632',
      fontFamily: 'monospace',
      fontSize: '20px',
      fontStyle: 'bold',
      padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: label,
      alpha: 0,
      delay: 1400,
      duration: 700,
      onComplete: () => label.destroy()
    });
  }

  private registerControls(): void {
    const keyboard = this.input.keyboard;

    if (!keyboard) {
      return;
    }

    this.movementKeys = {
      up: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)],
      down: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)],
      left: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)],
      right: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)]
    };
    this.interactKeys = [
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
    ];
    this.partyKeys = [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P)];
    this.closeKeys = [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)];
    this.selectionKeys = {
      left: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)],
      right: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)],
      confirm: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
      ]
    };
  }

  private getPressedDirection(): Direction | undefined {
    const keyboard = this.input.keyboard;

    if (!keyboard || !this.movementKeys) {
      return undefined;
    }

    const directions: Direction[] = ['up', 'down', 'left', 'right'];
    return directions.find((direction) =>
      this.movementKeys?.[direction].some((key) => keyboard.checkDown(key, 110))
    );
  }

  private isInteractPressed(): boolean {
    return this.interactKeys?.some((key) => Phaser.Input.Keyboard.JustDown(key)) ?? false;
  }

  private isPartyMenuPressed(): boolean {
    return this.partyKeys?.some((key) => Phaser.Input.Keyboard.JustDown(key)) ?? false;
  }

  private isMenuClosePressed(): boolean {
    return this.closeKeys?.some((key) => Phaser.Input.Keyboard.JustDown(key)) ?? false;
  }

  private tryInteract(): void {
    if (!this.player || !this.dialogueBox) {
      return;
    }

    const facingTile = this.player.getFacingTile();

    if (this.tileKey(facingTile) === this.tileKey(DR_SABLE_TILE)) {
      const hasStarter = Boolean(loadPlayerState().selectedStarter);
      this.dialogueBox.show(
        'Dr. Sable',
        hasStarter
          ? 'Your field party is ready. Press P to review your starter before heading back into town.'
          : 'The three prepared companions are on the specimen table. Press E or Space while facing the table to choose one.'
      );
      return;
    }

    if (this.isStarterTableTile(facingTile)) {
      this.openStarterSelection();
    }
  }

  private openStarterSelection(): void {
    if (loadPlayerState().selectedStarter) {
      this.dialogueBox?.show('Field Journal', 'A starter has already joined your party. Press P to view your field party.');
      return;
    }

    this.starterSelectionOpen = true;
    this.starterSelectionIndex = 0;
    this.updateStarterSelectionText();
    this.starterSelectionGroup?.setVisible(true);
  }

  private hideStarterSelection(): void {
    this.starterSelectionOpen = false;
    this.starterSelectionGroup?.setVisible(false);
  }

  private handleStarterSelectionInput(): void {
    if (this.isMenuClosePressed()) {
      this.hideStarterSelection();
      return;
    }

    const keys = this.selectionKeys;

    if (!keys) {
      return;
    }

    if (keys.left.some((key) => Phaser.Input.Keyboard.JustDown(key))) {
      this.starterSelectionIndex = (this.starterSelectionIndex + STARTER_OPTIONS.length - 1) % STARTER_OPTIONS.length;
      this.updateStarterSelectionText();
      return;
    }

    if (keys.right.some((key) => Phaser.Input.Keyboard.JustDown(key))) {
      this.starterSelectionIndex = (this.starterSelectionIndex + 1) % STARTER_OPTIONS.length;
      this.updateStarterSelectionText();
      return;
    }

    if (keys.confirm.some((key) => Phaser.Input.Keyboard.JustDown(key))) {
      const starter = STARTER_OPTIONS[this.starterSelectionIndex];
      selectStarter(starter);
      this.hideStarterSelection();
      this.dialogueBox?.show(
        'Field Journal',
        `${starter.displayName} joined your party. Press P to open the party menu and review your companion.`
      );
    }
  }

  private updateStarterSelectionText(): void {
    const body = STARTER_OPTIONS.map((starter, index) => {
      const marker = index === this.starterSelectionIndex ? '>' : ' ';
      return [
        `${marker} ${starter.displayName}`,
        `  Role: ${starter.role}`,
        `  Planned identity: ${starter.plannedTypeIdentity}`,
        `  Personality: ${starter.personality}`,
        `  Selection note: ${starter.selectionNote}`,
        `  Art note: ${starter.futureArtNote}`
      ].join('\n');
    }).join('\n\n');

    this.starterSelectionText?.setText(body);
  }

  private handleMoveComplete(tile: TilePosition): void {
    if (this.tileKey(tile) === this.tileKey(EXIT_TILE)) {
      updatePlayerLocation('AmberleafTownScene', TOWN_RETURN_TILE);
      this.scene.start('AmberleafTownScene');
      return;
    }

    updatePlayerLocation('DrSableLabScene', tile);
  }

  private canEnterTile(tile: TilePosition): boolean {
    if (tile.x < 0 || tile.y < 0 || tile.x >= MAP_WIDTH || tile.y >= MAP_HEIGHT) {
      return false;
    }

    if (this.tileKey(tile) === this.tileKey(EXIT_TILE)) {
      return true;
    }

    const terrain = LAB_TERRAIN[tile.y][tile.x];
    return terrain !== 'B' && terrain !== 'c' && terrain !== 's' && this.tileKey(tile) !== this.tileKey(DR_SABLE_TILE);
  }

  private isStarterTableTile(tile: TilePosition): boolean {
    return STARTER_TABLE_TILES.some((starterTile) => this.tileKey(starterTile) === this.tileKey(tile));
  }

  private getLabStartTile(): TilePosition {
    const state = loadPlayerState();
    return state.currentMap === 'DrSableLabScene' ? state.currentPosition : LAB_START_TILE;
  }

  private getValidStartTile(candidate: TilePosition): TilePosition {
    return this.canEnterTile(candidate) ? candidate : LAB_START_TILE;
  }

  private tileKey(tile: TilePosition): string {
    return `${tile.x},${tile.y}`;
  }
}
