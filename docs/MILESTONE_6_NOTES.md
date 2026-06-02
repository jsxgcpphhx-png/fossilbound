# Milestone 6 Notes — Field Pack and Inventory Scaffolding

Milestone 6 adds a data-driven Field Pack and inventory save model while keeping all creature acquisition, capture, item balance, economy, and progression rules temporary.

## Intentional scope limits

- This is scaffolding only.
- Final capture/acquisition rules will be designed later.
- No capture probability, weakening requirements, bonding, tranquilizing, trapping, scanning, damage, type mechanics, stat formulas, economy, or item balance are implemented here.
- Field Pack behavior currently displays placeholder text or temporary notes only.
- The developer-only Debug Add Creature action is clearly marked as scaffolding and is not a capture system.

## Temporary inventory model

- `src/data/inventory.ts` defines item ids, display names, categories, descriptions, quantities, temporary effect types, and usable contexts.
- The current placeholder item set is Field Tag, Survey Lens, Basic Med Kit, Trail Snack, and Lab Pass.
- Item categories and temporary effect ids are placeholders intended to support future capture items, research tools, healing items, key items, and field-use items.
- `PlayerState.inventory` stores item quantities so localStorage save/load and Continue/New Game can preserve Field Pack contents.

## Temporary Field Pack behavior

- Survey Lens displays additional placeholder creature notes when available.
- Basic Med Kit displays that healing is not implemented yet.
- Trail Snack displays that field recovery is not implemented yet.
- Lab Pass displays that the key item is not used in battle.
- Field Tag displays that creature acquisition rules are not finalized yet.
- Debug Add Creature can add the current placeholder wild creature to the party only if there is room; otherwise it reports that placeholder storage is not implemented yet.

Future milestones should replace these temporary effect hooks with the final roster, progression, acquisition, inventory, and battle systems once those designs are decided.
