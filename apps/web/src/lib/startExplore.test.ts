import { beforeEach, describe, expect, test } from 'bun:test';
import { createEmptyProjectSnapshot } from '@/lib/emptyProject';
import {
  loadProjectDraft,
  loadProjectFromStore,
  listRecentProjects,
} from '@/lib/projectStore';
import {
  editorHrefForProject,
  libraryBrowseHref,
  openExploreView,
  persistBrowseTemplateProject,
  roadmapBrowseHref,
} from '@/lib/startExplore';

function memoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  };
}

function installBrowserStorage() {
  const localStorage = memoryStorage();
  const sessionStorage = memoryStorage();
  const windowLike = {
    localStorage,
    sessionStorage,
    dispatchEvent: () => true,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  };
  Object.defineProperty(globalThis, 'window', { value: windowLike, configurable: true });
  Object.defineProperty(globalThis, 'localStorage', { value: localStorage, configurable: true });
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: sessionStorage,
    configurable: true,
  });
  return { localStorage, sessionStorage };
}

describe('startExplore', () => {
  beforeEach(() => {
    installBrowserStorage();
  });

  test('explore hrefs are dedicated browse routes without a project id', () => {
    expect(libraryBrowseHref()).toBe('/library');
    expect(libraryBrowseHref('templates')).toBe('/library?section=templates');
    expect(roadmapBrowseHref()).toBe('/roadmap');
    expect(libraryBrowseHref('templates')).not.toContain('id=');
    expect(libraryBrowseHref('templates')).not.toContain('proj-');
    expect(roadmapBrowseHref()).not.toContain('id=');
  });

  test('openExploreView does not save a draft or create proj-', () => {
    const pushes: string[] = [];
    const draftSet = sessionStorage.setItem.bind(sessionStorage);
    const draftWrites: string[] = [];
    sessionStorage.setItem = (key: string, value: string) => {
      draftWrites.push(key);
      draftSet(key, value);
    };

    openExploreView({ push: (href) => pushes.push(href) }, 'library', 'templates');
    openExploreView({ push: (href) => pushes.push(href) }, 'roadmap');

    expect(pushes).toEqual(['/library?section=templates', '/roadmap']);
    expect(draftWrites).toEqual([]);
    expect(listRecentProjects()).toEqual([]);
    expect(sessionStorage.length).toBe(0);
  });

  test('persistBrowseTemplateProject stores a real proj- and not a draft', () => {
    const snapshot = createEmptyProjectSnapshot();
    const projectId = persistBrowseTemplateProject(snapshot);
    expect(projectId.startsWith('proj-')).toBe(true);
    expect(loadProjectFromStore(projectId)).not.toBeNull();
    expect(loadProjectDraft(projectId)).toBeNull();
    expect(listRecentProjects().some((entry) => entry.id === projectId)).toBe(true);
    expect(editorHrefForProject(projectId)).toBe(`/editor?id=${projectId}`);
  });
});
