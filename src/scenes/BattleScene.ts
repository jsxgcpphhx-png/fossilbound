import Phaser from 'phaser';
import {
  type BattleAction,
  type BattleCreatureInstance,
  type BattleMenuState,
  type BattleMessageQueue,
  type BattleParticipant,
  type BattleParticipantRole,
  type PlaceholderHpStatusDisplay
} from '../data/battle/battleModel';
import { TEMPORARY_BATTLE_ACTIONS } from '../data/battle/temporaryBattleActions';
import { TEMPORARY_BATTLE_CONFIG } from '../data/battle/temporaryBattleConfig';
import { getTemporaryStatusLabel } from '../data/battle/temporaryBattleStatuses';
import { TEMPORARY_MOVE_LIKE_ENTRIES } from '../data/battle/temporaryMoveLikeEntries';
import { EARLY_GAME_DINOSAURS, type DinosaurDefinition } from '../data/dinosaurs';
import type { EncounterPreview } from '../data/encounters';
import { getInventoryCategoryLabel, getInventoryEntries, type InventoryEntry } from '../data/inventory';
import { addTemporaryDebugCreatureToParty, getKnownDinosaurName, loadPlayerState, updatePlayerPosition } from '../data/playerState';
import type { TilePosition } from '../types/grid';

type MainBattleMenuOption = 'Observe' | 'Actions' | 'Field Pack' | 'Flee';

const MAIN_MENU_OPTIONS: MainBattleMenuOption[] = ['Observe', 'Actions', 'Field Pack', 'Flee'];

interface BattleSceneData extends EncounterPreview {
  returnPosition?: TilePosition;
}

// Milestone 6 developer note:
// This scene consumes temporary, data-driven battle and inventory scaffolding. It
// intentionally avoids final damage, turn order, capture formulas, type
// mechanics, stats, item balance, economy, and acquisition rules. Field Pack
// entries only route to placeholder text so future capture/research/healing/key
// item systems can replace these hooks without rewriting the UI.
export class BattleScene extends Phaser.Scene {
  private encounter?: BattleSceneData;
  private participants?: { player: BattleParticipant; wild: BattleParticipant };
  private menuState: BattleMenuState = { mode: 'main', selectedIndex: 0 };
  private menuTexts: Phaser.GameObjects.Text[] = [];
  private panelObjects: Phaser.GameObjects.GameObject[] = [];
  private messageText?: Phaser.GameObjects.Text;
  private messageQueue: BattleMessageQueue = { pendingLines: [] };
  private menuKeys?: Phaser.Input.Keyboard.Key[];
  private actionKeys?: Phaser.Input.Keyboard.Key[];

  constructor() {
    super('BattleScene');
  }

  init(data: BattleSceneData): void {
    this.encounter = data;
    this.participants = undefined;
    this.menuState = { mode: 'main', selectedIndex: 0 };
    this.menuTexts = [];
    this.panelObjects = [];
    this.messageText = undefined;
    this.messageQueue = { pendingLines: [...TEMPORARY_BATTLE_CONFIG.openingMessages] };
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#17251d');

    if (!this.encounter) {
      this.scene.start('FernTrailScene');
      return;
    }

    this.participants = {
      wild: this.createWildParticipant(this.encounter),
      player: this.createPlayerParticipant()
    };

    this.drawBackground();
    this.drawActorArea(this.participants.wild, 456, 134, true);
    this.drawActorArea(this.participants.player, 164, 276, false);
    this.drawStatusBox(this.participants.wild.creature, 46, 54);
    this.drawStatusBox(this.participants.player.creature, 360, 232);
    this.drawMessageAndMenu();
    this.showNextMessage();
    this.registerControls();
  }

