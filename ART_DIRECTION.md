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

## Milestone 10 Placeholder Sprite Standards

These standards lock current placeholder proportions without declaring final art. New placeholder sprites should be original, generated or code-made pixel art only, with transparent backgrounds where practical and crisp pixel rendering (`pixelArt: true`, no smoothing).

| Asset role | Runtime size | Notes |
| --- | ---: | --- |
| Player overworld sprite | 32×32 px | Front-facing field researcher, readable hat/hair, torso, satchel, arms, legs, and 1–2 px highlight clusters. |
| NPC overworld sprite | 32×32 px | Same footprint as player; varied silhouettes through hair, coats, palettes, and props rather than size changes. |
| Follower creature sprite | 32×32 px | Compact companion silhouette with head, body, tail/crest, feet, shadow, and a limited accent color. |
| Overworld creature sprite | 32×32 px target | Used for small map creatures/followers; preserve tile readability and avoid noisy details. |
| Battle silhouette | about 192×128 px visual footprint | Larger staged silhouettes may be drawn with Phaser primitives for now; keep species body plan recognizable but non-final. |
| Quetzalcoatlus placeholder | 96×64 px | Long-winged carrier silhouette with grounded roost readability; do not imply final travel mechanics. |

### Placeholder Color, Outline, and Shading Rules

- Use 3–5 colors per sprite: dark outline, mid body color, lighter plane, warm amber accent, and optional tiny eye/highlight.
- Prefer dark moss/charcoal outlines (`#17251d`, `#243126`) with readable warm highlights (`#d99c3b`, `#f0c878`).
- Use small rectangular clusters and asymmetry to imply volume; avoid single flat blocks.
- Every overworld character/creature should include a soft oval shadow to ground it on the map.
- Keep silhouettes original and Fossilbound-specific. Do not copy Pokémon sprites, poses, UI framing, names, maps, or creature language.

### Future Animation Frame Rules

- Idle/walk animation should preserve the same 32×32 or 96×64 canvas sizes.
- Future player/NPC walk cycles should start with 2 frames per direction, then expand only after movement timing is stable.
- Follower creatures should use low-motion bob/tail/foot offsets so they remain readable behind the player.
- Quetzalcoatlus should eventually get separate roost, carry, and travel silhouettes, but current visuals remain placeholder scaffolding.

## Milestone 10 UI, Intro, and Text Standards

- Menus should use the field-journal palette: parchment panels, dark moss borders, amber accent strokes, clear title labels, and visible keyboard hints.
- Panels need enough padding for monospace text and should avoid writing directly against panel edges.
- Selected menu states should use both a marker and a color/background change when possible.
- Debug/developer text should be compact, readable, and toggleable rather than permanently intrusive.
- Dialogue, intro text, battle messages, and menu descriptions should use shared wrapping/pagination helpers where possible. Space/Enter should complete the current typewriter page first, then advance to the next page.
- The opening intro plays only from New Game, before Amberleaf Town. It is a staged placeholder arrival sequence with typewriter exposition and a visible skip prompt; Continue loads existing save data and does not replay it.
- The bullet-hell/action phase remains experimental presentation scaffolding. It does not define final damage, turn order, move categories, type rules, capture rules, stats, roster scope, progression, or balance.
