import { SAVE_KEY } from './constants';
import { EARLY_GAME_DINOSAURS } from './dinosaurs';
import { createStartingInventory, normalizeInventory, type InventoryQuantities } from './inventory';
import type { TilePosition } from '../types/grid';

export type MapId = 'AmberleafTownScene' | 'LabScene' | 'FernTrailScene';

export interface PartyCreatureState {
  instanceId: string;
  dinosaurId: string;
  nickname?: string;
}

export interface PlayerState {
  version: 2;
  playerName: string;
  currentMap: MapId;
  currentPosition: TilePosition;
  selectedCreatureId?: string;
  partyCreatures: PartyCreatureState[];
  inventory: InventoryQuantities;
  storyFlags: Record<string, boolean>;
}

interface LegacyMilestoneOneSave {
  playerTile?: TilePosition;
}

const DEFAULT_PLAYER_STATE: PlayerState = {
  version: 2,
  playerName: 'Researcher',
  currentMap: 'AmberleafTownScene',
  currentPosition: { x: 9, y: 9 },
  selectedCreatureId: undefined,
  partyCreatures: [],
  inventory: createStartingInventory(),
  storyFlags: {}
};

export function createDefaultPlayerState(overrides: Partial<PlayerState> = {}): PlayerState {
  return normalizePlayerState({ ...DEFAULT_PLAYER_STATE, ...overrides });
}

export function hasSavedPlayerState(): boolean {
  return window.localStorage.getItem(SAVE_KEY) !== null;
}

export function loadPlayerState(fallback: Partial<PlayerState> = {}): PlayerState {
  const fallbackState = createDefaultPlayerState(fallback);
  const rawSave = window.localStorage.getItem(SAVE_KEY);

  if (!rawSave) {
    return fallbackState;
  }

  try {
    const parsed = JSON.parse(rawSave) as Partial<PlayerState> & LegacyMilestoneOneSave;

    if (isTilePosition(parsed.playerTile) && !parsed.currentPosition) {
      return normalizePlayerState({ ...fallbackState, currentPosition: parsed.playerTile });
    }

    return normalizePlayerState({ ...fallbackState, ...parsed });
  } catch {
    window.localStorage.removeItem(SAVE_KEY);
    return fallbackState;
  }
}

export function savePlayerState(state: PlayerState): void {
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(normalizePlayerState(state)));
}

export function clearPlayerState(): void {
  window.localStorage.removeItem(SAVE_KEY);
}

export function updatePlayerPosition(currentMap: MapId, currentPosition: TilePosition): PlayerState {
  const state = loadPlayerState({ currentMap, currentPosition });
  const updatedState = normalizePlayerState({ ...state, currentMap, currentPosition });
  savePlayerState(updatedState);
  return updatedState;
}

export function selectCreature(dinosaurId: string): PlayerState {
  const state = loadPlayerState();
  const existingPartyCreature = state.partyCreatures.find((creature) => creature.dinosaurId === dinosaurId);
  const selectedPartyCreature = existingPartyCreature ?? {
    instanceId: createCreatureInstanceId(dinosaurId),
    dinosaurId
  };
  const updatedState = normalizePlayerState({
    ...state,
    selectedCreatureId: dinosaurId,
    partyCreatures: existingPartyCreature ? state.partyCreatures : [selectedPartyCreature, ...state.partyCreatures],
    storyFlags: { ...state.storyFlags, chosePlaceholderCreature: true }
  });

  savePlayerState(updatedState);
  return updatedState;
}


export interface TemporaryDebugAddCreatureResult {
  added: boolean;
  message: string;
}

export const TEMPORARY_PARTY_LIMIT = 6;

export function addTemporaryDebugCreatureToParty(dinosaurId: string): TemporaryDebugAddCreatureResult {
  const state = loadPlayerState();

  if (!isKnownDinosaurId(dinosaurId)) {
    return { added: false, message: 'Debug scaffold could not find this placeholder creature in current data.' };
  }

  if (state.partyCreatures.length >= TEMPORARY_PARTY_LIMIT) {
    return { added: false, message: 'Party is full. Placeholder storage is not implemented yet.' };
  }

  const updatedState = normalizePlayerState({
    ...state,
    selectedCreatureId: state.selectedCreatureId ?? dinosaurId,
    partyCreatures: [
      ...state.partyCreatures,
      {
        instanceId: createCreatureInstanceId(dinosaurId),
        dinosaurId
      }
    ],
    storyFlags: { ...state.storyFlags, usedTemporaryDebugAddCreature: true }
  });

  savePlayerState(updatedState);
  return { added: true, message: `Debug scaffold added ${getKnownDinosaurName(dinosaurId)} to the party. This is not final capture.` };
}

export function getKnownDinosaurName(dinosaurId: string): string {
  return EARLY_GAME_DINOSAURS.find((dinosaur) => dinosaur.id === dinosaurId)?.displayName ?? dinosaurId;
}

function normalizePlayerState(candidate: Partial<PlayerState>): PlayerState {
  const currentMap = isMapId(candidate.currentMap) ? candidate.currentMap : DEFAULT_PLAYER_STATE.currentMap;
  const currentPosition = isTilePosition(candidate.currentPosition)
    ? candidate.currentPosition
    : DEFAULT_PLAYER_STATE.currentPosition;
  const selectedCreatureId = isKnownDinosaurId(candidate.selectedCreatureId) ? candidate.selectedCreatureId : undefined;
  const partyCreatures = Array.isArray(candidate.partyCreatures)
    ? candidate.partyCreatures.filter(isPartyCreatureState)
    : [];

  return {
    version: 2,
    playerName: typeof candidate.playerName === 'string' && candidate.playerName.trim().length > 0
      ? candidate.playerName
      : DEFAULT_PLAYER_STATE.playerName,
    currentMap,
    currentPosition,
    selectedCreatureId,
    partyCreatures,
    inventory: normalizeInventory(candidate.inventory, DEFAULT_PLAYER_STATE.inventory),
    storyFlags: isBooleanRecord(candidate.storyFlags) ? candidate.storyFlags : {}
  };
}

function isTilePosition(candidate: unknown): candidate is TilePosition {
  if (!candidate || typeof candidate !== 'object') {
    return false;
  }

  const tile = candidate as Partial<TilePosition>;
  return Number.isInteger(tile.x) && Number.isInteger(tile.y);
}

function isMapId(candidate: unknown): candidate is MapId {
  return candidate === 'AmberleafTownScene' || candidate === 'LabScene' || candidate === 'FernTrailScene';
}

function isKnownDinosaurId(candidate: unknown): candidate is string {
  return typeof candidate === 'string' && EARLY_GAME_DINOSAURS.some((dinosaur) => dinosaur.id === candidate);
}

function isPartyCreatureState(candidate: unknown): candidate is PartyCreatureState {
  if (!candidate || typeof candidate !== 'object') {
    return false;
  }

  const creature = candidate as Partial<PartyCreatureState>;
  return typeof creature.instanceId === 'string' && isKnownDinosaurId(creature.dinosaurId);
}


function isBooleanRecord(candidate: unknown): candidate is Record<string, boolean> {
  return Boolean(candidate) && typeof candidate === 'object' && !Array.isArray(candidate);
}

function createCreatureInstanceId(dinosaurId: string): string {
  return `${dinosaurId}-${Date.now().toString(36)}`;
}
