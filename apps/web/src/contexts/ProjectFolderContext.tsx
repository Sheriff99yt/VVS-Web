'use client';

import React, { createContext, useContext, useMemo, ReactNode } from 'react';

interface ProjectFolderContextValue {
  folderKey: string | null;
  folderHandle: FileSystemDirectoryHandle | null;
  folderLabel: string | null;
  isFolderProject: boolean;
}

const ProjectFolderContext = createContext<ProjectFolderContextValue>({
  folderKey: null,
  folderHandle: null,
  folderLabel: null,
  isFolderProject: false,
});

interface ProjectFolderProviderProps {
  children: ReactNode;
  folderKey?: string | null;
  folderHandle?: FileSystemDirectoryHandle | null;
  folderLabel?: string | null;
}

export function ProjectFolderProvider({
  children,
  folderKey = null,
  folderHandle = null,
  folderLabel = null,
}: ProjectFolderProviderProps) {
  const value = useMemo(
    () => ({
      folderKey: folderKey ?? null,
      folderHandle: folderHandle ?? null,
      folderLabel: folderLabel ?? null,
      isFolderProject: Boolean(folderKey && folderHandle),
    }),
    [folderKey, folderHandle, folderLabel]
  );

  return (
    <ProjectFolderContext.Provider value={value}>{children}</ProjectFolderContext.Provider>
  );
}

export function useProjectFolder(): ProjectFolderContextValue {
  return useContext(ProjectFolderContext);
}
