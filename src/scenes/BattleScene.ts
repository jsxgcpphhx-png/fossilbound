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
import { TRANQUILIZER_SEQUENCE_VARIATIONS, createTranquilizerDifficultyProfile, getTranquilizerUpgrade, type TranquilizerDifficultyProfile, type TranquilizerObstacleKind, type TranquilizerObstacleMotion } from '../data/tranquilizer';
import type { EncounterPreview } from '../data/encounters';
import { getInventoryCategoryLabel, getInventoryEntries, type InventoryEntry } from '../data/inventory';
import { addTemporaryDebugCreatureToParty, getCreatureByInstanceId, getKnownDinosaurName, loadPlayerState, updatePlayerPosition } from '../data/playerState';
import type { TilePosition } from '../types/grid';
import { paginateText, panelTextStyle, truncateText, UI_COLORS, UI_HEX } from '../ui/theme';

type MainBattleMenuOption = 'Observe' | 'Actions' | 'Capture' | 'Field Pack' | 'Flee';

interface ActionHazard {
  shape: Phaser.GameObjects.GameObject;
  velocityX: number;
  velocityY: number;
  radius: number;
}


interface TranquilizerObstacle {
  shape: Phaser.GameObjects.GameObject;
  kind: TranquilizerObstacleKind;
  motion: TranquilizerObstacleMotion;
  radius: number;
  velocityX: number;
  velocityY: number;
  originX: number;
  originY: number;
  patrolAxis: 'x' | 'y';
}

interface TranquilizerPhaseState {
  panel: Phaser.Geom.Rectangle;
  cursor: Phaser.GameObjects.Rectangle;
  target: Phaser.GameObjects.GameObject;
  profile: TranquilizerDifficultyProfile;
  creatureName: string;
  roundIndex: number;
  roundStartedAt: number;
  sequenceStartedAt: number;
  lockedOnMs: number;
  targetVelocityX: number;
  targetVelocityY: number;
  targetAccelerationX: number;
  targetAccelerationY: number;
  progressBar: Phaser.GameObjects.Rectangle;
  progressText: Phaser.GameObjects.Text;
  timerText: Phaser.GameObjects.Text;
  roundText: Phaser.GameObjects.Text;
  statusText: Phaser.GameObjects.Text;
  warningText: Phaser.GameObjects.Text;
  targetBaseRadius: number;
  currentTargetRadius: number;
  obstacles: TranquilizerObstacle[];
  failedReason?: string;
  succeeded: boolean;
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

const MAIN_MENU_OPTIONS: MainBattleMenuOption[] = ['Observe', 'Actions', 'Capture', 'Field Pack', 'Flee'];

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
  private tranquilizerPhase?: TranquilizerPhaseState;
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
    this.tranquilizerPhase = undefined;
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

    if (this.tranquilizerPhase) {
      this.updateTranquilizerPhase(time, delta);
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
      text.setText(`${marker}${truncateText(option, 18)}`);
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

    if (selectedOption === 'Capture') {
      this.startTranquilizerSequence();
      return;
    }

    if (selectedOption === 'Field Pack') {
      this.openFieldPackPanel();
      return;
    }

    this.flee();
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
      'DEV SCAFFOLD ONLY · Tranq Sequence is the temporary capture mode.',
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
      'Tranq Sequence',
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
      this.startTranquilizerSequence();
      return;
    }

