import { EARLY_GAME_DINOSAURS } from './dinosaurs';

const PLACEHOLDER_SELECTION_CREATURE_IDS = [
  'velociraptor',
  'triceratops',
  'parasaurolophus'
] as const;

export const PLACEHOLDER_SELECTION_CREATURES = PLACEHOLDER_SELECTION_CREATURE_IDS.map((id) => {
  const dinosaur = EARLY_GAME_DINOSAURS.find((candidate) => candidate.id === id);

  if (!dinosaur) {
    throw new Error(`Missing placeholder creature data for ${id}`);
  }

  return dinosaur;
});
