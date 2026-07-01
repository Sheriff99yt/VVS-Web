import { GraphTab, TargetLanguage } from '@/contexts/ProjectContext';
import { GraphDocument } from '@/lib/graphDefaults';
import { graphDisplayName, generatedFileName } from './graphTabs';

const LIFECYCLE_EVENT_LABELS = new Set(['On Start', 'On Update']);

export interface EventDispatcherEntry {
  id: string;
  label: string;
  graphId: string;
}

export function listEventDispatchers(
  documents: Record<string, GraphDocument> | null
): EventDispatcherEntry[] {
  if (!documents) return [];

  const seen = new Set<string>();
  const entries: EventDispatcherEntry[] = [];

  for (const [graphId, doc] of Object.entries(documents)) {
    for (const node of doc.nodes) {
      if (node.type !== 'vvs_standard_node' || node.data.category !== 'Events') continue;
      const label = (node.data.label ?? '').trim();
      if (!label || LIFECYCLE_EVENT_LABELS.has(label)) continue;

      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push({ id: `dispatcher-${key}`, label, graphId });
    }
  }

  return entries.sort((a, b) => a.label.localeCompare(b.label));
}

export interface MacroEntry {
  id: string;
  name: string;
}

export interface GeneratedExportEntry {
  graphId: string;
  graphLabel: string;
  graphType: 'main' | 'function' | 'macro';
  fileName: string;
}

export function listGeneratedExports(
  openTabs: GraphTab[],
  functions: { id: string; name: string }[],
  documents: Record<string, GraphDocument> | null,
  moduleName: string,
  targetLanguage: TargetLanguage
): GeneratedExportEntry[] {
  return listAllGraphTabs(openTabs, functions, documents).map((tab) => ({
    graphId: tab.id,
    graphLabel: graphDisplayName(tab),
    graphType: tab.type,
    fileName: generatedFileName(tab, moduleName, targetLanguage),
  }));
}

export function listMacroEntries(openTabs: GraphTab[]): MacroEntry[] {
  return openTabs
    .filter((t) => t.type === 'macro')
    .map((t) => ({ id: t.id, name: graphDisplayName(t) }));
}

export function listAllGraphTabs(
  openTabs: GraphTab[],
  functions: { id: string; name: string }[],
  documents: Record<string, GraphDocument> | null
): GraphTab[] {
  const byId = new Map<string, GraphTab>();

  byId.set('main', { id: 'main', type: 'main', name: 'Main graph' });

  for (const func of functions) {
    const existing = openTabs.find((t) => t.id === func.id);
    byId.set(func.id, existing ?? { id: func.id, type: 'function', name: `Function: ${func.name}` });
  }

  for (const tab of openTabs) {
    if (tab.type === 'macro') byId.set(tab.id, tab);
  }

  if (documents) {
    for (const id of Object.keys(documents)) {
      if (id === 'main' || byId.has(id)) continue;
      const tab = openTabs.find((t) => t.id === id);
      if (tab) byId.set(id, tab);
    }
  }

  return Array.from(byId.values());
}

export interface BreadcrumbSegment {
  label: string;
  graphId?: string;
}

export function buildGraphBreadcrumb(
  moduleName: string,
  activeGraphTab: string,
  openTabs: GraphTab[]
): BreadcrumbSegment[] {
  const tab = openTabs.find((t) => t.id === activeGraphTab) ?? {
    id: 'main',
    type: 'main' as const,
    name: 'Main graph',
  };

  const segments: BreadcrumbSegment[] = [{ label: moduleName || 'Untitled' }];

  if (tab.type === 'main') {
    segments.push({ label: 'Main graph', graphId: 'main' });
    return segments;
  }

  segments.push({
    label: tab.type === 'function' ? 'Functions' : 'Macros',
  });
  segments.push({ label: graphDisplayName(tab), graphId: tab.id });
  return segments;
}
