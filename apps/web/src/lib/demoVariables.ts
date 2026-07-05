import { createVariableSymbol, type VariableSymbol } from '@vvs/graph-types';

/** Showcase variables illustrating datatype + binding portability (demo / onboarding). */
export const DEMO_VARIABLE_SYMBOLS: VariableSymbol[] = [
  {
    ...createVariableSymbol('PlayerHealth', { id: 'demo-v-health', type: 'data_number', binding: 'instance' }),
    defaultValue: 100,
  },
  {
    ...createVariableSymbol('Score', { id: 'demo-v-score', type: 'data_number', binding: 'instance' }),
    defaultValue: 0,
  },
  {
    ...createVariableSymbol('IsAlive', { id: 'demo-v-alive', type: 'data_boolean', binding: 'instance' }),
    defaultValue: true,
  },
  {
    ...createVariableSymbol('DisplayName', { id: 'demo-v-name', type: 'data_string', binding: 'instance' }),
    defaultValue: 'Player',
  },
  {
    ...createVariableSymbol('Inventory', { id: 'demo-v-inv', type: 'data_array', binding: 'instance' }),
    defaultValue: [],
  },
  {
    ...createVariableSymbol('RuntimeConfig', { id: 'demo-v-cfg', type: 'data_object', binding: 'instance' }),
    defaultValue: { difficulty: 'normal' },
  },
  {
    ...createVariableSymbol('GlobalSeed', { id: 'demo-v-seed', type: 'data_number', binding: 'static' }),
    defaultValue: 42,
  },
  {
    ...createVariableSymbol('SessionToken', { id: 'demo-v-any', type: 'data_any', binding: 'module' }),
    defaultValue: null,
    flags: { readonly: true },
  },
];

export function mergeDemoVariables(existing: VariableSymbol[]): VariableSymbol[] {
  const names = new Set(existing.map((v) => v.name.toLowerCase()));
  const toAdd = DEMO_VARIABLE_SYMBOLS.filter((d) => !names.has(d.name.toLowerCase()));
  return [...existing, ...toAdd];
}
