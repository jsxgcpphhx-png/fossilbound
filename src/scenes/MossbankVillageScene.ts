import Phaser from 'phaser';
import { TILE_SIZE } from '../data/constants';
import { loadPlayerState, updatePlayerPosition } from '../data/playerState';
import { FollowerSprite } from '../systems/FollowerSprite';
import { GridMover } from '../systems/GridMover';
import { addFixedLocationLabel, configureOverworldCamera, fadeToScene, tileCenter } from '../systems/OverworldCamera';
import { createOverworldCharacterTextures } from '../systems/PixelPlaceholderSprites';
import { DebugPanel } from '../ui/DebugPanel';
import { DialogueBox } from '../ui/DialogueBox';
import { PartyMenu } from '../ui/PartyMenu';
import type { Direction, TilePosition } from '../types/grid';

const START_TILE: TilePosition = { x: 1, y: 11 };
const FERN_TRAIL_EXIT_TILE: TilePosition = { x: 0, y: 11 };
const FERN_TRAIL_RETURN_TILE: TilePosition = { x: 32, y: 12 };

const TERRAIN = [
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
  'BmmmmmmgggggggttggggggmmmmmmBB',
  'BmmwwwmggghhhgttggqqqgmmwwwBBB',
  'BmmwwwmggghhhgggggqqqgmmwwwBBB',
  'BmmmmpmmmmpppppppppgggmmmmmBBB',
  'BggggppppppgggggpppgggggRRRBBB',
  'BggghhhggpggssggpgggggggRRRBBB',
  'BggghhhppppgssggppppgggggggBBB',
  'BgggggggppggggggggpggtttgggBBB',
  'BggnnnggppggttgmmmppggtttggBBB',
  'BggnnnppppggttgmmmpppppppppBBB',
  'pppppppggmmmmmmmmmmgggppggpBBB',
  'BgrrggggmwwwwmgggRRgggppgggBBB',
  'BgggggggmwwwwmgggRRggggggggBBB',
  'BgggRRggmmmmmmgggggggggFgggBBB',
  'BgggRRggggggpppppgggmmmmgggBBB',
  'BgggggggggggpppppgggmwwwmggBBB',
  'BttgggggggggggggggggmmmmmgtBBB',
  'BttttgggggggggggggggggggtttBBB',
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
] as const;

const MAP_WIDTH = TERRAIN[0].length;
const MAP_HEIGHT = TERRAIN.length;

const NPCS = [
  {
    tile: { x: 9, y: 8 },
    name: 'Reed Surveyor',
    dialogue: 'Mossbank now borrows the wetland colors from Fern Trail, so the village should feel like the trail opens into a research settlement.'
  },
  {
    tile: { x: 20, y: 5 },
    name: 'Roost Keeper',
    dialogue: 'The Quetzalcoatlus roost is still scaffolding. Carrier slots and island travel can change when progression is designed.'
  }
] as const;

