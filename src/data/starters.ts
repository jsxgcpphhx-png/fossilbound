import { EARLY_GAME_DINOSAURS } from './dinosaurs';
import type { PartyCreatureState } from './playerState';

export interface StarterOption extends PartyCreatureState {
  shortDescription: string;
  futureArtNote: string;
  selectionNote: string;
}

export const STARTER_OPTIONS: StarterOption[] = EARLY_GAME_DINOSAURS
  .filter((dinosaur) => dinosaur.starterCandidate)
  .sort((left, right) => left.starterCandidate!.selectionOrder - right.starterCandidate!.selectionOrder)
  .map((dinosaur) => {
    const starter = dinosaur.starterCandidate!;

    return {
      id: dinosaur.id,
      displayName: dinosaur.displayName,
      role: starter.role,
      plannedTypeIdentity: dinosaur.plannedTypeIdentity,
      personality: starter.personality,
      shortDescription: dinosaur.shortDescription,
      futureArtNote: dinosaur.spriteGenerationNotes,
      selectionNote: starter.selectionNote
    };
  });

export function getStarterOption(id: string): StarterOption | undefined {
  return STARTER_OPTIONS.find((starter) => starter.id === id);
}
