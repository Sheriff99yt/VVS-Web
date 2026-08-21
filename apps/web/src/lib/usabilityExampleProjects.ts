import { ProjectSnapshot } from '@/types/projectSnapshot';
import { createSimpleSnapshot } from '@/lib/usabilityExampleTests/simpleUsabilityTest';
import { createComplexSnapshot } from '@/lib/usabilityExampleTests/complexUsabilityTest';
import { createAdvancedSnapshot } from '@/lib/usabilityExampleTests/advancedUsabilityTest';
import {
  createProjectId,
  loadProjectFromStore,
  writeProjectPayload,
} from '@/lib/projectStore';

export type UsabilityTestLevel = 'simple' | 'complex' | 'advanced';

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

/**
 * Curated graph fixtures for usability regression — not tutorial demos.
 * See `docs/design/language_capability_catalog.md` § U65 Test Project rethink.
 * Rev 1: three examples — Simple (all 8), Complex (all 8), Advanced (most).
 */
export const USABILITY_EXAMPLE_TESTS: UsabilityExampleTestDefinition[] = [
  {
    id: 'simple',
    stableProjectId: 'vvs-test-simple',
    level: 'simple',
    title: 'Simple',
    moduleName: 'Hello',
    description:
      'Hello.Name + Greet concat/print. Real program on all 8 languages — no leftover (x).',
    highlights: ['One class', 'Print + concat', 'All 8 languages'],
    create: createSimpleSnapshot,
  },
  {
    id: 'complex',
    stableProjectId: 'vvs-test-complex',
    level: 'complex',
    title: 'Complex',
    moduleName: 'Counter',
    description:
      'Counter Add + branch, counted for, enum switch. Runs on all 8 languages.',
    highlights: ['Branch / for / switch', 'Enum switch', 'All 8 languages'],
    create: createComplexSnapshot,
  },
  {
    id: 'advanced',
    stableProjectId: 'vvs-test-advanced',
    level: 'advanced',
    title: 'Advanced',
    moduleName: 'Advanced',
    description:
      'Machine / Sensor Diagnose (override + super), Get User Input, Wait. Most languages.',
    highlights: ['Extends + override', 'Get User Input', 'Wait async'],
    create: createAdvancedSnapshot,
  },
];

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
