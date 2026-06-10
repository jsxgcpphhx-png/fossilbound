import type { TilePosition } from '../types/grid';
import { loadPlayerState, savePlayerState, updatePlayerPosition, type MapId } from './playerState';

export function loadPlayerTile(fallback: TilePosition): TilePosition {
  return loadPlayerState({ currentPosition: fallback }).currentPosition;
}

export function savePlayerTile(playerTile: TilePosition): void {
  const state = loadPlayerState({ currentPosition: playerTile });
  savePlayerState({ ...state, currentPosition: playerTile });
}

export function savePlayerMapTile(currentMap: MapId, playerTile: TilePosition): void {
  updatePlayerPosition(currentMap, playerTile);
}
