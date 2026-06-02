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


## Milestone 2 Additions

- Dr. Sable's lab interior connected to Amberleaf Town by a simple door warp.
- Starter selection for **Triceratops**, **Velociraptor**, or **Pteranodon** using temporary placeholder silhouettes only.
- Player state save data for name placeholder, current map, current position, selected starter, party creatures, inventory placeholder, and story flags.
- Continue option on the title screen when saved state exists.
- Basic party menu opened with **P** and closed with **P** or **Esc**.

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
5. Walk through the marked **LAB** door to enter Dr. Sable's lab.
6. Face the starter table and press **E** or **Space** to choose Triceratops, Velociraptor, or Pteranodon.
7. Press **P** to open or close the party menu; press **Esc** to close menus.
8. Watch the top-left debug panel for your current tile coordinates.

## Deployment

The Vite `base` is set to `/fossilbound/` in `vite.config.ts`, so built assets resolve correctly when deployed to GitHub Pages for this repository.

The GitHub Actions workflow in `.github/workflows/deploy-pages.yml` builds the app and publishes the `dist/` directory to GitHub Pages whenever changes are pushed to `main`.
