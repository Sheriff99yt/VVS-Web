export type ProjectSource = 'new' | 'recent' | 'import' | 'template' | 'demo';

export interface RecentProjectEntry {
  id: string;
  moduleName: string;
  savedAt: string;
  source: ProjectSource;
}

export interface EditorBootstrap {
  projectId: string;
  snapshot: import('@/types/projectSnapshot').ProjectSnapshot;
  source: ProjectSource;
  initialView?: 'canvas' | 'references' | 'library';
}
