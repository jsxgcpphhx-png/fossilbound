# Milestone 17 Notes: 2.5D World Layering and Depth Sorting

## World render layers

Fossilbound now keeps world-space draw order in `src/systems/WorldDepth.ts` instead of scattering small integer depths through every map. The layer constants are intentionally spaced so fixed ground layers, y-sorted world objects, foreground overlap, ambient effects, and screen-space UI do not collide:

1. `ground` — fixed base terrain such as grass and map borders.
2. `water` — fixed water and marsh base tiles.
3. `path` — fixed roads, dirt, stone, and boardwalk planks drawn above water/marsh.
4. `groundDecorations` — fixed or low detail marks such as flower beds, water-edge highlights, and shadows.
5. `lowProps` — y-sorted short props such as rocks, crates, signs, reeds, and fences.
6. `ySortedWorld` — actors and tall objects that need comparable bottom/foot ordering.
7. `tallObjectForeground` and `canopyRoofForeground` — reserved foreground bands for future split tree-canopy or roof-front atlas pieces.
8. `weatherAmbient` — reserved world-space overlay band.
9. `screenSpaceUi` — dialogue, menus, debug panels, battle/capture UI, terminal panels, and other camera-independent UI.

Ground tiles are not y-sorted. They stay on fixed layers so terrain does not shimmer or reorder as the camera moves.

## Y-depth sorting rules

Actors and most map props use this depth pattern:

```ts
depth = WORLD_RENDER_LAYERS[layer] + visualFootY + visualFootOffsetY
```

`visualFootY` is the object's world-space bottom/foot position. For atlas props, this is the image's positioned `y`, because upright atlas objects use bottom origins and draw offsets. For moving actors, `GridMover` and `FollowerSprite` refresh depth during tween updates so the player, follower creature, and NPC-like sprites sort continuously while stepping between grid cells.

Objects lower on the screen receive a larger depth and render in front of objects higher on the screen. This means the player appears in front of a tree, rock, sign, reed clump, or NPC when standing below it, and behind it when standing above/behind it.

## Origins, feet, and offsets

Atlas frame metadata in `src/data/textureAtlas.ts` is the source of truth for visual placement:

- `origin` / `originX` / `originY` — Phaser origin for the frame. Upright objects generally use `{ x: 0.5, y: 1 }` so their feet sit on the placement point.
- `drawOffset` / `drawOffsetX` / `drawOffsetY` — pixel offset from the logical tile center. Large art can extend above or around a tile without changing the movement grid.
- `visualFootOffsetY` — optional extra depth offset when the visible foot should sort slightly below or above the placement point.
- `collisionFootprint` — logical grid footprint in cells. This is separate from the atlas frame's visual pixel size.
- `blocksMovement` — documents whether the object should block grid movement.
- `overlapsPlayer` — marks art intended to visually cover actors when the actor is behind it.
- `splitForegroundFrameId` — reserved for future split objects where a base and a canopy/roof foreground piece use different atlas frames.

The atlas still uses explicit source rectangles. Do not replace the atlas with uniform 32x32 slicing; visual frames may be 32x32, 64x64, 96x96, or another explicit size.

## Tall-object foreground overlap

Tall objects currently use bottom-origin y-sorting as the default overlap model. Trees, houses, labs, huts, tents, and roost-sized props sort by their lower visual foot. When the player or follower is behind the object's foot y, the whole tall object draws over the actor; when the actor is physically lower on the screen, the actor draws over the object.

`WorldDepth.ts` reserves `tallObjectForeground` and `canopyRoofForeground` for follow-up atlas splits. To add a split tree or building later:

1. Add a lower/base frame and an upper/foreground frame to `OVERWORLD_TEXTURE_FRAMES`.
2. Give the base frame `depthMode: 'ySort'` and the normal collision footprint.
3. Give the foreground frame `depthMode: 'foreground'` or a y-sorted foreground metadata entry, depending on whether it should always overlay or only overlay around its foot line.
4. Set `splitForegroundFrameId` on the base frame so object authoring tools can associate the pieces.

## Adding a new layered object

1. Add or refine the atlas frame in `src/data/textureAtlas.ts` with the exact source rectangle and intended visual size.
2. Set `origin`, `drawOffset`, `layer`, and `depthMode` explicitly.
3. Set `collisionFootprint` and `blocksMovement` according to gameplay, not according to the art's pixel bounds.
4. Draw it with `addPropTile` or `addAtlasTexture` from `src/systems/OverworldTileset.ts`.
5. If the object is an actor, call `updateWorldDepth(sprite, actorDepthMetadata())` and refresh it during movement tweens.
6. Keep UI in UI classes or screen-space helpers with `setScrollFactor(0)` and the `screenSpaceUi` depth range.

## Scene-specific composition notes

- Mossbank boardwalk/path tiles are fixed above water and marsh base layers, while reeds, signs, rocks, crates, trees, NPCs, the roost scaffold, and huts participate in y-depth sorting.
- Fern Trail trees, reeds, signs, rocks, and encounter-grass details now sit in world layers instead of a single flat prop band.
- Amberleaf Town buildings, trees, signs, rocks, crates, fences, reeds, Dr. Sable, the player, and the follower share the same depth model, while lab/town UI remains screen-space.
