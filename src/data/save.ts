import { SAVE_KEY } from './constants';
import type { TilePosition } from '../types/grid';

interface MilestoneOneSave {
  playerTile: TilePosition;
}

export function loadPlayerTile(fallback: TilePosition): TilePosition {
  const rawSave = window.localStorage.getItem(SAVE_KEY);

  if (!rawSave) {
    return fallback;
  }

  try {
    const save = JSON.parse(rawSave) as Partial<MilestoneOneSave>;

    if (
      save.playerTile &&
      Number.isInteger(save.playerTile.x) &&
      Number.isInteger(save.playerTile.y)
    ) {
      return save.playerTile;
    }
  } catch {
    window.localStorage.removeItem(SAVE_KEY);
  }

  return fallback;
}

export function savePlayerTile(playerTile: TilePosition): void {
  const save: MilestoneOneSave = { playerTile };
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}
