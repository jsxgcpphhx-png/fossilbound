export interface TemporaryStatusLabel {
  id: string;
  label: string;
  displayText: string;
  description: string;
}

// Milestone 5 placeholder labels only. These are UI scaffolding values, not a
// final status-effect list or ruleset.
export const TEMPORARY_STATUS_LABELS: TemporaryStatusLabel[] = [
  {
    id: 'temp-clear',
    label: 'Clear',
    displayText: 'Status: —',
    description: 'No placeholder condition is shown.'
  },
  {
    id: 'temp-watchful',
    label: 'Watchful',
    displayText: 'Status: Watchful?',
    description: 'A non-mechanical label reserved for future encounter readability tests.'
  },
  {
    id: 'temp-unknown',
    label: 'Unknown',
    displayText: 'Status: TBD',
    description: 'Fallback label when temporary battle data is incomplete.'
  }
];

export function getTemporaryStatusLabel(statusLabelId: string): TemporaryStatusLabel {
  return TEMPORARY_STATUS_LABELS.find((status) => status.id === statusLabelId)
    ?? TEMPORARY_STATUS_LABELS[TEMPORARY_STATUS_LABELS.length - 1];
}
