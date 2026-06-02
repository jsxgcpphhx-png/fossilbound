import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TILE_SIZE } from '../data/constants';
import { PLACEHOLDER_SELECTION_CREATURES } from '../data/creatureSelection';
import { loadPlayerState, selectCreature, updatePlayerPosition } from '../data/playerState';
import { GridMover } from '../systems/GridMover';
import { DebugPanel } from '../ui/DebugPanel';
import { DialogueBox } from '../ui/DialogueBox';
import { CreatureSelectionPanel } from '../ui/CreatureSelectionPanel';
import { PartyMenu } from '../ui/PartyMenu';
import type { Direction, TilePosition } from '../types/grid';

const MAP_WIDTH = GAME_WIDTH / TILE_SIZE;
const MAP_HEIGHT = GAME_HEIGHT / TILE_SIZE;
const START_TILE: TilePosition = { x: 9, y: 12 };
const EXIT_TILE: TilePosition = { x: 9, y: 13 };
const TOWN_RETURN_TILE: TilePosition = { x: 7, y: 6 };
const SELECTION_TABLE_TILE: TilePosition = { x: 9, y: 5 };
const DR_SABLE_TILE: TilePosition = { x: 12, y: 6 };

const TERRAIN = [
  'BBBBBBBBBBBBBBBBBBBB',
  'BffffffffffffffffffB',
  'BfggggggggggggggggfB',
  'BfggggggggggggggggfB',
  'BfgggfffggggfffgggfB',
  'BfgggfffttttfffgggfB',
  'BfggggggggggggggggfB',
  'BfggggppppppggggggfB',
  'BfggggppppppggggggfB',
  'BfggggggggggggggggfB',
  'BfgggggffffgggggggfB',
  'BfggggggggggggggggfB',
  'BfggggggppggggggggfB',
  'BfggggggppggggggggfB',
  'BBBBBBBBBBBBBBBBBBBB'
] as const;

export class LabScene extends Phaser.Scene {
  private player?: GridMover;
  private debugPanel?: DebugPanel;
  private dialogueBox?: DialogueBox;
  private partyMenu?: PartyMenu;
  private selectionPanel?: CreatureSelectionPanel;
  private movementKeys?: Record<Direction, Phaser.Input.Keyboard.Key[]>;
  private interactKeys?: Phaser.Input.Keyboard.Key[];
  private partyKeys?: Phaser.Input.Keyboard.Key[];
  private escapeKey?: Phaser.Input.Keyboard.Key;
  private npcTiles = new Map<string, { name: string; dialogue: string }>();

  constructor() {
    super('LabScene');
  }

  preload(): void {
    this.createPlaceholderSprites();
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#273527');
    this.drawMap();
    this.createLabDetails();

    const savedState = loadPlayerState({ currentMap: 'LabScene', currentPosition: START_TILE });
    const savedStartTile = this.getValidStartTile(savedState.currentMap === 'LabScene' ? savedState.currentPosition : START_TILE);
    const playerSprite = this.add.sprite(0, 0, 'lab-player').setDepth(5);
    this.player = new GridMover({
      sprite: playerSprite,
      startTile: savedStartTile,
      canEnterTile: (tile) => this.canEnterTile(tile),
      onMoveComplete: (tile) => this.handleMoveComplete(tile)
    });

    this.debugPanel = new DebugPanel(this);
    this.dialogueBox = new DialogueBox(this);
    this.partyMenu = new PartyMenu(this);
    this.selectionPanel = new CreatureSelectionPanel(this, {
      creatures: PLACEHOLDER_SELECTION_CREATURES,
      onChoose: (creature) => {
        selectCreature(creature.id);
        this.selectionPanel?.hide();
        this.dialogueBox?.show('Lab Terminal', `${creature.displayName} was saved to your placeholder party data.`);
      }
    });
    this.registerControls();
    this.addLocationLabel();
  }

