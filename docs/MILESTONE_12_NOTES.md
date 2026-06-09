# Milestone 12 Notes — Continuous Overworld Presentation

Milestone 12 keeps the overworld implemented as separate Phaser scenes, but the region is now staged to feel like one connected place instead of isolated left-to-right rooms.

## Continuity approach

- Amberleaf Town, Fern Trail, and Mossbank Village are still scene-based for this milestone.
- The current implementation uses an **illusion of continuity** rather than true seamless streaming:
  - Larger maps exceed the viewport so the camera moves through each area.
  - The Amberleaf east road, Fern Trail west/east road, and Mossbank west boardwalk use aligned exits and return spawns.
  - Paths, fences, tree lines, fern beds, reeds, marsh grass, and water edges visually carry from one scene to the next.
  - Short camera fades soften the remaining scene handoffs.
- Mossbank still comes after Fern Trail geographically, with Fern Trail becoming wetter and reedier before opening onto Mossbank boardwalks.

## Camera behavior

- Overworld scenes use a shared camera helper that:
  - sets scene-specific world bounds from tile-map dimensions;
  - applies a modest zoom for a more intimate 2.5D feel;
  - follows the player with lerp smoothing to avoid hard locked-room movement;
  - fades in after scene creation to reduce abrupt cuts.
- Debug, dialogue, party menu, and location labels are fixed to the screen so camera zoom and scrolling do not pull UI into the world.

## Visual/world polish

- Amberleaf Town has a broader town green, a clearer research-lab focal point, more houses/props, a guided east road, and warmer path detail.
- Fern Trail now reads as a connective route, with curved path segments, fossil brush encounter beds, trees, rocks, signs, and increasingly wet marsh cues near Mossbank.
- Mossbank Village has denser wetland/research-settlement staging: boardwalks, tents, fossil shed, roost props, reeds, marsh pools, crates, rocks, and signage.

## Future expansion

- Replace scene handoffs with streamed chunks or a single regional map when the world scope justifies the refactor.
- Extend Mossbank north/east into additional wetland research areas without changing combat, capture, type, or progression rules prematurely.
- Continue improving prop placement and tile transitions as final overworld art arrives from the dinosaur/data art pipeline.
