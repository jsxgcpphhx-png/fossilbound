import Phaser from 'phaser';
import { EARLY_GAME_DINOSAURS, type DinosaurDefinition } from '../data/dinosaurs';
import type { EncounterPreview } from '../data/encounters';
import { getKnownDinosaurName, loadPlayerState, updatePlayerPosition } from '../data/playerState';
import type { TilePosition } from '../types/grid';

type BattleMenuOption = 'Observe' | 'Actions' | 'Field Pack' | 'Flee';

const MENU_OPTIONS: BattleMenuOption[] = ['Observe', 'Actions', 'Field Pack', 'Flee'];
const BATTLE_MESSAGE = 'A prehistoric creature appeared!';
const NOT_IMPLEMENTED_MESSAGE = 'Not implemented yet. Final battle rules will be designed later.';

interface BattleSceneData extends EncounterPreview {
  returnPosition?: TilePosition;
}

interface BattleActorViewModel {
  dinosaurId?: string;
  displayName: string;
  spritePath?: string;
  description?: string;
  role: 'wild' | 'player';
}

// Milestone 4 developer note:
// This scene is only a temporary battle-screen shell. It intentionally avoids
// damage, attack moves, turn order, capture, final type mechanics, stat formulas,
// and balance assumptions so the future battle system can remain data-driven.
export class BattleScene extends Phaser.Scene {
  private encounter?: BattleSceneData;
  private selectedMenuIndex = 0;
  private menuTexts: Phaser.GameObjects.Text[] = [];
  private messageText?: Phaser.GameObjects.Text;
  private menuKeys?: Phaser.Input.Keyboard.Key[];
  private actionKeys?: Phaser.Input.Keyboard.Key[];

  constructor() {
    super('BattleScene');
  }

  init(data: BattleSceneData): void {
    this.encounter = data;
    this.selectedMenuIndex = 0;
    this.menuTexts = [];
    this.messageText = undefined;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#17251d');

    if (!this.encounter) {
      this.scene.start('FernTrailScene');
      return;
    }

    const wildActor = this.createWildActor(this.encounter);
    const playerActor = this.createPlayerActor();

    this.drawBackground();
    this.drawActorArea(wildActor, 456, 134, true);
    this.drawActorArea(playerActor, 164, 276, false);
    this.drawStatusBox(wildActor.displayName, 46, 54, 'Wild placeholder');
    this.drawStatusBox(playerActor.displayName, 360, 232, 'Party placeholder');
    this.drawMessageAndMenu();
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
      this.chooseSelectedOption();
    }

    if (Phaser.Input.Keyboard.JustDown(this.actionKeys[1]) || Phaser.Input.Keyboard.JustDown(this.actionKeys[2])) {
      this.flee();
    }

    if (Phaser.Input.Keyboard.JustDown(this.actionKeys[3])) {
      this.showObserveText();
    }

    if (Phaser.Input.Keyboard.JustDown(this.actionKeys[4])) {
      this.showPlaceholderText('Actions');
    }

