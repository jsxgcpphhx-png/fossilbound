import Phaser from 'phaser';
import { loadPlayerState } from '../data/playerState';

export class PartyMenu {
  private readonly group: Phaser.GameObjects.Group;
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private open = false;

  constructor(scene: Phaser.Scene) {
    const overlay = scene.add.rectangle(320, 240, 640, 480, 0x17251d, 0.35).setDepth(20);
    const panel = scene.add.rectangle(320, 240, 520, 300, 0xf8f3df, 1).setStrokeStyle(4, 0x8a6a3d).setDepth(21);
    const header = scene.add.rectangle(320, 112, 520, 44, 0x2d4632, 1).setDepth(22);

    this.titleText = scene.add.text(86, 99, 'Field Party', {
      color: '#f8f3df',
      fontFamily: 'monospace',
      fontSize: '22px',
      fontStyle: 'bold'
    }).setDepth(23);

    this.bodyText = scene.add.text(92, 152, '', {
      color: '#17251d',
      fontFamily: 'monospace',
      fontSize: '17px',
      lineSpacing: 9,
      wordWrap: { width: 460 }
    }).setDepth(23);

    const promptText = scene.add.text(390, 362, 'P / Esc to close', {
      color: '#6c7f43',
      fontFamily: 'monospace',
      fontSize: '14px'
    }).setDepth(23);

    this.group = scene.add.group([overlay, panel, header, this.titleText, this.bodyText, promptText]);
    this.hide();
  }

  show(): void {
    const state = loadPlayerState();
    const partyText = state.partyCreatures.length > 0
      ? state.partyCreatures
        .map((creature, index) => [
          `${index + 1}. ${creature.displayName}`,
          `   Role: ${creature.role}`,
          `   Planned identity: ${creature.plannedTypeIdentity}`,
          `   Personality: ${creature.personality}`
        ].join('\n'))
        .join('\n\n')
      : 'No companion selected yet.\nVisit Dr. Sable\'s lab in Amberleaf Town to choose a starter.';

    this.open = true;
    this.titleText.setText(`${state.playerName}'s Field Party`);
    this.bodyText.setText(partyText);
    this.group.setVisible(true);
  }

  hide(): void {
    this.open = false;
    this.group.setVisible(false);
  }

  toggle(): void {
    if (this.open) {
      this.hide();
    } else {
      this.show();
    }
  }

  isOpen(): boolean {
    return this.open;
  }
}
