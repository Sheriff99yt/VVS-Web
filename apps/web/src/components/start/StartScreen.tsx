'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StartHomeLayout } from '@/components/start/StartHomeLayout';
import { createEmptyProjectSnapshot } from '@/lib/emptyProject';
import {
  openUsabilityTestProject,
  seedUsabilityTestProjectsToLocalStorage,
  type UsabilityTestLevel,
} from '@/lib/usabilityExampleProjects';
import {
  createProjectId,
  loadProjectFromStore,
  removeProjectDraft,
  removeProjectFromStore,
  saveProjectToStore,
  upsertRecentProject,
  pruneStableTestProjectsFromRecent,
} from '@/lib/projectStore';
import {
  initRecentProjects,
  notifyRecentProjectsChanged,
  useRecentProjects,
} from '@/lib/recentProjectsSubscribe';
import { isProjectSnapshot } from '@/types/projectSnapshot';
import type { RecentProjectEntry } from '@/types/projectRegistry';
import { isFolderRecentEntry } from '@/types/projectRegistry';
import {
  createProjectInFolder,
  folderKeyFromHandleName,
  getFolderHandle,
  loadProjectFromFolder,
  pickProjectFolder,
  removeFolderHandle,
  storeFolderHandle,
  verifyHandlePermission,
  resolveProjectFolderHandle,
} from '@/lib/projectFolder';
import { promoteBrowserProjectToDisk } from '@/lib/promoteProjectToDisk';
import { useFolderPickerSupported } from '@/hooks/useFolderPickerSupported';
import { useUiPreference } from '@/hooks/useUiPreference';
import { readUiPreference } from '@/lib/uiPreferences';

function openLocalInEditor(
  router: ReturnType<typeof useRouter>,
  projectId: string,
  snapshot: ReturnType<typeof createEmptyProjectSnapshot>,
  source: RecentProjectEntry['source'],
  query?: Record<string, string>
) {
  saveProjectToStore(projectId, snapshot, source);
  notifyRecentProjectsChanged();
  const params = new URLSearchParams({ id: projectId });
  if (query) {
    for (const [key, value] of Object.entries(query)) params.set(key, value);
  }
  router.push(`/editor?${params.toString()}`);
}

function openFolderInEditor(
  router: ReturnType<typeof useRouter>,
  folderKey: string,
  query?: Record<string, string>
) {
  notifyRecentProjectsChanged();
  const params = new URLSearchParams({ id: folderKey });
  if (query) {
    for (const [key, value] of Object.entries(query)) params.set(key, value);
  }
  router.push(`/editor?${params.toString()}`);
}

