export type TranquilizerSequenceVariationId = 'steady' | 'drifting' | 'pulsing' | 'light-hazards';
export type CreatureRarityPlaceholder = 'common' | 'uncommon' | 'rare';

export interface TranquilizerDifficultyInputs {
  creatureLevel: number;
  creatureRarity: CreatureRarityPlaceholder;
  currentHpRatio: number;
  tranqGunUpgradeLevel: number;
}

export interface TranquilizerDifficultyProfile {
  variationId: TranquilizerSequenceVariationId;
  targetRadius: number;
  targetSpeed: number;
  requiredLockOnMs: number;
  totalTimeLimitMs: number;
  hazardCount: number;
  developerNote: string;
}

export interface TranquilizerUpgradeDefinition {
  level: number;
  displayName: string;
  captureAssistPlaceholder: number;
  developerNote: string;
}

export const TRANQUILIZER_SEQUENCE_VARIATIONS: Record<TranquilizerSequenceVariationId, string> = {
  steady: 'Steady moving target',
  drifting: 'Drifting target',
  pulsing: 'Pulsing target',
  'light-hazards': 'Target with light hazards'
};

export const TRANQUILIZER_UPGRADES: TranquilizerUpgradeDefinition[] = [
  {
    level: 0,
    displayName: 'Field Tranq Prototype',
    captureAssistPlaceholder: 0,
    developerNote: 'Baseline lab-issued tranquilizer gun. Future upgrades may improve target size, movement speed, lock-on time, timer leniency, or hazard mitigation.'
  },
  {
    level: 1,
    displayName: 'Stabilized Sight Placeholder',
    captureAssistPlaceholder: 0.08,
    developerNote: 'Upgrade economy is intentionally not implemented; this entry only proves save/data shape for later progression.'
  },
  {
    level: 2,
    displayName: 'Calibrated Darts Placeholder',
    captureAssistPlaceholder: 0.14,
    developerNote: 'Higher upgrade levels can be balanced later once creature rarity, HP, and level curves exist.'
  }
];

export function getTranquilizerUpgrade(level: number): TranquilizerUpgradeDefinition {
  return TRANQUILIZER_UPGRADES.find((upgrade) => upgrade.level === level) ?? TRANQUILIZER_UPGRADES[0];
}

export function createTranquilizerDifficultyProfile(inputs: TranquilizerDifficultyInputs): TranquilizerDifficultyProfile {
  const clampedLevel = Math.max(1, Math.floor(inputs.creatureLevel));
  const hpRatio = Math.max(0.05, Math.min(1, inputs.currentHpRatio));
  const upgrade = getTranquilizerUpgrade(inputs.tranqGunUpgradeLevel);
  const rarityPressure = inputs.creatureRarity === 'rare' ? 0.22 : inputs.creatureRarity === 'uncommon' ? 0.12 : 0;
  const levelPressure = Math.min(0.3, clampedLevel * 0.012);
  const weakenedEase = (1 - hpRatio) * 0.24;
  const assist = upgrade.captureAssistPlaceholder;
  const difficulty = Math.max(0, Math.min(0.6, rarityPressure + levelPressure - weakenedEase - assist));
  const variationId: TranquilizerSequenceVariationId = difficulty > 0.42
    ? 'light-hazards'
    : difficulty > 0.28
      ? 'pulsing'
      : difficulty > 0.14
        ? 'drifting'
        : 'steady';

  return {
    variationId,
    targetRadius: Math.round(34 - difficulty * 22 + weakenedEase * 10 + assist * 18),
    targetSpeed: Math.round(42 + difficulty * 115 - weakenedEase * 25 - assist * 28),
    requiredLockOnMs: Math.round(1400 + difficulty * 2200 - weakenedEase * 700 - assist * 900),
    totalTimeLimitMs: Math.round(9000 - difficulty * 2400 + weakenedEase * 900 + assist * 1200),
    hazardCount: variationId === 'light-hazards' ? 3 : 0,
    developerNote: 'Prototype formula only: stronger/higher-level/rarer creatures become harder, lower HP and tranq upgrades make capture easier. No final capture odds or economy exist.'
  };
}
