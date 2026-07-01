import { ProjectSnapshot } from '@/types/projectSnapshot';
import { createSimpleExampleSnapshot } from '@/lib/examples/simpleExample';
import { createComplexExampleSnapshot } from '@/lib/examples/complexExample';

export type ExampleLevel = 'simple' | 'complex';

export interface ExampleProjectDefinition {
  id: ExampleLevel;
  level: ExampleLevel;
  title: string;
  moduleName: string;
  description: string;
  highlights: string[];
  create: () => ProjectSnapshot;
}

export const EXAMPLE_PROJECTS: ExampleProjectDefinition[] = [
  {
    id: 'simple',
    level: 'simple',
    title: 'Hello World',
    moduleName: 'HelloWorld',
    description: 'A single On Start event wired to Print String — the smallest useful graph.',
    highlights: ['1 graph', '2 nodes', 'No variables'],
    create: createSimpleExampleSnapshot,
  },
  {
    id: 'complex',
    level: 'complex',
    title: 'Game Session',
    moduleName: 'GameSession',
    description:
      'A small game loop with health, score, branching, and two function graphs you can explore in the tree.',
    highlights: ['3 graphs', '4 variables', 'Branch + Update'],
    create: createComplexExampleSnapshot,
  },
];

export function createExampleSnapshot(level: ExampleLevel): ProjectSnapshot {
  const def = EXAMPLE_PROJECTS.find((e) => e.level === level);
  if (!def) throw new Error(`Unknown example level: ${level}`);
  return def.create();
}
