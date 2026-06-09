# Milestone 14 Notes — Mossbank cutoff, UI scale, labels, and polish

## Camera and UI scaling

- Overworld camera configuration now clamps gameplay zoom to `1` so screen-space UI drawn with `setScrollFactor(0)` is not magnified, clipped, or pushed out of the viewport by world zoom.
- Future UI work should remain screen-space: dialogue boxes, menus, debug panels, battle UI, and capture UI should use fixed viewport coordinates and avoid depending on world tile positions.
- If a future scene needs a stronger world zoom, add a dedicated UI camera/layer first so text scale remains stable and readable.

## Mossbank map cutoff fix

- Mossbank now reports its map width from the widest terrain row and treats missing row cells as blocked border tiles. This prevents the camera/world bounds from being smaller than the playable wetland layout.
- The Fern Trail handoff remains at the west Mossbank boardwalk and returns to Fern Trail near its Mossbank-side exit.
- Player start positions are still validated against walkable terrain before spawning.

## Text, terminal, and debug standards

- Dialogue continues to wrap and paginate through the shared `DialogueBox`; interaction keys complete the current typewriter page first, then advance or close.
- Debug text is no longer shown during normal play. Toggle it with `T` when needed.
- Debug overlays should stay small, clear before redraw via `setText`, and contain only useful fields such as scene key and tile coordinates.

## Reduced-label approach and signs

- Do not place constant floating labels over every object, building, NPC, creature, or zone.
- Use small sign props for place information. The sign should display text only when the player faces it and presses the interaction key.
- Current sign standards:
  - Amberleaf Town sign: identifies the town and routes.
  - Fern Trail sign: explains trail direction and brush.
  - Mossbank Village/Wetlands signs: identify the wetland village and boardwalk paths.
  - Dr. Sable’s lab sign: marks the lab without a floating label.
  - Quetzalcoatlus roost sign: marks the roost through interaction only.

## Landscape and building visual standards

- Terrain should use subtle, low-contrast variation: small grass strokes, marsh shadows, boardwalk lines, and water edge highlights.
- Keep paths and boardwalks clear enough to navigate; avoid noisy patterns that obscure walkable routes.
- Buildings should avoid plain rectangles by including roofs, wall shading, doors, windows, shadows, and small nearby props.
- Mossbank should read as a wetland research village: raised planks, reeds, marsh pools, huts/sheds, and an intentional Quetzalcoatlus roost.
