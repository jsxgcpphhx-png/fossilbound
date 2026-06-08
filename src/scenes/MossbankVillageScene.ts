import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TILE_SIZE } from '../data/constants';
import { loadPlayerState, updatePlayerPosition } from '../data/playerState';
import { FollowerSprite } from '../systems/FollowerSprite';
import { GridMover } from '../systems/GridMover';
import { createOverworldCharacterTextures } from '../systems/PixelPlaceholderSprites';
import { DebugPanel } from '../ui/DebugPanel';
import { DialogueBox } from '../ui/DialogueBox';
import { PartyMenu } from '../ui/PartyMenu';
import type { Direction, TilePosition } from '../types/grid';

const MAP_WIDTH = GAME_WIDTH / TILE_SIZE;
const MAP_HEIGHT = GAME_HEIGHT / TILE_SIZE;
const START_TILE: TilePosition = { x: 1, y: 7 };
const FERN_TRAIL_EXIT_TILE: TilePosition = { x: 0, y: 7 };
const FERN_TRAIL_RETURN_TILE: TilePosition = { x: 18, y: 10 };

const TERRAIN = [
  'BBBBBBBBBBBBBBBBBBBB',
  'BmmmmmmggggggggggggB',
  'BmmwwwmggghhhggqqqgB',
  'BmmwwwmggghhhggqqqgB',
  'BmmmmpmmmmppppppppgB',
  'BggggppppppggggppggB',
  'BggghhhggpggssgppggB',
  'pppphhhppppgssgppppB',
  'BgggggggppgggggppggB',
  'BggnnnggppggttgppggB',
  'BggnnnppppggttgppggB',
  'BgggggggmmmmmggppggB',
  'BgrrggggmwwwmggggggB',
  'BgggggggmmmmmggggggB',
  'BBBBBBBBBBBBBBBBBBBB'
] as const;

const NPCS = [
  {
    tile: { x: 8, y: 6 },
    name: 'Reed Surveyor',
    dialogue: 'Mossbank Village is only a placeholder wetland town, but the boardwalk layout is already helping us test route flow.'
  },
  {
    tile: { x: 15, y: 5 },
    name: 'Roost Keeper',
    dialogue: 'The Quetzalcoatlus roost is scaffold art for now. Carrier slots and island travel can change when progression is designed.'
  }
] as const;

// Milestone 8 developer note:
// Mossbank Village is an early placeholder town. Its residents, story hooks,
// fossil research purpose, object placements, and route progression may all change
// once the final roster, capture rules, economy, and progression are designed.
export class MossbankVillageScene extends Phaser.Scene {
  private player?: GridMover;
  private debugPanel?: DebugPanel;
  private dialogueBox?: DialogueBox;
  private partyMenu?: PartyMenu;
  private follower?: FollowerSprite;
  private previousPlayerTile?: TilePosition;
  private movementKeys?: Record<Direction, Phaser.Input.Keyboard.Key[]>;
  private interactKeys?: Phaser.Input.Keyboard.Key[];
  private partyKeys?: Phaser.Input.Keyboard.Key[];
  private escapeKey?: Phaser.Input.Keyboard.Key;
  private npcTiles = new Map<string, { name: string; dialogue: string }>();

  constructor() {
    super('MossbankVillageScene');
  }

  preload(): void {
    createOverworldCharacterTextures(this);
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#203728');
    this.npcTiles.clear();
    this.drawMap();
    this.createTownDetails();

    const savedState = loadPlayerState({ currentMap: 'MossbankVillageScene', currentPosition: START_TILE });
    const savedStartTile = this.getValidStartTile(
      savedState.currentMap === 'MossbankVillageScene' ? savedState.currentPosition : START_TILE
    );
    const playerSprite = this.add.sprite(0, 0, 'player').setDepth(5);
    this.player = new GridMover({
      sprite: playerSprite,
      startTile: savedStartTile,
      canEnterTile: (tile) => this.canEnterTile(tile),
      onMoveComplete: (tile) => this.handleMoveComplete(tile)
    });

    this.follower = FollowerSprite.shouldCreate() ? new FollowerSprite(this, savedStartTile) : undefined;
    this.debugPanel = new DebugPanel(this);
    this.dialogueBox = new DialogueBox(this);
    this.partyMenu = new PartyMenu(this, {
      currentMap: 'MossbankVillageScene',
      getCurrentPosition: () => this.player?.currentTile ?? savedStartTile,
      onTravelToIslandBase: () => {
        this.dialogueBox?.show('Quetzalcoatlus', 'Quetzalcoatlus carries you toward your island base.');
        this.scene.start('IslandBaseScene');
      }
    });
    this.registerControls();
    this.addLocationLabel();
  }

