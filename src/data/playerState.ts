import { SAVE_KEY } from './constants';
import type { TilePosition } from '../types/grid';

export type MapId = 'AmberleafTownScene' | 'DrSableLabScene';
export type StarterDinosaurId = string;

export interface PartyCreatureState {
  id: StarterDinosaurId;
  displayName: string;
  role: string;
  plannedTypeIdentity: string;
  personality: string;
}

export interface PlayerState {
  playerName: string;
  currentMap: MapId;
  currentPosition: TilePosition;
  selectedStarter?: StarterDinosaurId;
  partyCreatures: PartyCreatureState[];
  inventory: string[];
  storyFlags: Record<string, boolean>;
}

interface LegacyMilestoneOneSave {
  playerTile?: TilePosition;
}

export const DEFAULT_PLAYER_POSITION: TilePosition = { x: 9, y: 9 };
export const DEFAULT_PLAYER_STATE: PlayerState = {
  playerName: 'Researcher',
  currentMap: 'AmberleafTownScene',
  currentPosition: DEFAULT_PLAYER_POSITION,
  partyCreatures: [],
  inventory: [],
  storyFlags: {}
};

export function hasPlayerSave(): boolean {
  return window.localStorage.getItem(SAVE_KEY) !== null;
}

export function loadPlayerState(): PlayerState {
  const rawSave = window.localStorage.getItem(SAVE_KEY);

  if (!rawSave) {
    return clonePlayerState(DEFAULT_PLAYER_STATE);
  }

  try {
    const parsedSave = JSON.parse(rawSave) as Partial<PlayerState> & LegacyMilestoneOneSave;
    return normalizePlayerState(parsedSave);
  } catch {
    window.localStorage.removeItem(SAVE_KEY);
    return clonePlayerState(DEFAULT_PLAYER_STATE);
  }
}

export function savePlayerState(state: PlayerState): void {
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(clonePlayerState(state)));
}

export function updatePlayerLocation(currentMap: MapId, currentPosition: TilePosition): PlayerState {
  const state = loadPlayerState();
  state.currentMap = currentMap;
  state.currentPosition = { ...currentPosition };
  savePlayerState(state);
  return state;
}

export function selectStarter(starter: PartyCreatureState): PlayerState {
  const state = loadPlayerState();
  state.selectedStarter = starter.id;
  state.partyCreatures = [{
    id: starter.id,
    displayName: starter.displayName,
    role: starter.role,
    plannedTypeIdentity: starter.plannedTypeIdentity,
    personality: starter.personality
  }];
  state.storyFlags.selectedStarter = true;
  savePlayerState(state);
  return state;
}

export function resetPlayerState(): PlayerState {
  const state = clonePlayerState(DEFAULT_PLAYER_STATE);
  savePlayerState(state);
  return state;
}

function normalizePlayerState(rawState: Partial<PlayerState> & LegacyMilestoneOneSave): PlayerState {
  const currentPosition = isTilePosition(rawState.currentPosition)
    ? rawState.currentPosition
    : isTilePosition(rawState.playerTile)
      ? rawState.playerTile
      : DEFAULT_PLAYER_STATE.currentPosition;

  const state: PlayerState = {
    playerName: typeof rawState.playerName === 'string' && rawState.playerName.length > 0
      ? rawState.playerName
      : DEFAULT_PLAYER_STATE.playerName,
    currentMap: isMapId(rawState.currentMap) ? rawState.currentMap : DEFAULT_PLAYER_STATE.currentMap,
    currentPosition: { ...currentPosition },
    selectedStarter: isStarterDinosaurId(rawState.selectedStarter) ? rawState.selectedStarter : undefined,
    partyCreatures: Array.isArray(rawState.partyCreatures)
      ? rawState.partyCreatures.filter(isPartyCreatureState).map((creature) => ({ ...creature }))
      : [],
    inventory: Array.isArray(rawState.inventory)
      ? rawState.inventory.filter((item): item is string => typeof item === 'string')
      : [],
    storyFlags: isStoryFlags(rawState.storyFlags) ? { ...rawState.storyFlags } : {}
  };

  if (state.selectedStarter && state.partyCreatures.length === 0) {
    state.storyFlags.selectedStarter = true;
  }

  return state;
}

function clonePlayerState(state: PlayerState): PlayerState {
  return {
    playerName: state.playerName,
    currentMap: state.currentMap,
    currentPosition: { ...state.currentPosition },
    selectedStarter: state.selectedStarter,
    partyCreatures: state.partyCreatures.map((creature) => ({ ...creature })),
    inventory: [...state.inventory],
    storyFlags: { ...state.storyFlags }
  };
}

function isTilePosition(value: unknown): value is TilePosition {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const tile = value as TilePosition;
  return Number.isInteger(tile.x) && Number.isInteger(tile.y);
}

function isMapId(value: unknown): value is MapId {
  return value === 'AmberleafTownScene' || value === 'DrSableLabScene';
}

function isStarterDinosaurId(value: unknown): value is StarterDinosaurId {
  return typeof value === 'string' && value.length > 0;
}

function isPartyCreatureState(value: unknown): value is PartyCreatureState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const creature = value as PartyCreatureState;
  return (
    isStarterDinosaurId(creature.id) &&
    typeof creature.displayName === 'string' &&
    typeof creature.role === 'string' &&
    typeof creature.plannedTypeIdentity === 'string' &&
    typeof creature.personality === 'string'
  );
}

function isStoryFlags(value: unknown): value is Record<string, boolean> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every((flag) => typeof flag === 'boolean');
}
