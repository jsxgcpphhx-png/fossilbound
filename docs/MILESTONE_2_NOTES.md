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

## Milestone 3 encounter scaffolding

Fern Trail introduces the first route and fossil-brush encounter zones. This is temporary scaffolding only:

- Encounter tables in `src/data/encounters.ts` use existing dinosaur records as replaceable test data.
- Step chances and weights are placeholders and should not be treated as final pacing or balance.
- The encounter scene only supports Observe/Flee presentation; Flee returns to the route, while full battles, moves, damage formulas, type mechanics, and capture are intentionally not implemented.
- Future milestones should replace the data tables and encounter-result model before adding final battle or capture rules.
