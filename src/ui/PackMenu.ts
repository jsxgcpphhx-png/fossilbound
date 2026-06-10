import Phaser from 'phaser';
import {
  getInventoryCategoryLabel,
  getInventoryEntries,
  getInventoryUseMessage,
  useInventoryItem,
  type InventoryEntry,
  type InventoryItemCategory
} from '../data/inventory';
import { loadPlayerState, savePlayerState } from '../data/playerState';
import { registerFixedUiObject } from '../systems/OverworldCamera';
import { drawUiPanel, paginateText, panelTextStyle, truncateText, UI_COLORS, UI_HEX, wrapUiText } from './theme';

interface PackMenuOptions {
  context?: 'field' | 'menu';
}

const CATEGORY_ORDER: InventoryItemCategory[] = ['capture-tool', 'research-tool', 'healing', 'field-use', 'key-item'];

export class PackMenu {
  private readonly scene: Phaser.Scene;
  private readonly options: Required<PackMenuOptions>;
  private readonly group: Phaser.GameObjects.Group;
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly categoryText: Phaser.GameObjects.Text;
  private readonly itemText: Phaser.GameObjects.Text;
  private readonly detailText: Phaser.GameObjects.Text;
  private readonly promptText: Phaser.GameObjects.Text;
  private open = false;
  private categoryIndex = 0;
  private itemIndex = 0;
  private detailPageIndex = 0;
  private statusLine = 'Choose an item to inspect temporary Field Pack behavior.';
  private controlKeys?: {
    up: Phaser.Input.Keyboard.Key[];
    down: Phaser.Input.Keyboard.Key[];
    left: Phaser.Input.Keyboard.Key[];
    right: Phaser.Input.Keyboard.Key[];
    confirm: Phaser.Input.Keyboard.Key[];
    back: Phaser.Input.Keyboard.Key[];
  };

  constructor(scene: Phaser.Scene, options: PackMenuOptions = {}) {
    this.scene = scene;
    this.options = { context: options.context ?? 'field' };

    const backdrop = drawUiPanel(scene, { x: 320, y: 240, width: 592, height: 392, depth: 24, fill: UI_HEX.parchment, stroke: UI_HEX.leaf });
    const categoryPanel = drawUiPanel(scene, { x: 146, y: 244, width: 174, height: 266, depth: 24, fill: UI_HEX.parchmentDark, stroke: UI_HEX.amber, alpha: 0.78 });
    const itemPanel = drawUiPanel(scene, { x: 336, y: 244, width: 190, height: 266, depth: 24, fill: UI_HEX.parchmentDark, stroke: UI_HEX.amber, alpha: 0.78 });
    const detailPanel = drawUiPanel(scene, { x: 502, y: 244, width: 130, height: 266, depth: 24, fill: UI_HEX.parchmentDark, stroke: UI_HEX.amber, alpha: 0.78 });

    this.titleText = registerFixedUiObject(scene, scene.add.text(48, 54, 'Field Pack', panelTextStyle({
      color: UI_COLORS.leaf,
      fontSize: '25px',
      fontStyle: 'bold'
    })).setDepth(25).setScrollFactor(0));
    this.categoryText = registerFixedUiObject(scene, scene.add.text(64, 98, '', panelTextStyle({
      color: UI_COLORS.ink,
      fontSize: '12px',
      lineSpacing: 7,
      wordWrap: { width: 154, useAdvancedWrap: true }
    })).setDepth(25).setScrollFactor(0));
    this.itemText = registerFixedUiObject(scene, scene.add.text(250, 98, '', panelTextStyle({
      color: UI_COLORS.ink,
      fontSize: '12px',
      lineSpacing: 6,
      wordWrap: { width: 170, useAdvancedWrap: true }
    })).setDepth(25).setScrollFactor(0));
    this.detailText = registerFixedUiObject(scene, scene.add.text(444, 98, '', panelTextStyle({
      color: UI_COLORS.ink,
      fontSize: '10px',
      lineSpacing: 5,
      wordWrap: { width: 120, useAdvancedWrap: true }
    })).setDepth(25).setScrollFactor(0));
    this.promptText = registerFixedUiObject(scene, scene.add.text(48, 418, '', panelTextStyle({
      color: UI_COLORS.moss,
      fontSize: '12px'
    })).setDepth(25).setScrollFactor(0));

    this.group = scene.add.group([backdrop, categoryPanel, itemPanel, detailPanel, this.titleText, this.categoryText, this.itemText, this.detailText, this.promptText]);
    this.registerControls();
    this.hide();
  }

  toggle(): void {
    if (this.open) this.hide();
    else this.show();
  }

  show(): void {
    this.open = true;
    this.group.setVisible(true);
    this.clampSelection();
    this.render();
    console.debug('[PackMenu] opened', { context: this.options.context });
  }

  hide(): void {
    this.open = false;
    this.group.setVisible(false);
  }

