# Milestone 15 Notes — Camera Scale, Mossbank Link, and Capture Preview

## World camera zoom vs. fixed UI rendering

- Overworld scenes now use a zoomed world camera (`1.32` by default) so the player sees less surrounding space and exploration feels more intimate.
- The overworld camera follows with rounded pixels and a conservative lerp to reduce jitter while preserving readable tile-by-tile movement.
- Screen-space UI must be registered through the fixed UI helpers so it renders on the unzoomed UI camera and is ignored by the zoomed world camera.
- Dialogue, Travel Team, debug text, and temporary location labels are fixed UI. Battle UI and capture UI remain non-overworld screen-space scene elements and should not inherit overworld zoom.

## Map size and camera-bound standards

- Amberleaf Town, Fern Trail, and Mossbank Village/Wetlands use wider maps than the pre-zoom layouts so the camera has natural terrain around paths instead of immediately exposing hard edges.
- Transition roads should have at least a few walkable tiles of lead-in before the scene edge and non-walkable terrain buffers (trees, reeds, marsh, water, fences, rocks, or foliage) around the visible route.
- `configureOverworldCamera` bounds must always use the full terrain width and height. If a map contains ragged rows, normalize them or route `getTerrainAt` through safe fallback logic before relying on those bounds.
- New maps should keep routes readable at the zoomed viewport: the main path should stay broad enough for directional clarity, while decorative terrain creates buffers rather than blocking required navigation.

## Fern Trail → Mossbank transition standards

- Fern Trail’s east road now becomes wetter before the transition, with marsh grass, reeds, water, and boardwalk-like path tiles leading into Mossbank.
- The Mossbank transition trigger must be reachable from the main Fern Trail path and not separated by a blocker tile.
- Mossbank spawns the player on a valid west boardwalk/grass entrance tile, not in water, a hut, a tree, an NPC, a sign, or off-map fallback space.
- Returning west from Mossbank should place the player just inside Fern Trail on a connected path tile, not on an isolated transition sliver.
- Signs should be physical/interactable route signs, not floating map labels. Temporary location labels may appear as fixed UI for orientation only.

## Tranquilizer preview/countdown behavior

- Capture mode begins with a 1-second preview phase.
- During preview, the capture panel, target circle, obstacles, timer/progress UI, and “Ready…” instruction are visible.
- During preview, cursor movement is locked, the target is stationary, obstacles are stationary, lock-on progress does not build, and capture timers do not count down.
- When preview ends, the UI announces “Go!”, cursor control unlocks, target and obstacle movement begin, and round/total timers start from their full values.

## Updated capture difficulty tuning

- The 3 successful lock-on round requirement remains intact.
- Easy encounters use larger targets, slower target movement, generous timers, and usually no obstacles.
- Medium encounters introduce modestly smaller targets, moderate movement, and limited readable obstacles.
- Hard and Apex/Rare encounters keep smaller/faster targets and moving hazards, but the timers and target sizes have been loosened so success is skill-gated rather than impossible.
- Obstacles should remain visibly colored, stay inside the capture panel, and avoid starting directly on the cursor or target.
- The current values are placeholder tuning only. Final capture odds, dart economy, creature acquisition economy, and progression balance remain future work.
