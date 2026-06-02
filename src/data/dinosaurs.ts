export interface StarterCandidateMetadata {
  selectionOrder: number;
  role: string;
  personality: string;
  selectionNote: string;
}

export interface DinosaurDefinition {
  id: string;
  displayName: string;
  prehistoricGroup: string;
  shortDescription: string;
  plannedTypeIdentity: string;
  battleSpritePath: string;
  overworldSpritePath: string;
  spriteGenerationNotes: string;
  starterCandidate?: StarterCandidateMetadata;
}

export const EARLY_GAME_DINOSAURS: DinosaurDefinition[] = [
  {
    id: 'triceratops',
    displayName: 'Triceratops',
    prehistoricGroup: 'Ceratopsian dinosaur',
    shortDescription: 'A sturdy horned herbivore with a broad frill and defensive herd instincts.',
    plannedTypeIdentity: 'Armored / Earth',
    starterCandidate: {
      selectionOrder: 1,
      role: 'Defensive starter',
      personality: 'Sturdy, loyal, protective',
      selectionNote: 'A grounded companion for players who want resilience and protection first.'
    },
    battleSpritePath: 'src/assets/dinosaurs/battle/triceratops.svg',
    overworldSpritePath: 'src/assets/dinosaurs/overworld/triceratops.svg',
    spriteGenerationNotes:
      'Keep the three horns and shield-like frill instantly readable; type variants can add clay-red markings, stone-like frill plates, or mossy edge accents.'
  },
  {
    id: 'velociraptor',
    displayName: 'Velociraptor',
    prehistoricGroup: 'Dromaeosaurid theropod',
    shortDescription: 'A small, alert feathered hunter built around speed, agility, and pack awareness.',
    plannedTypeIdentity: 'Carnivore / Wind',
    starterCandidate: {
      selectionOrder: 2,
      role: 'Fast attacker',
      personality: 'Quick, sharp, alert',
      selectionNote: 'A feathered companion for players who want speed and precision first.'
    },
    battleSpritePath: 'src/assets/dinosaurs/battle/velociraptor.svg',
    overworldSpritePath: 'src/assets/dinosaurs/overworld/velociraptor.svg',
    spriteGenerationNotes:
      'Use a feathered silhouette with a low, quick posture; future art should clearly read as feathered, with type variants emphasizing banded feathers, dust trails, or sharp directional markings.'
  },
  {
    id: 'pteranodon',
    displayName: 'Pteranodon',
    prehistoricGroup: 'Pterosaur',
    shortDescription: 'A soaring pterosaur with a long crest, wide wings, and coastal scouting behavior.',
    plannedTypeIdentity: 'Flying / Wind',
    starterCandidate: {
      selectionOrder: 3,
      role: 'Balanced aerial starter',
      personality: 'Agile, curious, high-mobility',
      selectionNote: 'A prehistoric flying reptile companion for players who want mobility and balance first.'
    },
    battleSpritePath: 'src/assets/dinosaurs/battle/pteranodon.svg',
    overworldSpritePath: 'src/assets/dinosaurs/overworld/pteranodon.svg',
    spriteGenerationNotes:
      'Prioritize the long crest and wing shape over mascot proportions; note that this is a prehistoric flying reptile rather than a dinosaur, and type variants can add wind-swept highlights.'
  },
  {
    id: 'ankylosaurus',
    displayName: 'Ankylosaurus',
    prehistoricGroup: 'Ankylosaurid dinosaur',
    shortDescription: 'A low armored herbivore with heavy plates and a powerful tail club.',
    plannedTypeIdentity: 'Stone / Bulwark',
    battleSpritePath: 'src/assets/dinosaurs/battle/ankylosaurus.svg',
    overworldSpritePath: 'src/assets/dinosaurs/overworld/ankylosaurus.svg',
    spriteGenerationNotes:
      'Make the squat armor and tail club the defining read; type variants can use basalt plates, amber chips, or lichen patterns.'
  },
  {
    id: 'parasaurolophus',
    displayName: 'Parasaurolophus',
    prehistoricGroup: 'Hadrosaurid dinosaur',
    shortDescription: 'A gentle crested herbivore known for resonant calls and social movement through wetlands.',
    plannedTypeIdentity: 'Sound / Reed',
    battleSpritePath: 'src/assets/dinosaurs/battle/parasaurolophus.svg',
    overworldSpritePath: 'src/assets/dinosaurs/overworld/parasaurolophus.svg',
    spriteGenerationNotes:
      'Keep the sweeping head crest clear from both side and three-quarter views; type variants can add reed-green striping or subtle sound-wave motifs.'
  },
  {
    id: 'spinosaurus',
    displayName: 'Spinosaurus',
    prehistoricGroup: 'Spinosaurid theropod',
    shortDescription: 'A semi-aquatic predator with a tall sail, long snout, and riverbank presence.',
    plannedTypeIdentity: 'River / Apex',
    battleSpritePath: 'src/assets/dinosaurs/battle/spinosaurus.svg',
    overworldSpritePath: 'src/assets/dinosaurs/overworld/spinosaurus.svg',
    spriteGenerationNotes:
      'Emphasize the sail, crocodile-like snout, and waterline stance; type variants can use rippled sail markings or wet reflective highlights.'
  }
];
