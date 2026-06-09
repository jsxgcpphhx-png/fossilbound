# Milestone 16 Notes — Overworld texture atlas correction

## Atlas, not a grid-sliced tileset

`src/assets/tilesets/Overworld.png` must be loaded as a single texture atlas image. Do not load it with Phaser's `spritesheet` helper or assume that every useful piece of art fits into a uniform 32×32 grid. The texture definitions are centralized in `src/data/textureAtlas.ts`.

## How to add or adjust frame rectangles

Each atlas frame defines an explicit source rectangle:

- `id`: stable frame name used by scene helpers.
- `x` / `y`: top-left pixel in `Overworld.png`.
- `width` / `height`: exact source rectangle size in pixels.
- `origin`: optional Phaser anchor; terrain normally uses center, taller props usually use bottom-center.
- `drawOffset`: optional visual offset from the logical tile center.
- `collisionFootprint`: optional documentation for the simple logical blocking area.

If a rock, tree, boardwalk, house, reed clump, or water frame is misaligned, refine that frame in `src/data/textureAtlas.ts`. Do not globally slice the PNG into 32×32 cells to fix one asset.

## Animated frames

Animated assets are listed in `OVERWORLD_ANIMATIONS`. Water uses explicit `terrain.water.frame.*` rectangle ids, and the overworld atlas system registers a looping Phaser animation from those named frames. Only assets with a documented animation entry should animate.

## Grid vs. art vs. collision

- Logical grid size: `TILE_SIZE` remains 32 px for movement, saved positions, transition checks, encounter zones, camera/world bounds, and simple tile collision.
- Visual texture size: atlas frames may be 16×16, 32×32, 64×64, 96×96, or any exact rectangle from the PNG.
- Collision footprint: gameplay should continue to use simple map tile codes or documented footprints instead of blocking the full visual silhouette of tall art.
- Draw offset/origin: use these to make larger objects sit naturally on their map cell while allowing foliage/buildings to extend above or around the movement tile.
