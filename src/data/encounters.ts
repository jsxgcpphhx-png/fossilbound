import { EARLY_GAME_DINOSAURS, type DinosaurDefinition } from './dinosaurs';

export interface EncounterTableEntry {
  dinosaurId: string;
  weight: number;
}

export interface EncounterZoneDefinition {
  id: string;
  label: string;
  stepChance: number;
  entries: EncounterTableEntry[];
}

export interface EncounterResult {
  zoneId: string;
  label: string;
  dinosaur: DinosaurDefinition;
}

export const FERN_TRAIL_FIELD_ZONE: EncounterZoneDefinition = {
  id: 'fern-trail-fossil-brush',
  label: 'Fossil Brush',
  stepChance: 0.22,
  entries: [
    { dinosaurId: 'parasaurolophus', weight: 5 },
    { dinosaurId: 'velociraptor', weight: 3 },
    { dinosaurId: 'ankylosaurus', weight: 2 }
  ]
};

export function rollEncounter(zone: EncounterZoneDefinition): EncounterResult | undefined {
  if (Math.random() > zone.stepChance) {
    return undefined;
  }

  const totalWeight = zone.entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const entry of zone.entries) {
    roll -= entry.weight;

    if (roll <= 0) {
      const dinosaur = EARLY_GAME_DINOSAURS.find((candidate) => candidate.id === entry.dinosaurId);

      if (dinosaur) {
        return { zoneId: zone.id, label: zone.label, dinosaur };
      }
    }
  }

  const fallback = EARLY_GAME_DINOSAURS.find((candidate) => candidate.id === zone.entries[0]?.dinosaurId);
  return fallback ? { zoneId: zone.id, label: zone.label, dinosaur: fallback } : undefined;
}
