import Phaser from 'phaser';

export class DialogueBox {
  private readonly group: Phaser.GameObjects.Group;
  private readonly box: Phaser.GameObjects.Rectangle;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly promptText: Phaser.GameObjects.Text;
  private open = false;

  constructor(scene: Phaser.Scene) {
    this.box = scene.add.rectangle(320, 390, 596, 128, 0xf8f3df, 1).setStrokeStyle(4, 0x2d4632);
    this.nameText = scene.add.text(54, 334, '', {
      color: '#2d4632',
      fontFamily: 'monospace',
      fontSize: '18px',
      fontStyle: 'bold'
    });
    this.bodyText = scene.add.text(54, 362, '', {
      color: '#17251d',
      fontFamily: 'monospace',
      fontSize: '18px',
      lineSpacing: 6,
      wordWrap: { width: 520 }
    });
    this.promptText = scene.add.text(504, 428, 'E / Space', {
      color: '#6c7f43',
      fontFamily: 'monospace',
      fontSize: '14px'
    });

    this.group = scene.add.group([this.box, this.nameText, this.bodyText, this.promptText]);
    this.hide();
  }

  show(speaker: string, message: string): void {
    this.open = true;
    this.nameText.setText(speaker);
    this.bodyText.setText(message);
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
