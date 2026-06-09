export type BattleParticipantRole = 'player' | 'wild';

export interface PlaceholderHpStatusDisplay {
  currentHp: number;
  maxHp: number;
  statusLabelId: string;
  note: string;
}

export interface BattleCreatureInstance {
  instanceId: string;
  dinosaurId?: string;
  displayName: string;
  spritePath?: string;
  description?: string;
  artNotes?: string;
  placeholderHpStatus: PlaceholderHpStatusDisplay;
}

export interface BattleParticipant {
  participantId: string;
  role: BattleParticipantRole;
  label: string;
  creature: BattleCreatureInstance;
}

export type BattleActionCategory = 'placeholder-action' | 'field-pack' | 'observe' | 'flee';

export interface TemporaryActionPhaseProfile {
  durationMs: number;
  hazardLabel: string;
  hazardColor: number;
  hazardSpawnMs: number;
  hazardSpeed: number;
  successLine: string;
  failureLine: string;
  developerNote: string;
}

export interface BattleAction {
  id: string;
  label: string;
  category: BattleActionCategory;
  summary: string;
  messageLines: string[];
  linkedMoveLikeEntryId?: string;
  phaseProfile?: TemporaryActionPhaseProfile;
}

export type BattleMenuMode = 'main' | 'observe' | 'actions' | 'field-pack' | 'action-phase' | 'capture-phase';

export interface BattleMenuState {
  mode: BattleMenuMode;
  selectedIndex: number;
}

export interface BattleMessageQueue {
  activeLine?: string;
  pendingLines: string[];
}
