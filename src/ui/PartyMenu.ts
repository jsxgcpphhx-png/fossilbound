import Phaser from 'phaser';
import { getInventoryCategoryLabel, getInventoryEntries } from '../data/inventory';
import {
  getCreatureByInstanceId,
  getKnownDinosaurName,
  getTravelTeamSlots,
  loadPlayerState,
  swapTravelTeamSlots,
  travelToIslandBase,
  TRAVEL_TEAM_SLOT_IDS,
  type MapId,
  type TravelTeamSlotId
} from '../data/playerState';
import type { TilePosition } from '../types/grid';

interface PartyMenuOptions {
  currentMap?: Exclude<MapId, 'IslandBaseScene'>;
  getCurrentPosition?: () => TilePosition;
  onTravelToIslandBase?: () => void;
}

export class PartyMenu {
  private readonly scene: Phaser.Scene;
  private readonly options: PartyMenuOptions;
  private readonly group: Phaser.GameObjects.Group;
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly promptText: Phaser.GameObjects.Text;
  private open = false;
  private selectedSlotIndex = 0;
  private controlKeys?: {
    up: Phaser.Input.Keyboard.Key[];
    down: Phaser.Input.Keyboard.Key[];
    swapLeft: Phaser.Input.Keyboard.Key[];
    swapRight: Phaser.Input.Keyboard.Key[];
    travel: Phaser.Input.Keyboard.Key[];
  };

  constructor(scene: Phaser.Scene, options: PartyMenuOptions = {}) {
    this.scene = scene;
    this.options = options;
    const backdrop = scene.add.rectangle(320, 240, 590, 390, 0xf8f3df, 0.98).setStrokeStyle(4, 0x2d4632).setDepth(20);
    this.titleText = scene.add.text(48, 54, 'Travel Team', {
      color: '#2d4632',
      fontFamily: 'monospace',
      fontSize: '26px',
      fontStyle: 'bold'
    }).setDepth(21);
    this.bodyText = scene.add.text(48, 94, '', {
      color: '#17251d',
      fontFamily: 'monospace',
      fontSize: '14px',
      lineSpacing: 5,
      wordWrap: { width: 542 }
    }).setDepth(21);
    this.promptText = scene.add.text(48, 420, '↑/↓ select · ←/→ swap slot · Q Island Base · P/Esc close', {
      color: '#6c7f43',
      fontFamily: 'monospace',
      fontSize: '14px'
    }).setDepth(21);

    this.group = scene.add.group([backdrop, this.titleText, this.bodyText, this.promptText]);
    this.registerControls();
    this.hide();
  }

  toggle(): void {
    if (this.open) {
      this.hide();
    } else {
      this.show();
    }
  }

  show(): void {
    this.open = true;
    this.group.setVisible(true);
    this.render();
  }

  hide(): void {
    this.open = false;
    this.group.setVisible(false);
  }

  isOpen(): boolean {
    return this.open;
  }

  update(): void {
    if (!this.open || !this.controlKeys) {
      return;
    }

    if (this.wasPressed(this.controlKeys.up)) {
      this.selectedSlotIndex = wrapIndex(this.selectedSlotIndex - 1, TRAVEL_TEAM_SLOT_IDS.length);
      this.render();
    }

    if (this.wasPressed(this.controlKeys.down)) {
      this.selectedSlotIndex = wrapIndex(this.selectedSlotIndex + 1, TRAVEL_TEAM_SLOT_IDS.length);
      this.render();
    }

    if (this.wasPressed(this.controlKeys.swapLeft)) {
      this.swapSelectedSlot(-1);
    }

    if (this.wasPressed(this.controlKeys.swapRight)) {
      this.swapSelectedSlot(1);
    }

    if (this.wasPressed(this.controlKeys.travel)) {
      this.travelToIslandBase();
    }
  }

  private render(): void {
    const state = loadPlayerState();
    const slotLines = getTravelTeamSlots(state).map((slot, index) => {
      const creature = getCreatureByInstanceId(state, slot.creatureId);
      const creatureName = creature ? getKnownDinosaurName(creature.dinosaurId) : 'empty';
      const marker = index === this.selectedSlotIndex ? '▶' : ' ';
      return `${marker} ${slot.label}: ${creatureName}\n   ${slot.description}`;
    });
    const inventoryLines = getInventoryEntries(state.inventory)
      .map((item) => `${item.displayName} x${item.quantity} (${getInventoryCategoryLabel(item.category)})`)
      .join('\n');

    this.bodyText.setText([
      `Researcher: ${state.playerName}`,
      '',
      ...slotLines,
      '',
      `Island Storage count: ${state.islandStorageCreatureIds.length}`,
      '',
      'Lead = primary battle creature.',
      'Follow = visible overworld companion.',
      'Carrier = backup creatures carried by Quetzalcoatlus.',
      'Island Base = storage for non-traveling creatures.',
      '',
      'Field Pack:',
      inventoryLines || 'No Field Pack entries found.',
      '',
      `Owned placeholder creatures: ${state.ownedCreatures.length} · Story flags: ${Object.keys(state.storyFlags).length}`
    ].join('\n'));
  }

  private swapSelectedSlot(offset: -1 | 1): void {
    const currentSlotId = TRAVEL_TEAM_SLOT_IDS[this.selectedSlotIndex];
    const otherIndex = wrapIndex(this.selectedSlotIndex + offset, TRAVEL_TEAM_SLOT_IDS.length);
    const otherSlotId = TRAVEL_TEAM_SLOT_IDS[otherIndex];

    swapTravelTeamSlots(currentSlotId, otherSlotId);
    this.selectedSlotIndex = otherIndex;
    this.render();
  }

  private travelToIslandBase(): void {
    const sceneKey = this.options.currentMap;

    if (!sceneKey || !isTravelReturnMap(sceneKey)) {
      return;
    }

    const returnPosition = this.options.getCurrentPosition?.() ?? loadPlayerState().currentPosition;
    travelToIslandBase(sceneKey, returnPosition);
    this.hide();
    this.options.onTravelToIslandBase?.();
  }

  private registerControls(): void {
    const keyboard = this.scene.input.keyboard;

    if (!keyboard) {
      return;
    }

    this.controlKeys = {
      up: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)],
      down: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)],
      swapLeft: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)],
      swapRight: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)],
      travel: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q)]
    };
  }

  private wasPressed(keys: Phaser.Input.Keyboard.Key[]): boolean {
    return keys.some((key) => Phaser.Input.Keyboard.JustDown(key));
  }
}

function isTravelReturnMap(mapId: MapId): mapId is Exclude<MapId, 'IslandBaseScene'> {
  return mapId === 'AmberleafTownScene' || mapId === 'LabScene' || mapId === 'FernTrailScene' || mapId === 'MossbankVillageScene';
}

function wrapIndex(index: number, length: number): number {
  return ((index % length) + length) % length;
}
