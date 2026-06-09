import Phaser from 'phaser';

interface DialoguePage {
  speaker: string;
  text: string;
}

interface DialogueBoxOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  depth?: number;
  bodyWidth?: number;
  maxLinesPerPage?: number;
  fontSize?: number;
  charactersPerSecond?: number;
}

// Developer note:
// DialogueBox is the shared typewriter text surface for NPC and short system
// messages. It wraps text to a conservative monospace line width, paginates by
// visible line count, and treats Space/Enter/E as advance controls in callers:
// first complete the current page, then move to the next page, then close.
export class DialogueBox {
  private readonly scene: Phaser.Scene;
  private readonly group: Phaser.GameObjects.Group;
  private readonly box: Phaser.GameObjects.Rectangle;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly promptText: Phaser.GameObjects.Text;
  private readonly continueText: Phaser.GameObjects.Text;
  private readonly options: Required<DialogueBoxOptions>;
  private pages: DialoguePage[] = [];
  private pageIndex = 0;
  private visibleCharacters = 0;
  private lastUpdateTime = 0;
  private open = false;

  constructor(scene: Phaser.Scene, options: DialogueBoxOptions = {}) {
    this.scene = scene;
    this.options = {
      x: options.x ?? 320,
      y: options.y ?? 390,
      width: options.width ?? 596,
      height: options.height ?? 128,
      depth: options.depth ?? 40,
      bodyWidth: options.bodyWidth ?? 520,
      maxLinesPerPage: options.maxLinesPerPage ?? 3,
      fontSize: options.fontSize ?? 18,
      charactersPerSecond: options.charactersPerSecond ?? 48
    };

    const left = this.options.x - this.options.width / 2 + 28;
    const top = this.options.y - this.options.height / 2 + 16;

    this.box = scene.add.rectangle(this.options.x, this.options.y, this.options.width, this.options.height, 0xf8f3df, 1)
      .setStrokeStyle(4, 0x2d4632)
      .setDepth(this.options.depth).setScrollFactor(0);
    this.nameText = scene.add.text(left, top, '', {
      color: '#2d4632',
      fontFamily: 'monospace',
      fontSize: `${this.options.fontSize}px`,
      fontStyle: 'bold'
    }).setDepth(this.options.depth + 1).setScrollFactor(0);
    this.bodyText = scene.add.text(left, top + 28, '', {
      color: '#17251d',
      fontFamily: 'monospace',
      fontSize: `${this.options.fontSize}px`,
      lineSpacing: 6,
      wordWrap: { width: this.options.bodyWidth, useAdvancedWrap: true }
    }).setDepth(this.options.depth + 1).setScrollFactor(0);
    this.promptText = scene.add.text(left, top + this.options.height - 34, 'Space/Enter: next · Esc: close', {
      color: '#6c7f43',
      fontFamily: 'monospace',
      fontSize: '12px'
    }).setDepth(this.options.depth + 1).setScrollFactor(0);
    this.continueText = scene.add.text(this.options.x + this.options.width / 2 - 48, top + this.options.height - 36, '▼', {
      color: '#d99c3b',
      fontFamily: 'monospace',
      fontSize: '18px',
      fontStyle: 'bold'
    }).setDepth(this.options.depth + 1).setScrollFactor(0);

    this.group = scene.add.group([this.box, this.nameText, this.bodyText, this.promptText, this.continueText]);
    this.hide();
  }

  show(speaker: string, message: string): void {
    this.open = true;
    this.pages = this.createPages(speaker, message);
    this.pageIndex = 0;
    this.visibleCharacters = 0;
    this.lastUpdateTime = this.scene.time.now;
    this.group.setVisible(true);
    this.renderCurrentPage();
  }

  update(time = this.scene.time.now): void {
    if (!this.open || this.isCurrentPageComplete()) {
      return;
    }

    const elapsedSeconds = Math.max(0, (time - this.lastUpdateTime) / 1000);
    this.lastUpdateTime = time;
    this.visibleCharacters = Math.min(
      this.currentPageText().length,
      this.visibleCharacters + elapsedSeconds * this.options.charactersPerSecond
    );
    this.renderCurrentPage();
  }

  advance(): boolean {
    if (!this.open) {
      return false;
    }

    if (!this.isCurrentPageComplete()) {
      this.visibleCharacters = this.currentPageText().length;
      this.renderCurrentPage();
      return true;
    }

    if (this.pageIndex < this.pages.length - 1) {
      this.pageIndex += 1;
      this.visibleCharacters = 0;
      this.lastUpdateTime = this.scene.time.now;
      this.renderCurrentPage();
      return true;
    }

    this.hide();
    return true;
  }

  hide(): void {
    this.open = false;
    this.group.setVisible(false);
  }

  isOpen(): boolean {
    return this.open;
  }

  isTyping(): boolean {
    return this.open && !this.isCurrentPageComplete();
  }

  private renderCurrentPage(): void {
    const page = this.pages[this.pageIndex];

    if (!page) {
      return;
    }

    this.nameText.setText(page.speaker);
    this.bodyText.setText(page.text.slice(0, Math.floor(this.visibleCharacters)));
    this.continueText.setVisible(this.open && this.isCurrentPageComplete());
    this.promptText.setText(this.pageIndex < this.pages.length - 1 ? 'Space/Enter: next page · Esc: close' : 'Space/Enter: close · Esc: close');
  }

  private createPages(speaker: string, message: string): DialoguePage[] {
    const maxCharactersPerLine = Math.max(18, Math.floor(this.options.bodyWidth / (this.options.fontSize * 0.62)));
    const lines = wrapText(message, maxCharactersPerLine);
    const pages: DialoguePage[] = [];

    for (let index = 0; index < lines.length; index += this.options.maxLinesPerPage) {
      pages.push({ speaker, text: lines.slice(index, index + this.options.maxLinesPerPage).join('\n') });
    }

    return pages.length > 0 ? pages : [{ speaker, text: '' }];
  }

  private currentPageText(): string {
    return this.pages[this.pageIndex]?.text ?? '';
  }

  private isCurrentPageComplete(): boolean {
    return this.visibleCharacters >= this.currentPageText().length;
  }
}

export function wrapText(message: string, maxCharactersPerLine: number): string[] {
  return message.split('\n').flatMap((paragraph) => wrapParagraph(paragraph, maxCharactersPerLine));
}

function wrapParagraph(paragraph: string, maxCharactersPerLine: number): string[] {
  const words = paragraph.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const chunks = chunkLongWord(word, maxCharactersPerLine);

    chunks.forEach((chunk) => {
      const candidate = currentLine ? `${currentLine} ${chunk}` : chunk;

      if (candidate.length > maxCharactersPerLine && currentLine) {
        lines.push(currentLine);
        currentLine = chunk;
      } else {
        currentLine = candidate;
      }
    });
  });

  if (currentLine || lines.length === 0) {
    lines.push(currentLine);
  }

  return lines;
}

function chunkLongWord(word: string, maxCharactersPerLine: number): string[] {
  if (word.length <= maxCharactersPerLine) {
    return [word];
  }

  const chunks: string[] = [];
  for (let index = 0; index < word.length; index += maxCharactersPerLine) {
    chunks.push(word.slice(index, index + maxCharactersPerLine));
  }
  return chunks;
}
