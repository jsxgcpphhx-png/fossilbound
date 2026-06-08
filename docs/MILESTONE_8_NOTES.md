# Milestone 8 Notes — Mossbank Village and Sprite Pass

Milestone 8 adds Mossbank Village as the second outdoor town after Fern Trail and improves generated placeholder sprite quality for the current prototype layer.

## Mossbank Village scope

- Mossbank Village is an early placeholder wetland/fossil-research town.
- Current NPCs, dialogue, route purpose, object placement, and story hooks are temporary and can change later.
- The village is intentionally built from original generated placeholder shapes only: no copyrighted external assets, copied creature designs, copied maps, or copied UI.
- Mossbank connects from the east side of Fern Trail and returns to Fern Trail from the west side of the village.

## Placeholder sprite sizes

Keep pixel rendering crisp and avoid blurry scaling. Phaser remains configured with `pixelArt: true`; canvas placeholders should keep `imageSmoothingEnabled = false`.

| Asset role | Current placeholder key/path | Prototype size |
| --- | --- | --- |
| Player overworld sprite | `player`, `lab-player` canvas textures | 32×32 px |
| Dr. Sable sprite | `dr-sable`, `lab-dr-sable` canvas textures | 32×32 px |
| Generic NPC sprite | `generic-npc` canvas texture | 32×32 px |
| Follower creature sprite | `follower-placeholder` canvas texture | 32×32 px |
| Overworld creature SVGs | `src/assets/dinosaurs/overworld/*.svg` | 32×32 px |
| Battle creature SVGs | `src/assets/dinosaurs/battle/*.svg` | 96×96 px |
| Quetzalcoatlus roost/travel placeholder | `quetzalcoatlus-placeholder` canvas texture | 96×64 px |

## Art notes

- The sprite pass is still placeholder art, not final character or creature art.
- Use clean silhouettes, small highlight clusters, warm shadows, and readable 2.5D object height.
- Mossbank should feel denser and warmer than Amberleaf: boardwalks, marsh edges, huts, tents, fossil shed, reeds, crates, flowers, rocks, fences, signs, and a landing roost.

## Systems preserved

The title screen, Continue/New Game, save/load, Amberleaf Town, Dr. Sable lab, placeholder creature selection, Travel Team menu, lead/follow/carrier structure, Quetzalcoatlus island-base travel, Fern Trail encounters, battle shell, and Field Pack scaffolding remain placeholder systems and are not final mechanics.
