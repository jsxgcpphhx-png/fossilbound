# Fossilbound Art Direction

Fossilbound should feel like a warm, readable 2.5D pixel-art overworld about field research, fossils, and living prehistoric animals. The game should support future externally generated sprite drops without locking us into final art too early.

## Core Visual Pillars

- **Warm 2.5D pixel-art overworld:** use chunky silhouettes, tile readability, soft shadows, amber highlights, sun-baked paths, mossy greens, fossil browns, and painterly pixel clusters rather than flat neon colors.
- **Naturalistic but stylized prehistoric creatures:** creatures should be broadly recognizable as real prehistoric animals while simplified for sprite readability, animation, and small-screen play.
- **Real prehistoric animal names:** use names such as Triceratops, Velociraptor, Ankylosaurus, Parasaurolophus, Spinosaurus, and Pteranodon. Do not create Pokémon-style invented creature names for the base creatures.
- **Type-influenced visual variants:** planned type identity can influence color, markings, feathers, armor texture, posture, elemental accents, and subtle visual effects, but the animal's real-world identity must remain legible.
- **Fossilbound-specific UI and creature language:** UI should lean toward field journals, amber, strata, maps, specimen cards, museum labels, and expedition tools rather than monster-ball, gym, or Pokédex conventions.

## Creature Design Rules

1. Start from a recognizable prehistoric animal silhouette and posture.
2. Keep anatomy stylized but plausible enough that the species name still makes sense at a glance.
3. Let type identity guide secondary design traits only:
   - color palette and markings,
   - scale, feather, hide, sail, horn, or armor treatment,
   - small environmental or elemental effects,
   - posture and idle animation mood.
4. Avoid round mascot proportions that erase the original animal's identity.
5. Avoid invented hybrid creature names for standard roster entries.
6. Avoid designs, poses, UI framing, iconography, or naming patterns that feel like Pokémon clones.

## Placeholder Asset Policy

Current placeholder dinosaurs are temporary generated silhouettes only. They should communicate approximate body plans and asset dimensions, not final rendering style. Final or externally generated pixel-art sprites can replace these files later as long as they keep the same folder conventions and paths documented in the dinosaur data model.

## Asset Pipeline Direction

Future sprite drops should use this structure:

```text
src/assets/dinosaurs/battle/      # larger battle-facing sprites
src/assets/dinosaurs/overworld/   # smaller map sprites
src/assets/tiles/                 # terrain, props, buildings, shadows
src/assets/ui/                    # journal, menus, buttons, icons, frames
```

Recommended future conventions:

- Keep filenames lowercase kebab-case and species-based, such as `triceratops.svg` while placeholders are SVG, then `triceratops.png` or `triceratops.aseprite` when final art is available.
- Keep battle and overworld sprite names aligned so data-model paths can be swapped predictably.
- Prefer transparent backgrounds for creature sprites.
- Store final source art separately if needed, but keep runtime-ready files in the asset folders above.
- Review all new creature art against the design rules before adding gameplay systems that depend on it.
