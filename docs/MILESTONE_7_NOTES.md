# Milestone 7 Notes — Travel Team and Island Base Storage Scaffolding

Milestone 7 replaces the simple placeholder party list with Fossilbound's core travel-team structure while keeping all creature roster, typing, moves, stats, battle formulas, and capture rules temporary.

## Core creature-management direction

- The player can travel with up to four active prehistoric creatures:
  - one Lead creature, used as the default battle participant;
  - one Follow creature, shown as a simple overworld companion placeholder;
  - three Quetzalcoatlus Carrier reserve slots for backup traveling creatures.
- All other owned creatures are assigned to Island Base storage.
- Quetzalcoatlus travel is available as placeholder flow from the Travel Team menu and opens a simple Island Base scene.

## Save migration and persistence

- `PlayerState` now stores `ownedCreatures`, `leadCreatureId`, `followCreatureId`, `carrierCreatureIds`, and `islandStorageCreatureIds`.
- Older saves with `partyCreatures` are normalized into the new model instead of being wiped.
- A single older selected placeholder creature becomes the Lead creature when possible.
- The legacy `partyCreatures` field is still emitted as a compatibility mirror for now, but new systems should read the Travel Team fields.

## Placeholder systems that remain intentionally unfinished

- Creature names, stats, types, moves, battle rules, capture rules, acquisition balance, and final storage progression remain placeholder-only.
- Debug Add Creature remains a developer scaffold. It fills empty travel-team slots first and sends overflow creatures to Island Base storage.
- The Island Base scene is not a final island map; it is a minimal returnable storage/travel placeholder.
- The follower sprite is generated silhouette art and is not final creature art.

Future milestones should build on this structure with real storage UI, island interactions, final travel affordances, and eventual battle/capture designs once those systems are ready.
