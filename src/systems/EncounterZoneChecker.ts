import type { EncounterResult, EncounterZoneDefinition } from '../data/encounters';
import { rollEncounter } from '../data/encounters';
import type { TilePosition } from '../types/grid';

interface EncounterZoneCheckerOptions {
  zonesByTile: Map<string, EncounterZoneDefinition>;
  cooldownSteps?: number;
}

export class EncounterZoneChecker {
  private readonly zonesByTile: Map<string, EncounterZoneDefinition>;
  private readonly cooldownSteps: number;
  private stepsUntilNextCheck = 0;

  constructor(options: EncounterZoneCheckerOptions) {
    this.zonesByTile = options.zonesByTile;
    this.cooldownSteps = options.cooldownSteps ?? 2;
  }

  checkStep(tile: TilePosition): EncounterResult | undefined {
    const zone = this.zonesByTile.get(this.tileKey(tile));

    if (!zone) {
      this.stepsUntilNextCheck = 0;
      return undefined;
    }

    if (this.stepsUntilNextCheck > 0) {
      this.stepsUntilNextCheck -= 1;
      return undefined;
    }

    const encounter = rollEncounter(zone);

    if (encounter) {
      this.stepsUntilNextCheck = this.cooldownSteps;
    }

    return encounter;
  }

  private tileKey(tile: TilePosition): string {
    return `${tile.x},${tile.y}`;
  }
}
