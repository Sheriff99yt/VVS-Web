import { GraphTab, TargetLanguage } from '@/contexts/ProjectContext';
import { GraphDocument } from '@/lib/graphDefaults';
import { graphDisplayName, generatedFileName } from './graphTabs';

import type { ProjectEventDefinition } from '@/types/graph';
import { findGraphWithEventDefine } from './eventHelpers';
import { resolveNodeKindId } from './nodeKind';

const LIFECYCLE_EVENT_LABELS = new Set(['On Start', 'On Update']);

export interface EventDispatcherEntry {
  id: string;
  label: string;
  graphId: string;
  subscriberCount: number;
}

function countEventSubscribers(
  eventId: string,
  documents: Record<string, GraphDocument> | null
): number {
  if (!documents) return 0;
  let count = 0;
  for (const doc of Object.values(documents)) {
    for (const node of doc.nodes) {
      if (node.type !== 'vvs_standard_node') continue;
      if (resolveNodeKindId(node.data) !== 'event_subscribe') continue;
      if (node.data.properties?.eventId === eventId) count += 1;
    }
  }
  return count;
}

/** List project events for the tree. Falls back to scanning graphs for legacy projects. */
export function listEventDispatchers(
  events: ProjectEventDefinition[],
  documents: Record<string, GraphDocument> | null
): EventDispatcherEntry[] {
  if (events.length > 0) {
    return events
      .map((event) => ({
        id: event.id,
        label: eventDisplayName(event.name),
        graphId: findGraphWithEventDefine(event.id, documents) ?? 'main',
        subscriberCount: countEventSubscribers(event.id, documents),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  return listLegacyEventDispatchers(documents);
}

function eventDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'Custom event';
  return trimmed.toLowerCase().startsWith('on ') ? trimmed : `On ${trimmed}`;
}

function listLegacyEventDispatchers(
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
      entries.push({ id: `dispatcher-${key}`, label, graphId, subscriberCount: 0 });
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

/** @deprecated Macro authoring removed — always returns []. */
export function listMacroEntries(_openTabs: GraphTab[]): MacroEntry[] {
  return [];
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
    if (tab.type === 'function' && !byId.has(tab.id)) byId.set(tab.id, tab);
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

  segments.push({ label: 'Functions' });
  segments.push({ label: graphDisplayName(tab), graphId: tab.id });
  return segments;
}
