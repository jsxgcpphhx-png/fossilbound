import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TILE_SIZE } from '../data/constants';
import { getEncounterZoneForTile } from '../data/encounters';
import { loadPlayerState, updatePlayerPosition } from '../data/playerState';
import { EncounterZoneSystem } from '../systems/EncounterZoneSystem';
import { FollowerSprite } from '../systems/FollowerSprite';
import { GridMover } from '../systems/GridMover';
import { DebugPanel } from '../ui/DebugPanel';
import { DialogueBox } from '../ui/DialogueBox';
import { PartyMenu } from '../ui/PartyMenu';
import type { Direction, TilePosition } from '../types/grid';

const MAP_WIDTH = GAME_WIDTH / TILE_SIZE;
const MAP_HEIGHT = GAME_HEIGHT / TILE_SIZE;
const START_TILE: TilePosition = { x: 1, y: 8 };
const TOWN_EXIT_TILE: TilePosition = { x: 0, y: 8 };
const AMBERLEAF_RETURN_TILE: TilePosition = { x: 18, y: 10 };

const TERRAIN = [
  'BBBBBBBBBBBBBBBBBBBB',
  'BggggggggttggggggggB',
  'BggGGGGggttgggrrrggB',
  'BggGGGGgggggggrrrggB',
  'BggggppppppppggggggB',
  'BttggpggggggpggttttB',
  'BttggpGGGGggpggggggB',
  'BggggpGGGGggppppgggB',
  'pggpppgggggggggpggB',
  'BggpgggrrrrggggpggB',
  'Bggpgggrrrrggggpppp',
  'BggpggggggggggggggB',
  'BggppppppppGGGGgggB',
  'BggggggggggGGGGgggB',
  'BBBBBBBBBBBBBBBBBBBB'
] as const;

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

  constructor() {
    super('FernTrailScene');
  }

  preload(): void {
    this.createPlaceholderSprites();
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1d3122');
    this.drawMap();
    this.addTrailSigns();

    const savedState = loadPlayerState({ currentMap: 'FernTrailScene', currentPosition: START_TILE });
    const savedStartTile = this.getValidStartTile(
      savedState.currentMap === 'FernTrailScene' ? savedState.currentPosition : START_TILE
    );
    const playerSprite = this.add.sprite(0, 0, 'player').setDepth(5);
    this.player = new GridMover({
      sprite: playerSprite,
      startTile: savedStartTile,
      canEnterTile: (tile) => this.canEnterTile(tile),
      onMoveComplete: (tile) => this.handleMoveComplete(tile)
    });

    this.encounterZones = new EncounterZoneSystem({
      random: {
        frac: () => Math.random(),
        between: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
      },
      onEncounter: (encounter) => {
        if (!this.player) {
          return;
        }

        updatePlayerPosition('FernTrailScene', this.player.currentTile);
        this.scene.start('BattleScene', { ...encounter, returnPosition: this.player.currentTile });
      }
    });
    this.follower = FollowerSprite.shouldCreate() ? new FollowerSprite(this, savedStartTile) : undefined;
    this.debugPanel = new DebugPanel(this);
    this.dialogueBox = new DialogueBox(this);
    this.partyMenu = new PartyMenu(this, {
      currentMap: 'FernTrailScene',
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
      } else {
        this.dialogueBox.show(
          'Fern Trail',
          'The fossil brush rustles with placeholder encounter zones. Full battles and capture rules are not implemented yet.'
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

        if (tile === 'G') {
          this.add.rectangle(centerX - 8, centerY + 5, 4, 18, 0x4f7a36).setRotation(-0.3);
          this.add.rectangle(centerX, centerY + 3, 5, 22, 0x6c8f43).setRotation(0.25);
          this.add.rectangle(centerX + 8, centerY + 5, 4, 17, 0xaebf7a).setRotation(0.4);
        }

        if (tile === 'r') {
          this.add.circle(centerX - 6, centerY + 3, 5, 0x8a6a3d);
          this.add.circle(centerX + 6, centerY + 2, 5, 0xd99c3b);
          this.add.rectangle(centerX, centerY - 6, 22, 4, 0xaebf7a).setRotation(-0.2);
        }

        if (tile === 't') {
          this.add.circle(centerX, centerY - 5, 13, 0x2f6f3e);
          this.add.circle(centerX + 6, centerY - 9, 9, 0x386641);
          this.add.rectangle(centerX, centerY + 9, 6, 12, 0x7a4f2b);
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
      case 'G':
        return 0x5f8a3c;
      case 'r':
        return 0x7f8f42;
      case 't':
        return 0x386641;
      default:
        return 0x6f9a4b;
    }
  }

  private addTrailSigns(): void {
    this.add.text(30, 252, 'Amberleaf', {
      backgroundColor: 'rgba(23, 37, 29, 0.78)',
      color: '#f8f3df',
      fontFamily: 'monospace',
      fontSize: '11px',
      padding: { x: 4, y: 2 }
    }).setDepth(6);
    this.add.text(460, 320, 'Fossil Brush\n(test encounters)', {
      align: 'center',
      backgroundColor: 'rgba(23, 37, 29, 0.78)',
      color: '#f0c878',
      fontFamily: 'monospace',
      fontSize: '11px',
      padding: { x: 4, y: 2 }
    }).setDepth(6);
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

  private handleMoveComplete(tile: TilePosition): void {
    if (this.previousPlayerTile) {
      this.follower?.moveTo(this.previousPlayerTile);
    }
    if (this.tileKey(tile) === this.tileKey(TOWN_EXIT_TILE)) {
      updatePlayerPosition('AmberleafTownScene', AMBERLEAF_RETURN_TILE);
      this.scene.start('AmberleafTownScene');
      return;
    }

    updatePlayerPosition('FernTrailScene', tile);
    this.encounterZones?.checkStep(getEncounterZoneForTile(TERRAIN[tile.y][tile.x]));
  }

  private canEnterTile(tile: TilePosition): boolean {
    if (tile.x < 0 || tile.y < 0 || tile.x >= MAP_WIDTH || tile.y >= MAP_HEIGHT) {
      return false;
    }

    const terrain = TERRAIN[tile.y][tile.x];
    return terrain !== 'B' && terrain !== 't';
  }

  private getValidStartTile(candidate: TilePosition): TilePosition {
    return this.canEnterTile(candidate) ? candidate : START_TILE;
  }

  private tileKey(tile: TilePosition): string {
    return `${tile.x},${tile.y}`;
  }
}