  update(): void {
    if (!this.player || !this.debugPanel || !this.dialogueBox || !this.partyMenu) {
      return;
    }

    this.debugPanel.update(this.player.currentTile);
    this.partyMenu.update();

    if (this.isPartyMenuPressed()) {
      if (this.dialogueBox.isOpen()) {
        this.dialogueBox.hide();
      }
      this.partyMenu.toggle();
      return;
    }

    if (this.isEscapePressed()) {
      if (this.partyMenu.isOpen()) {
        this.partyMenu.hide();
        return;
      }

      if (this.dialogueBox.isOpen()) {
        this.dialogueBox.hide();
        return;
      }
    }

    if (this.isInteractPressed()) {
      if (this.dialogueBox.isOpen()) {
        this.dialogueBox.hide();
      } else if (!this.tryTalkToNpc()) {
        this.dialogueBox.show(
          'Mossbank Village',
          'Early placeholder village: boardwalks, wetland props, NPC story hooks, and roost details can all change later.'
        );
      }
      return;
    }

    if (this.dialogueBox.isOpen() || this.partyMenu.isOpen() || this.player.isMoving()) {
      return;
    }

    const direction = this.getPressedDirection();

    if (direction) {
      this.previousPlayerTile = this.player.currentTile;
      this.player.tryMove(direction);
    }
  }

  private drawMap(): void {
    for (let y = 0; y < MAP_HEIGHT; y += 1) {
      for (let x = 0; x < MAP_WIDTH; x += 1) {
        const tile = TERRAIN[y][x];
        const centerX = x * TILE_SIZE + TILE_SIZE / 2;
        const centerY = y * TILE_SIZE + TILE_SIZE / 2;

        this.add.rectangle(centerX, centerY, TILE_SIZE, TILE_SIZE, this.getTileColor(tile));
        this.add.rectangle(centerX, centerY + 12, TILE_SIZE, 8, 0x000000, 0.06);
        this.add.rectangle(centerX, centerY, TILE_SIZE, TILE_SIZE, 0x000000, 0).setStrokeStyle(1, 0x000000, 0.08);

        if (tile === 'm') {
          this.add.rectangle(centerX - 7, centerY + 4, 3, 12, 0x6c8f43).setRotation(-0.24);
          this.add.rectangle(centerX + 7, centerY + 3, 3, 11, 0xaebf7a).setRotation(0.22);
        }

        if (tile === 'p') {
          this.add.rectangle(centerX, centerY - 5, 30, 3, 0xb4874d, 0.65);
          this.add.rectangle(centerX, centerY + 4, 30, 3, 0x8a6a3d, 0.55);
        }

        if (tile === 'h') {
          this.drawHut(centerX, centerY, 0xbf7d36, 0x6f4b2f);
        }

        if (tile === 's') {
          this.drawHut(centerX, centerY, 0x8a6a3d, 0x3f543c);
        }

        if (tile === 'n') {
          this.add.rectangle(centerX, centerY + 2, 26, 18, 0xd6ad6a).setStrokeStyle(2, 0x8a6a3d);
          this.add.triangle(centerX, centerY - 14, 0, 18, 13, 0, 26, 18, 0x9a5f2d);
          this.add.rectangle(centerX, centerY + 8, 7, 12, 0x2d1f16);
        }

        if (tile === 'q') {
          this.add.rectangle(centerX, centerY + 8, 24, 8, 0x8a6a3d);
          this.add.rectangle(centerX - 8, centerY - 4, 4, 24, 0x6f4b2f);
          this.add.rectangle(centerX + 8, centerY - 4, 4, 24, 0x6f4b2f);
        }

        if (tile === 'r') {
          this.add.rectangle(centerX - 8, centerY + 5, 4, 18, 0x4f7a36).setRotation(-0.35);
          this.add.rectangle(centerX, centerY + 3, 5, 22, 0x6c8f43).setRotation(0.25);
          this.add.rectangle(centerX + 8, centerY + 5, 4, 17, 0xaebf7a).setRotation(0.4);
        }

        if (tile === 't') {
          this.add.circle(centerX, centerY - 6, 12, 0x2f6f3e);
          this.add.circle(centerX + 6, centerY - 9, 8, 0x386641);
          this.add.rectangle(centerX, centerY + 9, 6, 12, 0x7a4f2b);
        }
      }
    }
  }

