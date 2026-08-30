/** Homepage / browse-shell activity ids. Persist on Start; routes for Library/Docs/Roadmap. */
export const START_ACTIVITY_IDS = ['start', 'examples', 'library', 'roadmap', 'docs'] as const;
export type StartActivityId = (typeof START_ACTIVITY_IDS)[number];

export function isStartActivityId(value: unknown): value is StartActivityId {
  return typeof value === 'string' && (START_ACTIVITY_IDS as readonly string[]).includes(value);
}

/** Activities that keep you on `/` with a content sidebar. */
export const START_LOCAL_ACTIVITIES = ['start', 'examples'] as const;
export type StartLocalActivityId = (typeof START_LOCAL_ACTIVITIES)[number];

export function isStartLocalActivityId(value: unknown): value is StartLocalActivityId {
  return value === 'start' || value === 'examples';
}

/** Old Start/Recent split stored `recent`; that activity now lives on Start. */
export function migrateStartActivity(value: unknown): StartLocalActivityId {
  if (value === 'examples') return 'examples';
  return 'start';
}
