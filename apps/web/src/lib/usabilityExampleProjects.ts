import { ProjectSnapshot } from '@/types/projectSnapshot';
import { createFirstGraphUsabilityTestSnapshot } from '@/lib/usabilityExampleTests/firstGraphUsabilityTest';
import { createCoverageLabUsabilityTestSnapshot } from '@/lib/usabilityExampleTests/coverageLabUsabilityTest';
import { saveProjectToStore } from '@/lib/projectStore';

export type UsabilityTestLevel = 'simple' | 'complex';

/** @deprecated Use `UsabilityTestLevel` */
export type ExampleLevel = UsabilityTestLevel;

export interface UsabilityExampleTestDefinition {
  id: UsabilityTestLevel;
  /** Stable localStorage project id — Test Projects re-seed from fixtures on open. */
  stableProjectId: string;
  level: UsabilityTestLevel;
  title: string;
  moduleName: string;
  description: string;
  highlights: string[];
  create: () => ProjectSnapshot;
}

/** @deprecated Use `UsabilityExampleTestDefinition` */
export type ExampleProjectDefinition = UsabilityExampleTestDefinition;

export const USABILITY_TEST_FIXTURE_REVISION = 5;

/**
 * Curated graph fixtures for usability regression — not tutorial demos.
 * See `docs/design/language_capability_catalog.md` · U65 Test Project rethink.
 * Rev 3: Declare ≠ Define vocabulary (U81) — Call / Declare / Define; same-file bodies (U80).
 */
export const USABILITY_EXAMPLE_TESTS: UsabilityExampleTestDefinition[] = [
  {
    id: 'simple',
    stableProjectId: 'vvs-test-first-graph',
    level: 'simple',
    title: 'First Graph',
    moduleName: 'FirstGraph',
    description:
      'Newcomer path: Declare (var/class/function) → Get User Input → Print → Call → Print. Body via Edit function body (same file).',
    highlights: ['Declare · Call · Define roles', 'Edit function body', 'Get User Input'],
    create: createFirstGraphUsabilityTestSnapshot,
  },
  {
    id: 'complex',
    stableProjectId: 'vvs-test-coverage-lab',
    level: 'complex',
    title: 'Coverage Lab',
    moduleName: 'CoverageLab',
    description:
      'Machine + Sensor on one graph → one file. Declare functions · Call at use; TypeRef enum / class / array / map, modifiers, switch, for, imports, Get User Input.',
    highlights: [
      'Two classes / one graph',
      'Declare · Call (Define = U81)',
      'TypeRef (enum·class·array·map)',
      '1:1 member order',
    ],
    create: createCoverageLabUsabilityTestSnapshot,
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

/** Write/refresh all StartScreen Test Projects into localStorage with stable ids (source: test). */
export function seedUsabilityTestProjectsToLocalStorage(): void {
  if (typeof window === 'undefined') return;
  for (const def of USABILITY_EXAMPLE_TESTS) {
    saveProjectToStore(def.stableProjectId, def.create(), 'test');
  }
}

/** Rebuild fixture snapshot into its stable localStorage slot (canonical Test Project open). */
export function openUsabilityTestProject(level: UsabilityTestLevel): {
  projectId: string;
  snapshot: ProjectSnapshot;
} {
  const def = USABILITY_EXAMPLE_TESTS.find((e) => e.level === level);
  if (!def) throw new Error(`Unknown usability test level: ${level}`);
  const snapshot = def.create();
  saveProjectToStore(def.stableProjectId, snapshot, 'test');
  return { projectId: def.stableProjectId, snapshot };
}
