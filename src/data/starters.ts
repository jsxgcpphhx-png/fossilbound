import { EARLY_GAME_DINOSAURS } from './dinosaurs';
import type { PartyCreatureState, StarterDinosaurId } from './playerState';

export interface StarterOption extends PartyCreatureState {
  shortDescription: string;
  futureArtNote: string;
}

const STARTER_DETAILS: Record<StarterDinosaurId, Omit<StarterOption, 'id' | 'displayName' | 'shortDescription'>> = {
  triceratops: {
    role: 'Defensive starter',
    plannedTypeIdentity: 'Armored / Earth',
    personality: 'Sturdy, loyal, protective',
    futureArtNote: 'Broad frill, three clear horns, grounded stance, and earth-toned armor markings.'
  },
  velociraptor: {
    role: 'Fast attacker',
    plannedTypeIdentity: 'Carnivore / Wind',
    personality: 'Quick, sharp, alert',
    futureArtNote: 'Must read as feathered in final art, with agile posture and wind-swept feather accents.'
  },
  pteranodon: {
    role: 'Balanced aerial starter',
    plannedTypeIdentity: 'Flying / Wind',
    personality: 'Agile, curious, high-mobility',
    futureArtNote: 'Ancient flying reptile companion, not technically a dinosaur; emphasize crest and wingspan.'
  }
};

export const STARTER_OPTIONS: StarterOption[] = EARLY_GAME_DINOSAURS.filter((dinosaur) =>
  dinosaur.id === 'triceratops' || dinosaur.id === 'velociraptor' || dinosaur.id === 'pteranodon'
).map((dinosaur) => {
  const id = dinosaur.id as StarterDinosaurId;
  const details = STARTER_DETAILS[id];

  return {
    id,
    displayName: dinosaur.displayName,
    shortDescription: dinosaur.shortDescription,
    ...details
  };
});

export function getStarterOption(id: StarterDinosaurId): StarterOption | undefined {
  return STARTER_OPTIONS.find((starter) => starter.id === id);
}
