import { ProjectSnapshot } from '@/types/projectSnapshot';
import { createHelloWorldUsabilityTestSnapshot } from '@/lib/usabilityExampleTests/helloWorldUsabilityTest';
import { createCalculatorUsabilityTestSnapshot } from '@/lib/usabilityExampleTests/calculatorUsabilityTest';

export type UsabilityTestLevel = 'simple' | 'complex';

/** @deprecated Use `UsabilityTestLevel` */
export type ExampleLevel = UsabilityTestLevel;

export interface UsabilityExampleTestDefinition {
  id: UsabilityTestLevel;
  level: UsabilityTestLevel;
  title: string;
  moduleName: string;
  description: string;
  highlights: string[];
  create: () => ProjectSnapshot;
}

/** @deprecated Use `UsabilityExampleTestDefinition` */
export type ExampleProjectDefinition = UsabilityExampleTestDefinition;

/**
 * Curated graph fixtures for usability regression — not tutorial demos.
 * Each opens a project that exercises canvas nodes and drives discovery of missing
 * inspector fields, spawn catalog entries, and per-language options.
 * See `docs/design/language_capability_catalog.md`.
 */
export const USABILITY_EXAMPLE_TESTS: UsabilityExampleTestDefinition[] = [
  {
    id: 'simple',
    level: 'simple',
    title: 'Hello World',
    moduleName: 'HelloWorld',
    description:
      'Minimal Declare → On → Print flow. Baseline for spawn catalog, handler wiring, and codegen highlight coverage.',
    highlights: ['1 graph', '2 nodes', 'No variables'],
    create: createHelloWorldUsabilityTestSnapshot,
  },
  {
    id: 'complex',
    level: 'complex',
    title: 'Calculator',
    moduleName: 'Calculator',
    description:
      'Member chain, multi-graph, Get User Input, Call/Dispatch, Branch, To String — surfaces gaps in unified UI for all targets.',
    highlights: ['Member chain', 'Declare + On + Dispatch', 'Multi-graph', 'Branch + To String'],
    create: createCalculatorUsabilityTestSnapshot,
  },
];

/** @deprecated Use `USABILITY_EXAMPLE_TESTS` */
export const EXAMPLE_PROJECTS = USABILITY_EXAMPLE_TESTS;

export function createUsabilityExampleTestSnapshot(level: UsabilityTestLevel): ProjectSnapshot {
  const def = USABILITY_EXAMPLE_TESTS.find((e) => e.level === level);
  if (!def) throw new Error(`Unknown usability test level: ${level}`);
  return def.create();
}

/** @deprecated Use `createUsabilityExampleTestSnapshot` */
export function createExampleSnapshot(level: UsabilityTestLevel): ProjectSnapshot {
  return createUsabilityExampleTestSnapshot(level);
}
