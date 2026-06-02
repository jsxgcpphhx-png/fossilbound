# Milestone 5 Notes — Battle Data Scaffolding

Milestone 5 adds temporary, data-driven battle architecture so the battle screen can keep evolving without committing to final combat design.

## Intentional scope limits

- This is scaffolding only.
- Final dinosaur roster, type identities, move rules, stats, damage formulas, capture rules, progression pacing, item behavior, switching, turn order, and balance will be designed later.
- Current action entries and HP/status values are temporary UI fixtures.
- The placeholder move-like entries deliberately omit power, accuracy, type, priority, targeting, effects, and formulas.
- Future battle mechanics should replace the temporary data modules without requiring a full rewrite of `BattleScene`.

## Temporary data modules

- `src/data/battle/battleModel.ts` defines generic participant, creature instance, action, menu state, message queue, and placeholder HP/status display shapes.
- `src/data/battle/temporaryBattleActions.ts` defines non-final action choices that only queue text.
- `src/data/battle/temporaryMoveLikeEntries.ts` defines non-mechanical move-like labels for future menu experiments.
- `src/data/battle/temporaryBattleStatuses.ts` defines temporary status labels for display only.
- `src/data/battle/temporaryBattleConfig.ts` centralizes placeholder opening text, field-pack text, and HP/status display values.
