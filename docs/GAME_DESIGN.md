# Fossilbound Game Design Notes

Milestone 11 locks in several creature-system directions while keeping implementation intentionally data-driven and provisional. These notes are developer-facing rules and scaffolding, not final balance.

## Starter Rules

Starters are selected in Dr. Sable's lab and currently create owned creature instances rather than bare species ids.

| Starter | Type | Growth category | Starts as | Growth path | Variant |
| --- | --- | --- | --- | --- | --- |
| Velociraptor | Fire | small | adult | adult only | normal/base only |
| Triceratops | Rock | big | baby | baby → adolescent → adult | normal/base only |
| Parasaurolophus | Grass | medium | juvenile | juvenile → adult | normal/base only |

Starter selection must not offer alternate/rare variants yet. Alternate starter typing fields should remain blank/null until variant design is intentionally revisited.

## Growth-Stage Rules

- Small/weak creatures use one stage, start as adults, and do not grow further.
- Medium creatures use two stages, start as juveniles, and grow to adults.
- Big/strong creatures use three stages, start as babies, then adolescent, then adult.
- Leveling is XP-based.
- Stage progression should remain data-driven and level-gated later. Current threshold values are placeholders used to prove the data shape only.
- Do not add final damage formulas, turn order, type charts, or full stat curves as part of this scaffold.

## Owned Creature Instance Rules

Every acquired creature is stored as an owned instance. The instance must include:

- unique instance id
- species id / dinosaur id
- nickname placeholder
- gender
- trait
- variant (`normal` or `alternate`)
- level
- XP
- current growth stage
- current HP placeholder
- max HP placeholder
- source (`starter`, `wild`, `fossil`, `debug`, or `legacy`)

Species definitions describe what a creature can be; owned instances describe the creature the player actually has.

## Gender Rules

- Each acquired creature gets a random gender.
- Current placeholder odds are 50% male and 50% female.
- Gender belongs on the owned creature instance, not only on species data.

## Trait Rules

Each acquired creature gets one random placeholder trait. The temporary trait pool is:

- Bold
- Swift
- Hardy
- Alert
- Stubborn
- Curious

Traits currently have no mechanical effects. Do not finalize trait effects until broader combat/stat systems exist.

## Variant Rules

Each species has:

- normal/base version
- alternate rare variant similar in role to a shiny

Future alternate variants may be visually different, slightly stronger, and possibly typed differently. Current data includes nullable alternate type overrides but does not implement wild rare variant spawning. Starters are normal/base variant only.

## Primal Rage Notes

Primal Rage is Fossilbound's future adult-only powered form system, similar in broad scope to a temporary special transformation. Current scaffolding includes:

- `canUsePrimalRage`
- `primalRageFormId`
- developer notes
- explicit adult-only requirement

No activation mechanic, item requirement, stat change, form art, damage formula, or balance has been implemented.

## Tranquilizer Capture Rules

Capture begins during an encounter/battle after the player weakens a wild creature. Capture uses a dedicated tranquilizer sequence, not the normal battle action bullet-hell phase.

Prototype sequence rules:

- Player controls a cursor inside a bounded panel.
- A slow moving target/circle appears.
- Player must keep the cursor inside the moving target for a required lock-on duration.
- The sequence has a visible timer and progress meter.
- On success, the creature is temporarily tranquilized and routed into Travel Team if room exists, otherwise Island Base storage.
- On failure, control returns to the battle menu.

Difficulty should be data-driven from placeholder fields:

- creature level
- creature rarity
- current HP ratio
- tranquilizer gun upgrade level
- target size
- target speed
- required lock-on duration
- total time limit

Stronger, higher-level, or rarer creatures should become harder through smaller/faster targets, longer required tracking, and possibly shorter timers. Weakened creatures should become easier through larger/slower targets and shorter required tracking.

Current placeholder sequence variations are:

- steady moving target
- drifting target
- pulsing target
- target with light hazards

## Tranquilizer Gun Upgrade Scaffolding

The save data includes `tranqGunUpgradeLevel`. Upgrade definitions are placeholders only. Future upgrades may improve capture difficulty by adjusting target size, target movement, required lock-on time, timer leniency, or hazard mitigation.

Do not add shop, economy, crafting, upgrade costs, or final tranquilizer progression yet.

## Fossil Reconstruction Rules

Fossil zones, caves, and dig sites are planned as a major progression system. To reconstruct a fossil creature, the player must collect five fossil bits:

- skull
- ribs
- tail
- arm
- leg

Future rules:

- Better/rarer creatures have lower fossil drop chances.
- Harder caves have higher fossil drop rates.
- Once all five bits are collected for a creature, the player returns to the arena/museum.
- The fossil creature is recreated.
- The player fights it as a boss.
- After that boss encounter, it can be captured.

Current implementation should stop at data/save scaffolding and optional debug progress display. Do not implement full fossil caves, loot tables, museum reconstruction, or boss fights yet.

## Save Migration Rules

Older saves must not crash. If legacy party or owned creature data only contains instance ids and dinosaur ids, migration should fill safe placeholders for gender, trait, variant, level, XP, growth stage, HP, and source. Migration should preserve existing travel team, carrier, storage, inventory, story, and map data wherever possible.
