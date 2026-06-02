# Milestone 2 Developer Notes

Milestone 2 adds the core RPG shell for moving between Amberleaf Town and the lab, choosing a temporary placeholder creature, saving party data, and viewing that party in a menu.

## Temporary creature system policy

The current selection flow is intentionally data-driven and temporary:

- The three selectable creatures are test records pulled from `src/data/dinosaurs.ts` through `src/data/creatureSelection.ts`.
- Creature roster, starter-like choices, type labels, moves, stats, battle rules, encounter rules, and progression ideas are placeholders.
- Do not build permanent gameplay assumptions around the current selectable dinosaurs or their `plannedTypeIdentity` values.
- Future roster, type-system, balance, and battle decisions should replace data first, then hook into these UI/state paths.

## Current save shape

`src/data/playerState.ts` owns localStorage persistence for:

- player name placeholder
- current map
- current position
- selected placeholder creature
- party creatures
- inventory placeholder
- story flags

The save loader still accepts the Milestone 1 `playerTile` save shape and migrates it into the broader player-state structure at load time.
