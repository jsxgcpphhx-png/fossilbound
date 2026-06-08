import { SAVE_KEY } from './constants';
import { EARLY_GAME_DINOSAURS } from './dinosaurs';
import { createStartingInventory, normalizeInventory, type InventoryQuantities } from './inventory';
import type { TilePosition } from '../types/grid';

export type MapId = 'AmberleafTownScene' | 'LabScene' | 'FernTrailScene' | 'MossbankVillageScene' | 'IslandBaseScene';

export interface PartyCreatureState {
  instanceId: string;
  dinosaurId: string;
  nickname?: string;
}

export interface PlayerState {
  version: 3;
  playerName: string;
  currentMap: MapId;
  currentPosition: TilePosition;
  selectedCreatureId?: string;
  ownedCreatures: PartyCreatureState[];
  leadCreatureId?: string;
  followCreatureId?: string;
  carrierCreatureIds: string[];
  islandStorageCreatureIds: string[];
  partyCreatures: PartyCreatureState[];
  inventory: InventoryQuantities;
  storyFlags: Record<string, boolean>;
  islandReturnMap?: Exclude<MapId, 'IslandBaseScene'>;
  islandReturnPosition?: TilePosition;
}

interface LegacyMilestoneOneSave {
  playerTile?: TilePosition;
}

interface LegacyPlayerStateCandidate extends Partial<Omit<PlayerState, 'version'>> {
  version?: number;
  partyCreatures?: PartyCreatureState[];
}

export interface TravelTeamSlot {
  id: TravelTeamSlotId;
  label: string;
  description: string;
  creatureId?: string;
}

export type TravelTeamSlotId = 'lead' | 'follow' | 'carrier-1' | 'carrier-2' | 'carrier-3';

const DEFAULT_PLAYER_STATE: PlayerState = {
  version: 3,
  playerName: 'Researcher',
  currentMap: 'AmberleafTownScene',
  currentPosition: { x: 9, y: 9 },
  selectedCreatureId: undefined,
  ownedCreatures: [],
  leadCreatureId: undefined,
  followCreatureId: undefined,
  carrierCreatureIds: [],
  islandStorageCreatureIds: [],
  partyCreatures: [],
  inventory: createStartingInventory(),
  storyFlags: {}
};

export const QUETZALCOATLUS_CARRIER_LIMIT = 3;
export const TRAVEL_TEAM_SLOT_IDS: TravelTeamSlotId[] = ['lead', 'follow', 'carrier-1', 'carrier-2', 'carrier-3'];

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
    const parsed = JSON.parse(rawSave) as LegacyPlayerStateCandidate & LegacyMilestoneOneSave;

    if (isTilePosition(parsed.playerTile) && !parsed.currentPosition) {
      return normalizePlayerState({ ...fallbackState, currentPosition: parsed.playerTile });
    }

    return normalizePlayerState({ ...fallbackState, ...parsed } as Partial<PlayerState>);
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

export function travelToIslandBase(returnMap: Exclude<MapId, 'IslandBaseScene'>, returnPosition: TilePosition): PlayerState {
  const state = loadPlayerState({ currentMap: returnMap, currentPosition: returnPosition });
  const updatedState = normalizePlayerState({
    ...state,
    currentMap: 'IslandBaseScene',
    currentPosition: { x: 9, y: 9 },
    islandReturnMap: returnMap,
    islandReturnPosition: returnPosition,
    storyFlags: { ...state.storyFlags, usedQuetzalcoatlusIslandTravel: true }
  });
  savePlayerState(updatedState);
  return updatedState;
}

export function returnFromIslandBase(): PlayerState {
  const state = loadPlayerState();
  const returnMap = state.islandReturnMap ?? 'AmberleafTownScene';
  const returnPosition = state.islandReturnPosition ?? DEFAULT_PLAYER_STATE.currentPosition;
  const updatedState = normalizePlayerState({
    ...state,
    currentMap: returnMap,
    currentPosition: returnPosition
  });
  savePlayerState(updatedState);
  return updatedState;
}

