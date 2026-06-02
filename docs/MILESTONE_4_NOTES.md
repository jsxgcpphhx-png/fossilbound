# Milestone 4 Notes — Battle Screen Shell

Milestone 4 adds a temporary battle-screen shell that route encounters can enter from Fern Trail. It is intentionally a layout and menu scaffold, not a battle-system implementation.

## What this milestone includes

- A dedicated `BattleScene` for encounter presentation.
- Data-driven wild and party actor view models sourced from the current placeholder dinosaur and player-state data.
- Nonfunctional placeholder HP/status boxes for both sides.
- Battle message text and a four-option menu: Observe, Actions, Field Pack, and Flee.
- Flee returns to Fern Trail at the tile saved before the encounter began.
- Observe can show temporary dinosaur description text when data exists.
- Actions and Field Pack display placeholder text.

## Temporary shell constraints

This milestone does **not** implement final battle mechanics. The scene deliberately avoids:

- damage calculations;
- attack moves;
- turn order;
- capture behavior;
- final type mechanics;
- final stat formulas;
- final balance assumptions.

Future milestones should replace the temporary actor view models and placeholder menu handlers with authored battle data and rules after the final creature roster, move system, type system, capture system, and combat math are chosen.