    if (Phaser.Input.Keyboard.JustDown(this.actionKeys[5])) {
      this.showPlaceholderText('Field Pack');
    }
  }

  private createWildActor(encounter: BattleSceneData): BattleActorViewModel {
    const dinosaur = this.getDinosaur(encounter.dinosaurId);

    return {
      dinosaurId: encounter.dinosaurId,
      displayName: dinosaur?.displayName ?? encounter.creatureName,
      spritePath: dinosaur?.battleSpritePath ?? encounter.spritePath,
      description: dinosaur?.shortDescription,
      role: 'wild'
    };
  }

  private createPlayerActor(): BattleActorViewModel {
    const state = loadPlayerState();
    const selectedPartyCreature = state.partyCreatures.find((creature) => creature.dinosaurId === state.selectedCreatureId)
      ?? state.partyCreatures[0];
    const dinosaur = selectedPartyCreature ? this.getDinosaur(selectedPartyCreature.dinosaurId) : undefined;

    return {
      dinosaurId: dinosaur?.id,
      displayName: dinosaur?.displayName ?? (state.selectedCreatureId ? getKnownDinosaurName(state.selectedCreatureId) : 'Field Companion'),
      spritePath: dinosaur?.battleSpritePath,
      description: dinosaur?.shortDescription ?? 'Placeholder party creature data will be expanded later.',
      role: 'player'
    };
  }

  private drawBackground(): void {
    this.add.rectangle(320, 240, 640, 480, 0x17251d);
    this.add.rectangle(320, 178, 640, 356, 0x35522f);
    this.add.rectangle(320, 350, 640, 104, 0x5f7f43, 0.88);
    this.add.rectangle(320, 352, 640, 42, 0x2d4632, 0.22);
    this.add.circle(124, 326, 92, 0xc7a765, 0.32);
    this.add.circle(464, 202, 76, 0xc7a765, 0.22);
    this.add.text(320, 24, 'Battle Shell — placeholder systems only', {
      align: 'center',
      color: '#f8f3df',
      fontFamily: 'monospace',
      fontSize: '16px'
    }).setOrigin(0.5);
  }

  private drawActorArea(actor: BattleActorViewModel, x: number, y: number, mirrored: boolean): void {
    this.add.rectangle(x, y + 74, 210, 30, 0x000000, 0.16);
    this.drawPlaceholderCreature(actor, x, y, mirrored);
    this.add.text(x, y + 116, actor.spritePath ? `sprite: ${actor.spritePath}` : 'placeholder silhouette', {
      align: 'center',
      color: '#d6ad6a',
      fontFamily: 'monospace',
      fontSize: '10px',
      wordWrap: { width: 220 }
    }).setOrigin(0.5);
  }

  private drawPlaceholderCreature(actor: BattleActorViewModel, x: number, y: number, mirrored: boolean): void {
    const bodyColor = actor.role === 'wild' ? 0x243126 : 0x2d4632;
    const accentColor = actor.role === 'wild' ? 0xf0c878 : 0xd99c3b;
    const direction = mirrored ? -1 : 1;
    const hasCrest = actor.dinosaurId === 'parasaurolophus' || actor.dinosaurId === 'pteranodon';
    const hasArmor = actor.dinosaurId === 'triceratops' || actor.dinosaurId === 'ankylosaurus';

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

  private drawStatusBox(name: string, x: number, y: number, subtitle: string): void {
    this.add.rectangle(x + 112, y + 42, 224, 84, 0xf8f3df, 0.96).setStrokeStyle(4, 0x2d4632);
    this.add.text(x + 20, y + 14, name, {
      color: '#17251d',
      fontFamily: 'monospace',
      fontSize: '18px',
      fontStyle: 'bold'
    });
    this.add.text(x + 20, y + 38, subtitle, {
      color: '#6f4b2f',
      fontFamily: 'monospace',
      fontSize: '12px'
    });
    this.add.rectangle(x + 112, y + 66, 160, 12, 0x2d4632, 0.28);
    this.add.rectangle(x + 112, y + 66, 154, 7, 0x6c7f43, 0.75);
    this.add.text(x + 190, y + 56, 'HP/status TBD', {
      align: 'right',
      color: '#6c7f43',
      fontFamily: 'monospace',
      fontSize: '10px'
    }).setOrigin(1, 0);
  }

  private drawMessageAndMenu(): void {
    this.add.rectangle(320, 426, 612, 118, 0xf8f3df, 0.98).setStrokeStyle(5, 0x2d4632);
    this.messageText = this.add.text(38, 384, BATTLE_MESSAGE, {
      color: '#17251d',
      fontFamily: 'monospace',
      fontSize: '18px',
      lineSpacing: 6,
      wordWrap: { width: 352 }
    });
    this.add.text(38, 456, 'Controls: ↑/↓/←/→ choose · Enter confirm · F/Esc flee', {
      color: '#6c7f43',
      fontFamily: 'monospace',
      fontSize: '12px'
    });
    this.add.rectangle(504, 426, 198, 88, 0xefe2bf, 0.96).setStrokeStyle(3, 0x6f4b2f);

    this.menuTexts = MENU_OPTIONS.map((option, index) => this.add.text(424 + (index % 2) * 92, 400 + Math.floor(index / 2) * 34, option, {
      color: '#2d4632',
      fontFamily: 'monospace',
      fontSize: '15px',
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
    this.selectedMenuIndex = (this.selectedMenuIndex + delta + MENU_OPTIONS.length) % MENU_OPTIONS.length;
    this.updateMenuLabels();
  }

  private updateMenuLabels(): void {
    this.menuTexts.forEach((text, index) => {
      const marker = index === this.selectedMenuIndex ? '▶ ' : '  ';
      text.setText(`${marker}${MENU_OPTIONS[index]}`);
    });
  }

  private chooseSelectedOption(): void {
    const selectedOption = MENU_OPTIONS[this.selectedMenuIndex];

    if (selectedOption === 'Flee') {
      this.flee();
      return;
    }

    if (selectedOption === 'Observe') {
      this.showObserveText();
      return;
    }

    this.showPlaceholderText(selectedOption);
  }

  private showObserveText(): void {
    const dinosaur = this.encounter ? this.getDinosaur(this.encounter.dinosaurId) : undefined;
    const description = dinosaur?.shortDescription ?? 'Temporary field notes are unavailable for this placeholder creature.';
    this.messageText?.setText(`Observe: ${description}`);
  }

  private showPlaceholderText(option: Exclude<BattleMenuOption, 'Observe' | 'Flee'>): void {
    this.messageText?.setText(`${option}: ${NOT_IMPLEMENTED_MESSAGE}`);
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
