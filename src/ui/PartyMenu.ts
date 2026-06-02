import Phaser from 'phaser';
import { getKnownDinosaurName, loadPlayerState } from '../data/playerState';

export class PartyMenu {
  private readonly group: Phaser.GameObjects.Group;
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private open = false;

  constructor(scene: Phaser.Scene) {
    const backdrop = scene.add.rectangle(320, 240, 560, 360, 0xf8f3df, 0.98).setStrokeStyle(4, 0x2d4632).setDepth(20);
    this.titleText = scene.add.text(72, 86, 'Field Party', {
      color: '#2d4632',
      fontFamily: 'monospace',
      fontSize: '26px',
      fontStyle: 'bold'
    }).setDepth(21);
    this.bodyText = scene.add.text(72, 132, '', {
      color: '#17251d',
      fontFamily: 'monospace',
      fontSize: '18px',
      lineSpacing: 10,
      wordWrap: { width: 500 }
    }).setDepth(21);
    const promptText = scene.add.text(72, 384, 'P / Esc: close', {
      color: '#6c7f43',
      fontFamily: 'monospace',
      fontSize: '16px'
    }).setDepth(21);

    this.group = scene.add.group([backdrop, this.titleText, this.bodyText, promptText]);
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
    const state = loadPlayerState();
    const partyLines = state.partyCreatures.length > 0
      ? state.partyCreatures.map((creature, index) => `${index + 1}. ${getKnownDinosaurName(creature.dinosaurId)}\n   placeholder field companion`).join('\n')
      : 'No placeholder creature selected yet.\nVisit the lab table to test the data-driven selection flow.';

    this.open = true;
    this.bodyText.setText(`Researcher: ${state.playerName}\n\n${partyLines}\n\nInventory: placeholder satchel\nStory flags: ${Object.keys(state.storyFlags).length}`);
    this.group.setVisible(true);
  }

  hide(): void {
    this.open = false;
    this.group.setVisible(false);
  }

  isOpen(): boolean {
    return this.open;
  }
}
