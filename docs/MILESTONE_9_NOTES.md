# Milestone 9 Notes — Dialogue Polish and Action-Phase Prototype

## Dialogue system behavior

- `DialogueBox` is now the shared NPC/system dialogue surface for overworld scenes.
- Messages type out character-by-character for better game feel.
- Pressing Space, Enter, or the scene interaction key while a page is typing completes the current page instantly.
- Pressing the interaction key after a page is complete advances to the next page, or closes the box on the final page.
- Escape still closes dialogue immediately so players can recover from long text quickly.

## Text wrapping and pagination

- Dialogue text is wrapped to a conservative monospace character width based on the box body width.
- Long words are chunked to prevent text from overflowing the dialogue panel.
- Dialogue pages are limited to a fixed number of visible lines, and a small continue indicator appears when the page is ready for input.
- Battle messages use the same wrapping helper for compact message pagination where practical.

## Placeholder battle action phase

- The battle Actions menu now contains temporary prototype entries: Test Strike, Guard Pulse, and Quick Feint.
- Selecting an action opens a bounded action panel inside the battle screen.
- The player controls a small sigil with arrow keys or WASD during the phase.
- Temporary hazards such as amber sparks, fossil shards, and wind gusts spawn from data on each placeholder action.
- The phase lasts a short fixed duration and returns to the battle menu with placeholder success/failure text.

## Experimental scaffolding warning

This bullet-hell-style panel is only an experiment for future move-resolution UX. It is intentionally data-driven and must not be read as the final combat mechanic. Future milestones may decide that this phase represents attacking, defending, dodging, bond checks, timing, accuracy, another system entirely, or may remove it.

The final dinosaur roster, creature names, types, moves, stats, damage formulas, turn order, capture rules, progression, item balance, and battle balance remain undecided placeholders.