// Milestone 12 developer note:
// Mossbank remains scene-based, but the west boardwalk, marsh reeds, and path
// alignment match Fern Trail to create continuity. Future milestones can extend
// this region north/east or replace scene handoffs with streamed chunks.
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

  constructor() { super('MossbankVillageScene'); }
  preload(): void { createOverworldCharacterTextures(this); }

  create(): void {
    this.cameras.main.setBackgroundColor('#203728');
    this.npcTiles.clear();
    this.drawMap();
    this.createTownDetails();

    const savedState = loadPlayerState({ currentMap: 'MossbankVillageScene', currentPosition: START_TILE });
    const savedStartTile = this.getValidStartTile(savedState.currentMap === 'MossbankVillageScene' ? savedState.currentPosition : START_TILE);
    const playerSprite = this.add.sprite(0, 0, 'player').setDepth(10);
    this.player = new GridMover({ sprite: playerSprite, startTile: savedStartTile, canEnterTile: (tile) => this.canEnterTile(tile), onMoveComplete: (tile) => this.handleMoveComplete(tile) });
    configureOverworldCamera(this, { mapWidth: MAP_WIDTH, mapHeight: MAP_HEIGHT, target: this.player.gameObject, zoom: 1.16 });

    this.follower = FollowerSprite.shouldCreate() ? new FollowerSprite(this, savedStartTile) : undefined;
    this.debugPanel = new DebugPanel(this);
    this.dialogueBox = new DialogueBox(this);
    this.partyMenu = new PartyMenu(this, {
      currentMap: 'MossbankVillageScene',
      getCurrentPosition: () => this.player?.currentTile ?? savedStartTile,
      onTravelToIslandBase: () => {
        this.dialogueBox?.show('Quetzalcoatlus', 'Quetzalcoatlus carries you toward your island base.');
        fadeToScene(this, 'IslandBaseScene');
      }
    });
    this.registerControls();
    addFixedLocationLabel(this, 'Mossbank Village');
  }

  update(): void {
    if (!this.player || !this.debugPanel || !this.dialogueBox || !this.partyMenu) return;
    this.debugPanel.update(this.player.currentTile);
    this.dialogueBox.update();
    this.partyMenu.update();
    if (this.isPartyMenuPressed()) { if (this.dialogueBox.isOpen()) this.dialogueBox.hide(); this.partyMenu.toggle(); return; }
    if (this.isEscapePressed()) { if (this.partyMenu.isOpen()) { this.partyMenu.hide(); return; } if (this.dialogueBox.isOpen()) { this.dialogueBox.hide(); return; } }
    if (this.isInteractPressed()) {
      if (this.dialogueBox.isOpen()) this.dialogueBox.advance();
      else if (!this.tryTalkToNpc()) this.dialogueBox.show('Mossbank Village', 'Boardwalks, reeds, tents, roost props, and wetland water edges are still polish scaffolding, not final progression content.');
      return;
    }
    if (this.dialogueBox.isOpen() || this.partyMenu.isOpen() || this.player.isMoving()) return;
    const direction = this.getPressedDirection();
    if (direction) { this.previousPlayerTile = this.player.currentTile; this.player.tryMove(direction); }
  }

  private drawMap(): void {
    for (let y = 0; y < MAP_HEIGHT; y += 1) {
      for (let x = 0; x < MAP_WIDTH; x += 1) {
        const tile = TERRAIN[y][x];
        const { x: centerX, y: centerY } = tileCenter({ x, y });
        this.add.rectangle(centerX, centerY, TILE_SIZE, TILE_SIZE, this.getTileColor(tile));
        this.add.rectangle(centerX, centerY + 12, TILE_SIZE, 8, 0x000000, 0.055);
        if (tile === 'm') this.drawMarshGrass(centerX, centerY);
        if (tile === 'p') this.drawBoardwalk(centerX, centerY);
        if (tile === 'h') this.drawHut(centerX, centerY, 0xbf7d36, 0x6f4b2f);
        if (tile === 's') this.drawHut(centerX, centerY, 0x8a6a3d, 0x3f543c);
        if (tile === 'n') this.drawTent(centerX, centerY);
        if (tile === 'q') this.drawRoost(centerX, centerY);
        if (tile === 'r' || tile === 'R') this.drawReeds(centerX, centerY);
        if (tile === 't') this.drawTree(centerX, centerY);
        if (tile === 'w') this.drawWater(centerX, centerY);
        if (tile === 'F') this.drawFlowerPatch(centerX, centerY);
      }
    }
  }

  private getTileColor(tile: string): number {
    switch (tile) {
      case 'B': return 0x243b2a;
      case 'p': return 0xa97943;
      case 'm': return 0x5f8a5e;
      case 'w': return 0x4f8cad;
      case 'h': return 0xbf7d36;
      case 's': return 0x8a6a3d;
      case 'n': return 0xd6ad6a;
      case 'q': return 0x7f8f42;
      case 'r': case 'R': return 0x6c8f43;
      case 't': return 0x386641;
      case 'F': return 0x83ad51;
      default: return 0x739f4f;
    }
  }

  private createTownDetails(): void {
    this.add.text(22, 338, '← Fern Trail', labelStyle()).setDepth(30);
    this.add.text(570, 108, 'Quetzalcoatlus\nlanding roost', { ...labelStyle(), align: 'center' }).setDepth(30);
    this.add.text(360, 190, 'Fossil shed', labelStyle()).setDepth(30);
    this.add.text(92, 296, 'Field tents', labelStyle()).setDepth(30);
    this.add.sprite(646, 128, 'quetzalcoatlus-placeholder').setDepth(12);
    this.add.rectangle(656, 160, 84, 10, 0x000000, 0.16).setDepth(6);
    this.drawProps();
    NPCS.forEach((npc) => {
      const { x, y } = tileCenter(npc.tile);
      this.add.sprite(x, y, 'generic-npc').setDepth(10);
      this.add.text(x - 24, y - 29, npc.name, labelStyle()).setDepth(30);
      this.npcTiles.set(this.tileKey(npc.tile), { name: npc.name, dialogue: npc.dialogue });
    });
  }

  private drawProps(): void {
    [{ x: 3, y: 6 }, { x: 7, y: 11 }, { x: 15, y: 8 }, { x: 24, y: 10 }].forEach((crate) => this.drawCrate(crate.x, crate.y));
    [{ x: 2, y: 13 }, { x: 6, y: 14 }, { x: 17, y: 6 }, { x: 26, y: 6 }].forEach((rock) => this.drawRock(rock.x, rock.y));
    [{ x: 4, y: 4 }, { x: 13, y: 5 }, { x: 18, y: 12 }, { x: 25, y: 15 }].forEach((flower) => this.drawFlower(flower.x, flower.y));
    [{ x: 2, y: 10 }, { x: 19, y: 4 }, { x: 27, y: 10 }].forEach((sign) => this.drawSign(sign.x, sign.y));
    for (let x = 20; x <= 26; x += 1) this.add.rectangle(x * TILE_SIZE + 16, 344, 22, 5, 0x8a6a3d).setDepth(4);
  }

  private drawBoardwalk(x: number, y: number): void {
    this.add.rectangle(x, y - 5, 30, 3, 0xb4874d, 0.65).setDepth(3);
    this.add.rectangle(x, y + 4, 30, 3, 0x8a6a3d, 0.55).setDepth(3);
  }
  private drawMarshGrass(x: number, y: number): void { this.add.ellipse(x, y + 7, 22, 5, 0x355d3c, 0.2).setDepth(3); this.drawReeds(x, y); }
  private drawHut(x: number, y: number, wallColor: number, roofColor: number): void {
    this.add.rectangle(x, y - 3, 28, 21, wallColor).setDepth(4);
    this.add.rectangle(x, y - 15, 31, 8, roofColor).setDepth(5);
    this.add.rectangle(x, y + 8, 10, 12, 0x2d1f16).setDepth(5);
    this.add.rectangle(x + 9, y, 5, 5, 0xf0c878).setDepth(5);
    this.add.rectangle(x, y + 13, 30, 4, 0x000000, 0.12).setDepth(3);
  }
  private drawTent(x: number, y: number): void {
    this.add.rectangle(x, y + 2, 26, 18, 0xd6ad6a).setDepth(4).setStrokeStyle(2, 0x8a6a3d);
    this.add.triangle(x, y - 14, 0, 18, 13, 0, 26, 18, 0x9a5f2d).setDepth(5);
    this.add.rectangle(x, y + 8, 7, 12, 0x2d1f16).setDepth(5);
  }
  private drawRoost(x: number, y: number): void {
    this.add.rectangle(x, y + 8, 24, 8, 0x8a6a3d).setDepth(4);
    this.add.rectangle(x - 8, y - 4, 4, 24, 0x6f4b2f).setDepth(5);
    this.add.rectangle(x + 8, y - 4, 4, 24, 0x6f4b2f).setDepth(5);
  }
  private drawReeds(x: number, y: number): void {
    this.add.rectangle(x - 8, y + 5, 4, 18, 0x4f7a36).setRotation(-0.35).setDepth(4);
    this.add.rectangle(x, y + 3, 5, 22, 0x6c8f43).setRotation(0.25).setDepth(4);
    this.add.rectangle(x + 8, y + 5, 4, 17, 0xaebf7a).setRotation(0.4).setDepth(4);
  }
  private drawTree(x: number, y: number): void {
    this.add.circle(x, y - 6, 12, 0x2f6f3e).setDepth(5);
    this.add.circle(x + 6, y - 9, 8, 0x386641).setDepth(6);
    this.add.rectangle(x, y + 9, 6, 12, 0x7a4f2b).setDepth(4);
  }
  private drawWater(x: number, y: number): void {
    this.add.rectangle(x, y - 12, TILE_SIZE, 3, 0x9dd7c6, 0.25).setDepth(2);
    this.add.ellipse(x + 3, y + 2, 18, 5, 0x8cc9d8, 0.35).setDepth(2);
  }
  private drawFlowerPatch(x: number, y: number): void { [0xf0c878, 0xd99c3b, 0xf8f3df].forEach((color, index) => this.add.circle(x - 6 + index * 6, y + 6 - index, 2, color).setDepth(4)); }
  private drawCrate(tileX: number, tileY: number): void { const { x, y } = tileCenter({ x: tileX, y: tileY }); this.add.rectangle(x, y + 5, 16, 14, 0x8a6a3d).setDepth(4).setStrokeStyle(2, 0x593928); this.add.line(x, y + 5, -7, -5, 7, 5, 0xd99c3b).setDepth(5); }
  private drawRock(tileX: number, tileY: number): void { const { x, y } = tileCenter({ x: tileX, y: tileY }); this.add.circle(x - 4, y + 5, 5, 0x6f6f5f).setDepth(4); this.add.circle(x + 4, y + 4, 6, 0x8f8f78).setDepth(4); }
  private drawFlower(tileX: number, tileY: number): void { const { x, y } = tileCenter({ x: tileX, y: tileY }); this.drawFlowerPatch(x, y); }
  private drawSign(tileX: number, tileY: number): void { const { x, y } = tileCenter({ x: tileX, y: tileY }); this.add.rectangle(x, y + 7, 4, 12, 0x6f4b2f).setDepth(4); this.add.rectangle(x, y, 22, 10, 0xb4874d).setDepth(5).setStrokeStyle(1, 0x593928); }

  private registerControls(): void {
    const keyboard = this.input.keyboard; if (!keyboard) return;
    this.movementKeys = { up: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)], down: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)], left: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)], right: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)] };
    this.interactKeys = [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)];
    this.partyKeys = [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P)];
    this.escapeKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }
  private getPressedDirection(): Direction | undefined { const keyboard = this.input.keyboard; if (!keyboard || !this.movementKeys) return undefined; return (['up', 'down', 'left', 'right'] as Direction[]).find((direction) => this.movementKeys?.[direction].some((key) => keyboard.checkDown(key, 110))); }
  private isInteractPressed(): boolean { return this.interactKeys?.some((key) => Phaser.Input.Keyboard.JustDown(key)) ?? false; }
  private isPartyMenuPressed(): boolean { return this.partyKeys?.some((key) => Phaser.Input.Keyboard.JustDown(key)) ?? false; }
  private isEscapePressed(): boolean { return this.escapeKey ? Phaser.Input.Keyboard.JustDown(this.escapeKey) : false; }
  private tryTalkToNpc(): boolean { if (!this.player || !this.dialogueBox) return false; const npc = this.npcTiles.get(this.tileKey(this.player.getFacingTile())); if (!npc) return false; this.dialogueBox.show(npc.name, npc.dialogue); return true; }

  private handleMoveComplete(tile: TilePosition): void {
    if (this.previousPlayerTile) this.follower?.moveTo(this.previousPlayerTile);
    if (this.tileKey(tile) === this.tileKey(FERN_TRAIL_EXIT_TILE)) {
      updatePlayerPosition('FernTrailScene', FERN_TRAIL_RETURN_TILE);
      fadeToScene(this, 'FernTrailScene');
      return;
    }
    updatePlayerPosition('MossbankVillageScene', tile);
  }
  private canEnterTile(tile: TilePosition): boolean {
    if (tile.x < 0 || tile.y < 0 || tile.x >= MAP_WIDTH || tile.y >= MAP_HEIGHT) return false;
    const terrain = TERRAIN[tile.y][tile.x];
    const blockedTerrain = terrain === 'B' || terrain === 'w' || terrain === 'h' || terrain === 's' || terrain === 'n' || terrain === 'q' || terrain === 't';
    return !blockedTerrain && !this.npcTiles.has(this.tileKey(tile));
  }
  private getValidStartTile(candidate: TilePosition): TilePosition { return this.canEnterTile(candidate) ? candidate : START_TILE; }
  private tileKey(tile: TilePosition): string { return `${tile.x},${tile.y}`; }
}

function labelStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return { backgroundColor: 'rgba(23, 37, 29, 0.78)', color: '#f8f3df', fontFamily: 'monospace', fontSize: '11px', padding: { x: 4, y: 2 } };
}
