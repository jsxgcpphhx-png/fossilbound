export interface TemporaryMoveLikeEntry {
  id: string;
  label: string;
  intent: string;
  developerNote: string;
}

// These entries intentionally do not include power, accuracy, type, priority,
// target rules, or effects. They exist so menu rendering can be data-driven
// before the real move system is designed.
export const TEMPORARY_MOVE_LIKE_ENTRIES: TemporaryMoveLikeEntry[] = [
  {
    id: 'temp-test-signal',
    label: 'Test Signal',
    intent: 'Exercises the action selection flow.',
    developerNote: 'Replace with the final move/action schema after roster and battle design are approved.'
  },
  {
    id: 'temp-guard-pose',
    label: 'Guard Pose',
    intent: 'Represents a defensive-looking choice without applying a buff.',
    developerNote: 'Does not alter stats, turn order, damage, or status.'
  },
  {
    id: 'temp-reposition-call',
    label: 'Reposition Call',
    intent: 'Represents trainer communication without switching or recall rules.',
    developerNote: 'Does not switch creatures or trigger party-management mechanics.'
  }
];
