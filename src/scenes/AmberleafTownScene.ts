import Phaser from 'phaser';
import { TILE_SIZE } from '../data/constants';
import { loadPlayerState, updatePlayerPosition } from '../data/playerState';
import { FollowerSprite } from '../systems/FollowerSprite';
import { GridMover } from '../systems/GridMover';
import {
  addFixedLocationLabel,
  configureOverworldCamera,
  fadeToScene,
  tileCenter
} from '../systems/OverworldCamera';
import { createOverworldCharacterTextures } from '../systems/PixelPlaceholderSprites';
import { addPropTile, addTerrainTile, configureOverworldTileset, preloadOverworldTileset } from '../systems/OverworldTileset';
import { actorDepthMetadata, updateWorldDepth, worldLayerDepth } from '../systems/WorldDepth';
import { DebugPanel } from '../ui/DebugPanel';
import { DialogueBox } from '../ui/DialogueBox';
import { PartyMenu } from '../ui/PartyMenu';
import { PackMenu } from '../ui/PackMenu';
import type { Direction, TilePosition } from '../types/grid';

const START_TILE: TilePosition = { x: 13, y: 12 };
const LAB_DOOR_TILE: TilePosition = { x: 10, y: 7 };
const LAB_ENTRY_TILE: TilePosition = { x: 9, y: 12 };
const FERN_TRAIL_EXIT_TILE: TilePosition = { x: 37, y: 12 };
const FERN_TRAIL_ENTRY_TILE: TilePosition = { x: 1, y: 12 };
const DR_SABLE_TILE: TilePosition = { x: 13, y: 8 };
const DR_SABLE_DIALOGUE =
  'Amberleaf opens into Fern Trail now instead of ending at a hard screen edge. The fences, path, and tree line should guide your eye east.';

const TERRAIN = [
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
  'BttttgggggggggggggggggttttttBBttttttBB',
  'BtggggggggffffggggggggggggttBBgggtttBB',
  'BtggggpppppppppppggggwwggggtBBgggggtBB',
  'BgggpphhhhpppphhhppgggwwggggBBggggggBB',
  'BgggpphhhhpppphhhppgggwwggggBBggggggBB',
  'BgggpphhhhpppppppppggwwgggggBBggggggBB',
  'BgggppppppdpppppggggggggggggBBggggggBB',
  'BggffffgggdgggffffggggggggggBBggggggBB',
  'BgggFgggggdgggggggggtttgggggBBttggggBB',
  'BgggggggppdppppgggggtttgggggBBttggggBB',
  'Bgggppppppdppppppppppppppppppppppppppp',
  'BgggppggggdgggggggggggggggFppppppppppp',
  'BgggppggttdttgggFgggggfffffppppppppppp',
  'BgggggggttdttggggggggggggggBBBgggtttBB',
  'BgggggggggdgggwwwwwgggRggggBBBggRRggBB',
  'BgggFgggggggggwwwwwggRRRgggBBBgRRRggBB',
  'BttgggggggggggggggggggRggttBBBgggtttBB',
  'BttttgggggggggggggggggggtttBBBttttttBB',
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
] as const;

const MAP_WIDTH = TERRAIN[0].length;
const MAP_HEIGHT = TERRAIN.length;

export class AmberleafTownScene extends Phaser.Scene {
  private player?: GridMover;
  private debugPanel?: DebugPanel;
  private dialogueBox?: DialogueBox;
  private partyMenu?: PartyMenu;
  private packMenu?: PackMenu;
  private follower?: FollowerSprite;
  private previousPlayerTile?: TilePosition;
  private movementKeys?: Record<Direction, Phaser.Input.Keyboard.Key[]>;
  private interactKeys?: Phaser.Input.Keyboard.Key[];
  private partyKeys?: Phaser.Input.Keyboard.Key[];
  private packKeys?: Phaser.Input.Keyboard.Key[];
  private escapeKey?: Phaser.Input.Keyboard.Key;
  private npcTiles = new Map<string, { name: string; dialogue: string }>();
  private signTiles = new Map<string, { title: string; text: string }>();

  constructor() {
    super('AmberleafTownScene');
  }

