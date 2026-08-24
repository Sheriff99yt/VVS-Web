import type { ProjectSnapshot } from '@/types/projectSnapshot';
import { createProjectId, saveProjectToStore } from '@/lib/projectStore';

export const LIBRARY_BROWSE_PATH = '/library';
export const ROADMAP_BROWSE_PATH = '/roadmap';
export const DOCS_BROWSE_PATH = '/docs';

/** Ephemeral ProjectProvider id for /library browse — never persisted. */
export const BROWSE_LIBRARY_PROJECT_ID = 'browse-library';

export function libraryBrowseHref(section?: string): string {
  if (!section) return LIBRARY_BROWSE_PATH;
  const params = new URLSearchParams({ section });
  return `${LIBRARY_BROWSE_PATH}?${params.toString()}`;
}

export function roadmapBrowseHref(): string {
  return ROADMAP_BROWSE_PATH;
}

export function editorHrefForProject(projectId: string): string {
  return `/editor?${new URLSearchParams({ id: projectId }).toString()}`;
}

/**
 * Open Library or Roadmap without creating a stored/session project.
 * Callers must not save a draft or mint a proj-* id here.
 */
export function openExploreView(
  router: { push: (href: string) => void },
  view: 'library' | 'roadmap' | 'docs',
  section?: string
): void {
  const href =
    view === 'library' ? libraryBrowseHref(section) : view === 'docs' ? DOCS_BROWSE_PATH : roadmapBrowseHref();
  router.push(href);
}

/** Applying a template from Library browse creates a real stored project. */
export function persistBrowseTemplateProject(snapshot: ProjectSnapshot): string {
  const projectId = createProjectId();
  saveProjectToStore(projectId, { ...snapshot, projectId }, 'template');
  return projectId;
}
