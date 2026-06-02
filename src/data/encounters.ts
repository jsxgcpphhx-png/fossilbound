import { EARLY_GAME_DINOSAURS } from './dinosaurs';

export interface EncounterTableEntry {
  dinosaurId: string;
  weight: number;
}

export interface EncounterZoneDefinition {
  id: string;
  label: string;
  description: string;
  triggerTileCodes: string[];
  stepsPerCheck: number;
  chancePerCheck: number;
  table: EncounterTableEntry[];
}

export interface EncounterPreview {
  zoneId: string;
  zoneLabel: string;
  dinosaurId: string;
  creatureName: string;
  spritePath: string;
  returnScene: 'FernTrailScene';
}

// Milestone 3 scaffolding only: these encounter tables intentionally reuse the
// existing dinosaur data as temporary test content. Final creature rosters,
// encounter rates, battle rules, and capture rules should replace this data
// without changing route scene logic.
export const ENCOUNTER_ZONES: EncounterZoneDefinition[] = [
  {
    id: 'fern-trail-fossil-brush',
    label: 'Fossil Brush',
    description: 'Rustling fern beds and amber weeds along Fern Trail.',
    triggerTileCodes: ['G', 'r'],
    stepsPerCheck: 3,
    chancePerCheck: 0.38,
    table: [
      { dinosaurId: 'velociraptor', weight: 35 },
      { dinosaurId: 'parasaurolophus', weight: 30 },
      { dinosaurId: 'triceratops', weight: 20 },
      { dinosaurId: 'ankylosaurus', weight: 15 }
    ]
  }
];

export function getEncounterZoneForTile(tileCode: string): EncounterZoneDefinition | undefined {
  return ENCOUNTER_ZONES.find((zone) => zone.triggerTileCodes.includes(tileCode));
}

export function createEncounterPreview(
  zone: EncounterZoneDefinition,
  random: { between(min: number, max: number): number }
): EncounterPreview | undefined {
  const totalWeight = zone.table.reduce((total, entry) => total + Math.max(0, entry.weight), 0);

  if (totalWeight <= 0) {
    return undefined;
  }

  let roll = random.between(1, totalWeight);
  const selectedEntry = zone.table.find((entry) => {
    roll -= Math.max(0, entry.weight);
    return roll <= 0;
  }) ?? zone.table[0];
  const dinosaur = EARLY_GAME_DINOSAURS.find((candidate) => candidate.id === selectedEntry.dinosaurId);

  if (!dinosaur) {
    return undefined;
  }

  return {
    zoneId: zone.id,
    zoneLabel: zone.label,
    dinosaurId: dinosaur.id,
    creatureName: dinosaur.displayName,
    spritePath: dinosaur.battleSpritePath,
    returnScene: 'FernTrailScene'
  };
}
