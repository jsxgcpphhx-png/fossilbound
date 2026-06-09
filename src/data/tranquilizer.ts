export type TranquilizerSequenceVariationId = 'steady' | 'drifting' | 'pulsing' | 'light-hazards' | 'apex-surge';
export type CreatureRarityPlaceholder = 'common' | 'uncommon' | 'rare';
export type TranquilizerDifficultyTier = 'Easy' | 'Medium' | 'Hard' | 'Apex/Rare';
export type TranquilizerObstacleKind = 'amber-shard' | 'thorn-cluster' | 'fossil-splinter' | 'alarm-spark' | 'wind-gust';
export type TranquilizerObstacleMotion = 'stationary' | 'drift' | 'patrol' | 'bounce';

export interface TranquilizerDifficultyInputs {
  creatureLevel: number;
  creatureRarity: CreatureRarityPlaceholder;
  currentHpRatio: number;
  tranqGunUpgradeLevel: number;
}

export interface TranquilizerObstaclePattern {
  kind: TranquilizerObstacleKind;
  motion: TranquilizerObstacleMotion;
  radius: number;
  speed: number;
}

export interface TranquilizerDifficultyProfile {
  variationId: TranquilizerSequenceVariationId;
  difficultyTier: TranquilizerDifficultyTier;
  difficultyScore: number;
  targetRadius: number;
  targetSpeed: number;
  targetAcceleration: number;
  requiredLockOnMs: number;
  roundTimeLimitMs: number;
  totalTimeLimitMs: number;
  requiredRounds: number;
  obstacleCount: number;
  obstacleRadius: number;
  movingObstacles: boolean;
  obstaclePatterns: TranquilizerObstaclePattern[];
  developerNote: string;
}

export interface TranquilizerUpgradeDefinition {
  level: number;
  displayName: string;
  captureAssistPlaceholder: number;
  developerNote: string;
}

export const TRANQUILIZER_SEQUENCE_VARIATIONS: Record<TranquilizerSequenceVariationId, string> = {
  steady: 'Steady target with broad timing',
  drifting: 'Drifting target with light course changes',
  pulsing: 'Pulsing target with tighter tracking',
  'light-hazards': 'Hazard-laced moving target',
  'apex-surge': 'Erratic target with moving hazards'
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
  const rarityPressure = inputs.creatureRarity === 'rare' ? 0.34 : inputs.creatureRarity === 'uncommon' ? 0.17 : 0;
  const levelPressure = Math.min(0.34, clampedLevel * 0.014);
  const weakenedEase = (1 - hpRatio) * 0.22;
  const assist = upgrade.captureAssistPlaceholder;
  const difficulty = Math.max(0, Math.min(0.78, rarityPressure + levelPressure - weakenedEase - assist));
  const difficultyTier = getDifficultyTier(difficulty, inputs.creatureRarity);
  const variationId = getVariationId(difficultyTier, difficulty);
  const obstaclePatterns = createObstaclePatterns(difficultyTier, difficulty);

  return {
    variationId,
    difficultyTier,
    difficultyScore: Number(difficulty.toFixed(2)),
    targetRadius: safeClamp(Math.round(34 - difficulty * 14 + weakenedEase * 7 + assist * 10), 17, 38),
    targetSpeed: safeClamp(Math.round(42 + difficulty * 96 - weakenedEase * 20 - assist * 24), 36, 126),
    targetAcceleration: safeClamp(Math.round(12 + difficulty * 42), 10, 44),
    requiredLockOnMs: safeClamp(Math.round(850 + difficulty * 620 - weakenedEase * 200 - assist * 280), 680, 1240),
    roundTimeLimitMs: safeClamp(Math.round(8600 - difficulty * 1300 + weakenedEase * 700 + assist * 700), 7000, 9400),
    totalTimeLimitMs: safeClamp(Math.round(28600 - difficulty * 3800 + weakenedEase * 1800 + assist * 1900), 23800, 31000),
    requiredRounds: 3,
    obstacleCount: obstaclePatterns.length,
    obstacleRadius: obstaclePatterns[0]?.radius ?? 0,
    movingObstacles: obstaclePatterns.some((pattern) => pattern.motion !== 'stationary'),
    obstaclePatterns,
    developerNote: 'Prototype formula only: stronger/higher-level/rarer creatures create smaller targets, faster movement, shorter timers, and denser obstacles. No final capture odds, dart economy, upgrade curve, type balance, damage formula, or progression tuning exists.'
  };
}

function getDifficultyTier(difficulty: number, rarity: CreatureRarityPlaceholder): TranquilizerDifficultyTier {
  if (rarity === 'rare' && difficulty >= 0.34) {
    return 'Apex/Rare';
  }

  if (difficulty >= 0.48) {
    return 'Hard';
  }

  if (difficulty >= 0.22) {
    return 'Medium';
  }

  return 'Easy';
}

function getVariationId(tier: TranquilizerDifficultyTier, difficulty: number): TranquilizerSequenceVariationId {
  if (tier === 'Apex/Rare') {
    return 'apex-surge';
  }

  if (tier === 'Hard') {
    return 'light-hazards';
  }

  if (difficulty >= 0.32) {
    return 'pulsing';
  }

  if (tier === 'Medium') {
    return 'drifting';
  }

  return 'steady';
}

function createObstaclePatterns(tier: TranquilizerDifficultyTier, difficulty: number): TranquilizerObstaclePattern[] {
  const mediumRadius = Math.round(10 + difficulty * 3);

  if (tier === 'Easy') {
    return difficulty > 0.16 ? [{ kind: 'amber-shard', motion: 'stationary', radius: 11, speed: 0 }] : [];
  }

  if (tier === 'Medium') {
    return [
      { kind: 'amber-shard', motion: 'stationary', radius: mediumRadius, speed: 0 },
      { kind: 'thorn-cluster', motion: 'patrol', radius: mediumRadius + 1, speed: 24 }
    ];
  }

  if (tier === 'Hard') {
    return [
      { kind: 'amber-shard', motion: 'stationary', radius: 13, speed: 0 },
      { kind: 'fossil-splinter', motion: 'drift', radius: 11, speed: 28 },
      { kind: 'alarm-spark', motion: 'bounce', radius: 10, speed: 40 }
    ];
  }

  return [
    { kind: 'amber-shard', motion: 'patrol', radius: 12, speed: 36 },
    { kind: 'thorn-cluster', motion: 'stationary', radius: 13, speed: 0 },
    { kind: 'fossil-splinter', motion: 'drift', radius: 11, speed: 34 },
    { kind: 'alarm-spark', motion: 'bounce', radius: 10, speed: 50 },
    { kind: 'wind-gust', motion: 'patrol', radius: 13, speed: 42 }
  ];
}

function safeClamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
