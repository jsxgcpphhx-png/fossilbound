# Milestone 18 Notes — Pack / Field Pack Repair

Milestone 18 repairs the temporary Pack and battle Field Pack scaffolding without adding final economy, final item balance, shop systems, type mechanics, or final capture rules.

## Pack data structure

- `PlayerState.inventory` is a stable `Record<string, number>` keyed by inventory item id.
- Quantities are normalized through `normalizeInventory`, which drops unknown ids, floors valid numbers, and clamps negative or invalid quantities to zero.
- New and migrated saves use the starting inventory fallback so older saves that lack inventory fields receive the current placeholder item ids safely.
- Zero-quantity non-key items are omitted from menu entries, while key items remain visible so key-item UI can be tested.

## Item definition structure

Temporary item definitions live in `src/data/inventory.ts` and include:

- `id`
- `displayName`
- `category`
- `description`
- `temporaryEffectType`
- `usableContexts`
- optional `consumesOnUse`

The placeholder item set currently includes Field Tag, Survey Lens, Basic Med Kit, Trail Snack, Lab Pass, and Tranq Dart Prototype. These are scaffolding entries only. They do not define final capture odds, healing values, progression gates, prices, shops, dart economy, or item balance.

## Overworld Pack menu state

The overworld Pack is implemented as a fixed screen-space UI (`PackMenu`) so it is not affected by world camera zoom or depth sorting. It opens with `I` or `B` in Amberleaf Town, Dr. Sable's Lab, Fern Trail, and Mossbank Village.

Controls:

- Left/Right or A/D changes category.
- Up/Down or W/S changes item selection.
- Enter/Space inspects or attempts to use the selected item.
- Escape/Backspace closes the Pack.

When the Pack is open, movement is blocked only while the UI is visible. Closing the Pack restores normal overworld control. Empty categories render a safe message and cannot crash selection.

## Battle Field Pack flow

BattleScene keeps Field Pack as a battle-menu mode. The main battle menu can open it through the Field Pack option or the `P`, `I`, or `B` shortcuts.

Controls:

- Arrow keys or WASD move selection.
- Enter/Space confirms.
- Escape/Backspace returns to the previous battle menu/state.

Selecting an item routes through the shared inventory use helper. Items usable in battle display placeholder results. Items that are not usable in battle, such as key items or field-only placeholders, display a clean “This cannot be used here.” style message and remain in battle flow. The separate Capture / Tranq Sequence prototype remains available and is not duplicated into final item economy.

## Inventory save migration

`normalizePlayerState` continues to normalize old saves into the current `PlayerState.version` and calls `normalizeInventory(candidate.inventory, DEFAULT_PLAYER_STATE.inventory)`. This means saves from before inventory existed, saves missing newly added placeholder ids, and saves with malformed quantities are repaired during load/save normalization.

## Still placeholder

The following remain intentionally unresolved:

- final item balance
- final healing behavior
- final shop/economy
- final capture economy and dart spending
- final acquisition/capture rules
- final progression gates for key items
- final battle mechanics and type mechanics
