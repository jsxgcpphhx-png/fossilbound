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
import { addTemporaryDebugCreatureToParty, getCreatureByInstanceId, getKnownDinosaurName, loadPlayerState, updatePlayerPosition } from '../data/playerState';
import type { TilePosition } from '../types/grid';
import { wrapText } from '../ui/DialogueBox';

type MainBattleMenuOption = 'Observe' | 'Actions' | 'Field Pack' | 'Flee';

interface ActionHazard {
  shape: Phaser.GameObjects.GameObject;
  velocityX: number;
  velocityY: number;
  radius: number;
}

interface ActionPhaseState {
  action: BattleAction;
  panel: Phaser.Geom.Rectangle;
  player: Phaser.GameObjects.Rectangle;
  hazards: ActionHazard[];
  startedAt: number;
  lastSpawnAt: number;
  hit: boolean;
  timeText: Phaser.GameObjects.Text;
}

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
  private messageContinueText?: Phaser.GameObjects.Text;
  private messageQueue: BattleMessageQueue = { pendingLines: [] };
  private activeMessagePages: string[] = [];
  private activeMessagePageIndex = 0;
  private actionPhase?: ActionPhaseState;
  private menuKeys?: Phaser.Input.Keyboard.Key[];
  private actionKeys?: Phaser.Input.Keyboard.Key[];
  private phaseKeys?: Record<'left' | 'right' | 'up' | 'down', Phaser.Input.Keyboard.Key[]>;

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
    this.messageContinueText = undefined;
    this.messageQueue = { pendingLines: [...TEMPORARY_BATTLE_CONFIG.openingMessages] };
    this.activeMessagePages = [];
    this.activeMessagePageIndex = 0;
    this.actionPhase = undefined;
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

  update(time: number, delta: number): void {
    if (this.actionPhase) {
      this.updateActionPhase(time, delta);
      return;
    }

    if (!this.menuKeys || !this.actionKeys) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.menuKeys[0]) || Phaser.Input.Keyboard.JustDown(this.menuKeys[2])) {
      this.changeSelection(-1);
    }

    if (Phaser.Input.Keyboard.JustDown(this.menuKeys[1]) || Phaser.Input.Keyboard.JustDown(this.menuKeys[3])) {
      this.changeSelection(1);
    }

    if (Phaser.Input.Keyboard.JustDown(this.actionKeys[0]) || Phaser.Input.Keyboard.JustDown(this.actionKeys[6])) {
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
    const leadCreature = getCreatureByInstanceId(state, state.leadCreatureId);
    const dinosaur = leadCreature ? this.getDinosaur(leadCreature.dinosaurId) : undefined;
    const fallbackName = leadCreature
      ? getKnownDinosaurName(leadCreature.dinosaurId)
      : TEMPORARY_BATTLE_CONFIG.defaultPlayerCreatureName;

    return {
      participantId: 'player-party-lead',
      role: 'player',
      label: 'Field Team',
      creature: this.createCreatureInstance({
        role: 'player',
        instanceId: leadCreature?.instanceId ?? 'player-placeholder-creature',
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
    this.add.rectangle(320, 178, 570, 260, 0x243b2a, 0.28).setStrokeStyle(2, 0x6c7f43, 0.28);
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
    const midColor = participant.role === 'wild' ? 0x314634 : 0x3f5f41;
    const accentColor = participant.role === 'wild' ? 0xf0c878 : 0xd99c3b;
    const direction = mirrored ? -1 : 1;
    const dinosaurId = participant.creature.dinosaurId;
    const hasCrest = dinosaurId === 'parasaurolophus' || dinosaurId === 'pteranodon';
    const hasArmor = dinosaurId === 'triceratops' || dinosaurId === 'ankylosaurus';
    const hasSail = dinosaurId === 'spinosaurus';
    const isFlier = dinosaurId === 'pteranodon';

    this.add.ellipse(x, y + 74, 210, 30, 0x000000, 0.16);

    if (isFlier) {
      this.add.triangle(x - 18 * direction, y + 8, 0, 24, 118, -34, 102, 18, bodyColor);
      this.add.triangle(x + 18 * direction, y + 8, 0, 24, -118, -34, -102, 18, bodyColor);
      this.add.ellipse(x, y + 10, 58, 22, midColor);
      this.add.rectangle(x + 42 * direction, y - 8, 54, 12, bodyColor).setRotation(-0.16 * direction);
      this.add.triangle(x + 78 * direction, y - 12, 0, 0, 42 * direction, -12, 20 * direction, 10, accentColor);
      this.add.circle(x + 66 * direction, y - 10, 3, accentColor);
      return;
    }

    this.add.ellipse(x - 22 * direction, y + 12, 116, 58, bodyColor);
    this.add.ellipse(x - 18 * direction, y + 3, 92, 34, midColor, 0.64);
    this.add.ellipse(x + 62 * direction, y - 16, 50, 34, bodyColor);
    this.add.rectangle(x + 96 * direction, y - 18, 52, 14, bodyColor).setRotation(0.14 * direction);
    this.add.triangle(x - 88 * direction, y + 10, 0, 0, -64 * direction, -12, -58 * direction, 16, bodyColor);
    this.add.rectangle(x - 34 * direction, y + 42, 14, 44, bodyColor).setRotation(0.08 * direction);
    this.add.rectangle(x + 30 * direction, y + 42, 14, 44, bodyColor).setRotation(-0.08 * direction);
    this.add.rectangle(x - 38 * direction, y + 62, 28, 8, bodyColor).setRotation(-0.1 * direction);
    this.add.rectangle(x + 36 * direction, y + 62, 28, 8, bodyColor).setRotation(0.1 * direction);
    this.add.circle(x + 78 * direction, y - 20, 3, accentColor);

    if (hasCrest) {
      this.add.triangle(x + 50 * direction, y - 35, 0, 0, 48 * direction, -22, 30 * direction, 10, accentColor, 0.76);
    }

    if (hasArmor) {
      this.add.ellipse(x + 64 * direction, y - 26, 62, 42, accentColor, 0.24);
      for (let offset = -46; offset <= 28; offset += 18) {
        this.add.triangle(x + offset * direction, y - 26, 0, 0, 8 * direction, -14, 16 * direction, 0, accentColor, 0.48);
      }
    }

    if (hasSail) {
      this.add.triangle(x - 10 * direction, y - 28, 0, 32, 28 * direction, -38, 58 * direction, 32, accentColor, 0.5);
    }
  }

  private drawStatusBox(creature: BattleCreatureInstance, x: number, y: number): void {
    const hpStatus = creature.placeholderHpStatus;
    const statusLabel = getTemporaryStatusLabel(hpStatus.statusLabelId);
    const hpRatio = hpStatus.maxHp > 0 ? Math.max(0, Math.min(1, hpStatus.currentHp / hpStatus.maxHp)) : 0;

    this.add.rectangle(x + 112, y + 42, 230, 94, 0xf8f3df, 0.97).setStrokeStyle(4, 0x2d4632);
    this.add.rectangle(x + 112, y + 42, 214, 78, 0xefe2bf, 0.35).setStrokeStyle(1, 0xd6ad6a, 0.5);
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
    this.add.text(x + 20, y + 56, 'TEMP HP', {
      color: '#6f4b2f',
      fontFamily: 'monospace',
      fontSize: '9px',
      fontStyle: 'bold'
    });
    this.add.rectangle(x + 112, y + 64, 160, 13, 0x2d4632, 0.3);
    this.add.rectangle(x + 35 + 77 * hpRatio, y + 64, 154 * hpRatio, 8, 0x6c7f43, 0.82);
    this.add.text(x + 20, y + 73, `${hpStatus.currentHp}/${hpStatus.maxHp} HP · ${statusLabel.displayText}`, {
      color: '#6c7f43',
      fontFamily: 'monospace',
      fontSize: '10px'
    });
  }

  private drawMessageAndMenu(): void {
    this.add.rectangle(320, 426, 612, 118, 0xf8f3df, 0.98).setStrokeStyle(5, 0x2d4632);
    this.add.rectangle(214, 426, 366, 88, 0xefe2bf, 0.72).setStrokeStyle(2, 0xd99c3b, 0.42);
    this.messageText = this.add.text(38, 384, '', {
      color: '#17251d',
      fontFamily: 'monospace',
      fontSize: '18px',
      lineSpacing: 6,
      wordWrap: { width: 352, useAdvancedWrap: true }
    });
    this.messageContinueText = this.add.text(380, 432, '▼', {
      color: '#d99c3b',
      fontFamily: 'monospace',
      fontSize: '18px',
      fontStyle: 'bold'
    });
    this.add.text(38, 456, 'Controls: arrows choose · Space/Enter confirm · Esc back · F flee · O/A/P shortcuts', {
      color: '#6c7f43',
      fontFamily: 'monospace',
      fontSize: '11px'
    });
    this.add.rectangle(504, 426, 198, 88, 0xefe2bf, 0.96).setStrokeStyle(3, 0x6f4b2f);
    this.add.text(424, 376, 'Menu', {
      color: '#6f4b2f',
      fontFamily: 'monospace',
      fontSize: '11px',
      fontStyle: 'bold'
    });

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
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P),
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    ];
    this.phaseKeys = {
      left: [this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT), this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A)],
      right: [this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT), this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)],
      up: [this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP), this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W)],
      down: [this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN), this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S)]
    };
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

      const isSelected = index === this.menuState.selectedIndex;
      const marker = isSelected ? '▶ ' : '  ';
      text.setText(`${marker}${option}`);
      text.setColor(isSelected ? '#f8f3df' : '#2d4632');
      text.setBackgroundColor(isSelected ? '#6f4b2f' : 'rgba(0,0,0,0)');
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
      action.phaseProfile?.developerNote ?? linkedMove?.developerNote ?? 'Future real battle data will replace this placeholder.',
      'DEV NOTE: The action panel is experimental scaffolding only; it does not imply final attack, defense, accuracy, dodge, bond, or move-resolution rules.'
    ]);
    this.queueMessages(action.messageLines);
    this.startTemporaryActionPhase(action);
  }


  private startTemporaryActionPhase(action: BattleAction): void {
    const profile = action.phaseProfile;

    if (!profile) {
      return;
    }

    this.menuState = { mode: 'action-phase', selectedIndex: 0 };
    this.updateMenuLabels();
    this.clearPanel();

    const panel = new Phaser.Geom.Rectangle(200, 82, 240, 188);
    this.panelObjects.push(this.add.rectangle(panel.centerX, panel.centerY, panel.width + 18, panel.height + 18, 0x17251d, 0.94).setStrokeStyle(4, 0xf0c878));
    this.panelObjects.push(this.add.rectangle(panel.centerX, panel.centerY, panel.width, panel.height, 0x243b2a, 0.98).setStrokeStyle(2, 0x6c7f43));
    this.panelObjects.push(this.add.text(panel.x, panel.y - 34, `${action.label} prototype`, {
      color: '#f8f3df',
      fontFamily: 'monospace',
      fontSize: '15px',
      fontStyle: 'bold'
    }));
    this.panelObjects.push(this.add.text(panel.x, panel.y + panel.height + 12, `Move sigil: arrows/WASD · avoid ${profile.hazardLabel}`, {
      color: '#f0c878',
      fontFamily: 'monospace',
      fontSize: '11px'
    }));

    const player = this.add.rectangle(panel.centerX, panel.bottom - 24, 14, 14, 0xf8f3df, 1).setStrokeStyle(2, 0xd99c3b);
    const timeText = this.add.text(panel.right - 70, panel.y - 30, '', {
      color: '#f8f3df',
      fontFamily: 'monospace',
      fontSize: '12px'
    });
    this.panelObjects.push(player, timeText);

    this.actionPhase = {
      action,
      panel,
      player,
      hazards: [],
      startedAt: this.time.now,
      lastSpawnAt: this.time.now,
      hit: false,
      timeText
    };
  }

  private updateActionPhase(time: number, delta: number): void {
    const phase = this.actionPhase;
    const profile = phase?.action.phaseProfile;

    if (!phase || !profile) {
      return;
    }

    const elapsed = time - phase.startedAt;
    const remaining = Math.max(0, Math.ceil((profile.durationMs - elapsed) / 1000));
    phase.timeText.setText(`${remaining}s`);
    this.moveActionSigil(phase, delta);

    if (time - phase.lastSpawnAt >= profile.hazardSpawnMs) {
      this.spawnActionHazard(phase);
      phase.lastSpawnAt = time;
    }

    this.updateActionHazards(phase, delta);

    if (elapsed >= profile.durationMs || phase.hit) {
      this.finishActionPhase(phase);
    }
  }

  private moveActionSigil(phase: ActionPhaseState, delta: number): void {
    if (!this.input.keyboard || !this.phaseKeys) {
      return;
    }

    const speed = 130 * (delta / 1000);
    const left = this.phaseKeys.left.some((key) => this.input.keyboard!.checkDown(key, 1));
    const right = this.phaseKeys.right.some((key) => this.input.keyboard!.checkDown(key, 1));
    const up = this.phaseKeys.up.some((key) => this.input.keyboard!.checkDown(key, 1));
    const down = this.phaseKeys.down.some((key) => this.input.keyboard!.checkDown(key, 1));

    const nextX = Phaser.Math.Clamp(phase.player.x + (right ? speed : 0) - (left ? speed : 0), phase.panel.left + 8, phase.panel.right - 8);
    const nextY = Phaser.Math.Clamp(phase.player.y + (down ? speed : 0) - (up ? speed : 0), phase.panel.top + 8, phase.panel.bottom - 8);
    phase.player.setPosition(nextX, nextY);
  }

  private spawnActionHazard(phase: ActionPhaseState): void {
    const profile = phase.action.phaseProfile;

    if (!profile) {
      return;
    }

    const x = Phaser.Math.Between(phase.panel.left + 10, phase.panel.right - 10);
    const radius = Phaser.Math.Between(5, 8);
    const shape = this.add.circle(x, phase.panel.top - 8, radius, profile.hazardColor, 0.96).setStrokeStyle(2, 0xf8f3df, 0.78);
    const drift = Phaser.Math.Between(-20, 20);
    phase.hazards.push({ shape, velocityX: drift, velocityY: profile.hazardSpeed, radius });
    this.panelObjects.push(shape);
  }

  private updateActionHazards(phase: ActionPhaseState, delta: number): void {
    const deltaSeconds = delta / 1000;

    phase.hazards = phase.hazards.filter((hazard) => {
      hazard.shape.setPosition(hazard.shape.x + hazard.velocityX * deltaSeconds, hazard.shape.y + hazard.velocityY * deltaSeconds);

      const distance = Phaser.Math.Distance.Between(hazard.shape.x, hazard.shape.y, phase.player.x, phase.player.y);
      if (distance < hazard.radius + 9) {
        phase.hit = true;
      }

      if (hazard.shape.y > phase.panel.bottom + 16) {
        hazard.shape.destroy();
        return false;
      }

      return true;
    });
  }

  private finishActionPhase(phase: ActionPhaseState): void {
    const profile = phase.action.phaseProfile;
    const resultLine = phase.hit
      ? profile?.failureLine ?? 'Placeholder action feedback: hit detected, but no battle values changed.'
      : profile?.successLine ?? 'Placeholder action feedback: clear, but no battle values changed.';

    phase.hazards.forEach((hazard) => hazard.shape.destroy());
    this.actionPhase = undefined;
    this.openMainMenu();
    this.queueMessages([
      resultLine,
      'Returned to battle menu. Final damage, turn order, capture, type mechanics, stats, and balance remain undecided.'
    ]);
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
    this.activeMessagePages = [];
    this.activeMessagePageIndex = 0;
    this.showNextMessage();
  }

  private showNextMessage(): void {
    if (this.activeMessagePages.length > 0 && this.activeMessagePageIndex < this.activeMessagePages.length - 1) {
      this.activeMessagePageIndex += 1;
      this.renderActiveMessagePage();
      return;
    }

    const nextLine = this.messageQueue.pendingLines.shift();

    if (!nextLine) {
      this.messageContinueText?.setVisible(false);
      return;
    }

    this.messageQueue.activeLine = nextLine;
    this.activeMessagePages = paginateBattleMessage(nextLine);
    this.activeMessagePageIndex = 0;
    this.renderActiveMessagePage();
  }

  private renderActiveMessagePage(): void {
    this.messageText?.setText(this.activeMessagePages[this.activeMessagePageIndex] ?? '');
    this.messageContinueText?.setVisible(this.hasPendingMessages());
  }

  private hasPendingMessages(): boolean {
    return this.messageQueue.pendingLines.length > 0 || this.activeMessagePageIndex < this.activeMessagePages.length - 1;
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

function paginateBattleMessage(message: string): string[] {
  const lines = wrapText(message, 39);
  const pages: string[] = [];

  for (let index = 0; index < lines.length; index += 2) {
    pages.push(lines.slice(index, index + 2).join('\n'));
  }

  return pages.length > 0 ? pages : [''];
}
