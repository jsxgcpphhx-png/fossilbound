import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TILE_SIZE } from '../data/constants';
import { loadPlayerState, updatePlayerLocation } from '../data/playerState';
import { GridMover } from '../systems/GridMover';
import { DebugPanel } from '../ui/DebugPanel';
import { DialogueBox } from '../ui/DialogueBox';
import { PartyMenu } from '../ui/PartyMenu';
import type { Direction, TilePosition } from '../types/grid';

const MAP_WIDTH = GAME_WIDTH / TILE_SIZE;
const MAP_HEIGHT = GAME_HEIGHT / TILE_SIZE;
const START_TILE: TilePosition = { x: 9, y: 9 };
const DR_SABLE_TILE: TilePosition = { x: 10, y: 7 };
const DR_SABLE_DIALOGUE =
  'The lab is open just north of the amber path. Step through the marked door and choose one prehistoric companion for your first field survey.';
const DR_SABLE_AFTER_STARTER_DIALOGUE =
  'Your starter is recorded in the field party. Open the party menu with P whenever you want to review your companion.';
const LAB_DOOR_TILE: TilePosition = { x: 6, y: 5 };
const LAB_RETURN_TILE: TilePosition = { x: 8, y: 13 };

const TERRAIN = [
  'BBBBBBBBBBBBBBBBBBBB',
  'BggggggggggggggggggB',
  'BgggppppppppgggggggB',
  'BgggphhhhpppggwwgggB',
  'BgggphhhhpppggwwgggB',
  'BgggppppppppggwwgggB',
  'BggggggppggggggggggB',
  'BgggffgppgffgggggggB',
  'BgggffgppgffgggggggB',
  'BggggggppggggggggggB',
  'BggppppppppppppggggB',
  'BggpggggggggggpggggB',
  'BggpggttggttggpggggB',
  'BggggggggggggggggggB',
  'BBBBBBBBBBBBBBBBBBBB'
] as const;

export class AmberleafTownScene extends Phaser.Scene {
  private player?: GridMover;
  private debugPanel?: DebugPanel;
  private dialogueBox?: DialogueBox;
  private movementKeys?: Record<Direction, Phaser.Input.Keyboard.Key[]>;
  private interactKeys?: Phaser.Input.Keyboard.Key[];
  private partyKeys?: Phaser.Input.Keyboard.Key[];
  private closeKeys?: Phaser.Input.Keyboard.Key[];
  private npcTiles = new Map<string, { name: string; getDialogue: () => string }>();
  private partyMenu?: PartyMenu;

  constructor() {
    super('AmberleafTownScene');
  }

  preload(): void {
    this.createPlaceholderSprites();
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#223324');
    const savedStartTile = this.getValidStartTile(this.getTownStartTile());
    updatePlayerLocation('AmberleafTownScene', savedStartTile);
    this.drawMap();
    this.createNpc();

    const playerSprite = this.add.sprite(0, 0, 'player').setDepth(5);
    this.player = new GridMover({
      sprite: playerSprite,
      startTile: savedStartTile,
      canEnterTile: (tile) => this.canEnterTile(tile),
      onMoveComplete: (tile) => this.handleMoveComplete(tile)
    });

    this.debugPanel = new DebugPanel(this);
    this.dialogueBox = new DialogueBox(this);
    this.partyMenu = new PartyMenu(this);
    this.registerControls();
    this.addLocationLabel();
  }

  update(): void {
    if (!this.player || !this.debugPanel || !this.dialogueBox || !this.partyMenu) {
      return;
    }

    this.debugPanel.update(this.player.currentTile);

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
        this.tryTalkToNpc();
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
    const playerCanvas = this.textures.createCanvas('player', TILE_SIZE, TILE_SIZE);
    const playerContext = playerCanvas?.getContext();

    if (playerCanvas && playerContext) {
      playerContext.fillStyle = '#00000033';
      playerContext.fillRect(7, 27, 18, 4);
      playerContext.fillStyle = '#274c77';
      playerContext.fillRect(9, 10, 14, 18);
      playerContext.fillStyle = '#8a6a3d';
      playerContext.fillRect(7, 8, 18, 7);
      playerContext.fillStyle = '#f1c27d';
      playerContext.fillRect(10, 4, 12, 10);
      playerContext.fillStyle = '#d99c3b';
      playerContext.fillRect(12, 15, 8, 3);
      playerContext.fillStyle = '#f8f3df';
      playerContext.fillRect(8, 27, 6, 4);
      playerContext.fillRect(18, 27, 6, 4);
      playerCanvas.refresh();
    }

    const npcCanvas = this.textures.createCanvas('dr-sable', TILE_SIZE, TILE_SIZE);
    const npcContext = npcCanvas?.getContext();

    if (npcCanvas && npcContext) {
      npcContext.fillStyle = '#00000033';
      npcContext.fillRect(6, 28, 20, 4);
      npcContext.fillStyle = '#3c2f2f';
      npcContext.fillRect(8, 5, 16, 8);
      npcContext.fillStyle = '#d6aa78';
      npcContext.fillRect(10, 8, 12, 10);
      npcContext.fillStyle = '#f8f3df';
      npcContext.fillRect(7, 17, 18, 13);
      npcContext.fillStyle = '#6c7f43';
      npcContext.fillRect(13, 19, 6, 9);
      npcContext.fillStyle = '#d99c3b';
      npcContext.fillRect(21, 19, 3, 8);
      npcCanvas.refresh();
    }
  }

