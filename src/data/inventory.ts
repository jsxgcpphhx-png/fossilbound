export type InventoryItemCategory = 'capture-tool' | 'research-tool' | 'healing' | 'field-use' | 'key-item';
export type InventoryEffectType =
  | 'temporary-creature-acquisition'
  | 'temporary-survey-notes'
  | 'temporary-healing-placeholder'
  | 'temporary-field-recovery-placeholder'
  | 'temporary-key-item-placeholder';
export type InventoryUsableContext = 'battle' | 'field' | 'menu' | 'key-item';

export interface InventoryItemDefinition {
  id: string;
  displayName: string;
  category: InventoryItemCategory;
  description: string;
  temporaryEffectType: InventoryEffectType;
  usableContexts: InventoryUsableContext[];
}

export interface InventoryEntry extends InventoryItemDefinition {
  quantity: number;
}

export type InventoryQuantities = Record<string, number>;

// Milestone 6 developer note:
// Inventory is data-driven scaffolding only. Categories, quantities, contexts,
// and temporary effect ids are placeholders so final capture tools, research
// tools, healing items, key items, field-use items, economy, and progression can
// be designed later without changing save structure or menu plumbing.
export const TEMPORARY_ITEM_DEFINITIONS: InventoryItemDefinition[] = [
  {
    id: 'field-tag',
    displayName: 'Field Tag',
    category: 'capture-tool',
    description: 'Temporary tagging kit reserved for future creature-acquisition rules. No capture math exists yet.',
    temporaryEffectType: 'temporary-creature-acquisition',
    usableContexts: ['battle', 'field']
  },
  {
    id: 'survey-lens',
    displayName: 'Survey Lens',
    category: 'research-tool',
    description: 'A provisional observation lens that can surface extra placeholder creature notes.',
    temporaryEffectType: 'temporary-survey-notes',
    usableContexts: ['battle', 'field', 'menu']
  },
  {
    id: 'basic-med-kit',
    displayName: 'Basic Med Kit',
    category: 'healing',
    description: 'Placeholder care supplies. Healing rules, costs, and balance are intentionally not implemented.',
    temporaryEffectType: 'temporary-healing-placeholder',
    usableContexts: ['battle', 'field', 'menu']
  },
  {
    id: 'trail-snack',
    displayName: 'Trail Snack',
    category: 'field-use',
    description: 'A placeholder field recovery item. Recovery mechanics will be designed later.',
    temporaryEffectType: 'temporary-field-recovery-placeholder',
    usableContexts: ['field', 'menu']
  },
  {
    id: 'lab-pass',
    displayName: 'Lab Pass',
    category: 'key-item',
    description: 'A prototype key item representing lab access. It has no finalized gates or quest logic.',
    temporaryEffectType: 'temporary-key-item-placeholder',
    usableContexts: ['key-item', 'menu']
  }
];

export const STARTING_INVENTORY: InventoryQuantities = {
  'field-tag': 3,
  'survey-lens': 1,
  'basic-med-kit': 2,
  'trail-snack': 2,
  'lab-pass': 1
};

export function getInventoryEntries(inventory: InventoryQuantities): InventoryEntry[] {
  return TEMPORARY_ITEM_DEFINITIONS.map((definition) => ({
    ...definition,
    quantity: Math.max(0, Math.floor(inventory[definition.id] ?? 0))
  })).filter((entry) => entry.quantity > 0 || entry.category === 'key-item');
}

export function getInventoryItemDefinition(itemId: string): InventoryItemDefinition | undefined {
  return TEMPORARY_ITEM_DEFINITIONS.find((item) => item.id === itemId);
}

export function getInventoryCategoryLabel(category: InventoryItemCategory): string {
  switch (category) {
    case 'capture-tool':
      return 'Capture Tools';
    case 'research-tool':
      return 'Research Tools';
    case 'healing':
      return 'Care Items';
    case 'field-use':
      return 'Field Use';
    case 'key-item':
      return 'Key Items';
  }
}

export function createStartingInventory(): InventoryQuantities {
  return { ...STARTING_INVENTORY };
}

export function normalizeInventory(candidate: unknown, fallback: InventoryQuantities = {}): InventoryQuantities {
  const normalized: InventoryQuantities = { ...fallback };

  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return normalized;
  }

  Object.entries(candidate as Record<string, unknown>).forEach(([itemId, quantity]) => {
    if (!getInventoryItemDefinition(itemId) || typeof quantity !== 'number' || !Number.isFinite(quantity)) {
      return;
    }

    normalized[itemId] = Math.max(0, Math.floor(quantity));
  });

  return normalized;
}
