import type { EncounterPreview, EncounterZoneDefinition } from '../data/encounters';
import { createEncounterPreview } from '../data/encounters';

interface EncounterZoneSystemOptions {
  random: { frac(): number; between(min: number, max: number): number };
  onEncounter: (encounter: EncounterPreview) => void;
}

export class EncounterZoneSystem {
  private readonly random: { frac(): number; between(min: number, max: number): number };
  private readonly onEncounter: (encounter: EncounterPreview) => void;
  private zoneStepCounters = new Map<string, number>();
  private locked = false;

  constructor(options: EncounterZoneSystemOptions) {
    this.random = options.random;
    this.onEncounter = options.onEncounter;
  }

  checkStep(zone: EncounterZoneDefinition | undefined): void {
    if (!zone || this.locked) {
      return;
    }

    const nextStepCount = (this.zoneStepCounters.get(zone.id) ?? 0) + 1;

    if (nextStepCount < zone.stepsPerCheck) {
      this.zoneStepCounters.set(zone.id, nextStepCount);
      return;
    }

    this.zoneStepCounters.set(zone.id, 0);

    if (this.random.frac() > zone.chancePerCheck) {
      return;
    }

    const encounter = createEncounterPreview(zone, this.random);

    if (!encounter) {
      return;
    }

    this.locked = true;
    this.onEncounter(encounter);
  }
}