  preload(): void {
    preloadOverworldTileset(this);
    createOverworldCharacterTextures(this);
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#223324');
    configureOverworldTileset(this);
    this.npcTiles.clear();
    this.signTiles.clear();
    this.drawMap();
    this.createTownDetails();

    const savedState = loadPlayerState({ currentMap: 'AmberleafTownScene', currentPosition: START_TILE });
    const savedStartTile = this.getValidStartTile(
      savedState.currentMap === 'AmberleafTownScene' ? savedState.currentPosition : START_TILE
    );
    const playerSprite = this.add.sprite(0, 0, 'player');
    this.player = new GridMover({
      sprite: playerSprite,
      startTile: savedStartTile,
      canEnterTile: (tile) => this.canEnterTile(tile),
      onMoveComplete: (tile) => this.handleMoveComplete(tile)
    });
    this.follower = FollowerSprite.shouldCreate() ? new FollowerSprite(this, savedStartTile) : undefined;
    configureOverworldCamera(this, { mapWidth: MAP_WIDTH, mapHeight: MAP_HEIGHT, target: this.player.gameObject });
    this.debugPanel = new DebugPanel(this);
    this.dialogueBox = new DialogueBox(this);
    this.partyMenu = new PartyMenu(this, {
      currentMap: 'AmberleafTownScene',
      getCurrentPosition: () => this.player?.currentTile ?? savedStartTile,
      onTravelToIslandBase: () => {
        this.dialogueBox?.show('Quetzalcoatlus', 'Quetzalcoatlus carries you toward your island base.');
        fadeToScene(this, 'IslandBaseScene');
      }
    });
    this.packMenu = new PackMenu(this, { context: 'field' });
    this.registerControls();
    addFixedLocationLabel(this, 'Amberleaf Town');
  }