export function selectCreature(dinosaurId: string): PlayerState {
  const state = loadPlayerState();
  const existingOwnedCreature = state.ownedCreatures.find((creature) => creature.dinosaurId === dinosaurId);
  const selectedOwnedCreature = existingOwnedCreature ?? {
    instanceId: createCreatureInstanceId(dinosaurId),
    dinosaurId
  };
  const updatedState = addCreatureToTravelOrStorage({
    ...state,
    selectedCreatureId: dinosaurId,
    ownedCreatures: existingOwnedCreature ? state.ownedCreatures : [selectedOwnedCreature, ...state.ownedCreatures],
    storyFlags: { ...state.storyFlags, chosePlaceholderCreature: true }
  }, selectedOwnedCreature.instanceId);

  savePlayerState(updatedState);
  return updatedState;
}

export interface TemporaryDebugAddCreatureResult {
  added: boolean;
  message: string;
}

export function addTemporaryDebugCreatureToParty(dinosaurId: string): TemporaryDebugAddCreatureResult {
  const state = loadPlayerState();

  if (!isKnownDinosaurId(dinosaurId)) {
    return { added: false, message: 'Debug scaffold could not find this placeholder creature in current data.' };
  }

  const newCreature = {
    instanceId: createCreatureInstanceId(dinosaurId),
    dinosaurId
  };
  const beforeTravelIds = new Set(getTravelCreatureIds(state));
  const updatedState = addCreatureToTravelOrStorage({
    ...state,
    selectedCreatureId: state.selectedCreatureId ?? dinosaurId,
    ownedCreatures: [...state.ownedCreatures, newCreature],
    storyFlags: { ...state.storyFlags, usedTemporaryDebugAddCreature: true }
  }, newCreature.instanceId);
  const afterTravelIds = new Set(getTravelCreatureIds(updatedState));
  const wentToTravel = !beforeTravelIds.has(newCreature.instanceId) && afterTravelIds.has(newCreature.instanceId);

  savePlayerState(updatedState);
  return {
    added: true,
    message: wentToTravel
      ? `Debug scaffold added ${getKnownDinosaurName(dinosaurId)} to an empty travel team slot. This is not final capture.`
      : `Debug scaffold sent ${getKnownDinosaurName(dinosaurId)} to Island Base storage. This is not final capture.`
  };
}

export function swapTravelTeamSlots(firstSlotId: TravelTeamSlotId, secondSlotId: TravelTeamSlotId): PlayerState {
  const state = loadPlayerState();
  const firstCreatureId = getCreatureIdForSlot(state, firstSlotId);
  const secondCreatureId = getCreatureIdForSlot(state, secondSlotId);
  const updatedState = setCreatureIdForSlot(setCreatureIdForSlot(state, firstSlotId, secondCreatureId), secondSlotId, firstCreatureId);
  savePlayerState(updatedState);
  return updatedState;
}

export function getTravelTeamSlots(state: PlayerState = loadPlayerState()): TravelTeamSlot[] {
  return [
    {
      id: 'lead',
      label: 'Lead',
      description: 'primary battle creature',
      creatureId: state.leadCreatureId
    },
    {
      id: 'follow',
      label: 'Follow',
      description: 'visible overworld companion',
      creatureId: state.followCreatureId
    },
    ...Array.from({ length: QUETZALCOATLUS_CARRIER_LIMIT }, (_, index) => ({
      id: `carrier-${index + 1}` as TravelTeamSlotId,
      label: `Quetzalcoatlus Carrier Slot ${index + 1}`,
      description: 'backup creature carried by Quetzalcoatlus',
      creatureId: state.carrierCreatureIds[index]
    }))
  ];
}

export function getCreatureByInstanceId(state: PlayerState, instanceId?: string): PartyCreatureState | undefined {
  return instanceId ? state.ownedCreatures.find((creature) => creature.instanceId === instanceId) : undefined;
}

export function getTravelCreatureIds(state: PlayerState): string[] {
  return [state.leadCreatureId, state.followCreatureId, ...state.carrierCreatureIds].filter(isString);
}

export function getKnownDinosaurName(dinosaurId: string): string {
  return EARLY_GAME_DINOSAURS.find((dinosaur) => dinosaur.id === dinosaurId)?.displayName ?? dinosaurId;
}

