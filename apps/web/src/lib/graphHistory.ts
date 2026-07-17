import type {
  VVSNode,
  VVSEdge,
  VariableSymbol,
  FunctionSymbol,
  ProjectEventDefinition,
} from '@/types/graph';
import type { GraphDocument } from '@/lib/graphDefaults';
import type { GraphTab } from '@/contexts/ProjectContext';
import type { ClassSymbol } from '@vvs/graph-types';

export interface GraphHistoryEntryMeta {
  id: string;
  label: string;
  at: number;
}

/** Where to show the user after undo / redo / History jump (not mouse navigation). */
export interface GraphHistoryReveal {
  tabId: string;
  focusNodeIds: string[];
}

export interface ProjectDetailsSlice {
  moduleName: string;
  extendsType: string;
  description: string;
}

/** Symbol tables + all graph documents at a point in time (for undoable dual-write). */
export interface ProjectHistorySlice {
  variables: VariableSymbol[];
  functions: FunctionSymbol[];
  events: ProjectEventDefinition[];
  classes: ClassSymbol[];
  activeClassId: string;
  projectDetails: ProjectDetailsSlice;
  documents: Record<string, GraphDocument>;
  openTabs: GraphTab[];
  activeGraphTab: string;
}

export interface GraphHistorySnapshot {
  nodes: VVSNode[];
  edges: VVSEdge[];
  label: string;
  at: number;
  id: string;
  /** Tab this canvas snapshot belongs to (lean entries + project entries). */
  activeGraphTab: string;
  /** Present when project symbols/docs must restore with this entry. */
  project?: ProjectHistorySlice;
}

export function cloneProjectSlice(slice: ProjectHistorySlice): ProjectHistorySlice {
  return structuredClone(slice);
}

export function cloneGraphSnapshot(
  nodes: VVSNode[],
  edges: VVSEdge[],
  label: string,
  activeGraphTab: string,
  project?: ProjectHistorySlice | null
): GraphHistorySnapshot {
  return {
    nodes: structuredClone(nodes),
    edges: structuredClone(edges),
    label,
    at: Date.now(),
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    activeGraphTab,
    ...(project ? { project: cloneProjectSlice(project) } : {}),
  };
}

export function metaFromSnapshot(s: GraphHistorySnapshot): GraphHistoryEntryMeta {
  return { id: s.id, label: s.label, at: s.at };
}

/** Tab + selected nodes from a restored snapshot — used to reveal the undo site. */
export function revealFromSnapshot(snap: GraphHistorySnapshot): GraphHistoryReveal {
  return {
    tabId: snap.project?.activeGraphTab ?? snap.activeGraphTab,
    focusNodeIds: snap.nodes.filter((n) => n.selected).map((n) => n.id),
  };
}