  isOpen(): boolean {
    return this.open;
  }

  update(): void {
    if (!this.open || !this.controlKeys) return;

    if (this.wasPressed(this.controlKeys.back)) {
      this.hide();
      return;
    }

    if (this.wasPressed(this.controlKeys.left)) {
      this.categoryIndex = wrapIndex(this.categoryIndex - 1, CATEGORY_ORDER.length);
      this.itemIndex = 0;
      this.detailPageIndex = 0;
      this.statusLine = 'Category changed.';
      this.render();
      return;
    }

    if (this.wasPressed(this.controlKeys.right)) {
      this.categoryIndex = wrapIndex(this.categoryIndex + 1, CATEGORY_ORDER.length);
      this.itemIndex = 0;
      this.detailPageIndex = 0;
      this.statusLine = 'Category changed.';
      this.render();
      return;
    }

    const entries = this.getCurrentEntries();
    if (this.wasPressed(this.controlKeys.up)) {
      this.itemIndex = entries.length > 0 ? wrapIndex(this.itemIndex - 1, entries.length) : 0;
      this.detailPageIndex = 0;
      this.render();
      return;
    }

    if (this.wasPressed(this.controlKeys.down)) {
      this.itemIndex = entries.length > 0 ? wrapIndex(this.itemIndex + 1, entries.length) : 0;
      this.detailPageIndex = 0;
      this.render();
      return;
    }

    if (this.wasPressed(this.controlKeys.confirm)) {
      this.selectCurrentItem();
    }
  }

  private render(): void {
    this.clampSelection();
    const entries = this.getCurrentEntries();
    const selectedItem = entries[this.itemIndex];
    const categories = CATEGORY_ORDER.map((category, index) => {
      const marker = index === this.categoryIndex ? '▶' : ' ';
      const count = this.getEntriesForCategory(category).length;
      return `${marker} ${getInventoryCategoryLabel(category)} (${count})`;
    });
    const itemLines = entries.length > 0
      ? entries.map((entry, index) => `${index === this.itemIndex ? '▶' : ' '} ${truncateText(entry.displayName, 15)} x${entry.quantity}`)
      : ['  No entries here.'];
    const detailPages = this.getDetailPages(selectedItem);

    this.titleText.setText(`${this.options.context === 'field' ? 'Field Pack' : 'Pack'} · ${loadPlayerState().playerName}`);
    this.categoryText.setText(['Categories', '', ...categories].join('\n'));
    this.itemText.setText(['Items', '', ...itemLines].join('\n'));
    this.detailText.setText(detailPages[this.detailPageIndex] ?? 'No item selected.');
    this.promptText.setText('←/→ category · ↑/↓ item · Enter/Space use/inspect · Esc/Backspace close · ' + this.statusLine);
  }

  private selectCurrentItem(): void {
    const item = this.getCurrentEntries()[this.itemIndex];

    if (!item) {
      this.statusLine = 'No item in this category.';
      this.render();
      return;
    }

    const state = loadPlayerState();
    const result = useInventoryItem(item.id, this.options.context, state.inventory);
    if (result.consumed) {
      savePlayerState({ ...state, inventory: result.inventory });
    }
    this.statusLine = result.message;
    this.detailPageIndex = 0;
    this.render();
  }

  private getDetailPages(item?: InventoryEntry): string[] {
    if (!item) return ['No item selected.\n\nEmpty categories are safe and do not affect movement or saves.'];

    const details = [
      item.displayName,
      `${getInventoryCategoryLabel(item.category)} · quantity ${item.quantity}`,
      '',
      ...wrapUiText(item.description, 21),
      '',
      getInventoryUseMessage(item, this.options.context),
      '',
      'Placeholder only: final balance, economy, and item effects are not implemented.'
    ].join('\n');

    return paginateText(details, 24, 16);
  }

  private getCurrentEntries(): InventoryEntry[] {
    return this.getEntriesForCategory(CATEGORY_ORDER[this.categoryIndex]);
  }

  private getEntriesForCategory(category: InventoryItemCategory): InventoryEntry[] {
    return getInventoryEntries(loadPlayerState().inventory).filter((entry) => entry.category === category);
  }

  private clampSelection(): void {
    this.categoryIndex = clamp(this.categoryIndex, 0, CATEGORY_ORDER.length - 1);
    const maxIndex = Math.max(0, this.getCurrentEntries().length - 1);
    this.itemIndex = clamp(this.itemIndex, 0, maxIndex);
    this.detailPageIndex = 0;
  }

  private registerControls(): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;

    this.controlKeys = {
      up: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)],
      down: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)],
      left: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)],
      right: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)],
      confirm: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)],
      back: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE)]
    };
  }

  private wasPressed(keys: Phaser.Input.Keyboard.Key[]): boolean {
    return keys.some((key) => Phaser.Input.Keyboard.JustDown(key));
  }
}

function wrapIndex(index: number, length: number): number {
  return ((index % length) + length) % length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
