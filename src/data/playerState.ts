import { SAVE_KEY } from './constants';
import {
  EARLY_GAME_DINOSAURS,
  FOSSIL_BIT_IDS,
  PLACEHOLDER_TRAIT_POOL,
  getDinosaurDefinition,
  type CreatureGender,
  type CreatureTrait,
  type CreatureVariantId,
  type FossilBitId,
  type GrowthStageName
} from './dinosaurs';
import { createStartingInventory, normalizeInventory, type InventoryQuantities } from './inventory';
import type { TilePosition } from '../types/grid';

export type MapId = 'AmberleafTownScene' | 'LabScene' | 'FernTrailScene' | 'MossbankVillageScene' | 'IslandBaseScene';
export type CreatureSource = 'starter' | 'wild' | 'fossil' | 'debug' | 'legacy';
export type FossilProgress = Partial<Record<FossilBitId, number>>;
export type FossilInventory = Record<string, FossilProgress>;

export interface PartyCreatureState {
  instanceId: string;
  dinosaurId: string;
  speciesId: string;
  nickname?: string;
  gender: CreatureGender;
  trait: CreatureTrait;
  variant: CreatureVariantId;
  level: number;
  xp: number;
  growthStage: GrowthStageName;
  currentHp: number;
  maxHp: number;
  source: CreatureSource;
}

export interface PlayerState {
  version: 4;
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
  tranqGunUpgradeLevel: number;
  fossilInventory: FossilInventory;
  storyFlags: Record<string, boolean>;
  islandReturnMap?: Exclude<MapId, 'IslandBaseScene'>;
  islandReturnPosition?: TilePosition;
}

interface LegacyMilestoneOneSave {
  playerTile?: TilePosition;
}

interface LegacyPlayerStateCandidate {
  version?: number;
  playerName?: unknown;
  currentMap?: unknown;
  currentPosition?: unknown;
  selectedCreatureId?: unknown;
  ownedCreatures?: unknown[];
  leadCreatureId?: unknown;
  followCreatureId?: unknown;
  carrierCreatureIds?: unknown;
  islandStorageCreatureIds?: unknown;
  partyCreatures?: unknown[];
  inventory?: unknown;
  tranqGunUpgradeLevel?: unknown;
  fossilInventory?: unknown;
  storyFlags?: unknown;
  islandReturnMap?: unknown;
  islandReturnPosition?: unknown;
}

export interface TravelTeamSlot {
  id: TravelTeamSlotId;
  label: string;
  description: string;
  creatureId?: string;
}

export type TravelTeamSlotId = 'lead' | 'follow' | 'carrier-1' | 'carrier-2' | 'carrier-3';

