/** Homepage / browse-shell activity ids. Persist on Start; routes for Library/Docs/Roadmap. */
export const START_ACTIVITY_IDS = ['start', 'recent', 'examples', 'library', 'roadmap', 'docs'] as const;
export type StartActivityId = (typeof START_ACTIVITY_IDS)[number];

export function isStartActivityId(value: unknown): value is StartActivityId {
  return typeof value === 'string' && (START_ACTIVITY_IDS as readonly string[]).includes(value);
}

/** Activities that keep you on `/` with a content sidebar. */
export const START_LOCAL_ACTIVITIES = ['start', 'recent', 'examples'] as const;
export type StartLocalActivityId = (typeof START_LOCAL_ACTIVITIES)[number];

export function isStartLocalActivityId(value: unknown): value is StartLocalActivityId {
  return value === 'start' || value === 'recent' || value === 'examples';
}