export function StartScreen() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recent = useRecentProjects();
  const folderPickerReady = useFolderPickerSupported();
  const [folderBrowser, setFolderBrowser] = useState<{
    handle: FileSystemDirectoryHandle;
    projectName: string;
  } | null>(null);
  const [startActivity, setStartActivity] = useUiPreference('startActivity');
  const [sidebarOpen, setSidebarOpen] = useUiPreference('startSidebarOpen');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarOpen(!readUiPreference('startSidebarOpen'));
      }
    };
    window.addEventListener('keydown', onKey);
    return function unbind() {
      window.removeEventListener('keydown', onKey);
    };
  }, [setSidebarOpen]);

  useEffect(() => {
    initRecentProjects();
    pruneStableTestProjectsFromRecent();
    // Warm stable CI fixture slots only — does not touch recent or overwrite saves.
    seedUsabilityTestProjectsToLocalStorage();
  }, []);

  const refreshRecent = () => notifyRecentProjectsChanged();

  const handleNewProject = () => {
    const id = createProjectId();
    openLocalInEditor(router, id, createEmptyProjectSnapshot(), 'new');
  };

  const handleOpenUsabilityTest = (level: UsabilityTestLevel) => {
    try {
      const { projectId, snapshot } = openUsabilityTestProject(level);
      openLocalInEditor(router, projectId, snapshot, 'test');
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : 'Could not open this usability test. Check browser storage settings and try again.'
      );
    }
  };

  const handleNewProjectFolder = async () => {
    const handle = await pickProjectFolder();
    if (!handle) return;
    const snapshot = createEmptyProjectSnapshot();
    try {
      await createProjectInFolder(handle, snapshot, { adoptExisting: true });
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : 'Could not create project in that folder.'
      );
      return;
    }
    const folderKey = folderKeyFromHandleName(handle.name);
    await storeFolderHandle(folderKey, handle);
    upsertRecentProject({
      id: folderKey,
      moduleName: snapshot.projectDetails.moduleName,
      savedAt: new Date().toISOString(),
      source: 'new',
      storage: 'folder',
      folderLabel: handle.name,
    });
    openFolderInEditor(router, folderKey);
  };

  const handleOpenProjectFolder = async () => {
    const handle = await pickProjectFolder();
    if (!handle) return;
    const permitted = await verifyHandlePermission(handle);
    if (!permitted) return;
    const loaded = await loadProjectFromFolder(handle);
    if (!loaded) {
      window.alert('No .vvs/project.json found in that folder. Use "New in folder" to initialize one.');
      return;
    }
    const folderKey = folderKeyFromHandleName(handle.name);
    await storeFolderHandle(folderKey, handle);
    upsertRecentProject({
      id: folderKey,
      moduleName: loaded.snapshot.projectDetails.moduleName || handle.name,
      savedAt: loaded.snapshot.savedAt,
      source: 'recent',
      storage: 'folder',
      folderLabel: handle.name,
    });
    openFolderInEditor(router, folderKey);
  };

  const handleOpenRecent = async (entry: RecentProjectEntry) => {
    if (isFolderRecentEntry(entry)) {
      const handle = await getFolderHandle(entry.id);
      if (!handle) {
        window.alert('Folder access was lost. Use the folder button to reconnect.');
        return;
      }
      const permitted = await verifyHandlePermission(handle);
      if (!permitted) return;
      openFolderInEditor(router, entry.id);
      return;
    }
    const snapshot = loadProjectFromStore(entry.id);
    if (!snapshot) {
      removeProjectFromStore(entry.id);
      refreshRecent();
      return;
    }
    openLocalInEditor(router, entry.id, snapshot, 'recent');
  };

  const handleDeleteProject = (e: React.MouseEvent, entry: RecentProjectEntry) => {
    e.stopPropagation();
    const name = entry.moduleName || 'this project';
    const isFolder = isFolderRecentEntry(entry);
    const confirmed = window.confirm(
      isFolder
        ? `Delete "${name}" from VVS?\n\nThis removes it from your recent list and clears saved folder access. Files on disk are not deleted.`
        : `Delete "${name}"?\n\nThis permanently removes the project from browser storage and cannot be undone.`
    );
    if (!confirmed) return;

    if (isFolder) {
      void removeFolderHandle(entry.id);
      removeProjectFromStore(entry.id);
    } else {
      removeProjectFromStore(entry.id);
      removeProjectDraft(entry.id);
    }
    refreshRecent();
  };

  const handleOpenProjectDirectory = async (
    e: React.MouseEvent,
    entry: RecentProjectEntry
  ) => {
    e.stopPropagation();
    if (!folderPickerReady) {
      window.alert('Your browser does not support folder access. Use Chrome or Edge.');
      return;
    }

    let handle: FileSystemDirectoryHandle | null = null;

    if (isFolderRecentEntry(entry)) {
      handle = await resolveProjectFolderHandle(entry.id, entry.folderLabel);
    } else {
      const snapshot = loadProjectFromStore(entry.id);
      if (!snapshot) {
        window.alert('Project data not found in browser storage.');
        return;
      }
      const promoted = await promoteBrowserProjectToDisk(entry.id, snapshot, entry.source);
      if (promoted) {
        handle = promoted.handle;
        notifyRecentProjectsChanged();
      }
    }

    if (handle) {
      setFolderBrowser({ handle, projectName: entry.moduleName });
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isProjectSnapshot(parsed)) {
        window.alert('Invalid VVS project file.');
        return;
      }
      const id = parsed.projectId ?? createProjectId();
      openLocalInEditor(router, id, { ...parsed, projectId: id }, 'import');
    } catch {
      window.alert('Could not parse JSON file.');
    }
  };

  const formatRelative = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <StartHomeLayout
      fileInputRef={fileInputRef}
      folderPickerReady={folderPickerReady}
      recent={recent}
      folderBrowser={folderBrowser}
      startActivity={startActivity}
      sidebarOpen={sidebarOpen}
      setStartActivity={setStartActivity}
      setSidebarOpen={setSidebarOpen}
      setFolderBrowser={setFolderBrowser}
      onNewProject={handleNewProject}
      onNewProjectFolder={() => void handleNewProjectFolder()}
      onOpenProjectFolder={() => void handleOpenProjectFolder()}
      onImportFile={handleImportFile}
      onOpenUsabilityTest={handleOpenUsabilityTest}
      onOpenRecent={(entry) => void handleOpenRecent(entry)}
      onDeleteProject={handleDeleteProject}
      onOpenProjectDirectory={(e, entry) => void handleOpenProjectDirectory(e, entry)}
      formatRelative={formatRelative}
    />
  );
}
