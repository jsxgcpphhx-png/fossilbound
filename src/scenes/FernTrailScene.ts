import Phaser from 'phaser';
import { TILE_SIZE } from '../data/constants';
import { getEncounterZoneForTile } from '../data/encounters';
import { loadPlayerState, updatePlayerPosition } from '../data/playerState';
import { EncounterZoneSystem } from '../systems/EncounterZoneSystem';
import { FollowerSprite } from '../systems/FollowerSprite';
import { GridMover } from '../systems/GridMover';
import { addFixedLocationLabel, configureOverworldCamera, fadeToScene, tileCenter } from '../systems/OverworldCamera';
import { createOverworldCharacterTextures } from '../systems/PixelPlaceholderSprites';
import { DebugPanel } from '../ui/DebugPanel';
import { DialogueBox } from '../ui/DialogueBox';
import { PartyMenu } from '../ui/PartyMenu';
import type { Direction, TilePosition } from '../types/grid';

const START_TILE: TilePosition = { x: 1, y: 12 };
const TOWN_EXIT_TILE: TilePosition = { x: 0, y: 12 };
const AMBERLEAF_RETURN_TILE: TilePosition = { x: 36, y: 12 };
const MOSSBANK_EXIT_TILE: TilePosition = { x: 39, y: 12 };
const MOSSBANK_ENTRY_TILE: TilePosition = { x: 1, y: 12 };

const TERRAIN = [
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
  'BtttggggggggggggttttggggggmmmmmBBBBBBBBB',
  'BttggGGGGggggggggttttgggggmmwwwBBBwwwBBB',
  'BtgggGGGGgtttggggggggggggmmwwwwBBBwwwBBB',
  'BgggggggggtttggGGGGGGgggggmmmmmBBBmmmBBB',
  'BgggggpppppppppGGGGGGggggggmmmBBBBmmmBBB',
  'BggggpggggggggpppppgggRRRgggggBBBBgggBBB',
  'BttggpggGGGGggggggpgggRRRggwwwBBBBwwwBBB',
  'BttggpggGGGGggggggpgggggggwwwwBBBBwwwBBB',
  'BggggpgggggggttgggpggggmmmmwwwBBBBwwwBBB',
  'BgggpppppppggttgggpppppmmmmmmmBBBBmmmBBB',
  'BgggpgggggppppppppppggppppppppBBBBpppppp',
  'pggppggGGggggggGGgggggmmmmmmmmpppppppppp',
  'BggpggGGGGgggrrGGGGggggmmwwwmmBBBBwwwBBB',
  'BggpgggggggggrrrrggggggmmwwwmmBBBBmmmBBB',
  'BggpppppggggggggggggppppmmmmmBBBBBmmmBBB',
  'BggggggpggtttggggggpgggggRRRggBBBBRRgBBB',
  'BttgggggggtttggggggggggggRRRgtBBBBRRtBBB',
  'BttttgggggggggggggggggggggggttBBBBtttBBB',
  'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
] as const;

const MAP_WIDTH = TERRAIN[0].length;
const MAP_HEIGHT = TERRAIN.length;

export class FernTrailScene extends Phaser.Scene {
  private player?: GridMover;
  private debugPanel?: DebugPanel;
  private dialogueBox?: DialogueBox;
  private partyMenu?: PartyMenu;
  private follower?: FollowerSprite;
  private previousPlayerTile?: TilePosition;
  private encounterZones?: EncounterZoneSystem;
  private movementKeys?: Record<Direction, Phaser.Input.Keyboard.Key[]>;
  private interactKeys?: Phaser.Input.Keyboard.Key[];
  private partyKeys?: Phaser.Input.Keyboard.Key[];
  private escapeKey?: Phaser.Input.Keyboard.Key;
  private signTiles = new Map<string, { title: string; text: string }>();

  constructor() { super('FernTrailScene'); }

  preload(): void { createOverworldCharacterTextures(this); }