    if (selectedIndex === entries.length + 1) {
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


  // Dedicated capture prototype: this 3-round tranquilizer lock-on mode is
  // intentionally separate from the temporary action bullet-hell below. It
  // does not define final capture odds, tranq economy, damage, or turn rules.
  private startTranquilizerSequence(): void {
    const wildCreature = this.participants?.wild.creature;
    const dinosaur = this.getDinosaur(wildCreature?.dinosaurId);
    const playerState = loadPlayerState();
    const rarity = dinosaur?.fossilReconstruction.isFossilReconstructable ? 'rare' : dinosaur?.growthCategory === 'big' ? 'uncommon' : 'common';
    const hpStatus = wildCreature?.placeholderHpStatus ?? TEMPORARY_BATTLE_CONFIG.placeholderHp.wild;
    const currentHpRatio = hpStatus.maxHp > 0 ? hpStatus.currentHp / hpStatus.maxHp : 1;
    const profile = createTranquilizerDifficultyProfile({
      creatureLevel: dinosaur?.placeholderBaseLevel ?? 5,
      creatureRarity: rarity,
      currentHpRatio,
      tranqGunUpgradeLevel: playerState.tranqGunUpgradeLevel
    });
    const upgrade = getTranquilizerUpgrade(playerState.tranqGunUpgradeLevel);
    const creatureName = wildCreature?.displayName ?? TEMPORARY_BATTLE_CONFIG.defaultWildCreatureName;

    this.menuState = { mode: 'capture-phase', selectedIndex: 0 };
    this.updateMenuLabels();
    this.clearPanel();

    const panel = new Phaser.Geom.Rectangle(148, 72, 344, 226);
    this.panelObjects.push(this.add.rectangle(panel.centerX, panel.centerY, panel.width + 22, panel.height + 22, UI_HEX.ink, 0.96).setStrokeStyle(4, UI_HEX.amberLight));
    this.panelObjects.push(this.add.rectangle(panel.centerX, panel.centerY, panel.width, panel.height, UI_HEX.leaf, 0.98).setStrokeStyle(2, UI_HEX.moss));
    this.panelObjects.push(this.add.text(panel.x, panel.y - 44, 'Tranquilizer Capture — 3 Lock-on Rounds', panelTextStyle({
      color: UI_COLORS.parchment,
      fontSize: '14px',
      fontStyle: 'bold'
    })));
    this.panelObjects.push(this.add.text(panel.x, panel.y - 24, `${creatureName} · ${profile.difficultyTier} · ${TRANQUILIZER_SEQUENCE_VARIATIONS[profile.variationId]}`, panelTextStyle({
      color: UI_COLORS.amberLight,
      fontSize: '10px',
      wordWrap: { width: panel.width, useAdvancedWrap: true }
    })));
    this.panelObjects.push(this.add.text(panel.x, panel.bottom + 10, 'Arrows/WASD move cursor · hold inside target · touching obstacles fails immediately.', panelTextStyle({
      color: UI_COLORS.amberLight,
      fontSize: '10px',
      wordWrap: { width: panel.width + 8, useAdvancedWrap: true }
    })));
    this.panelObjects.push(this.add.text(panel.x, panel.bottom + 38, `${upgrade.displayName} · Tuning is placeholder; no final dart economy or capture odds.`, panelTextStyle({
      color: UI_COLORS.parchmentDark,
      fontSize: '9px',
      wordWrap: { width: panel.width + 8, useAdvancedWrap: true }
    })));

    const target = this.add.circle(panel.centerX + 72, panel.centerY - 20, profile.targetRadius, UI_HEX.amber, 0.24).setStrokeStyle(3, UI_HEX.parchment, 0.92);
    const cursor = this.add.rectangle(panel.centerX - 84, panel.centerY + 54, 13, 13, UI_HEX.parchment, 1).setStrokeStyle(2, UI_HEX.bark);
    const progressBack = this.add.rectangle(panel.centerX, panel.top + 18, 192, 12, UI_HEX.ink, 0.86).setStrokeStyle(1, UI_HEX.parchment, 0.52);
    const progressBar = this.add.rectangle(panel.centerX - 96, panel.top + 18, 1, 8, UI_HEX.moss, 0.95).setOrigin(0, 0.5);
    const roundText = this.add.text(panel.x + 10, panel.top + 32, `Round 1/${profile.requiredRounds}`, panelTextStyle({ color: UI_COLORS.parchment, fontSize: '11px', fontStyle: 'bold' }));
    const progressText = this.add.text(panel.x + 108, panel.top + 32, 'Lock-on 0%', panelTextStyle({ color: UI_COLORS.parchment, fontSize: '11px' }));
    const timerText = this.add.text(panel.right - 86, panel.top + 32, '0.0s', panelTextStyle({ color: UI_COLORS.parchment, fontSize: '11px' }));
    const statusText = this.add.text(panel.x + 10, panel.bottom - 24, 'Acquire the moving target.', panelTextStyle({ color: UI_COLORS.amberLight, fontSize: '10px', wordWrap: { width: panel.width - 20, useAdvancedWrap: true } }));
    const warningText = this.add.text(panel.right - 126, panel.bottom - 44, '', panelTextStyle({ color: '#ffcf70', fontSize: '10px', fontStyle: 'bold' }));
    const obstacles = this.createTranquilizerObstacles(panel, profile);
    this.panelObjects.push(target, cursor, progressBack, progressBar, roundText, progressText, timerText, statusText, warningText, ...obstacles.map((obstacle) => obstacle.shape));

    this.tranquilizerPhase = {
      panel,
      cursor,
      target,
      profile,
      creatureName,
      roundIndex: 0,
      roundStartedAt: this.time.now,
      sequenceStartedAt: this.time.now,
      lockedOnMs: 0,
      targetVelocityX: profile.targetSpeed,
      targetVelocityY: profile.targetSpeed * 0.58,
      targetAccelerationX: profile.targetAcceleration,
      targetAccelerationY: profile.targetAcceleration * -0.7,
      progressBar,
      progressText,
      timerText,
      roundText,
      statusText,
      warningText,
      targetBaseRadius: profile.targetRadius,
      currentTargetRadius: profile.targetRadius,
      obstacles,
      succeeded: false
    };
    this.queueMessages([
      'Capture mode started: this 3-round tranquilizer lock-on is separate from the experimental action bullet-hell.',
      'Hold the cursor inside the moving target to fill each round. Touch any obstacle and the attempt fails.'
    ]);
  }

  private updateTranquilizerPhase(time: number, delta: number): void {
    const phase = this.tranquilizerPhase;

    if (!phase) {
      return;
    }

    this.moveTranqCursor(phase, delta);
    this.moveTranqTarget(phase, time, delta);
    this.updateTranquilizerObstacles(phase, time, delta);

    const hitObstacle = this.getObstacleCollision(phase);
    if (hitObstacle) {
      phase.failedReason = `${this.getObstacleLabel(hitObstacle.kind)} hit the cursor.`;
      this.finishTranquilizerPhase(phase);
      return;
    }

    const distance = Phaser.Math.Distance.Between(phase.cursor.x, phase.cursor.y, phase.target.x, phase.target.y);
    const lockedOn = distance <= phase.currentTargetRadius;
    phase.lockedOnMs = Phaser.Math.Clamp(phase.lockedOnMs + (lockedOn ? delta : -delta * 0.62), 0, phase.profile.requiredLockOnMs);
    const progress = phase.lockedOnMs / phase.profile.requiredLockOnMs;
    (phase.progressBar as unknown as { width: number }).width = Math.max(1, 192 * progress);
    phase.progressText.setText(`Lock-on ${Math.round(progress * 100)}%`);

    const roundRemainingMs = Math.max(0, phase.profile.roundTimeLimitMs - (time - phase.roundStartedAt));
    const totalRemainingMs = Math.max(0, phase.profile.totalTimeLimitMs - (time - phase.sequenceStartedAt));
    phase.timerText.setText(`${(Math.min(roundRemainingMs, totalRemainingMs) / 1000).toFixed(1)}s`);
    phase.roundText.setText(`Round ${phase.roundIndex + 1}/${phase.profile.requiredRounds}`);
    phase.statusText.setText(lockedOn ? 'Locked on — hold steady!' : 'Acquire the moving target.');
    (phase.target as unknown as { setFillStyle?: (color: number, alpha?: number) => void }).setFillStyle?.(lockedOn ? UI_HEX.amberLight : UI_HEX.amber, lockedOn ? 0.42 : 0.24);
    phase.target.setStrokeStyle(lockedOn ? 4 : 3, lockedOn ? 0xf8f3df : 0xf0c878, lockedOn ? 1 : 0.92);
    phase.warningText.setText(this.isNearTranquilizerObstacle(phase) ? 'OBSTACLE NEAR' : '');

    if (phase.lockedOnMs >= phase.profile.requiredLockOnMs) {
      this.advanceTranquilizerRound(phase);
      return;
    }

    if (roundRemainingMs <= 0 || totalRemainingMs <= 0) {
      phase.failedReason = roundRemainingMs <= 0 ? `Round ${phase.roundIndex + 1} timer expired.` : 'Total capture timer expired.';
      this.finishTranquilizerPhase(phase);
    }
  }

  private moveTranqCursor(phase: TranquilizerPhaseState, delta: number): void {
    if (!this.input.keyboard || !this.phaseKeys) {
      return;
    }

    const speed = 165 * (delta / 1000);
    const left = this.phaseKeys.left.some((key) => this.input.keyboard!.checkDown(key, 1));
    const right = this.phaseKeys.right.some((key) => this.input.keyboard!.checkDown(key, 1));
    const up = this.phaseKeys.up.some((key) => this.input.keyboard!.checkDown(key, 1));
    const down = this.phaseKeys.down.some((key) => this.input.keyboard!.checkDown(key, 1));
    phase.cursor.setPosition(
      Phaser.Math.Clamp(phase.cursor.x + (right ? speed : 0) - (left ? speed : 0), phase.panel.left + 7, phase.panel.right - 7),
      Phaser.Math.Clamp(phase.cursor.y + (down ? speed : 0) - (up ? speed : 0), phase.panel.top + 50, phase.panel.bottom - 7)
    );
  }

  private moveTranqTarget(phase: TranquilizerPhaseState, time: number, delta: number): void {
    const deltaSeconds = delta / 1000;
    const erratic = phase.profile.variationId === 'apex-surge';
    const drift = phase.profile.variationId === 'drifting' || phase.profile.variationId === 'light-hazards' || erratic ? Math.sin(time / 360) * 26 : 0;
    const pulse = phase.profile.variationId === 'pulsing' || phase.profile.variationId === 'light-hazards' || erratic
      ? Math.sin(time / 170) * (erratic ? 4 : 3)
      : 0;
    const accelerationWaveX = Math.sin(time / (erratic ? 260 : 520)) * phase.targetAccelerationX;
    const accelerationWaveY = Math.cos(time / (erratic ? 310 : 610)) * phase.targetAccelerationY;
    phase.targetVelocityX = Phaser.Math.Clamp(phase.targetVelocityX + accelerationWaveX * deltaSeconds, -phase.profile.targetSpeed * 1.45, phase.profile.targetSpeed * 1.45);
    phase.targetVelocityY = Phaser.Math.Clamp(phase.targetVelocityY + accelerationWaveY * deltaSeconds, -phase.profile.targetSpeed * 1.2, phase.profile.targetSpeed * 1.2);

    const nextX = phase.target.x + (phase.targetVelocityX + drift) * deltaSeconds;
    const nextY = phase.target.y + phase.targetVelocityY * deltaSeconds;

    if (nextX < phase.panel.left + phase.currentTargetRadius || nextX > phase.panel.right - phase.currentTargetRadius) {
      phase.targetVelocityX *= -0.94;
    }

    if (nextY < phase.panel.top + phase.currentTargetRadius + 52 || nextY > phase.panel.bottom - phase.currentTargetRadius - 8) {
      phase.targetVelocityY *= -0.94;
    }

    phase.currentTargetRadius = Math.max(12, phase.targetBaseRadius + pulse);
    (phase.target as unknown as { setRadius?: (radius: number) => void }).setRadius?.(phase.currentTargetRadius);
    phase.target.setPosition(
      Phaser.Math.Clamp(nextX, phase.panel.left + phase.currentTargetRadius, phase.panel.right - phase.currentTargetRadius),
      Phaser.Math.Clamp(nextY, phase.panel.top + phase.currentTargetRadius + 52, phase.panel.bottom - phase.currentTargetRadius - 8)
    );
  }

  private advanceTranquilizerRound(phase: TranquilizerPhaseState): void {
    if (phase.roundIndex >= phase.profile.requiredRounds - 1) {
      phase.succeeded = true;
      this.finishTranquilizerPhase(phase);
      return;
    }

    phase.roundIndex += 1;
    phase.lockedOnMs = 0;
    phase.roundStartedAt = this.time.now;
    (phase.progressBar as unknown as { width: number }).width = 1;
    phase.targetVelocityX = (phase.profile.targetSpeed + phase.roundIndex * 10) * (phase.roundIndex % 2 === 0 ? 1 : -1);
    phase.targetVelocityY = (phase.profile.targetSpeed * 0.55 + phase.roundIndex * 8) * (phase.roundIndex % 2 === 0 ? 1 : -1);
    phase.target.setPosition(
      Phaser.Math.Clamp(phase.panel.centerX + (phase.roundIndex === 1 ? -70 : 76), phase.panel.left + phase.currentTargetRadius, phase.panel.right - phase.currentTargetRadius),
      Phaser.Math.Clamp(phase.panel.centerY + (phase.roundIndex === 1 ? 44 : -36), phase.panel.top + phase.currentTargetRadius + 52, phase.panel.bottom - phase.currentTargetRadius - 8)
    );
    phase.statusText.setText(`Round ${phase.roundIndex} secured. Acquire the next target.`);
  }

  private createTranquilizerObstacles(panel: Phaser.Geom.Rectangle, profile: TranquilizerDifficultyProfile): TranquilizerObstacle[] {
    const slots = [
      { x: panel.left + 64, y: panel.top + 88 },
      { x: panel.right - 58, y: panel.top + 128 },
      { x: panel.centerX, y: panel.bottom - 50 },
      { x: panel.left + 104, y: panel.bottom - 82 },
      { x: panel.right - 104, y: panel.top + 76 }
    ];

    return profile.obstaclePatterns.map((pattern, index) => {
      const slot = slots[index % slots.length];
      const shape = this.drawTranquilizerObstacle(slot.x, slot.y, pattern.radius, pattern.kind);
      const direction = index % 2 === 0 ? 1 : -1;
      return {
        shape,
        kind: pattern.kind,
        motion: pattern.motion,
        radius: pattern.radius,
        velocityX: pattern.motion === 'bounce' || pattern.motion === 'drift' ? pattern.speed * direction : 0,
        velocityY: pattern.motion === 'bounce' || pattern.motion === 'drift' ? pattern.speed * 0.65 * -direction : 0,
        originX: slot.x,
        originY: slot.y,
        patrolAxis: index % 2 === 0 ? 'x' : 'y'
      };
    });
  }

  private drawTranquilizerObstacle(x: number, y: number, radius: number, kind: TranquilizerObstacleKind): Phaser.GameObjects.GameObject {
    const color = kind === 'amber-shard' ? 0xffb13d : kind === 'thorn-cluster' ? 0x8f5830 : kind === 'fossil-splinter' ? 0xd7d0bd : kind === 'alarm-spark' ? 0xff6b57 : 0x9fd7ef;
    const obstacle = this.add.circle(x, y, radius, color, 0.86).setStrokeStyle(2, UI_HEX.ink, 0.86);
    return obstacle;
  }

  private updateTranquilizerObstacles(phase: TranquilizerPhaseState, time: number, delta: number): void {
    const deltaSeconds = delta / 1000;

    phase.obstacles.forEach((obstacle) => {
      if (obstacle.motion === 'stationary') {
        return;
      }

      if (obstacle.motion === 'patrol') {
        const offset = Math.sin(time / 820 + obstacle.originX * 0.01) * 42;
        obstacle.shape.setPosition(
          obstacle.patrolAxis === 'x' ? obstacle.originX + offset : obstacle.originX,
          obstacle.patrolAxis === 'y' ? obstacle.originY + offset : obstacle.originY
        );
        return;
      }

      obstacle.shape.setPosition(obstacle.shape.x + obstacle.velocityX * deltaSeconds, obstacle.shape.y + obstacle.velocityY * deltaSeconds);
      const left = phase.panel.left + obstacle.radius;
      const right = phase.panel.right - obstacle.radius;
      const top = phase.panel.top + 56 + obstacle.radius;
      const bottom = phase.panel.bottom - obstacle.radius;

      if (obstacle.shape.x < left || obstacle.shape.x > right) {
        obstacle.velocityX *= -1;
      }

      if (obstacle.shape.y < top || obstacle.shape.y > bottom) {
        obstacle.velocityY *= -1;
      }

      if (obstacle.motion === 'drift') {
        obstacle.velocityX += Math.sin(time / 900) * 0.18;
        obstacle.velocityY += Math.cos(time / 840) * 0.18;
      }

      obstacle.shape.setPosition(
        Phaser.Math.Clamp(obstacle.shape.x, left, right),
        Phaser.Math.Clamp(obstacle.shape.y, top, bottom)
      );
    });
  }

  private getObstacleCollision(phase: TranquilizerPhaseState): TranquilizerObstacle | undefined {
    return phase.obstacles.find((obstacle) => Phaser.Math.Distance.Between(obstacle.shape.x, obstacle.shape.y, phase.cursor.x, phase.cursor.y) <= obstacle.radius + 8);
  }

  private isNearTranquilizerObstacle(phase: TranquilizerPhaseState): boolean {
    return phase.obstacles.some((obstacle) => Phaser.Math.Distance.Between(obstacle.shape.x, obstacle.shape.y, phase.cursor.x, phase.cursor.y) <= obstacle.radius + 28);
  }

  private getObstacleLabel(kind: TranquilizerObstacleKind): string {
    return kind.split('-').map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`).join(' ');
  }

  private finishTranquilizerPhase(phase: TranquilizerPhaseState): void {
    this.tranquilizerPhase = undefined;
    const dinosaurId = this.participants?.wild.creature.dinosaurId;

    if (phase.succeeded && dinosaurId) {
      const result = addTemporaryDebugCreatureToParty(dinosaurId, 'wild');
      this.openMainMenu();
      this.drawPanel('Tranquilized — temporary capture', [
        `SUCCESS — ${phase.creatureName} was tranquilized after ${phase.profile.requiredRounds} lock-on rounds.`,
        result.message,
        'A normal/base owned creature instance was created with random gender and trait. Final capture odds, dart inventory, economy, tranq upgrades, and boss restrictions are not implemented.'
      ]);
      this.queueMessages(['Three lock-on rounds completed. The creature was tranquilized in the prototype capture sequence.', result.message]);
      return;
    }

    this.openMainMenu();
    this.drawPanel('Tranquilizer failed', [
      `FAILURE — ${phase.failedReason ?? 'lock-on was not held long enough before the timer expired.'}`,
      `Progress reached round ${Math.min(phase.roundIndex + 1, phase.profile.requiredRounds)}/${phase.profile.requiredRounds}.`,
      'Returned to the battle menu. Future HP, level, rarity, upgrades, and tranquilizer economy are still placeholder tuning.'
    ]);
    this.queueMessages([`The tranquilizer attempt failed: ${phase.failedReason ?? 'timer expired'}. Returned to the battle menu.`]);
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


  // Experimental action/move timing scaffold only. Do not treat this as the
  // tranquilizer capture mode or as final battle resolution design.
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
    this.tranquilizerPhase = undefined;
    this.openMainMenu();
    this.queueMessages([
      resultLine,
      'Returned to battle menu. Final damage, turn order, capture, type mechanics, stats, and balance remain undecided.'
    ]);
  }

  private drawPanel(title: string, lines: string[]): void {
    this.clearPanel();
    const body = paginateText(lines.join('\n'), 66, 9)[0] ?? '';
    this.panelObjects.push(this.add.rectangle(320, 176, 560, 210, UI_HEX.parchment, 0.96).setStrokeStyle(4, UI_HEX.bark));
    this.panelObjects.push(this.add.text(66, 88, truncateText(title, 42), panelTextStyle({
      color: UI_COLORS.ink,
      fontSize: '18px',
      fontStyle: 'bold'
    })));
    this.panelObjects.push(this.add.text(66, 120, body, panelTextStyle({
      color: UI_COLORS.leaf,
      fontSize: '12px',
      lineSpacing: 5,
      wordWrap: { width: 508, useAdvancedWrap: true }
    })));
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
  return paginateText(message, 39, 2);
}