  private drawHut(centerX: number, centerY: number, wallColor: number, roofColor: number): void {
    this.add.rectangle(centerX, centerY - 3, 28, 21, wallColor);
    this.add.rectangle(centerX, centerY - 15, 31, 8, roofColor);
    this.add.rectangle(centerX, centerY + 8, 10, 12, 0x2d1f16);
    this.add.rectangle(centerX + 9, centerY, 5, 5, 0xf0c878);
    this.add.rectangle(centerX, centerY + 13, 30, 4, 0x000000, 0.12);
  }

  private getTileColor(tile: string): number {
    switch (tile) {
      case 'B':
        return 0x243b2a;
      case 'p':
        return 0xa97943;
      case 'm':
        return 0x5f8a5e;
      case 'w':
        return 0x4f8cad;
      case 'h':
        return 0xbf7d36;
      case 's':
        return 0x8a6a3d;
      case 'n':
        return 0xd6ad6a;
      case 'q':
        return 0x7f8f42;
      case 'r':
        return 0x6c8f43;
      case 't':
        return 0x386641;
      default:
        return 0x739f4f;
    }
  }

  private createTownDetails(): void {
    this.add.text(20, 214, 'Fern Trail', labelStyle()).setDepth(6);
    this.add.text(372, 114, 'Quetzalcoatlus\nlanding roost', { ...labelStyle(), align: 'center' }).setDepth(6);
    this.add.text(356, 190, 'Fossil shed', labelStyle()).setDepth(6);
    this.add.text(92, 296, 'Field tents', labelStyle()).setDepth(6);

    this.add.sprite(492, 128, 'quetzalcoatlus-placeholder').setDepth(7);
    this.add.rectangle(502, 160, 84, 10, 0x000000, 0.16).setDepth(6);

    this.drawProps();

    NPCS.forEach((npc) => {
      this.add.sprite(npc.tile.x * TILE_SIZE + TILE_SIZE / 2, npc.tile.y * TILE_SIZE + TILE_SIZE / 2, 'generic-npc').setDepth(5);
      this.add.text(npc.tile.x * TILE_SIZE - 24, npc.tile.y * TILE_SIZE - 29, npc.name, labelStyle()).setDepth(6);
      this.npcTiles.set(this.tileKey(npc.tile), { name: npc.name, dialogue: npc.dialogue });
    });
  }

  private drawProps(): void {
    [
      { x: 3, y: 5 }, { x: 6, y: 8 }, { x: 12, y: 8 }, { x: 17, y: 9 }
    ].forEach((crate) => this.drawCrate(crate.x, crate.y));
    [
      { x: 2, y: 11 }, { x: 5, y: 12 }, { x: 13, y: 6 }, { x: 18, y: 5 }
    ].forEach((rock) => this.drawRock(rock.x, rock.y));
    [
      { x: 4, y: 4 }, { x: 10, y: 5 }, { x: 14, y: 10 }, { x: 17, y: 12 }
    ].forEach((flower) => this.drawFlower(flower.x, flower.y));
    [
      { x: 2, y: 6 }, { x: 14, y: 4 }, { x: 18, y: 8 }
    ].forEach((sign) => this.drawSign(sign.x, sign.y));
    for (let x = 12; x <= 18; x += 1) {
      this.add.rectangle(x * TILE_SIZE + 16, 344, 22, 5, 0x8a6a3d).setDepth(3);
    }
  }

