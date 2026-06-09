export type CreatureType = 'Fire' | 'Rock' | 'Grass' | 'Sky' | 'Water' | 'Neutral';
export type GrowthCategory = 'small' | 'medium' | 'big';
export type GrowthStageName = 'baby' | 'juvenile' | 'adolescent' | 'adult';
export type CreatureVariantId = 'normal' | 'alternate';
export type FossilBitId = 'skull' | 'ribs' | 'tail' | 'arm' | 'leg';

export interface CreatureVariantDefinition {
  id: CreatureVariantId;
  displayName: string;
  visualNote: string;
  strengthModifierPlaceholder: number;
  typeOverride: CreatureType[] | null;
}

export interface GrowthStageDefinition {
  id: GrowthStageName;
  displayName: string;
  placeholderLevelGate: number | null;
}

export interface PrimalRageDefinition {
  canUsePrimalRage: boolean;
  primalRageFormId: string | null;
  adultOnlyRequirement: true;
  developerNote: string;
}

export interface FossilReconstructionDefinition {
  isFossilReconstructable: boolean;
  requiredBits: FossilBitId[];
  placeholderDropChance: number | null;
  reconstructionLocationId: string | null;
  requiresBossEncounterBeforeCapture: boolean;
  developerNote: string;
}

export interface DinosaurDefinition {
  id: string;
  displayName: string;
  prehistoricGroup: string;
  shortDescription: string;
  plannedTypeIdentity: string;
  baseType: CreatureType;
  types: CreatureType[];
  growthCategory: GrowthCategory;
  growthStages: GrowthStageDefinition[];
  startingGrowthStage: GrowthStageName;
  placeholderBaseLevel: number;
  placeholderStartingXp: number;
  placeholderXpToNextStage: number | null;
  variants: {
    normal: CreatureVariantDefinition;
    alternate: CreatureVariantDefinition;
  };
  canUsePrimalRage: boolean;
  primalRage: PrimalRageDefinition;
  fossilReconstruction: FossilReconstructionDefinition;
  battleSpritePath: string;
  overworldSpritePath: string;
  spriteGenerationNotes: string;
}

export const FOSSIL_BIT_IDS: FossilBitId[] = ['skull', 'ribs', 'tail', 'arm', 'leg'];

export const PLACEHOLDER_TRAIT_POOL = ['Bold', 'Swift', 'Hardy', 'Alert', 'Stubborn', 'Curious'] as const;
export type CreatureTrait = typeof PLACEHOLDER_TRAIT_POOL[number];
export type CreatureGender = 'male' | 'female';

const NORMAL_VARIANT: CreatureVariantDefinition = {
  id: 'normal',
  displayName: 'Base',
  visualNote: 'Default palette and typing. Starters are locked to this variant for now.',
  strengthModifierPlaceholder: 1,
  typeOverride: null
};

function alternateVariant(visualNote: string): CreatureVariantDefinition {
  return {
    id: 'alternate',
    displayName: 'Alternate',
    visualNote,
    strengthModifierPlaceholder: 1.05,
    typeOverride: null
  };
}

function primalRage(canUsePrimalRage: boolean, formId: string | null): PrimalRageDefinition {
  return {
    canUsePrimalRage,
    primalRageFormId: formId,
    adultOnlyRequirement: true,
    developerNote: canUsePrimalRage
      ? 'Primal Rage is a future adult-only power-up similar in scope to a temporary transformed form; no activation, stat, item, or balance rules are implemented.'
      : 'This species currently has no planned Primal Rage form; adult-only requirement still applies if one is added later.'
  };
}

