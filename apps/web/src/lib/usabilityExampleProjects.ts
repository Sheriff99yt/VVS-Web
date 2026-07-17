import { ProjectSnapshot } from '@/types/projectSnapshot';
import { createFirstGraphUsabilityTestSnapshot } from '@/lib/usabilityExampleTests/firstGraphUsabilityTest';
import { createCoverageLabUsabilityTestSnapshot } from '@/lib/usabilityExampleTests/coverageLabUsabilityTest';
import {
  createProjectId,
  loadProjectFromStore,
  writeProjectPayload,
} from '@/lib/projectStore';

export type UsabilityTestLevel = 'simple' | 'complex';

/** @deprecated Use `UsabilityTestLevel` */
export type ExampleLevel = UsabilityTestLevel;

export interface UsabilityExampleTestDefinition {
  id: UsabilityTestLevel;
  /**
   * Stable localStorage cache id for CI / golden extract scripts.
   * StartScreen "Open" creates a **new** `proj-*` copy — it does not open this id.
   */
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

/**
 * Warm stable fixture cache slots for CI extract scripts.
 * Never touches the recent list and never overwrites an existing payload
 * (so browser edits / prior seeds are preserved).
 */
export function seedUsabilityTestProjectsToLocalStorage(): void {
  if (typeof window === 'undefined') return;
  for (const def of USABILITY_EXAMPLE_TESTS) {
    if (loadProjectFromStore(def.stableProjectId)) continue;
    writeProjectPayload(def.stableProjectId, def.create());
  }
}

/**
 * Create a **new** browser project from the usability fixture (fresh `proj-*` id).
 * Each StartScreen open adds its own recent entry — does not reuse/wipe stable slots.
 */
export function openUsabilityTestProject(level: UsabilityTestLevel): {
  projectId: string;
  snapshot: ProjectSnapshot;
} {
  const def = USABILITY_EXAMPLE_TESTS.find((e) => e.level === level);
  if (!def) throw new Error(`Unknown usability test level: ${level}`);
  const projectId = createProjectId();
  const fixture = def.create();
  const snapshot: ProjectSnapshot = {
    ...fixture,
    projectId,
    savedAt: new Date().toISOString(),
    projectDetails: {
      ...fixture.projectDetails,
      moduleName: fixture.projectDetails.moduleName || def.moduleName,
    },
  };
  return { projectId, snapshot };
}
