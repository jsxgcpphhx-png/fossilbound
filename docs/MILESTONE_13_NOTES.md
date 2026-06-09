# Milestone 13 Notes — Tranquilizer Capture and UI/Text Cleanup

Milestone 13 turns the tranquilizer scaffold into a more playable capture prototype while keeping all final battle/capture balance deliberately unresolved.

## Three-round tranquilizer capture prototype

- Capture is now a dedicated **Tranquilizer Capture** mode, separate from the temporary battle action bullet-hell.
- A capture attempt requires **three successful lock-on rounds**.
- Each round asks the player to move a cursor with arrows/WASD and hold it inside a moving target circle long enough to fill that round's lock-on meter.
- Successful rounds reset the lock-on meter and reposition the target for the next round.
- Completing round 3 uses the current placeholder acquisition flow to add the wild creature to the player's owned/team/storage data.
- Failing any round returns to the battle menu with clear failure text.

## Capture difficulty settings

Capture difficulty is data-driven through `createTranquilizerDifficultyProfile` and is still placeholder tuning only.

Difficulty currently affects:

- difficulty label (`Easy`, `Medium`, `Hard`, `Apex/Rare`);
- target size;
- target movement speed;
- mild acceleration/erratic target motion;
- required lock-on time per round;
- per-round and total timers;
- obstacle count;
- obstacle radius;
- whether obstacles move.

Current placeholder inputs are creature level, placeholder rarity, HP ratio, and tranq gun upgrade level. These inputs are scaffolding and do **not** finalize capture odds, balance, progression, or economy.

## Obstacle behavior

- Obstacles spawn inside the capture panel and are visually distinct from the lock-on target.
- Touching an obstacle immediately fails the capture attempt.
- Easy captures may have no obstacles or one slow/static obstacle.
- Medium captures use several stationary obstacles.
- Hard captures introduce drifting/bouncing obstacles.
- Apex/Rare captures combine moving obstacles with faster/erratic target movement.
- Placeholder obstacle themes include amber shards, thorn clusters, fossil splinters, alarm sparks, and wind gust markers.
- Moving obstacles are clamped/bounced/patrolled inside the capture panel so they stay readable and avoid random off-panel unfairness.

## Battle action phase separation

The existing battle action bullet-hell remains a separate experimental scaffold for future action/move timing tests. It does not imply final move resolution, damage formulas, turn order, type matchups, stats, accuracy, or capture rules.

## UI and text fitting standards

Shared UI helpers now centralize panel colors, text styles, wrapping/pagination helpers, and safe truncation. New/updated UI should follow these standards:

- draw panel backplates before redrawing text;
- clear/destroy old panel objects before creating new panel objects;
- wrap long text to the usable panel width;
- paginate dialogue and battle messages when text exceeds available lines;
- keep Space/Enter behavior as: finish typing current page first, then advance/close;
- make selected options obvious with a marker, color, and highlight background;
- keep keyboard hints short enough to fit in their panels;
- use debug/terminal overlays with fixed-width wrapping and full text replacement each update to avoid overlapping/glitched text.

## Still intentionally not finalized

Milestone 13 does not add final damage formulas, turn order, type chart, final creature roster, final capture economy, final tranq gun upgrade economy, or fossil cave implementation.
