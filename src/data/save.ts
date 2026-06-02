import type { TilePosition } from '../types/grid';
import { loadPlayerState, savePlayerState } from './playerState';

export function loadPlayerTile(fallback: TilePosition): TilePosition {
  const state = loadPlayerState();
  const tile = state.currentPosition;

  if (Number.isInteger(tile.x) && Number.isInteger(tile.y)) {
    return tile;
  }

  return fallback;
}

export function savePlayerTile(playerTile: TilePosition): void {
  const state = loadPlayerState();
  state.currentPosition = { ...playerTile };
  savePlayerState(state);
}
