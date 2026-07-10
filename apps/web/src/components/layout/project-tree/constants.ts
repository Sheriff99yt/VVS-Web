export type ExplorerTab = 'symbols' | 'output' | 'api';

export type ProjectTreeMode = 'canvas' | 'references';

export type SymbolCategoryKey = 'classes' | 'functions' | 'events' | 'variables';

export type SectionViewMode = 'list' | 'grid';

export type SectionViewKey =
  | 'graphs'
  | SymbolCategoryKey
  | 'projectFiles'
  | 'api';

export const DEFAULT_SECTION_VIEWS: Record<SectionViewKey, SectionViewMode> = {
  graphs: 'list',
  classes: 'list',
  functions: 'list',
  events: 'list',
  variables: 'list',
  projectFiles: 'list',
  api: 'list',
};

export const INDENT = { root: 'pl-2', l1: 'pl-5', l2: 'pl-8' } as const;