function normalizePlayerState(candidate: Partial<PlayerState>): PlayerState {
  const currentMap = isMapId(candidate.currentMap) ? candidate.currentMap : DEFAULT_PLAYER_STATE.currentMap;
  const currentPosition = isTilePosition(candidate.currentPosition)
    ? candidate.currentPosition
    : DEFAULT_PLAYER_STATE.currentPosition;
  const legacyPartyCreatures = Array.isArray(candidate.partyCreatures)
    ? candidate.partyCreatures.filter(isPartyCreatureState)
    : [];
  const candidateOwnedCreatures = Array.isArray(candidate.ownedCreatures)
    ? candidate.ownedCreatures.filter(isPartyCreatureState)
    : [];
  const ownedCreatures = dedupeCreatures([...candidateOwnedCreatures, ...legacyPartyCreatures]);
  const ownedIds = new Set(ownedCreatures.map((creature) => creature.instanceId));
  const selectedCreatureId = isKnownDinosaurId(candidate.selectedCreatureId) ? candidate.selectedCreatureId : undefined;
  const migratedLeadCreatureId = isOwnedCreatureId(candidate.leadCreatureId, ownedIds)
    ? candidate.leadCreatureId
    : findLegacySelectedCreatureId(ownedCreatures, selectedCreatureId) ?? ownedCreatures[0]?.instanceId;
  const migratedFollowCreatureId = isOwnedCreatureId(candidate.followCreatureId, ownedIds)
    ? candidate.followCreatureId
    : ownedCreatures.find((creature) => creature.instanceId !== migratedLeadCreatureId)?.instanceId;
  const assignedIds = new Set([migratedLeadCreatureId, migratedFollowCreatureId].filter(isString));
  const carrierCreatureIds = normalizeCreatureIdList([
    ...(Array.isArray(candidate.carrierCreatureIds) ? candidate.carrierCreatureIds : []),
    ...ownedCreatures.map((creature) => creature.instanceId)
  ], ownedIds, assignedIds, QUETZALCOATLUS_CARRIER_LIMIT);
  carrierCreatureIds.forEach((creatureId) => assignedIds.add(creatureId));
  const explicitStorageIds = normalizeCreatureIdList(candidate.islandStorageCreatureIds, ownedIds, assignedIds);
  explicitStorageIds.forEach((creatureId) => assignedIds.add(creatureId));
  const islandStorageCreatureIds = [
    ...explicitStorageIds,
    ...ownedCreatures.map((creature) => creature.instanceId).filter((creatureId) => !assignedIds.has(creatureId))
  ];
  const normalizedState: PlayerState = {
    version: 3,
    playerName: typeof candidate.playerName === 'string' && candidate.playerName.trim().length > 0
      ? candidate.playerName
      : DEFAULT_PLAYER_STATE.playerName,
    currentMap,
    currentPosition,
    selectedCreatureId,
    ownedCreatures,
    leadCreatureId: migratedLeadCreatureId,
    followCreatureId: migratedFollowCreatureId,
    carrierCreatureIds,
    islandStorageCreatureIds,
    partyCreatures: ownedCreatures.filter((creature) => getTravelCreatureIds({
      ...DEFAULT_PLAYER_STATE,
      ownedCreatures,
      leadCreatureId: migratedLeadCreatureId,
      followCreatureId: migratedFollowCreatureId,
      carrierCreatureIds
    }).includes(creature.instanceId)),
    inventory: normalizeInventory(candidate.inventory, DEFAULT_PLAYER_STATE.inventory),
    storyFlags: isBooleanRecord(candidate.storyFlags) ? candidate.storyFlags : {},
    islandReturnMap: isReturnMapId(candidate.islandReturnMap) ? candidate.islandReturnMap : undefined,
    islandReturnPosition: isTilePosition(candidate.islandReturnPosition) ? candidate.islandReturnPosition : undefined
  };

  return normalizedState;
}

