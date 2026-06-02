# Milestone 3 Notes: Fern Trail and Encounter Scaffolding

Milestone 3 adds the first explorable route outside Amberleaf Town and a generic encounter-zone shell. This is intentionally a prototype layer, not a final battle or capture implementation.

## What is temporary

- Fern Trail encounter tables use the existing dinosaur data only as test data.
- Creature names, types, stats, move identities, encounter rates, battle math, capture rules, and final roster decisions remain undecided placeholders.
- The encounter screen is a temporary presentation shell that shows an encountered creature name, a placeholder silhouette, and the configured sprite path.
- The Observe option is non-functional scaffolding. Flee is the only working encounter action and returns to Fern Trail.

## Data-driven replacement points

- Encounter zones are defined in `src/data/encounters.ts` with tile triggers, check cadence, probability, and weighted table entries.
- Route scenes ask the encounter-zone system whether the tile stepped on belongs to a zone; route logic does not contain hard-coded creature picks.
- The encounter screen receives an encounter preview payload so a future battle scene can replace it without locking in final type charts, damage formulas, move systems, or capture mechanics.

## Recommended next milestone

Milestone 4 should focus on a data-driven field guide / discovery log or a non-combat observation flow before full battles. That would let the project validate route traversal, creature reveal language, and save data changes without committing to final combat or capture rules too early.