function fossilReconstruction(isFossilReconstructable: boolean, placeholderDropChance: number | null): FossilReconstructionDefinition {
  return {
    isFossilReconstructable,
    requiredBits: FOSSIL_BIT_IDS,
    placeholderDropChance,
    reconstructionLocationId: isFossilReconstructable ? 'arena-museum-placeholder' : null,
    requiresBossEncounterBeforeCapture: isFossilReconstructable,
    developerNote: isFossilReconstructable
      ? 'Future fossil zones/caves/dig sites award skull, ribs, tail, arm, and leg bits; after all five are collected, reconstruction routes through an arena/museum boss encounter before capture.'
      : 'Not currently flagged for fossil reconstruction; keep fields present for save/data stability.'
  };
}

const SMALL_GROWTH_STAGES: GrowthStageDefinition[] = [
  { id: 'adult', displayName: 'Adult', placeholderLevelGate: 1 }
];
const MEDIUM_GROWTH_STAGES: GrowthStageDefinition[] = [
  { id: 'juvenile', displayName: 'Juvenile', placeholderLevelGate: 1 },
  { id: 'adult', displayName: 'Adult', placeholderLevelGate: 16 }
];
const BIG_GROWTH_STAGES: GrowthStageDefinition[] = [
  { id: 'baby', displayName: 'Baby', placeholderLevelGate: 1 },
  { id: 'adolescent', displayName: 'Adolescent', placeholderLevelGate: 12 },
  { id: 'adult', displayName: 'Adult', placeholderLevelGate: 28 }
];

