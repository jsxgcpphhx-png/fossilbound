import type { BattleAction } from './battleModel';

// Milestone 9 non-final action content. Selecting one starts an experimental,
// data-driven dodge/action-panel prototype only. These entries must not change
// HP, calculate damage, apply status effects, capture, choose turn order, or
// imply final moves/type mechanics. Future battle design may repurpose this
// phase as attacking, defending, dodging, bond timing, accuracy, or remove it.
export const TEMPORARY_BATTLE_ACTIONS: BattleAction[] = [
  {
    id: 'test-strike',
    label: 'Test Strike',
    category: 'placeholder-action',
    summary: 'Prototype action-panel sequence with falling amber sparks.',
    linkedMoveLikeEntryId: 'temp-test-signal',
    messageLines: [
      'Test Strike selected.',
      'Temporary action phase begins. Avoid hazards; no damage or battle rules will run.'
    ],
    phaseProfile: {
      durationMs: 6000,
      hazardLabel: 'Amber sparks',
      hazardColor: 0xd99c3b,
      hazardSpawnMs: 420,
      hazardSpeed: 96,
      successLine: 'Placeholder success: the signal stayed steady. HP and stats did not change.',
      failureLine: 'Placeholder feedback: the spark clipped the sigil. No HP, stats, or status changed.',
      developerNote: 'Prototype for future move-resolution experiments; not a final attack mechanic.'
    }
  },
  {
    id: 'guard-pulse',
    label: 'Guard Pulse',
    category: 'placeholder-action',
    summary: 'Prototype action-panel sequence with drifting fossil shards.',
    linkedMoveLikeEntryId: 'temp-guard-pose',
    messageLines: [
      'Guard Pulse selected.',
      'Temporary action phase begins. This is not real guarding, damage reduction, or turn order.'
    ],
    phaseProfile: {
      durationMs: 6500,
      hazardLabel: 'Fossil shards',
      hazardColor: 0xf0c878,
      hazardSpawnMs: 520,
      hazardSpeed: 82,
      successLine: 'Placeholder success: the guard rhythm held. No battle values changed.',
      failureLine: 'Placeholder feedback: a shard broke the rhythm. No battle values changed.',
      developerNote: 'Prototype for future defensive/bond/timing experiments; not final guard logic.'
    }
  },
  {
    id: 'quick-feint',
    label: 'Quick Feint',
    category: 'placeholder-action',
    summary: 'Prototype action-panel sequence with fast wind gusts.',
    linkedMoveLikeEntryId: 'temp-reposition-call',
    messageLines: [
      'Quick Feint selected.',
      'Temporary action phase begins. This is not real speed, priority, accuracy, or evasion.'
    ],
    phaseProfile: {
      durationMs: 5200,
      hazardLabel: 'Wind gusts',
      hazardColor: 0xaebf7a,
      hazardSpawnMs: 360,
      hazardSpeed: 122,
      successLine: 'Placeholder success: the feint path stayed clear. No turn rules were resolved.',
      failureLine: 'Placeholder feedback: the gust caught the sigil. No turn rules were resolved.',
      developerNote: 'Prototype for future action-resolution experiments; not a final speed mechanic.'
    }
  }
];
