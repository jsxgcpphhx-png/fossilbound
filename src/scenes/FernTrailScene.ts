import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TILE_SIZE } from '../data/constants';
import { FERN_TRAIL_FIELD_ZONE, type EncounterResult, type EncounterZoneDefinition } from '../data/encounters';
import { loadPlayerState, updatePlayerPosition } from '../data/playerState';
import { EncounterZoneChecker } from '../systems/EncounterZoneChecker';
import { GridMover } from '../systems/GridMover';
import { DebugPanel } from '../ui/DebugPanel';
import { DialogueBox } from '../ui/DialogueBox';
import { PartyMenu } from '../ui/PartyMenu';
import type { Direction, TilePosition } from '../types/grid';

const MAP_WIDTH = GAME_WIDTH / TILE_SIZE;
const MAP_HEIGHT = GAME_HEIGHT / TILE_SIZE;
const START_TILE: TilePosition = { x: 2, y: 7 };
const TOWN_EXIT_TILE: TilePosition = { x: 1, y: 7 };
const TOWN_RETURN_TILE: TilePosition = { x: 18, y: 10 };
const SIGN_TILE: TilePosition = { x: 4, y: 6 };

const TERRAIN = [
  'BBBBBBBBBBBBBBBBBBBB',
  'BggggggggggggggggggB',
  'BggbbbbggggggbbbbggB',
  'BggbbbbggttggbbbbggB',
  'BggggggggttggggggggB',
  'BgggttggggggggttgggB',
  'BggggggggppggggggggB',
  'BppppppppppppppppppB',
  'BggggggggppggggggggB',
  'BggbbbbggggggbbbbggB',
  'BggbbbbggwwggbbbbggB',
  'BggggggggwwggggggggB',
  'BgggttggggggggttgggB',
  'BggggggggggggggggggB',
  'BBBBBBBBBBBBBBBBBBBB'
] as const;

export class FernTrailScene extends Phaser.Scene {
  private player?: GridMover;
  private debugPanel?: DebugPanel;
  private dialogueBox?: DialogueBox;
  private partyMenu?: PartyMenu;
  private encounterChecker?: EncounterZoneChecker;
  private movementKeys?: Record<Direction, Phaser.Input.Keyboard.Key[]>;
  private interactKeys?: Phaser.Input.Keyboard.Key[];
  private partyKeys?: Phaser.Input.Keyboard.Key[];
  private escapeKey?: Phaser.Input.Keyboard.Key;
  private readonly signTiles = new Map<string, { name: string; dialogue: string }>();

  constructor() {
    super('FernTrailScene');
  }

  preload(): void {
    this.createPlaceholderSprites();
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#25351f');
    this.drawMap();
    this.createSigns();
    this.encounterChecker = new EncounterZoneChecker({ zonesByTile: this.createEncounterZones() });

    const savedState = loadPlayerState({ currentMap: 'FernTrailScene', currentPosition: START_TILE });
    const savedStartTile = this.getValidStartTile(
      savedState.currentMap === 'FernTrailScene' ? savedState.currentPosition : START_TILE
    );
    const playerSprite = this.add.sprite(0, 0, 'trail-player').setDepth(5);
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
      } else {
        this.tryReadSign();
      }
      return;
    }

    if (this.dialogueBox.isOpen() || this.partyMenu.isOpen() || this.player.isMoving()) {
      return;
    }

    const direction = this.getPressedDirection();

    if (direction) {
      this.player.tryMove(direction);
    }
  }

  private createPlaceholderSprites(): void {
    const playerCanvas = this.textures.createCanvas('trail-player', TILE_SIZE, TILE_SIZE);
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

        if (tile === 'b') {
          this.add.rectangle(centerX - 6, centerY + 4, 4, 18, 0x386641);
          this.add.rectangle(centerX, centerY + 2, 4, 20, 0x4f7d3a);
          this.add.rectangle(centerX + 7, centerY + 5, 4, 16, 0x6c7f43);
          this.add.rectangle(centerX, centerY + 10, 26, 5, 0x243b2a, 0.28);
        }

        if (tile === 't') {
          this.add.circle(centerX, centerY - 5, 13, 0x2f6f3e);
          this.add.circle(centerX + 6, centerY - 9, 9, 0x386641);
          this.add.rectangle(centerX, centerY + 9, 6, 12, 0x7a4f2b);
        }

        if (tile === 'w') {
          this.add.rectangle(centerX, centerY + 6, TILE_SIZE, 5, 0xffffff, 0.16);
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
      case 'b':
        return 0x4f7d3a;
      case 't':
        return 0x386641;
      case 'w':
        return 0x4f8cad;
      default:
        return 0x739f4f;
    }
  }

  private createSigns(): void {
    const signX = SIGN_TILE.x * TILE_SIZE + TILE_SIZE / 2;
    const signY = SIGN_TILE.y * TILE_SIZE + TILE_SIZE / 2;
    this.add.rectangle(signX, signY - 4, 22, 14, 0x8a6a3d).setDepth(3);
    this.add.rectangle(signX, signY + 8, 5, 16, 0x593928).setDepth(2);
    this.signTiles.set(this.tileKey(SIGN_TILE), {
      name: 'Trail Marker',
      dialogue: 'Fern Trail: fossil brush ahead. Encounter data is temporary scaffolding for future prehistoric wildlife systems.'
    });
  }

  private addLocationLabel(): void {
    const label = this.add.text(320, 46, 'Fern Trail', {
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
    this.interactKeys = [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)];
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

  private tryReadSign(): void {
    if (!this.player || !this.dialogueBox) {
      return;
    }

    const sign = this.signTiles.get(this.tileKey(this.player.getFacingTile()));

    if (sign) {
      this.dialogueBox.show(sign.name, sign.dialogue);
    }
  }

  private handleMoveComplete(tile: TilePosition): void {
    if (this.tileKey(tile) === this.tileKey(TOWN_EXIT_TILE)) {
      updatePlayerPosition('AmberleafTownScene', TOWN_RETURN_TILE);
      this.scene.start('AmberleafTownScene');
      return;
    }

    updatePlayerPosition('FernTrailScene', tile);
    this.tryStartEncounter(tile);
  }

  private tryStartEncounter(tile: TilePosition): void {
    const encounter = this.encounterChecker?.checkStep(tile);

    if (!encounter) {
      return;
    }

    this.scene.start('EncounterScene', {
      encounter,
      returnMap: 'FernTrailScene',
      returnPosition: tile
    });
  }

  private createEncounterZones(): Map<string, EncounterZoneDefinition> {
    const zones = new Map<string, EncounterZoneDefinition>();

    for (let y = 0; y < MAP_HEIGHT; y += 1) {
      for (let x = 0; x < MAP_WIDTH; x += 1) {
        if (TERRAIN[y][x] === 'b') {
          zones.set(this.tileKey({ x, y }), FERN_TRAIL_FIELD_ZONE);
        }
      }
    }

    return zones;
  }

  private canEnterTile(tile: TilePosition): boolean {
    if (tile.x < 0 || tile.y < 0 || tile.x >= MAP_WIDTH || tile.y >= MAP_HEIGHT) {
      return false;
    }

    const terrain = TERRAIN[tile.y][tile.x];
    const blockedTerrain = terrain === 'B' || terrain === 't' || terrain === 'w';

    return !blockedTerrain && !this.signTiles.has(this.tileKey(tile));
  }

  private getValidStartTile(candidate: TilePosition): TilePosition {
    return this.canEnterTile(candidate) ? candidate : START_TILE;
  }

  private tileKey(tile: TilePosition): string {
    return `${tile.x},${tile.y}`;
  }
}