export const EARLY_GAME_DINOSAURS: DinosaurDefinition[] = [
  {
    id: 'triceratops',
    displayName: 'Triceratops',
    prehistoricGroup: 'Ceratopsian dinosaur',
    shortDescription: 'A sturdy horned herbivore with a broad frill and defensive herd instincts.',
    plannedTypeIdentity: 'Rock / Guard',
    baseType: 'Rock',
    types: ['Rock'],
    growthCategory: 'big',
    growthStages: BIG_GROWTH_STAGES,
    startingGrowthStage: 'baby',
    placeholderBaseLevel: 5,
    placeholderStartingXp: 0,
    placeholderXpToNextStage: 120,
    variants: {
      normal: NORMAL_VARIANT,
      alternate: alternateVariant('Rare variant may eventually use warmer frill markings and slightly stronger defensive reads; alternate typing intentionally blank for now.')
    },
    canUsePrimalRage: true,
    primalRage: primalRage(true, 'triceratops-primal-placeholder'),
    fossilReconstruction: fossilReconstruction(false, null),
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
    plannedTypeIdentity: 'Fire / Cunning',
    baseType: 'Fire',
    types: ['Fire'],
    growthCategory: 'small',
    growthStages: SMALL_GROWTH_STAGES,
    startingGrowthStage: 'adult',
    placeholderBaseLevel: 5,
    placeholderStartingXp: 0,
    placeholderXpToNextStage: null,
    variants: {
      normal: NORMAL_VARIANT,
      alternate: alternateVariant('Rare variant may eventually shift feather markings and slightly improve speed; alternate starter typing remains blank/null.')
    },
    canUsePrimalRage: true,
    primalRage: primalRage(true, 'velociraptor-primal-placeholder'),
    fossilReconstruction: fossilReconstruction(false, null),
    battleSpritePath: 'src/assets/dinosaurs/battle/velociraptor.svg',
    overworldSpritePath: 'src/assets/dinosaurs/overworld/velociraptor.svg',
    spriteGenerationNotes:
      'Use a feathered silhouette with a low, quick posture; type variants can emphasize banded feathers, dust trails, or sharp directional markings.'
  },
  {
    id: 'pteranodon',
    displayName: 'Pteranodon',
    prehistoricGroup: 'Pterosaur',
    shortDescription: 'A soaring pterosaur with a long crest, wide wings, and coastal scouting behavior.',
    plannedTypeIdentity: 'Sky / Tide',
    baseType: 'Sky',
    types: ['Sky'],
    growthCategory: 'medium',
    growthStages: MEDIUM_GROWTH_STAGES,
    startingGrowthStage: 'juvenile',
    placeholderBaseLevel: 5,
    placeholderStartingXp: 0,
    placeholderXpToNextStage: 100,
    variants: {
      normal: NORMAL_VARIANT,
      alternate: alternateVariant('Rare variant may eventually add seafoam wing gradients and slightly stronger scouting utility; alternate typing is blank/null.')
    },
    canUsePrimalRage: false,
    primalRage: primalRage(false, null),
    fossilReconstruction: fossilReconstruction(true, 0.18),
    battleSpritePath: 'src/assets/dinosaurs/battle/pteranodon.svg',
    overworldSpritePath: 'src/assets/dinosaurs/overworld/pteranodon.svg',
    spriteGenerationNotes:
      'Prioritize the long crest and wing shape over mascot proportions; type variants can add seafoam wing gradients or wind-swept highlights.'
  },
  {
    id: 'ankylosaurus',
    displayName: 'Ankylosaurus',
    prehistoricGroup: 'Ankylosaurid dinosaur',
    shortDescription: 'A low armored herbivore with heavy plates and a powerful tail club.',
    plannedTypeIdentity: 'Rock / Bulwark',
    baseType: 'Rock',
    types: ['Rock'],
    growthCategory: 'big',
    growthStages: BIG_GROWTH_STAGES,
    startingGrowthStage: 'baby',
    placeholderBaseLevel: 6,
    placeholderStartingXp: 0,
    placeholderXpToNextStage: 130,
    variants: {
      normal: NORMAL_VARIANT,
      alternate: alternateVariant('Rare variant may eventually use basalt plates, amber chips, or lichen patterns with a small strength bump; alternate typing is blank/null.')
    },
    canUsePrimalRage: false,
    primalRage: primalRage(false, null),
    fossilReconstruction: fossilReconstruction(true, 0.12),
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
    plannedTypeIdentity: 'Grass / Reed',
    baseType: 'Grass',
    types: ['Grass'],
    growthCategory: 'medium',
    growthStages: MEDIUM_GROWTH_STAGES,
    startingGrowthStage: 'juvenile',
    placeholderBaseLevel: 5,
    placeholderStartingXp: 0,
    placeholderXpToNextStage: 100,
    variants: {
      normal: NORMAL_VARIANT,
      alternate: alternateVariant('Rare variant may eventually add reed-green striping or subtle sound-wave motifs; alternate starter typing remains blank/null.')
    },
    canUsePrimalRage: true,
    primalRage: primalRage(true, 'parasaurolophus-primal-placeholder'),
    fossilReconstruction: fossilReconstruction(false, null),
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
    plannedTypeIdentity: 'Water / Apex',
    baseType: 'Water',
    types: ['Water'],
    growthCategory: 'big',
    growthStages: BIG_GROWTH_STAGES,
    startingGrowthStage: 'baby',
    placeholderBaseLevel: 8,
    placeholderStartingXp: 0,
    placeholderXpToNextStage: 160,
    variants: {
      normal: NORMAL_VARIANT,
      alternate: alternateVariant('Rare variant may eventually use rippled sail markings or wet reflective highlights with a slight strength bump; alternate typing is blank/null.')
    },
    canUsePrimalRage: false,
    primalRage: primalRage(false, null),
    fossilReconstruction: fossilReconstruction(true, 0.07),
    battleSpritePath: 'src/assets/dinosaurs/battle/spinosaurus.svg',
    overworldSpritePath: 'src/assets/dinosaurs/overworld/spinosaurus.svg',
    spriteGenerationNotes:
      'Emphasize the sail, crocodile-like snout, and waterline stance; type variants can use rippled sail markings or wet reflective highlights.'
  }
];

export function getDinosaurDefinition(dinosaurId?: string): DinosaurDefinition | undefined {
  return dinosaurId ? EARLY_GAME_DINOSAURS.find((dinosaur) => dinosaur.id === dinosaurId) : undefined;
}