  update(): void {
    if (!this.player || !this.debugPanel || !this.dialogueBox || !this.partyMenu || !this.selectionPanel) {
      return;
    }

    this.debugPanel.update(this.player.currentTile);

    if (this.selectionPanel.isOpen()) {
      this.handleSelectionControls();
      return;
    }

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
      } else if (!this.tryUseSelectionTable()) {
        this.tryTalkToNpc();
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
    const playerCanvas = this.textures.createCanvas('lab-player', TILE_SIZE, TILE_SIZE);
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

    const sableCanvas = this.textures.createCanvas('lab-dr-sable', TILE_SIZE, TILE_SIZE);
    const sableContext = sableCanvas?.getContext();

    if (sableCanvas && sableContext) {
      sableContext.fillStyle = '#00000033';
      sableContext.fillRect(6, 28, 20, 4);
      sableContext.fillStyle = '#3c2f2f';
      sableContext.fillRect(8, 5, 16, 8);
      sableContext.fillStyle = '#d6aa78';
      sableContext.fillRect(10, 8, 12, 10);
      sableContext.fillStyle = '#f8f3df';
      sableContext.fillRect(7, 17, 18, 13);
      sableContext.fillStyle = '#6c7f43';
      sableContext.fillRect(13, 19, 6, 9);
      sableContext.fillStyle = '#d99c3b';
      sableContext.fillRect(21, 19, 3, 8);
      sableCanvas.refresh();
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

        if (tile === 'f') {
          this.add.rectangle(centerX, centerY, 26, 24, 0x7a4f2b, 0.55);
          this.add.rectangle(centerX, centerY - 8, 24, 4, 0xb4874d, 0.85);
        }

        if (tile === 't') {
          this.add.rectangle(centerX, centerY, 30, 20, 0x8a6a3d);
          this.add.rectangle(centerX, centerY - 5, 24, 4, 0xd99c3b);
        }
      }
    }
  }

  private getTileColor(tile: string): number {
    switch (tile) {
      case 'B':
        return 0x243b2a;
      case 'f':
        return 0x3f543c;
      case 'p':
        return 0xd6ad6a;
      case 't':
        return 0x80613b;
      default:
        return 0x6c7f43;
    }
  }

  private createLabDetails(): void {
    this.add.rectangle(320, 86, 330, 28, 0xf0c878, 0.55).setDepth(2);
    this.add.text(178, 76, 'Amberleaf Research Lab', {
      color: '#2d4632',
      fontFamily: 'monospace',
      fontSize: '16px',
      fontStyle: 'bold'
    }).setDepth(3);
    this.add.text(238, 190, 'Specimen Table', {
      backgroundColor: 'rgba(23, 37, 29, 0.78)',
      color: '#f8f3df',
      fontFamily: 'monospace',
      fontSize: '11px',
      padding: { x: 4, y: 2 }
    }).setDepth(6);
    this.add.text(254, 424, 'Exit', {
      backgroundColor: 'rgba(23, 37, 29, 0.78)',
      color: '#f8f3df',
      fontFamily: 'monospace',
      fontSize: '11px',
      padding: { x: 4, y: 2 }
    }).setDepth(6);

    this.add.sprite(
      DR_SABLE_TILE.x * TILE_SIZE + TILE_SIZE / 2,
      DR_SABLE_TILE.y * TILE_SIZE + TILE_SIZE / 2,
      'lab-dr-sable'
    ).setDepth(4);
    this.npcTiles.set(this.tileKey(DR_SABLE_TILE), {
      name: 'Dr. Sable',
      dialogue: 'The lab selection terminal is only a placeholder. It saves party data, but it does not define final creatures, types, stats, moves, or battles.'
    });
  }

  private addLocationLabel(): void {
    const label = this.add.text(320, 46, 'Amberleaf Research Lab', {
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
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    ];
    this.partyKeys = [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P)];
    this.escapeKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  private handleSelectionControls(): void {
    if (!this.selectionPanel) {
      return;
    }

    if (this.isEscapePressed()) {
      this.selectionPanel.hide();
      return;
    }

    if (this.isSelectionPreviousPressed()) {
      this.selectionPanel.moveSelection(-1);
      return;
    }

    if (this.isSelectionNextPressed()) {
      this.selectionPanel.moveSelection(1);
      return;
    }

    if (this.isInteractPressed()) {
      this.selectionPanel.chooseSelected();
    }
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

  private isSelectionPreviousPressed(): boolean {
    return Boolean(
      this.movementKeys?.left.some((key) => Phaser.Input.Keyboard.JustDown(key)) ||
        this.movementKeys?.up.some((key) => Phaser.Input.Keyboard.JustDown(key))
    );
  }

  private isSelectionNextPressed(): boolean {
    return Boolean(
      this.movementKeys?.right.some((key) => Phaser.Input.Keyboard.JustDown(key)) ||
        this.movementKeys?.down.some((key) => Phaser.Input.Keyboard.JustDown(key))
    );
  }

  private tryUseSelectionTable(): boolean {
    if (!this.player || !this.selectionPanel) {
      return false;
    }

    if (this.tileKey(this.player.getFacingTile()) !== this.tileKey(SELECTION_TABLE_TILE)) {
      return false;
    }

    this.selectionPanel.show();
    return true;
  }

  private tryTalkToNpc(): void {
    if (!this.player || !this.dialogueBox) {
      return;
    }

    const npc = this.npcTiles.get(this.tileKey(this.player.getFacingTile()));

    if (npc) {
      this.dialogueBox.show(npc.name, npc.dialogue);
    }
  }

  private handleMoveComplete(tile: TilePosition): void {
    if (this.tileKey(tile) === this.tileKey(EXIT_TILE)) {
      updatePlayerPosition('AmberleafTownScene', TOWN_RETURN_TILE);
      this.scene.start('AmberleafTownScene');
      return;
    }

    updatePlayerPosition('LabScene', tile);
  }

  private canEnterTile(tile: TilePosition): boolean {
    if (tile.x < 0 || tile.y < 0 || tile.x >= MAP_WIDTH || tile.y >= MAP_HEIGHT) {
      return false;
    }

    const terrain = TERRAIN[tile.y][tile.x];
    const blockedTerrain = terrain === 'B' || terrain === 'f' || terrain === 't';

    return !blockedTerrain && !this.npcTiles.has(this.tileKey(tile));
  }

  private getValidStartTile(candidate: TilePosition): TilePosition {
    return this.canEnterTile(candidate) ? candidate : START_TILE;
  }

  private tileKey(tile: TilePosition): string {
    return `${tile.x},${tile.y}`;
  }
}