  private drawMap(): void {
    for (let y = 0; y < MAP_HEIGHT; y += 1) {
      for (let x = 0; x < MAP_WIDTH; x += 1) {
        const tile = TERRAIN[y][x];
        const centerX = x * TILE_SIZE + TILE_SIZE / 2;
        const centerY = y * TILE_SIZE + TILE_SIZE / 2;
        const color = this.getTileColor(tile);

        this.add.rectangle(centerX, centerY, TILE_SIZE, TILE_SIZE, color);
        this.add.rectangle(centerX, centerY + 12, TILE_SIZE, 8, 0x000000, 0.06);
        this.add.rectangle(centerX, centerY, TILE_SIZE, TILE_SIZE, 0x000000, 0).setStrokeStyle(1, 0x000000, 0.08);

        if (this.tileKey({ x, y }) === this.tileKey(LAB_DOOR_TILE)) {
          this.add.rectangle(centerX, centerY - 5, 16, 20, 0x593928);
          this.add.rectangle(centerX, centerY - 16, 24, 6, 0xd99c3b);
          this.add.text(centerX - 19, centerY + 8, 'LAB', {
            color: '#f8f3df',
            fontFamily: 'monospace',
            fontSize: '9px'
          }).setDepth(3);
        }

        if (tile === 'h') {
          this.add.rectangle(centerX, centerY - 3, 27, 20, 0x9a5f2d);
          this.add.rectangle(centerX, centerY - 13, 29, 8, 0x6f4b2f);
          this.add.rectangle(centerX, centerY + 9, 10, 10, 0x593928);
          this.add.rectangle(centerX + 8, centerY + 1, 5, 5, 0xf0c878);
        }

        if (tile === 't') {
          this.add.circle(centerX, centerY - 5, 13, 0x2f6f3e);
          this.add.circle(centerX + 6, centerY - 9, 9, 0x386641);
          this.add.rectangle(centerX, centerY + 9, 6, 12, 0x7a4f2b);
        }

        if (tile === 'f') {
          this.add.rectangle(centerX, centerY + 1, 25, 8, 0x8a6a3d);
          this.add.rectangle(centerX, centerY - 3, 25, 3, 0xb4874d);
        }
      }
    }
  }

  private getTileColor(tile: string): number {
    switch (tile) {
      case 'B':
        return 0x243b2a;
      case 'p':
        return 0xd6ad6a;
      case 'h':
        return 0xbf7d36;
      case 'w':
        return 0x4f8cad;
      case 'f':
        return 0x8a6a3d;
      case 't':
        return 0x386641;
      default:
        return 0x739f4f;
    }
  }

  private createNpc(): void {
    this.add.sprite(
      DR_SABLE_TILE.x * TILE_SIZE + TILE_SIZE / 2,
      DR_SABLE_TILE.y * TILE_SIZE + TILE_SIZE / 2,
      'dr-sable'
    ).setDepth(4);
    this.add.text(DR_SABLE_TILE.x * TILE_SIZE - 28, DR_SABLE_TILE.y * TILE_SIZE - 30, 'Dr. Sable', {
      backgroundColor: 'rgba(23, 37, 29, 0.78)',
      color: '#f8f3df',
      fontFamily: 'monospace',
      fontSize: '12px',
      padding: { x: 4, y: 2 }
    }).setDepth(6);
    this.npcTiles.set(this.tileKey(DR_SABLE_TILE), {
      name: 'Dr. Sable',
      getDialogue: () => loadPlayerState().selectedStarter ? DR_SABLE_AFTER_STARTER_DIALOGUE : DR_SABLE_DIALOGUE
    });
  }

  private addLocationLabel(): void {
    const label = this.add.text(320, 46, 'Amberleaf Town', {
      backgroundColor: 'rgba(248, 243, 223, 0.92)',
      color: '#2d4632',
      fontFamily: 'monospace',
      fontSize: '20px',
      fontStyle: 'bold',
      padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setDepth(10);

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
      up: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
      ],
      down: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
      ],
      left: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
      ],
      right: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
      ]
    };
    this.interactKeys = [
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
    ];
    this.partyKeys = [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P)];
    this.closeKeys = [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)];
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

  private tryTalkToNpc(): void {
    if (!this.player || !this.dialogueBox) {
      return;
    }

    const npc = this.npcTiles.get(this.tileKey(this.player.getFacingTile()));

    if (npc) {
      this.dialogueBox.show(npc.name, npc.getDialogue());
    }
  }

  private canEnterTile(tile: TilePosition): boolean {
    if (tile.x < 0 || tile.y < 0 || tile.x >= MAP_WIDTH || tile.y >= MAP_HEIGHT) {
      return false;
    }

    const terrain = TERRAIN[tile.y][tile.x];
    const blockedTerrain = terrain === 'B' || terrain === 'h' || terrain === 'w' || terrain === 'f' || terrain === 't';

    return !blockedTerrain && !this.npcTiles.has(this.tileKey(tile));
  }

  private handleMoveComplete(tile: TilePosition): void {
    if (this.tileKey(tile) === this.tileKey(LAB_DOOR_TILE)) {
      updatePlayerLocation('DrSableLabScene', LAB_RETURN_TILE);
      this.scene.start('DrSableLabScene');
      return;
    }

    updatePlayerLocation('AmberleafTownScene', tile);
  }

  private getTownStartTile(): TilePosition {
    const state = loadPlayerState();
    return state.currentMap === 'AmberleafTownScene' ? state.currentPosition : START_TILE;
  }

  private getValidStartTile(candidate: TilePosition): TilePosition {
    return this.canEnterTile(candidate) ? candidate : START_TILE;
  }

  private tileKey(tile: TilePosition): string {
    return `${tile.x},${tile.y}`;
  }
}
