# Fossilbound

Fossilbound is a browser-based prehistoric creature RPG prototype inspired by classic handheld adventure pacing. It uses original setting, story setup, UI, and placeholder-only art while keeping its creatures grounded in recognizable prehistoric animal names.

## Milestone 1 Features

- Vite + TypeScript + Phaser 3 project setup.
- Title screen with keyboard and mouse start controls.
- Playable overworld map: **Amberleaf Town**.
- Placeholder player character.
- Visual direction documentation for a warm 2.5D pixel-art overworld and naturalistic prehistoric creatures.
- Starter asset pipeline folders for dinosaur battle sprites, overworld sprites, tiles, and UI.
- Early dinosaur data model entries for Triceratops, Velociraptor, Pteranodon, Ankylosaurus, Parasaurolophus, and Spinosaurus.
- Grid/tile-based top-down movement.
- Collision boundaries for map edges, buildings, water, fences, trees, and NPCs.
- One NPC: **Dr. Sable**.
- Dialogue box when interacting with Dr. Sable.
- Debug panel showing the player's current tile coordinates.
- Browser `localStorage` save for the player's last tile position.
- GitHub Pages deployment workflow configured for the `/fossilbound/` repository path.

## Current Prototype Notes

- Milestone 6 adds a data-driven Field Pack inventory scaffold with temporary Field Tag, Survey Lens, Basic Med Kit, Trail Snack, and Lab Pass items.
- Inventory quantities are stored in `PlayerState` and persist through browser `localStorage` save/load.
- Field Pack item behavior is placeholder-only; final capture/acquisition rules, item balance, economy, healing, field recovery, and progression are intentionally not implemented yet.
- A developer-only Debug Add Creature action exists only as temporary acquisition scaffolding for testing party persistence.
- Milestone 13 adds a 3-round tranquilizer lock-on capture prototype with difficulty-scaled targets, timers, obstacle patterns, and immediate obstacle-hit failure.
- Capture tuning, dart economy, tranq gun upgrades, final roster, damage formulas, turn order, type balance, and fossil cave progression remain intentionally placeholder.

## Run Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build a production bundle:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## How to Play

1. Open the app in a browser.
2. Press **Enter** or click the title screen to start.
3. Move around Amberleaf Town with **Arrow keys** or **WASD**.
4. Stand next to **Dr. Sable**, face her, and press **E** or **Space** to talk.
5. Press **E** or **Space** again to advance/close dialogue pages.
6. In battle, choose **Capture** or Field Pack → **Tranq Sequence** to test the 3-round tranquilizer capture prototype.
7. Watch the top-left debug panel for your current tile coordinates.

## Deployment

The Vite `base` is set to `/fossilbound/` in `vite.config.ts`, so built assets resolve correctly when deployed to GitHub Pages for this repository.

The GitHub Actions workflow in `.github/workflows/deploy-pages.yml` builds the app and publishes the `dist/` directory to GitHub Pages whenever changes are pushed to `main`.

## Tileset Notes

- The overworld uses the uploaded art at `src/assets/tilesets/Overworld.png`, but the PNG is treated as a texture atlas/sprite sheet, **not** a uniform 32×32 tileset.
- Atlas frame rectangles live in `src/data/textureAtlas.ts`. Add or adjust a texture by editing its `x`, `y`, `width`, and `height` source rectangle; those numbers are atlas pixels measured from the PNG top-left.
- The logical movement/collision grid remains `TILE_SIZE` (`32`) so walking, saves, camera bounds, and simple collision footprints stay stable. Visual texture size is independent: rocks, reeds, trees, buildings, boardwalk pieces, and water frames may use different source sizes and origins.
- `origin` controls the Phaser anchor, `drawOffset` moves the visual relative to a logical tile center, and `collisionFootprint` documents the intended simple movement footprint instead of using the full art bounds.
- Animated atlas assets define explicit frame rectangles and frame order in `OVERWORLD_ANIMATIONS`; water currently loops the named `terrain.water.frame.*` rectangles without grid slicing the whole PNG.
- Several rectangles are documented as approximate carry-forwards from the earlier implementation. If a texture looks misaligned, refine only that frame's atlas rectangle/offset in `src/data/textureAtlas.ts` rather than reintroducing automatic 32×32 sheet slicing.
- No separate license or attribution text was included with the uploaded tileset in this repository; add creator/license attribution here if those terms are provided later.