function addCreatureToTravelOrStorage(candidate: PlayerState, creatureId: string): PlayerState {
  const state = normalizePlayerState(candidate);

  if (!state.leadCreatureId) {
    return normalizePlayerState({ ...state, leadCreatureId: creatureId });
  }

  if (!state.followCreatureId && creatureId !== state.leadCreatureId) {
    return normalizePlayerState({ ...state, followCreatureId: creatureId });
  }

  if (state.carrierCreatureIds.length < QUETZALCOATLUS_CARRIER_LIMIT && !getTravelCreatureIds(state).includes(creatureId)) {
    return normalizePlayerState({ ...state, carrierCreatureIds: [...state.carrierCreatureIds, creatureId] });
  }

  if (!state.islandStorageCreatureIds.includes(creatureId) && !getTravelCreatureIds(state).includes(creatureId)) {
    return normalizePlayerState({ ...state, islandStorageCreatureIds: [...state.islandStorageCreatureIds, creatureId] });
  }

  return state;
}

function getCreatureIdForSlot(state: PlayerState, slotId: TravelTeamSlotId): string | undefined {
  if (slotId === 'lead') {
    return state.leadCreatureId;
  }

  if (slotId === 'follow') {
    return state.followCreatureId;
  }

  return state.carrierCreatureIds[Number(slotId.slice(-1)) - 1];
}

function setCreatureIdForSlot(state: PlayerState, slotId: TravelTeamSlotId, creatureId?: string): PlayerState {
  if (slotId === 'lead') {
    return normalizePlayerState({ ...state, leadCreatureId: creatureId });
  }

  if (slotId === 'follow') {
    return normalizePlayerState({ ...state, followCreatureId: creatureId });
  }

  const carrierIndex = Number(slotId.slice(-1)) - 1;
  const carrierCreatureIds = [...state.carrierCreatureIds];

  if (creatureId) {
    carrierCreatureIds[carrierIndex] = creatureId;
  } else {
    carrierCreatureIds.splice(carrierIndex, 1);
  }

  return normalizePlayerState({ ...state, carrierCreatureIds });
}

function normalizeCreatureIdList(candidate: unknown, ownedIds: Set<string>, alreadyAssigned = new Set<string>(), limit = Number.POSITIVE_INFINITY): string[] {
  if (!Array.isArray(candidate)) {
    return [];
  }

  const normalizedIds: string[] = [];

  candidate.forEach((creatureId) => {
    if (
      typeof creatureId === 'string'
      && ownedIds.has(creatureId)
      && !alreadyAssigned.has(creatureId)
      && !normalizedIds.includes(creatureId)
      && normalizedIds.length < limit
    ) {
      normalizedIds.push(creatureId);
    }
  });

  return normalizedIds;
}

function dedupeCreatures(creatures: PartyCreatureState[]): PartyCreatureState[] {
  const seen = new Set<string>();

  return creatures.filter((creature) => {
    if (seen.has(creature.instanceId)) {
      return false;
    }

    seen.add(creature.instanceId);
    return true;
  });
}

function findLegacySelectedCreatureId(creatures: PartyCreatureState[], selectedCreatureId?: string): string | undefined {
  return selectedCreatureId
    ? creatures.find((creature) => creature.dinosaurId === selectedCreatureId)?.instanceId
    : undefined;
}

function isTilePosition(candidate: unknown): candidate is TilePosition {
  if (!candidate || typeof candidate !== 'object') {
    return false;
  }

  const tile = candidate as Partial<TilePosition>;
  return Number.isInteger(tile.x) && Number.isInteger(tile.y);
}

function isMapId(candidate: unknown): candidate is MapId {
  return candidate === 'AmberleafTownScene' || candidate === 'LabScene' || candidate === 'FernTrailScene' || candidate === 'MossbankVillageScene' || candidate === 'IslandBaseScene';
}

function isReturnMapId(candidate: unknown): candidate is Exclude<MapId, 'IslandBaseScene'> {
  return candidate === 'AmberleafTownScene' || candidate === 'LabScene' || candidate === 'FernTrailScene' || candidate === 'MossbankVillageScene';
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

function isOwnedCreatureId(candidate: unknown, ownedIds: Set<string>): candidate is string {
  return typeof candidate === 'string' && ownedIds.has(candidate);
}

function isString(candidate: unknown): candidate is string {
  return typeof candidate === 'string';
}

function isBooleanRecord(candidate: unknown): candidate is Record<string, boolean> {
  return Boolean(candidate) && typeof candidate === 'object' && !Array.isArray(candidate);
}

function createCreatureInstanceId(dinosaurId: string): string {
  return `${dinosaurId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
