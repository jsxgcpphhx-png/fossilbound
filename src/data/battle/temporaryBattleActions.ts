import type { BattleAction } from './battleModel';

// Milestone 5 non-final action content. Selecting one only queues text; it must
// not change HP, calculate damage, apply status effects, capture, or advance
// final battle turns.
export const TEMPORARY_BATTLE_ACTIONS: BattleAction[] = [
  {
    id: 'test-action',
    label: 'Test Action',
    category: 'placeholder-action',
    summary: 'Prints placeholder text for the future action resolver.',
    linkedMoveLikeEntryId: 'temp-test-signal',
    messageLines: [
      'Test Action selected.',
      'Placeholder only: no damage, turn order, status, or capture rules ran.'
    ]
  },
  {
    id: 'defensive-stance',
    label: 'Defensive Stance',
    category: 'placeholder-action',
    summary: 'Shows where a defensive action could appear later.',
    linkedMoveLikeEntryId: 'temp-guard-pose',
    messageLines: [
      'Defensive Stance selected.',
      'The creature holds position, but no stats or effects changed.'
    ]
  },
  {
    id: 'call-back',
    label: 'Call Back',
    category: 'placeholder-action',
    summary: 'Shows a future command slot without implementing switching.',
    linkedMoveLikeEntryId: 'temp-reposition-call',
    messageLines: [
      'Call Back selected.',
      'Future party and switching rules are still intentionally undefined.'
    ]
  }
];