  update(): void {
    if (!this.player || !this.debugPanel || !this.dialogueBox || !this.partyMenu || !this.packMenu) return;
    this.debugPanel.update(this.player.currentTile);
    this.dialogueBox.update();
    this.partyMenu.update();
    this.packMenu.update();

    if (this.isPackMenuPressed()) {
      if (this.dialogueBox.isOpen()) this.dialogueBox.hide();
      if (this.partyMenu.isOpen()) this.partyMenu.hide();
      this.packMenu.toggle();
      return;
    }

    if (this.isPartyMenuPressed()) {
      if (this.dialogueBox.isOpen()) this.dialogueBox.hide();
      if (this.packMenu.isOpen()) this.packMenu.hide();
      this.partyMenu.toggle();
      return;
    }
    if (this.isEscapePressed()) {
      if (this.packMenu.isOpen()) { this.packMenu.hide(); return; }
      if (this.partyMenu.isOpen()) { this.partyMenu.hide(); return; }
      if (this.dialogueBox.isOpen()) { this.dialogueBox.hide(); return; }
    }
    if (this.isInteractPressed()) {
      if (this.dialogueBox.isOpen()) this.dialogueBox.advance();
      else if (!this.tryReadSign()) this.tryTalkToNpc();
      return;
    }
    if (this.dialogueBox.isOpen() || this.partyMenu.isOpen() || this.packMenu.isOpen() || this.player.isMoving()) return;
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
        const { x: centerX, y: centerY } = tileCenter({ x, y });
        addTerrainTile(this, tile, x, y);

        if (tile === 'p' || tile === 'd') this.drawPathTexture(centerX, centerY, tile === 'd');
        if (tile === 'h') this.drawHouse(centerX, centerY);
        if (tile === 't') this.drawTree(centerX, centerY);
        if (tile === 'f') this.drawFence(centerX, centerY);
        if (tile === 'F') this.drawFlowerPatch(centerX, centerY);
        if (tile === 'R') this.drawReeds(centerX, centerY);
        if (tile === 'w') this.drawWaterEdge(centerX, centerY);
        if (x === LAB_DOOR_TILE.x && y === LAB_DOOR_TILE.y) this.drawLab(centerX, centerY);
      }
    }
  }

  private createTownDetails(): void {
    updateWorldDepth(this.add.sprite(tileCenter(DR_SABLE_TILE).x, tileCenter(DR_SABLE_TILE).y, 'dr-sable'), actorDepthMetadata());
    this.npcTiles.set(this.tileKey(DR_SABLE_TILE), { name: 'Dr. Sable', dialogue: DR_SABLE_DIALOGUE });
    this.registerSign({ x: 6, y: 12 }, 'Amberleaf Town', 'Amberleaf Town research green. The lab is north; Fern Trail leaves from the east road.');
    this.registerSign({ x: 9, y: 6 }, "Dr. Sable's Lab", 'Field research lab. Please wipe mud off your boots before stepping inside.');
    this.registerSign({ x: 34, y: 12 }, 'Fern Trail', 'Fern Trail east: ferns, fossil brush, and the path toward Mossbank Wetlands.');
    [{ x: 7, y: 10 }, { x: 18, y: 13 }, { x: 22, y: 10 }, { x: 25, y: 14 }].forEach(({ x, y }) => this.drawRock(x, y));
    [{ x: 16, y: 11 }, { x: 21, y: 12 }].forEach(({ x, y }) => this.drawCrate(x, y));
  }

  private drawPathTexture(x: number, y: number, darker = false): void {
    this.add.ellipse(x - 8, y + 3, 10, 5, darker ? 0x9b6d3f : 0xc18c52, 0.18).setDepth(worldLayerDepth('path') + 1);
    this.add.ellipse(x + 9, y - 5, 9, 4, 0xf0c878, 0.1).setDepth(worldLayerDepth('path') + 1);
  }

  private drawHouse(x: number, y: number): void {
    this.add.ellipse(x, y + 15, 30, 7, 0x000000, 0.14).setDepth(worldLayerDepth('path') + 1);
    addPropTile(this, 'house', Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE), 4);
  }

  private drawLab(x: number, y: number): void {
    addPropTile(this, 'lab', Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE), 5);
  }

  private drawTree(x: number, y: number): void {
    this.add.ellipse(x, y + 13, 24, 7, 0x000000, 0.12).setDepth(worldLayerDepth('groundDecorations') + 2);
    addPropTile(this, 'tree', Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE), 5);
  }

  private drawFence(x: number, y: number): void {
    addPropTile(this, 'fence', Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE), 4);
  }

  private drawFlowerPatch(x: number, y: number): void {
    addPropTile(this, 'flower', Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE), 4);
  }

  private drawReeds(x: number, y: number): void {
    addPropTile(this, 'reeds', Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE), 4);
  }

  private drawWaterEdge(x: number, y: number): void {
    this.add.rectangle(x, y - 12, TILE_SIZE, 3, 0x9dd7c6, 0.25).setDepth(worldLayerDepth('water') + 1);
    this.add.ellipse(x + 3, y + 2, 18, 5, 0x8cc9d8, 0.35).setDepth(worldLayerDepth('water') + 1);
  }

  private drawSign(tileX: number, tileY: number): void {
    addPropTile(this, 'sign', tileX, tileY, 5);
  }

  private drawRock(tileX: number, tileY: number): void {
    addPropTile(this, 'rock', tileX, tileY, 4);
  }

  private drawCrate(tileX: number, tileY: number): void {
    addPropTile(this, 'crate', tileX, tileY, 4);
  }


  private registerControls(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;
    this.movementKeys = {
      up: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)],
      down: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)],
      left: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)],
      right: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)]
    };
    this.interactKeys = [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)];
    this.partyKeys = [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P)];
    this.packKeys = [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B)];
    this.escapeKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  private getPressedDirection(): Direction | undefined {
    const keyboard = this.input.keyboard;
    if (!keyboard || !this.movementKeys) return undefined;
    const directions: Direction[] = ['up', 'down', 'left', 'right'];
    return directions.find((direction) => this.movementKeys?.[direction].some((key) => keyboard.checkDown(key, 110)));
  }

  private isInteractPressed(): boolean { return this.interactKeys?.some((key) => Phaser.Input.Keyboard.JustDown(key)) ?? false; }
  private isPackMenuPressed(): boolean { return this.packKeys?.some((key) => Phaser.Input.Keyboard.JustDown(key)) ?? false; }
  private isPartyMenuPressed(): boolean { return this.partyKeys?.some((key) => Phaser.Input.Keyboard.JustDown(key)) ?? false; }
  private isEscapePressed(): boolean { return this.escapeKey ? Phaser.Input.Keyboard.JustDown(this.escapeKey) : false; }

  private tryReadSign(): boolean {
    if (!this.player || !this.dialogueBox) return false;
    const sign = this.signTiles.get(this.tileKey(this.player.getFacingTile()));
    if (!sign) return false;
    this.dialogueBox.show(sign.title, sign.text);
    return true;
  }

  private tryTalkToNpc(): void {
    if (!this.player || !this.dialogueBox) return;
    const npc = this.npcTiles.get(this.tileKey(this.player.getFacingTile()));
    if (npc) this.dialogueBox.show(npc.name, npc.dialogue);
  }

  private registerSign(tile: TilePosition, title: string, text: string): void {
    this.drawSign(tile.x, tile.y);
    this.signTiles.set(this.tileKey(tile), { title, text });
  }

  private handleMoveComplete(tile: TilePosition): void {
    if (this.previousPlayerTile) this.follower?.moveTo(this.previousPlayerTile);
    if (this.tileKey(tile) === this.tileKey(LAB_DOOR_TILE)) {
      updatePlayerPosition('LabScene', LAB_ENTRY_TILE);
      fadeToScene(this, 'LabScene');
      return;
    }
    if (this.tileKey(tile) === this.tileKey(FERN_TRAIL_EXIT_TILE)) {
      updatePlayerPosition('FernTrailScene', FERN_TRAIL_ENTRY_TILE);
      fadeToScene(this, 'FernTrailScene');
      return;
    }
    updatePlayerPosition('AmberleafTownScene', tile);
  }

  private canEnterTile(tile: TilePosition): boolean {
    if (tile.x < 0 || tile.y < 0 || tile.x >= MAP_WIDTH || tile.y >= MAP_HEIGHT) return false;
    const terrain = TERRAIN[tile.y][tile.x];
    const blockedTerrain = terrain === 'B' || terrain === 'h' || terrain === 'w' || terrain === 'f' || terrain === 't';
    return !blockedTerrain && !this.npcTiles.has(this.tileKey(tile)) && !this.signTiles.has(this.tileKey(tile));
  }

  private getValidStartTile(candidate: TilePosition): TilePosition { return this.canEnterTile(candidate) ? candidate : START_TILE; }
  private tileKey(tile: TilePosition): string { return `${tile.x},${tile.y}`; }
}