  private drawCrate(tileX: number, tileY: number): void {
    const x = tileX * TILE_SIZE + TILE_SIZE / 2;
    const y = tileY * TILE_SIZE + TILE_SIZE / 2;
    this.add.rectangle(x, y + 5, 16, 14, 0x8a6a3d).setDepth(3).setStrokeStyle(2, 0x593928);
    this.add.line(x, y + 5, -7, -5, 7, 5, 0xd99c3b).setDepth(4);
  }

  private drawRock(tileX: number, tileY: number): void {
    const x = tileX * TILE_SIZE + TILE_SIZE / 2;
    const y = tileY * TILE_SIZE + TILE_SIZE / 2;
    this.add.circle(x - 4, y + 5, 5, 0x6f6f5f).setDepth(3);
    this.add.circle(x + 4, y + 4, 6, 0x8f8f78).setDepth(3);
  }

  private drawFlower(tileX: number, tileY: number): void {
    const x = tileX * TILE_SIZE + TILE_SIZE / 2;
    const y = tileY * TILE_SIZE + TILE_SIZE / 2;
    this.add.circle(x - 4, y + 7, 2, 0xf0c878).setDepth(3);
    this.add.circle(x, y + 5, 2, 0xd99c3b).setDepth(3);
    this.add.circle(x + 4, y + 7, 2, 0xf8f3df).setDepth(3);
  }

  private drawSign(tileX: number, tileY: number): void {
    const x = tileX * TILE_SIZE + TILE_SIZE / 2;
    const y = tileY * TILE_SIZE + TILE_SIZE / 2;
    this.add.rectangle(x, y + 7, 4, 12, 0x6f4b2f).setDepth(3);
    this.add.rectangle(x, y, 22, 10, 0xb4874d).setDepth(4).setStrokeStyle(1, 0x593928);
  }

  private addLocationLabel(): void {
    const label = this.add.text(320, 46, 'Mossbank Village', {
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
    this.escapeKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
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

  private isEscapePressed(): boolean {
    return this.escapeKey ? Phaser.Input.Keyboard.JustDown(this.escapeKey) : false;
  }

  private tryTalkToNpc(): boolean {
    if (!this.player || !this.dialogueBox) {
      return false;
    }

    const npc = this.npcTiles.get(this.tileKey(this.player.getFacingTile()));

    if (!npc) {
      return false;
    }

    this.dialogueBox.show(npc.name, npc.dialogue);
    return true;
  }

  private handleMoveComplete(tile: TilePosition): void {
    if (this.previousPlayerTile) {
      this.follower?.moveTo(this.previousPlayerTile);
    }

    if (this.tileKey(tile) === this.tileKey(FERN_TRAIL_EXIT_TILE)) {
      updatePlayerPosition('FernTrailScene', FERN_TRAIL_RETURN_TILE);
      this.scene.start('FernTrailScene');
      return;
    }

    updatePlayerPosition('MossbankVillageScene', tile);
  }

  private canEnterTile(tile: TilePosition): boolean {
    if (tile.x < 0 || tile.y < 0 || tile.x >= MAP_WIDTH || tile.y >= MAP_HEIGHT) {
      return false;
    }

    const terrain = TERRAIN[tile.y][tile.x];
    const blockedTerrain = terrain === 'B' || terrain === 'w' || terrain === 'h' || terrain === 's' || terrain === 'n' || terrain === 'q' || terrain === 't';
    return !blockedTerrain && !this.npcTiles.has(this.tileKey(tile));
  }

  private getValidStartTile(candidate: TilePosition): TilePosition {
    return this.canEnterTile(candidate) ? candidate : START_TILE;
  }

  private tileKey(tile: TilePosition): string {
    return `${tile.x},${tile.y}`;
  }
}

function labelStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    backgroundColor: 'rgba(23, 37, 29, 0.78)',
    color: '#f8f3df',
    fontFamily: 'monospace',
    fontSize: '11px',
    padding: { x: 4, y: 2 }
  };
}