  update(): void {
    if (!this.menuKeys || !this.actionKeys) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.menuKeys[0]) || Phaser.Input.Keyboard.JustDown(this.menuKeys[2])) {
      this.changeSelection(-1);
    }

    if (Phaser.Input.Keyboard.JustDown(this.menuKeys[1]) || Phaser.Input.Keyboard.JustDown(this.menuKeys[3])) {
      this.changeSelection(1);
    }

    if (Phaser.Input.Keyboard.JustDown(this.actionKeys[0])) {
      this.confirmOrAdvanceMessage();
    }

    if (Phaser.Input.Keyboard.JustDown(this.actionKeys[1])) {
      this.flee();
    }

    if (Phaser.Input.Keyboard.JustDown(this.actionKeys[2])) {
      this.backOrFlee();
    }

    if (Phaser.Input.Keyboard.JustDown(this.actionKeys[3])) {
      this.openObservePanel();
    }

    if (Phaser.Input.Keyboard.JustDown(this.actionKeys[4])) {
      this.openActionsPanel();
    }

    if (Phaser.Input.Keyboard.JustDown(this.actionKeys[5])) {
      this.openFieldPackPanel();
    }
  }

  private createWildParticipant(encounter: BattleSceneData): BattleParticipant {
    const dinosaur = this.getDinosaur(encounter.dinosaurId);

    return {
      participantId: 'wild-encounter',
      role: 'wild',
      label: encounter.zoneLabel,
      creature: this.createCreatureInstance({
        role: 'wild',
        instanceId: `wild-${encounter.dinosaurId}`,
        dinosaur,
        fallbackName: encounter.creatureName || TEMPORARY_BATTLE_CONFIG.defaultWildCreatureName,
        fallbackSpritePath: encounter.spritePath,
        placeholderHpStatus: TEMPORARY_BATTLE_CONFIG.placeholderHp.wild
      })
    };
  }

  private createPlayerParticipant(): BattleParticipant {
    const state = loadPlayerState();
    const selectedPartyCreature = state.partyCreatures.find((creature) => creature.dinosaurId === state.selectedCreatureId)
      ?? state.partyCreatures[0];
    const dinosaur = selectedPartyCreature ? this.getDinosaur(selectedPartyCreature.dinosaurId) : undefined;
    const fallbackName = state.selectedCreatureId
      ? getKnownDinosaurName(state.selectedCreatureId)
      : TEMPORARY_BATTLE_CONFIG.defaultPlayerCreatureName;

    return {
      participantId: 'player-party-lead',
      role: 'player',
      label: 'Field Team',
      creature: this.createCreatureInstance({
        role: 'player',
        instanceId: selectedPartyCreature?.instanceId ?? 'player-placeholder-creature',
        dinosaur,
        fallbackName,
        placeholderHpStatus: TEMPORARY_BATTLE_CONFIG.placeholderHp.player
      })
    };
  }

  private createCreatureInstance(options: {
    role: BattleParticipantRole;
    instanceId: string;
    dinosaur?: DinosaurDefinition;
    fallbackName: string;
    fallbackSpritePath?: string;
    placeholderHpStatus: PlaceholderHpStatusDisplay;
  }): BattleCreatureInstance {
    return {
      instanceId: options.instanceId,
      dinosaurId: options.dinosaur?.id,
      displayName: options.dinosaur?.displayName ?? options.fallbackName,
      spritePath: options.dinosaur?.battleSpritePath ?? options.fallbackSpritePath,
      description: options.dinosaur?.shortDescription ?? `${options.role} placeholder creature data will be expanded later.`,
      artNotes: options.dinosaur?.spriteGenerationNotes,
      placeholderHpStatus: { ...options.placeholderHpStatus }
    };
  }

  private drawBackground(): void {
    this.add.rectangle(320, 240, 640, 480, 0x17251d);
    this.add.rectangle(320, 178, 640, 356, 0x35522f);
    this.add.rectangle(320, 350, 640, 104, 0x5f7f43, 0.88);
    this.add.rectangle(320, 352, 640, 42, 0x2d4632, 0.22);
    this.add.circle(124, 326, 92, 0xc7a765, 0.32);
    this.add.circle(464, 202, 76, 0xc7a765, 0.22);
    this.add.text(320, 24, 'Battle Shell — temporary data scaffolding only', {
      align: 'center',
      color: '#f8f3df',
      fontFamily: 'monospace',
      fontSize: '16px'
    }).setOrigin(0.5);
  }

  private drawActorArea(participant: BattleParticipant, x: number, y: number, mirrored: boolean): void {
    this.add.rectangle(x, y + 74, 210, 30, 0x000000, 0.16);
    this.drawPlaceholderCreature(participant, x, y, mirrored);
    this.add.text(x, y + 116, participant.creature.spritePath ? `sprite: ${participant.creature.spritePath}` : 'placeholder silhouette', {
      align: 'center',
      color: '#d6ad6a',
      fontFamily: 'monospace',
      fontSize: '10px',
      wordWrap: { width: 220 }
    }).setOrigin(0.5);
  }

  private drawPlaceholderCreature(participant: BattleParticipant, x: number, y: number, mirrored: boolean): void {
    const bodyColor = participant.role === 'wild' ? 0x243126 : 0x2d4632;
    const accentColor = participant.role === 'wild' ? 0xf0c878 : 0xd99c3b;
    const direction = mirrored ? -1 : 1;
    const hasCrest = participant.creature.dinosaurId === 'parasaurolophus' || participant.creature.dinosaurId === 'pteranodon';
    const hasArmor = participant.creature.dinosaurId === 'triceratops' || participant.creature.dinosaurId === 'ankylosaurus';

    this.add.circle(x - 42 * direction, y - 2, 34, bodyColor);
    this.add.rectangle(x, y + 8, 94, 62, bodyColor);
    this.add.circle(x + 76 * direction, y - 24, 28, bodyColor);
    this.add.rectangle(x + 111 * direction, y - 24, 44, 18, bodyColor).setRotation(0.15 * direction);
    this.add.rectangle(x - 86 * direction, y + 2, 74, 18, bodyColor).setRotation(-0.18 * direction);
    this.add.rectangle(x - 34 * direction, y + 48, 14, 48, bodyColor).setRotation(0.08 * direction);
    this.add.rectangle(x + 32 * direction, y + 48, 14, 48, bodyColor).setRotation(-0.08 * direction);
    this.add.circle(x + 92 * direction, y - 30, 3, accentColor);

    if (hasCrest) {
      this.add.rectangle(x + 56 * direction, y - 54, 72, 16, accentColor, 0.68).setRotation(-0.32 * direction);
    }

    if (hasArmor) {
      this.add.circle(x + 76 * direction, y - 34, 42, accentColor, 0.28);
      this.add.rectangle(x - 4 * direction, y - 28, 78, 12, accentColor, 0.42);
    }
  }

  private drawStatusBox(creature: BattleCreatureInstance, x: number, y: number): void {
    const hpStatus = creature.placeholderHpStatus;
    const statusLabel = getTemporaryStatusLabel(hpStatus.statusLabelId);
    const hpRatio = hpStatus.maxHp > 0 ? Math.max(0, Math.min(1, hpStatus.currentHp / hpStatus.maxHp)) : 0;

    this.add.rectangle(x + 112, y + 42, 224, 90, 0xf8f3df, 0.96).setStrokeStyle(4, 0x2d4632);
    this.add.text(x + 20, y + 12, creature.displayName, {
      color: '#17251d',
      fontFamily: 'monospace',
      fontSize: '18px',
      fontStyle: 'bold'
    });
    this.add.text(x + 20, y + 36, hpStatus.note, {
      color: '#6f4b2f',
      fontFamily: 'monospace',
      fontSize: '12px'
    });
    this.add.rectangle(x + 112, y + 64, 160, 12, 0x2d4632, 0.28);
    this.add.rectangle(x + 35 + 77 * hpRatio, y + 64, 154 * hpRatio, 7, 0x6c7f43, 0.75);
    this.add.text(x + 20, y + 73, `${hpStatus.currentHp}/${hpStatus.maxHp} HP · ${statusLabel.displayText}`, {
      color: '#6c7f43',
      fontFamily: 'monospace',
      fontSize: '10px'
    });
  }

  private drawMessageAndMenu(): void {
    this.add.rectangle(320, 426, 612, 118, 0xf8f3df, 0.98).setStrokeStyle(5, 0x2d4632);
    this.messageText = this.add.text(38, 384, '', {
      color: '#17251d',
      fontFamily: 'monospace',
      fontSize: '18px',
      lineSpacing: 6,
      wordWrap: { width: 352 }
    });
    this.add.text(38, 456, 'Controls: arrows choose · Enter confirm/next · Esc back/flee · F flee · O/A/P shortcuts', {
      color: '#6c7f43',
      fontFamily: 'monospace',
      fontSize: '11px'
    });
    this.add.rectangle(504, 426, 198, 88, 0xefe2bf, 0.96).setStrokeStyle(3, 0x6f4b2f);

    this.menuTexts = Array.from({ length: 8 }, (_, index) => this.add.text(424 + (index % 2) * 96, 394 + Math.floor(index / 2) * 22, '', {
      color: '#2d4632',
      fontFamily: 'monospace',
      fontSize: '11px',
      fontStyle: 'bold'
    }));
    this.updateMenuLabels();
  }

  private registerControls(): void {
    this.menuKeys = [
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)
    ];
    this.actionKeys = [
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F),
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.O),
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P)
    ];
  }

  private changeSelection(delta: number): void {
    const optionCount = this.getCurrentOptionCount();

    if (optionCount <= 0) {
      return;
    }

    this.menuState = {
      ...this.menuState,
      selectedIndex: (this.menuState.selectedIndex + delta + optionCount) % optionCount
    };
    this.updateMenuLabels();
  }

  private updateMenuLabels(): void {
    const options = this.getCurrentMenuLabels();

    this.menuTexts.forEach((text, index) => {
      const option = options[index];

      if (!option) {
        text.setText('');
        return;
      }

      const marker = index === this.menuState.selectedIndex ? '▶ ' : '  ';
      text.setText(`${marker}${option}`);
    });
  }

  private getCurrentOptionCount(): number {
    return this.getCurrentMenuLabels().length;
  }

  private getCurrentMenuLabels(): string[] {
    if (this.menuState.mode === 'actions') {
      return TEMPORARY_BATTLE_ACTIONS.map((action) => action.label);
    }

    if (this.menuState.mode === 'observe') {
      return ['Back'];
    }

    if (this.menuState.mode === 'field-pack') {
      return this.getFieldPackMenuLabels();
    }

    return MAIN_MENU_OPTIONS;
  }

  private confirmOrAdvanceMessage(): void {
    if (this.hasPendingMessages()) {
      this.showNextMessage();
      return;
    }

    this.chooseSelectedOption();
  }

  private chooseSelectedOption(): void {
    if (this.menuState.mode === 'actions') {
      const selectedAction = TEMPORARY_BATTLE_ACTIONS[this.menuState.selectedIndex];

      if (selectedAction) {
        this.selectTemporaryAction(selectedAction);
      }
      return;
    }

    if (this.menuState.mode === 'observe') {
      this.openMainMenu();
      return;
    }

    if (this.menuState.mode === 'field-pack') {
      this.chooseFieldPackOption();
      return;
    }

    const selectedOption = MAIN_MENU_OPTIONS[this.menuState.selectedIndex];

    if (selectedOption === 'Flee') {
      this.flee();
      return;
    }

    if (selectedOption === 'Observe') {
      this.openObservePanel();
      return;
    }

    if (selectedOption === 'Actions') {
      this.openActionsPanel();
      return;
    }

    this.openFieldPackPanel();
  }

  private openMainMenu(): void {
    this.menuState = { mode: 'main', selectedIndex: 0 };
    this.clearPanel();
    this.updateMenuLabels();
  }

  private openObservePanel(): void {
    const wildCreature = this.participants?.wild.creature;

    this.menuState = { mode: 'observe', selectedIndex: 0 };
    this.drawPanel('Observe', [
      wildCreature?.displayName ?? TEMPORARY_BATTLE_CONFIG.defaultWildCreatureName,
      wildCreature?.description ?? 'Temporary field notes are unavailable for this placeholder creature.',
      wildCreature?.artNotes ? `Art notes: ${wildCreature.artNotes}` : 'Art notes: not available yet.'
    ]);
    this.queueMessages([
      `Observe: ${wildCreature?.displayName ?? 'creature'} field notes opened.`,
      'These notes come from temporary dinosaur description/art data when available.'
    ]);
    this.updateMenuLabels();
  }

  private openActionsPanel(): void {
    this.menuState = { mode: 'actions', selectedIndex: 0 };
    this.drawPanel('Actions', TEMPORARY_BATTLE_ACTIONS.map((action) => {
      const linkedMove = TEMPORARY_MOVE_LIKE_ENTRIES.find((entry) => entry.id === action.linkedMoveLikeEntryId);
      return `${action.label}: ${linkedMove?.intent ?? action.summary}`;
    }));
    this.queueMessages([
      'Actions placeholder opened.',
      'Choose a temporary entry to test menu flow only.'
    ]);
    this.updateMenuLabels();
  }

  private openFieldPackPanel(): void {
    const fieldPackEntries = this.getFieldPackEntries();

    this.menuState = { mode: 'field-pack', selectedIndex: 0 };
    this.drawPanel(TEMPORARY_BATTLE_CONFIG.fieldPackTitle, [
      ...fieldPackEntries.map((entry) => `${getInventoryCategoryLabel(entry.category)} · ${entry.displayName} x${entry.quantity}`),
      'DEV SCAFFOLD ONLY · Debug Add Creature is not final capture.'
    ]);
    this.queueMessages(TEMPORARY_BATTLE_CONFIG.fieldPackLines);
    this.updateMenuLabels();
  }

  private getFieldPackEntries(): InventoryEntry[] {
    return getInventoryEntries(loadPlayerState().inventory);
  }

  private getFieldPackMenuLabels(): string[] {
    return [
      ...this.getFieldPackEntries().map((entry) => `${entry.displayName} x${entry.quantity}`),
      'DEV: Add Creature',
      'Back'
    ];
  }

  private chooseFieldPackOption(): void {
    const entries = this.getFieldPackEntries();
    const selectedIndex = this.menuState.selectedIndex;

    if (selectedIndex < entries.length) {
      this.useTemporaryFieldPackItem(entries[selectedIndex]);
      return;
    }

    if (selectedIndex === entries.length) {
      this.debugAddCreatureFromEncounter();
      return;
    }

    this.openMainMenu();
  }

  private useTemporaryFieldPackItem(item: InventoryEntry): void {
    const wildCreature = this.participants?.wild.creature;

    switch (item.temporaryEffectType) {
      case 'temporary-survey-notes':
        this.drawPanel(item.displayName, [
          item.description,
          wildCreature?.displayName ?? TEMPORARY_BATTLE_CONFIG.defaultWildCreatureName,
          wildCreature?.description ?? 'Additional creature notes are not available for this placeholder encounter.',
          wildCreature?.artNotes ? `Additional notes: ${wildCreature.artNotes}` : 'Additional creature notes are not available yet.'
        ]);
        this.queueMessages(['Survey Lens displayed additional creature notes if available.']);
        return;
      case 'temporary-healing-placeholder':
        this.drawTemporaryItemMessage(item, 'Healing is not implemented yet');
        return;
      case 'temporary-field-recovery-placeholder':
        this.drawTemporaryItemMessage(item, 'Field recovery is not implemented yet');
        return;
      case 'temporary-key-item-placeholder':
        this.drawTemporaryItemMessage(item, 'This key item is not used here');
        return;
      case 'temporary-creature-acquisition':
        this.drawTemporaryItemMessage(item, 'Creature acquisition rules are not finalized yet');
        return;
    }
  }

  private drawTemporaryItemMessage(item: InventoryEntry, useText: string): void {
    this.drawPanel(item.displayName, [
      `${getInventoryCategoryLabel(item.category)} · quantity ${item.quantity}`,
      item.description,
      useText,
      'Temporary Field Pack behavior only; no final item rules, balance, economy, or capture logic.'
    ]);
    this.queueMessages([useText]);
  }

  private debugAddCreatureFromEncounter(): void {
    const dinosaurId = this.participants?.wild.creature.dinosaurId;

    if (!dinosaurId) {
      this.drawPanel('DEV: Add Creature', [
        'DEV SCAFFOLD ONLY — not final capture.',
        'The current placeholder encounter has no dinosaur id to add.'
      ]);
      this.queueMessages(['Debug add creature scaffold could not find a current wild creature.']);
      return;
    }

    const result = addTemporaryDebugCreatureToParty(dinosaurId);
    this.drawPanel('DEV: Add Creature', [
      'DEV SCAFFOLD ONLY — not final capture.',
      result.message,
      'Final acquisition rules, storage, bonding, capture tools, probabilities, and progression will be designed later.'
    ]);
    this.queueMessages([result.message]);
  }

  private selectTemporaryAction(action: BattleAction): void {
    const linkedMove = TEMPORARY_MOVE_LIKE_ENTRIES.find((entry) => entry.id === action.linkedMoveLikeEntryId);

    this.drawPanel(action.label, [
      action.summary,
      linkedMove ? `Linked temporary move-like entry: ${linkedMove.label}.` : 'No linked move-like entry.',
      linkedMove?.developerNote ?? 'Future real battle data will replace this placeholder.'
    ]);
    this.queueMessages(action.messageLines);
  }

  private drawPanel(title: string, lines: string[]): void {
    this.clearPanel();
    this.panelObjects.push(this.add.rectangle(320, 176, 560, 210, 0xf8f3df, 0.96).setStrokeStyle(4, 0x6f4b2f));
    this.panelObjects.push(this.add.text(66, 88, title, {
      color: '#17251d',
      fontFamily: 'monospace',
      fontSize: '18px',
      fontStyle: 'bold'
    }));
    this.panelObjects.push(this.add.text(66, 120, lines.join('\n\n'), {
      color: '#2d4632',
      fontFamily: 'monospace',
      fontSize: '12px',
      lineSpacing: 5,
      wordWrap: { width: 508 }
    }));
  }

  private clearPanel(): void {
    this.panelObjects.forEach((gameObject) => gameObject.destroy());
    this.panelObjects = [];
  }

  private queueMessages(lines: string[]): void {
    this.messageQueue = { pendingLines: [...lines] };
    this.showNextMessage();
  }

  private showNextMessage(): void {
    const nextLine = this.messageQueue.pendingLines.shift();

    if (!nextLine) {
      return;
    }

    this.messageQueue.activeLine = nextLine;
    this.messageText?.setText(nextLine);
  }

  private hasPendingMessages(): boolean {
    return this.messageQueue.pendingLines.length > 0;
  }

  private backOrFlee(): void {
    if (this.menuState.mode !== 'main') {
      this.openMainMenu();
      return;
    }

    this.flee();
  }

  private flee(): void {
    if (this.encounter?.returnPosition) {
      updatePlayerPosition('FernTrailScene', this.encounter.returnPosition);
    }

    this.scene.start(this.encounter?.returnScene ?? 'FernTrailScene');
  }

  private getDinosaur(dinosaurId?: string): DinosaurDefinition | undefined {
    return EARLY_GAME_DINOSAURS.find((dinosaur) => dinosaur.id === dinosaurId);
  }
}
