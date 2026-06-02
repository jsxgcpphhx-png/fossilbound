import type { PlaceholderHpStatusDisplay } from './battleModel';

export interface TemporaryBattleConfig {
  openingMessages: string[];
  defaultPlayerCreatureName: string;
  defaultWildCreatureName: string;
  fieldPackTitle: string;
  fieldPackLines: string[];
  placeholderHp: {
    player: PlaceholderHpStatusDisplay;
    wild: PlaceholderHpStatusDisplay;
  };
}

// Battle scaffolding only. The final dinosaur roster, types, moves, stats,
// formulas, capture rules, progression pacing, item rules, and balance are not
// defined here and should replace these temporary values later.
export const TEMPORARY_BATTLE_CONFIG: TemporaryBattleConfig = {
  openingMessages: [
    'A prehistoric creature appeared!',
    'Milestone 5 battle data scaffolding is active.'
  ],
  defaultPlayerCreatureName: 'Field Companion',
  defaultWildCreatureName: 'Unknown Creature',
  fieldPackTitle: 'Field Pack',
  fieldPackLines: [
    'Field Pack placeholder opened.',
    'Inventory actions, capture rules, and item effects will be designed later.'
  ],
  placeholderHp: {
    player: {
      currentHp: 24,
      maxHp: 24,
      statusLabelId: 'temp-clear',
      note: 'Party placeholder'
    },
    wild: {
      currentHp: 18,
      maxHp: 18,
      statusLabelId: 'temp-watchful',
      note: 'Wild placeholder'
    }
  }
};
