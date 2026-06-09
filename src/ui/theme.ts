import Phaser from 'phaser';
import { registerFixedUiObject } from '../systems/OverworldCamera';

export const UI_COLORS = {
  ink: '#17251d',
  leaf: '#2d4632',
  moss: '#6c7f43',
  parchment: '#f8f3df',
  parchmentDark: '#efe2bf',
  amber: '#d99c3b',
  amberLight: '#f0c878',
  bark: '#6f4b2f'
} as const;

export const UI_HEX = {
  ink: 0x17251d,
  leaf: 0x2d4632,
  moss: 0x6c7f43,
  parchment: 0xf8f3df,
  parchmentDark: 0xefe2bf,
  amber: 0xd99c3b,
  amberLight: 0xf0c878,
  bark: 0x6f4b2f
} as const;

export interface PanelOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  depth?: number;
  fill?: number;
  stroke?: number;
  alpha?: number;
}

export function panelTextStyle(options: Phaser.Types.GameObjects.Text.TextStyle = {}): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    color: UI_COLORS.ink,
    fontFamily: 'monospace',
    fontSize: '12px',
    lineSpacing: 4,
    ...options
  };
}

export function drawUiPanel(scene: Phaser.Scene, options: PanelOptions): Phaser.GameObjects.Rectangle {
  return registerFixedUiObject(scene, scene.add.rectangle(options.x, options.y, options.width, options.height, options.fill ?? UI_HEX.parchment, options.alpha ?? 0.98)
    .setStrokeStyle(4, options.stroke ?? UI_HEX.leaf)
    .setDepth(options.depth ?? 0)
    .setScrollFactor(0));
}

export function paginateText(message: string, maxCharactersPerLine: number, maxLinesPerPage: number): string[] {
  const lines = wrapUiText(message, maxCharactersPerLine);
  const pages: string[] = [];

  for (let index = 0; index < lines.length; index += maxLinesPerPage) {
    pages.push(lines.slice(index, index + maxLinesPerPage).join('\n'));
  }

  return pages.length > 0 ? pages : [''];
}

export function truncateText(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, Math.max(0, maxLength - 1))}…`;
}


export function wrapUiText(message: string, maxCharactersPerLine: number): string[] {
  return message.split('\n').flatMap((paragraph) => wrapUiParagraph(paragraph, maxCharactersPerLine));
}

function wrapUiParagraph(paragraph: string, maxCharactersPerLine: number): string[] {
  const words = paragraph.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const chunks = chunkUiLongWord(word, maxCharactersPerLine);

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

function chunkUiLongWord(word: string, maxCharactersPerLine: number): string[] {
  if (word.length <= maxCharactersPerLine) {
    return [word];
  }

  const chunks: string[] = [];
  for (let index = 0; index < word.length; index += maxCharactersPerLine) {
    chunks.push(word.slice(index, index + maxCharactersPerLine));
  }
  return chunks;
}