  create(): void {
    this.cameras.main.setBackgroundColor('#1d3122');
    this.signTiles.clear();
    this.drawMap();
    this.addTrailSigns();

    const savedState = loadPlayerState({ currentMap: 'FernTrailScene', currentPosition: START_TILE });
    const savedStartTile = this.getValidStartTile(savedState.currentMap === 'FernTrailScene' ? savedState.currentPosition : START_TILE);
    const playerSprite = this.add.sprite(0, 0, 'player').setDepth(10);
    this.player = new GridMover({
      sprite: playerSprite,
      startTile: savedStartTile,
      canEnterTile: (tile) => this.canEnterTile(tile),
      onMoveComplete: (tile) => this.handleMoveComplete(tile)
    });
    this.follower = FollowerSprite.shouldCreate() ? new FollowerSprite(this, savedStartTile) : undefined;
    configureOverworldCamera(this, { mapWidth: MAP_WIDTH, mapHeight: MAP_HEIGHT, target: this.player.gameObject, zoom: 1.32 });

    this.encounterZones = new EncounterZoneSystem({
      random: { frac: () => Math.random(), between: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min },
      onEncounter: (encounter) => {
        if (!this.player) return;
        updatePlayerPosition('FernTrailScene', this.player.currentTile);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start('BattleScene', { ...encounter, returnPosition: this.player?.currentTile ?? START_TILE });
        });
        this.cameras.main.fadeOut(180, 23, 37, 29);
      }
    });
    this.debugPanel = new DebugPanel(this);
    this.dialogueBox = new DialogueBox(this);
    this.partyMenu = new PartyMenu(this, {
      currentMap: 'FernTrailScene',
      getCurrentPosition: () => this.player?.currentTile ?? savedStartTile,
      onTravelToIslandBase: () => {
        this.dialogueBox?.show('Quetzalcoatlus', 'Quetzalcoatlus carries you toward your island base.');
        fadeToScene(this, 'IslandBaseScene');
      }
    });
    this.registerControls();
    addFixedLocationLabel(this, 'Fern Trail');
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
      else if (!this.tryReadSign()) this.dialogueBox.show('Fern Trail', 'The road bends from Amberleaf grassland into wetter fern beds. Encounter, battle, and capture values remain temporary scaffolding.');
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
        if (tile === 'p') this.drawPathTexture(centerX, centerY);
        if (tile === 'G') this.drawFernBed(centerX, centerY);
        if (tile === 'r') this.drawAmberBrush(centerX, centerY);
        if (tile === 'R') this.drawReeds(centerX, centerY);
        if (tile === 't') this.drawTree(centerX, centerY);
        if (tile === 'm') this.drawMarshGrass(centerX, centerY);
        if (tile === 'w') this.drawWater(centerX, centerY);
      }
    }
  }

  private getTileColor(tile: string): number {
    switch (tile) {
      case 'B': return 0x243b2a;
      case 'p': return 0xd6ad6a;
      case 'G': return 0x5f8a3c;
      case 'r': return 0x7f8f42;
      case 'R': return 0x6c8f43;
      case 'm': return 0x5f8a5e;
      case 'w': return 0x4f8cad;
      case 't': return 0x386641;
      default: return 0x6f9a4b;
    }
  }

  private addTrailSigns(): void {
    this.registerSign({ x: 5, y: 11 }, 'Fern Trail', 'Fern Trail links Amberleaf Town to the wetter Mossbank boardwalk. Watch for brush movement in the tall ferns.');
    this.registerSign({ x: 34, y: 13 }, 'Mossbank Wetlands', 'Mossbank Village is east. Follow the planks where the ground turns soft and waterlogged.');
    [{ x: 14, y: 12 }, { x: 24, y: 11 }].forEach(({ x, y }) => this.drawSign(x, y));
    [{ x: 7, y: 9 }, { x: 17, y: 15 }, { x: 26, y: 8 }, { x: 30, y: 15 }].forEach(({ x, y }) => this.drawRock(x, y));
  }

  private drawPathTexture(x: number, y: number): void {
    this.add.ellipse(x - 8, y + 2, 10, 5, 0xc18c52, 0.30).setDepth(2);
    this.add.ellipse(x + 9, y - 5, 9, 4, 0xf0c878, 0.18).setDepth(2);
  }
  private drawFernBed(x: number, y: number): void {
    this.add.rectangle(x - 8, y + 5, 4, 18, 0x4f7a36).setRotation(-0.3).setDepth(4);
    this.add.rectangle(x, y + 3, 5, 22, 0x6c8f43).setRotation(0.25).setDepth(4);
    this.add.rectangle(x + 8, y + 5, 4, 17, 0xaebf7a).setRotation(0.4).setDepth(4);
  }
  private drawAmberBrush(x: number, y: number): void {
    this.add.circle(x - 6, y + 3, 5, 0x8a6a3d).setDepth(4);
    this.add.circle(x + 6, y + 2, 5, 0xd99c3b).setDepth(4);
    this.add.rectangle(x, y - 6, 22, 4, 0xaebf7a).setRotation(-0.2).setDepth(4);
  }
  private drawReeds(x: number, y: number): void {
    this.add.rectangle(x - 7, y + 4, 3, 13, 0x6c8f43).setRotation(-0.24).setDepth(4);
    this.add.rectangle(x + 7, y + 2, 3, 12, 0xaebf7a).setRotation(0.22).setDepth(4);
  }
  private drawMarshGrass(x: number, y: number): void {
    this.add.ellipse(x, y + 7, 22, 5, 0x355d3c, 0.2).setDepth(3);
    this.drawReeds(x, y);
  }
  private drawWater(x: number, y: number): void {
    this.add.rectangle(x, y - 12, TILE_SIZE, 3, 0x9dd7c6, 0.25).setDepth(2);
    this.add.ellipse(x + 2, y + 3, 18, 5, 0x8cc9d8, 0.35).setDepth(2);
  }
  private drawTree(x: number, y: number): void {
    this.add.circle(x, y - 5, 13, 0x2f6f3e).setDepth(5);
    this.add.circle(x + 6, y - 9, 9, 0x386641).setDepth(6);
    this.add.rectangle(x, y + 9, 6, 12, 0x7a4f2b).setDepth(4);
  }
  private drawSign(tileX: number, tileY: number): void {
    const { x, y } = tileCenter({ x: tileX, y: tileY });
    this.add.rectangle(x, y + 7, 4, 12, 0x6f4b2f).setDepth(4);
    this.add.rectangle(x, y, 22, 10, 0xb4874d).setDepth(5).setStrokeStyle(1, 0x593928);
  }
  private drawRock(tileX: number, tileY: number): void {
    const { x, y } = tileCenter({ x: tileX, y: tileY });
    this.add.circle(x - 4, y + 5, 5, 0x6f6f5f).setDepth(4);
    this.add.circle(x + 4, y + 4, 6, 0x8f8f78).setDepth(4);
  }

  private registerControls(): void {
    const keyboard = this.input.keyboard; if (!keyboard) return;
    this.movementKeys = {
      up: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)],
      down: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)],
      left: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)],
      right: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)]
    };
    this.interactKeys = [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)];
    this.partyKeys = [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P)];
    this.escapeKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }
  private getPressedDirection(): Direction | undefined {
    const keyboard = this.input.keyboard; if (!keyboard || !this.movementKeys) return undefined;
    return (['up', 'down', 'left', 'right'] as Direction[]).find((direction) => this.movementKeys?.[direction].some((key) => keyboard.checkDown(key, 110)));
  }
  private isInteractPressed(): boolean { return this.interactKeys?.some((key) => Phaser.Input.Keyboard.JustDown(key)) ?? false; }
  private isPartyMenuPressed(): boolean { return this.partyKeys?.some((key) => Phaser.Input.Keyboard.JustDown(key)) ?? false; }
  private isEscapePressed(): boolean { return this.escapeKey ? Phaser.Input.Keyboard.JustDown(this.escapeKey) : false; }
  private tryReadSign(): boolean { if (!this.player || !this.dialogueBox) return false; const sign = this.signTiles.get(this.tileKey(this.player.getFacingTile())); if (!sign) return false; this.dialogueBox.show(sign.title, sign.text); return true; }
  private registerSign(tile: TilePosition, title: string, text: string): void { this.drawSign(tile.x, tile.y); this.signTiles.set(this.tileKey(tile), { title, text }); }

  private handleMoveComplete(tile: TilePosition): void {
    if (this.previousPlayerTile) this.follower?.moveTo(this.previousPlayerTile);
    if (this.tileKey(tile) === this.tileKey(TOWN_EXIT_TILE)) {
      updatePlayerPosition('AmberleafTownScene', AMBERLEAF_RETURN_TILE);
      fadeToScene(this, 'AmberleafTownScene');
      return;
    }
    if (this.tileKey(tile) === this.tileKey(MOSSBANK_EXIT_TILE)) {
      updatePlayerPosition('MossbankVillageScene', MOSSBANK_ENTRY_TILE);
      fadeToScene(this, 'MossbankVillageScene');
      return;
    }
    updatePlayerPosition('FernTrailScene', tile);
    this.encounterZones?.checkStep(getEncounterZoneForTile(TERRAIN[tile.y][tile.x]));
  }

  private canEnterTile(tile: TilePosition): boolean {
    if (tile.x < 0 || tile.y < 0 || tile.x >= MAP_WIDTH || tile.y >= MAP_HEIGHT) return false;
    const terrain = TERRAIN[tile.y][tile.x];
    return terrain !== 'B' && terrain !== 't' && terrain !== 'w' && !this.signTiles.has(this.tileKey(tile));
  }
  private getValidStartTile(candidate: TilePosition): TilePosition { return this.canEnterTile(candidate) ? candidate : START_TILE; }
  private tileKey(tile: TilePosition): string { return `${tile.x},${tile.y}`; }
}
