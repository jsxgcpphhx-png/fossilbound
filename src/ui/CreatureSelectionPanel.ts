import Phaser from 'phaser';
import type { DinosaurDefinition } from '../data/dinosaurs';

interface CreatureSelectionPanelOptions {
  creatures: DinosaurDefinition[];
  onChoose: (creature: DinosaurDefinition) => void;
}

export class CreatureSelectionPanel {
  private readonly creatures: DinosaurDefinition[];
  private readonly onChoose: (creature: DinosaurDefinition) => void;
  private readonly group: Phaser.GameObjects.Group;
  private readonly cardTexts: Phaser.GameObjects.Text[] = [];
  private selectedIndex = 0;
  private open = false;

  constructor(scene: Phaser.Scene, options: CreatureSelectionPanelOptions) {
    this.creatures = options.creatures;
    this.onChoose = options.onChoose;

    const backdrop = scene.add.rectangle(320, 240, 596, 396, 0xf8f3df, 0.98).setStrokeStyle(5, 0x2d4632).setDepth(30);
    const titleText = scene.add.text(48, 70, 'Placeholder Creature Selection', {
      color: '#2d4632',
      fontFamily: 'monospace',
      fontSize: '24px',
      fontStyle: 'bold'
    }).setDepth(31);
    const noteText = scene.add.text(
      48,
      104,
      'Temporary test data only. Real roster, types, stats, moves, and battle rules are not final.',
      {
        color: '#6c7f43',
        fontFamily: 'monospace',
        fontSize: '14px',
        wordWrap: { width: 540 }
      }
    ).setDepth(31);
    const promptText = scene.add.text(48, 390, '←/→ or W/S: choose   Enter/E/Space: select   Esc: close', {
      color: '#6c7f43',
      fontFamily: 'monospace',
      fontSize: '14px'
    }).setDepth(31);

    const children: Phaser.GameObjects.GameObject[] = [backdrop, titleText, noteText, promptText];

    this.creatures.forEach((creature, index) => {
      const column = index % 3;
      const row = Math.floor(index / 3);
      const x = 64 + column * 174;
      const y = 154 + row * 104;
      const card = scene.add.rectangle(x + 78, y + 44, 158, 94, 0xf0c878, 0.45).setStrokeStyle(2, 0x8a6a3d).setDepth(31);
      const text = scene.add.text(x + 10, y + 6, '', {
        color: '#17251d',
        fontFamily: 'monospace',
        fontSize: '12px',
        lineSpacing: 3,
        wordWrap: { width: 138, useAdvancedWrap: true }
      }).setDepth(32);

      this.cardTexts.push(text);
      children.push(card, text);
    });

    this.group = scene.add.group(children);
    this.refreshCards();
    this.hide();
  }

  show(): void {
    this.open = true;
    this.refreshCards();
    this.group.setVisible(true);
  }

  hide(): void {
    this.open = false;
    this.group.setVisible(false);
  }

  isOpen(): boolean {
    return this.open;
  }

  moveSelection(delta: number): void {
    if (!this.open || this.creatures.length === 0) {
      return;
    }

    this.selectedIndex = (this.selectedIndex + delta + this.creatures.length) % this.creatures.length;
    this.refreshCards();
  }

  chooseSelected(): void {
    const creature = this.creatures[this.selectedIndex];

    if (this.open && creature) {
      this.onChoose(creature);
    }
  }

  private refreshCards(): void {
    this.cardTexts.forEach((text, index) => {
      const creature = this.creatures[index];
      const selectedMarker = index === this.selectedIndex ? '▶ ' : '  ';
      const shortDescription = creature.shortDescription.length > 68
        ? `${creature.shortDescription.slice(0, 65)}...`
        : creature.shortDescription;
      text.setText(`${selectedMarker}${creature.displayName}\n${creature.prehistoricGroup}\n${shortDescription}`);
    });
  }
}