const DEFAULT_PLAYER_STATE: PlayerState = {
  version: 4,
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
  tranqGunUpgradeLevel: 0,
  fossilInventory: {},
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
  const existingOwnedCreature = state.ownedCreatures.find((creature) => creature.dinosaurId === dinosaurId && creature.source === 'starter');
  const selectedOwnedCreature = existingOwnedCreature ?? createOwnedCreatureInstance(dinosaurId, 'starter', 'normal');
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

export function addTemporaryDebugCreatureToParty(dinosaurId: string, source: CreatureSource = 'debug'): TemporaryDebugAddCreatureResult {
  const state = loadPlayerState();

  if (!isKnownDinosaurId(dinosaurId)) {
    return { added: false, message: 'Debug scaffold could not find this placeholder creature in current data.' };
  }

  const newCreature = createOwnedCreatureInstance(dinosaurId, source, 'normal');
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
      ? `${source === 'wild' ? 'Tranq prototype' : 'Debug scaffold'} added ${getKnownDinosaurName(dinosaurId)} (${newCreature.gender}, ${newCreature.trait}, ${newCreature.growthStage}, Lv.${newCreature.level}) to an empty travel team slot.`
      : `${source === 'wild' ? 'Tranq prototype' : 'Debug scaffold'} sent ${getKnownDinosaurName(dinosaurId)} (${newCreature.gender}, ${newCreature.trait}, ${newCreature.growthStage}, Lv.${newCreature.level}) to Island Base storage.`
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

export function getCreatureSummaryLine(creature: PartyCreatureState): string {
  const variantText = creature.variant === 'alternate' ? ' · Alt Variant' : ' · Base Variant';
  return `${getKnownDinosaurName(creature.dinosaurId)} ${creature.gender === 'male' ? '♂' : '♀'} · ${creature.trait} · ${creature.growthStage} · Lv.${creature.level}${variantText}`;
}

export function getFossilProgressSummary(state: PlayerState): string[] {
  const fossilSpecies = EARLY_GAME_DINOSAURS.filter((dinosaur) => dinosaur.fossilReconstruction.isFossilReconstructable);

  if (fossilSpecies.length === 0) {
    return ['No fossil reconstructable species are flagged yet.'];
  }

  return fossilSpecies.map((dinosaur) => {
    const progress = state.fossilInventory[dinosaur.id] ?? {};
    const bitCounts = FOSSIL_BIT_IDS.map((bitId) => `${bitId}:${progress[bitId] ?? 0}`).join(' ');
    return `${dinosaur.displayName} — ${bitCounts}`;
  });
}

function normalizePlayerState(candidate: Partial<PlayerState>): PlayerState {
  const currentMap = isMapId(candidate.currentMap) ? candidate.currentMap : DEFAULT_PLAYER_STATE.currentMap;
  const currentPosition = isTilePosition(candidate.currentPosition)
    ? candidate.currentPosition
    : DEFAULT_PLAYER_STATE.currentPosition;
  const legacyPartyCreatures = Array.isArray(candidate.partyCreatures)
    ? candidate.partyCreatures.map((creature) => normalizeCreatureState(creature, 'legacy')).filter(isStringlessUndefined)
    : [];
  const candidateOwnedCreatures = Array.isArray(candidate.ownedCreatures)
    ? candidate.ownedCreatures.map((creature) => normalizeCreatureState(creature, 'legacy')).filter(isStringlessUndefined)
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
  const islandStorageCreatureIds = normalizeCreatureIdList([
    ...(Array.isArray(candidate.islandStorageCreatureIds) ? candidate.islandStorageCreatureIds : []),
    ...ownedCreatures.map((creature) => creature.instanceId)
  ], ownedIds, assignedIds);

  const normalizedState: PlayerState = {
    version: 4,
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
    tranqGunUpgradeLevel: normalizeNonNegativeInteger(candidate.tranqGunUpgradeLevel, DEFAULT_PLAYER_STATE.tranqGunUpgradeLevel),
    fossilInventory: normalizeFossilInventory(candidate.fossilInventory),
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

function createOwnedCreatureInstance(dinosaurId: string, source: CreatureSource, variant: CreatureVariantId = 'normal'): PartyCreatureState {
  const dinosaur = getDinosaurDefinition(dinosaurId);
  const level = dinosaur?.placeholderBaseLevel ?? 1;
  const maxHp = getPlaceholderMaxHp(dinosaurId, level);

  return {
    instanceId: createCreatureInstanceId(dinosaurId),
    dinosaurId,
    speciesId: dinosaurId,
    nickname: undefined,
    gender: Math.random() < 0.5 ? 'male' : 'female',
    trait: PLACEHOLDER_TRAIT_POOL[Math.floor(Math.random() * PLACEHOLDER_TRAIT_POOL.length)],
    variant,
    level,
    xp: dinosaur?.placeholderStartingXp ?? 0,
    growthStage: dinosaur?.startingGrowthStage ?? 'adult',
    currentHp: maxHp,
    maxHp,
    source
  };
}

function normalizeCreatureState(candidate: unknown, defaultSource: CreatureSource): PartyCreatureState | undefined {
  if (!candidate || typeof candidate !== 'object') {
    return undefined;
  }

  const creature = candidate as Partial<PartyCreatureState> & { dinosaurId?: unknown; speciesId?: unknown };
  const dinosaurId = isKnownDinosaurId(creature.dinosaurId)
    ? creature.dinosaurId
    : isKnownDinosaurId(creature.speciesId)
      ? creature.speciesId
      : undefined;

  if (!dinosaurId || typeof creature.instanceId !== 'string') {
    return undefined;
  }

  const dinosaur = getDinosaurDefinition(dinosaurId);
  const level = normalizePositiveInteger(creature.level, dinosaur?.placeholderBaseLevel ?? 1);
  const maxHp = normalizePositiveInteger(creature.maxHp, getPlaceholderMaxHp(dinosaurId, level));
  const currentHp = Math.min(maxHp, normalizeNonNegativeInteger(creature.currentHp, maxHp));
  const gender: CreatureGender = creature.gender === 'female' ? 'female' : creature.gender === 'male' ? 'male' : Math.random() < 0.5 ? 'male' : 'female';
  const trait: CreatureTrait = PLACEHOLDER_TRAIT_POOL.includes(creature.trait as CreatureTrait)
    ? creature.trait as CreatureTrait
    : PLACEHOLDER_TRAIT_POOL[Math.floor(Math.random() * PLACEHOLDER_TRAIT_POOL.length)];
  const growthStage = dinosaur?.growthStages.some((stage) => stage.id === creature.growthStage)
    ? creature.growthStage as GrowthStageName
    : dinosaur?.startingGrowthStage ?? 'adult';

  return {
    instanceId: creature.instanceId,
    dinosaurId,
    speciesId: dinosaurId,
    nickname: typeof creature.nickname === 'string' ? creature.nickname : undefined,
    gender,
    trait,
    variant: creature.variant === 'alternate' ? 'alternate' : 'normal',
    level,
    xp: normalizeNonNegativeInteger(creature.xp, dinosaur?.placeholderStartingXp ?? 0),
    growthStage,
    currentHp,
    maxHp,
    source: isCreatureSource(creature.source) ? creature.source : defaultSource
  };
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

function normalizeFossilInventory(candidate: unknown): FossilInventory {
  const normalized: FossilInventory = {};

  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return normalized;
  }

  Object.entries(candidate as Record<string, unknown>).forEach(([dinosaurId, progress]) => {
    if (!isKnownDinosaurId(dinosaurId) || !progress || typeof progress !== 'object' || Array.isArray(progress)) {
      return;
    }

    const normalizedProgress: FossilProgress = {};
    FOSSIL_BIT_IDS.forEach((bitId) => {
      const count = (progress as Record<string, unknown>)[bitId];
      normalizedProgress[bitId] = normalizeNonNegativeInteger(count, 0);
    });
    normalized[dinosaurId] = normalizedProgress;
  });

  return normalized;
}

function getPlaceholderMaxHp(dinosaurId: string, level: number): number {
  const dinosaur = getDinosaurDefinition(dinosaurId);
  const categoryBonus = dinosaur?.growthCategory === 'big' ? 18 : dinosaur?.growthCategory === 'medium' ? 10 : 4;
  return 24 + categoryBonus + level * 2;
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

function isOwnedCreatureId(candidate: unknown, ownedIds: Set<string>): candidate is string {
  return typeof candidate === 'string' && ownedIds.has(candidate);
}

function isString(candidate: unknown): candidate is string {
  return typeof candidate === 'string';
}

function isStringlessUndefined<T>(candidate: T | undefined): candidate is T {
  return candidate !== undefined;
}

function isBooleanRecord(candidate: unknown): candidate is Record<string, boolean> {
  return Boolean(candidate) && typeof candidate === 'object' && !Array.isArray(candidate);
}

function isCreatureSource(candidate: unknown): candidate is CreatureSource {
  return candidate === 'starter' || candidate === 'wild' || candidate === 'fossil' || candidate === 'debug' || candidate === 'legacy';
}

function normalizePositiveInteger(candidate: unknown, fallback: number): number {
  return typeof candidate === 'number' && Number.isFinite(candidate) && candidate > 0 ? Math.floor(candidate) : fallback;
}

function normalizeNonNegativeInteger(candidate: unknown, fallback: number): number {
  return typeof candidate === 'number' && Number.isFinite(candidate) && candidate >= 0 ? Math.floor(candidate) : fallback;
}

function createCreatureInstanceId(dinosaurId: string): string {
  return `${dinosaurId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
