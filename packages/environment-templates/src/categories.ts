export const ENVIRONMENT_CATEGORIES = [
  {
    id: 'console',
    label: 'Console & CLI',
    description: 'Terminal apps, scripts, and command-line tools.',
  },
  {
    id: 'web',
    label: 'Web & Browser',
    description: 'Browser apps, SPAs, and front-end entry points.',
  },
  {
    id: 'data',
    label: 'Data & Analysis',
    description: 'ETL, file processing, and data pipelines.',
  },
  {
    id: 'api',
    label: 'API & Services',
    description: 'HTTP services, REST handlers, and backends.',
  },
  {
    id: 'game',
    label: 'Game & Runtime',
    description: 'Game loops, C++/Verse runtimes, and simulations.',
  },
] as const;

export type EnvironmentCategory = (typeof ENVIRONMENT_CATEGORIES)[number]['id'];

const CATEGORY_IDS = new Set<string>(ENVIRONMENT_CATEGORIES.map((c) => c.id));

export function isEnvironmentCategory(value: string): value is EnvironmentCategory {
  return CATEGORY_IDS.has(value);
}

export function resolveEnvironmentCategory(
  manifest: { category?: EnvironmentCategory }
): EnvironmentCategory {
  if (manifest.category && isEnvironmentCategory(manifest.category)) {
    return manifest.category;
  }
  return 'console';
}

export function environmentCategoryLabel(category: EnvironmentCategory): string {
  return ENVIRONMENT_CATEGORIES.find((c) => c.id === category)?.label ?? category;
}

export function groupEnvironmentsByCategory<T extends { category?: EnvironmentCategory }>(
  manifests: T[]
): Map<EnvironmentCategory, T[]> {
  const groups = new Map<EnvironmentCategory, T[]>();
  for (const cat of ENVIRONMENT_CATEGORIES) {
    groups.set(cat.id, []);
  }
  for (const manifest of manifests) {
    const cat = resolveEnvironmentCategory(manifest);
    groups.get(cat)!.push(manifest);
  }
  return groups;
}
