import type { TilePosition } from '../types/grid';
import { loadPlayerState, savePlayerState, updatePlayerPosition } from './playerState';

export function loadPlayerTile(fallback: TilePosition): TilePosition {
  return loadPlayerState({ currentPosition: fallback }).currentPosition;
}

export function savePlayerTile(playerTile: TilePosition): void {
  const state = loadPlayerState({ currentPosition: playerTile });
  savePlayerState({ ...state, currentPosition: playerTile });
}

export function savePlayerMapTile(currentMap: 'AmberleafTownScene' | 'LabScene', playerTile: TilePosition): void {
  updatePlayerPosition(currentMap, playerTile);
}
