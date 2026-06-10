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
  /** Placeholder scaffold: no current item consumes quantity until final balance/economy exists. */
  consumesOnUse?: boolean;
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
  },
  {
    id: 'tranq-dart-prototype',
    displayName: 'Tranq Dart Prototype',
    category: 'capture-tool',
    description: 'A lab-safe placeholder for future tranquilizer supplies. The current capture prototype does not spend darts.',
    temporaryEffectType: 'temporary-creature-acquisition',
    usableContexts: ['battle']
  }
];

export const STARTING_INVENTORY: InventoryQuantities = {
  'field-tag': 3,
  'survey-lens': 1,
  'basic-med-kit': 2,
  'trail-snack': 2,
  'lab-pass': 1,
  'tranq-dart-prototype': 1
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


export interface InventoryUseResult {
  item?: InventoryEntry;
  used: boolean;
  consumed: boolean;
  message: string;
  inventory: InventoryQuantities;
}

export function getInventoryUseMessage(item: InventoryEntry, context: InventoryUsableContext): string {
  if (item.quantity <= 0 && item.category !== 'key-item') {
    return 'No quantity remains.';
  }

  if (!isItemUsableInContext(item, context)) {
    return context === 'battle' ? 'This cannot be used here.' : 'This is not usable from here.';
  }

  switch (item.temporaryEffectType) {
    case 'temporary-survey-notes':
      return 'Displays placeholder research notes when available.';
    case 'temporary-healing-placeholder':
      return 'Healing is not implemented yet.';
    case 'temporary-field-recovery-placeholder':
      return 'Field recovery is not implemented yet.';
    case 'temporary-key-item-placeholder':
      return 'This key item has no active use here yet.';
    case 'temporary-creature-acquisition':
      return item.id === 'tranq-dart-prototype'
        ? 'Tranq economy is placeholder; use Capture/Tranq Sequence to test capture.'
        : 'Creature acquisition rules are not finalized yet.';
  }
}

export function isItemUsableInContext(item: InventoryItemDefinition, context: InventoryUsableContext): boolean {
  if (item.category === 'key-item') {
    return item.usableContexts.includes(context) || item.usableContexts.includes('key-item');
  }

  return item.usableContexts.includes(context) || item.usableContexts.includes('menu');
}

export function useInventoryItem(itemId: string, context: InventoryUsableContext, inventory: InventoryQuantities = normalizeInventory(undefined, STARTING_INVENTORY)): InventoryUseResult {
  const normalizedInventory = normalizeInventory(inventory, STARTING_INVENTORY);
  const definition = getInventoryItemDefinition(itemId);

  if (!definition) {
    return { used: false, consumed: false, message: 'Unknown Field Pack item.', inventory: normalizedInventory };
  }

  const item: InventoryEntry = {
    ...definition,
    quantity: Math.max(0, Math.floor(normalizedInventory[itemId] ?? 0))
  };

  if (item.quantity <= 0 && item.category !== 'key-item') {
    return { item, used: false, consumed: false, message: 'No quantity remains.', inventory: normalizedInventory };
  }

  const message = getInventoryUseMessage(item, context);
  if (!isItemUsableInContext(item, context)) {
    return { item, used: false, consumed: false, message, inventory: normalizedInventory };
  }

  if (!item.consumesOnUse) {
    return { item, used: true, consumed: false, message, inventory: normalizedInventory };
  }

  return {
    item: { ...item, quantity: item.quantity - 1 },
    used: true,
    consumed: true,
    message,
    inventory: { ...normalizedInventory, [itemId]: Math.max(0, item.quantity - 1) }
  };
}
