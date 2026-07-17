'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Search, X, Layers } from 'lucide-react';
import { useReactFlow, useStore } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import { useProject } from '@/contexts/ProjectContext';
import { useGraphDocuments } from '@/hooks/useGraphDocuments';
import { useEditorNavigation } from '@/contexts/EditorNavigationContext';
import { useUiPreference } from '@/hooks/useUiPreference';
import { VVSNode } from '@/types/graph';
import {
  filterOutlinerNodes,
  nodeCategoryColor,
  nodeDisplayLabel,
} from '@/lib/nodeOutliner';
import { shortcutKeys, shortcutTitle } from '@/lib/graphShortcuts';
import {
  FOCUS_GRAPH_NODE_SEARCH_EVENT,
  type FocusGraphNodeSearchDetail,
} from '@/lib/uiPreferences';
import { nodesForSearchSubscription } from '@/lib/graphVirtualization';
import { focusGraphNodes } from '@/lib/graphCamera';
import { graphDisplayName } from '@/lib/graphTabs';
import { Tooltip } from '@/components/ui/Tooltip';

const MAX_RESULTS = 12;

type SearchHit = { node: VVSNode; tabId: string; tabLabel: string };

export function GraphNodeSearch() {
  const { selection, setSelection, activeGraphTab, openTabs } = useProject();
  const documents = useGraphDocuments();
  const { navigate } = useEditorNavigation();
  const { fitView, setNodes } = useReactFlow();
  const [searchAllGraphs, setSearchAllGraphs] = useUiPreference('nodeSearchAllGraphs');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  // U83: do not subscribe to the full node list while search is collapsed.
  const nodes = useStore(
    useCallback(
      (state: { nodes: Node[] }) =>
        nodesForSearchSubscription(expanded, state.nodes) as VVSNode[],
      [expanded]
    )
  );

  const tabLabel = useCallback(
    (tabId: string) => {
      const tab = openTabs.find((t) => t.id === tabId);
      return tab ? graphDisplayName(tab) : tabId;
    },
    [openTabs]
  );

  const results = useMemo((): SearchHit[] => {
    if (!query.trim()) return [];

    if (!searchAllGraphs) {
      return filterOutlinerNodes(nodes, query)
        .slice(0, MAX_RESULTS)
        .map((node) => ({
          node,
          tabId: activeGraphTab,
          tabLabel: tabLabel(activeGraphTab),
        }));
    }

    const hits: SearchHit[] = [];
    const docs = documents ?? {};
    // Prefer active tab first so local matches rank higher.
    const tabIds = [
      activeGraphTab,
      ...Object.keys(docs).filter((id) => id !== activeGraphTab),
    ];
    for (const tabId of tabIds) {
      const docNodes = (docs[tabId]?.nodes ?? []) as Node[];
      for (const node of filterOutlinerNodes(docNodes, query)) {
        hits.push({ node, tabId, tabLabel: tabLabel(tabId) });
        if (hits.length >= MAX_RESULTS) return hits;
      }
    }
    return hits;
  }, [activeGraphTab, documents, nodes, query, searchAllGraphs, tabLabel]);

  const showDropdown = expanded && query.trim().length > 0;
  const highlightedIndex =
    results.length === 0 ? 0 : Math.min(activeIndex, results.length - 1);

  const focusHit = React.useCallback(
    (hit: SearchHit) => {
      if (hit.tabId !== activeGraphTab) {
        navigate({
          graphTab: hit.tabId,
          editorView: 'canvas',
          selection: { type: 'node', id: hit.node.id },
          focusedNodeId: hit.node.id,
        });
      } else {
        setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === hit.node.id })));
        setSelection({ type: 'node', id: hit.node.id });
        requestAnimationFrame(() => {
          focusGraphNodes(fitView, [hit.node.id]);
        });
      }
      inputRef.current?.focus();
    },
    [activeGraphTab, fitView, navigate, setNodes, setSelection]
  );

  const collapseIfEmpty = React.useCallback(() => {
    if (query.trim()) return;
    setExpanded(false);
    inputRef.current?.blur();
  }, [query]);

  const clearAndCollapse = React.useCallback(() => {
    setQuery('');
    setExpanded(false);
    setActiveIndex(0);
    inputRef.current?.blur();
  }, []);

  const openSearch = React.useCallback(
    (initialQueries?: string | string[], searchAllGraphsOverride?: boolean) => {
      setExpanded(true);
      if (searchAllGraphsOverride === true) setSearchAllGraphs(true);
      else if (searchAllGraphsOverride === false) setSearchAllGraphs(false);
      if (initialQueries !== undefined) {
        const terms = (
          Array.isArray(initialQueries) ? initialQueries : [initialQueries]
        )
          .map((s) => s.trim())
          .filter(Boolean);
        const unique = [...new Set(terms)];
        setQuery(unique.join(', '));
        setActiveIndex(0);
      }
      requestAnimationFrame(() => inputRef.current?.focus());
    },
    [setSearchAllGraphs]
  );

  React.useEffect(() => {
    const onFocusSearch = (event: Event) => {
      const detail = (event as CustomEvent<FocusGraphNodeSearchDetail>).detail;
      const initial =
        detail?.queries && detail.queries.length > 0
          ? detail.queries
          : detail?.query;
      openSearch(initial, detail?.searchAllGraphs);
    };
    window.addEventListener(FOCUS_GRAPH_NODE_SEARCH_EVENT, onFocusSearch);
    return () => window.removeEventListener(FOCUS_GRAPH_NODE_SEARCH_EVENT, onFocusSearch);
  }, [openSearch]);

  React.useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as HTMLElement)) {
        // Clicking the canvas (or any outside chrome) fully closes search so F frames again.
        clearAndCollapse();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [expanded, clearAndCollapse]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (query.trim()) {
        setQuery('');
        setActiveIndex(0);
      } else {
        clearAndCollapse();
      }
      return;
    }
    if (!showDropdown || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const hit = results[highlightedIndex];
      if (hit) focusHit(hit);
    }
  };

  const keepExpanded = expanded || query.trim().length > 0;

  const handleHoverOpen = React.useCallback(() => {
    openSearch();
  }, [openSearch]);

  const handleHoverClose = React.useCallback(() => {
    collapseIfEmpty();
  }, [collapseIfEmpty]);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-auto flex flex-col transition-[width] duration-200 ease-out ${
        keepExpanded ? 'w-72' : 'w-8'
      }`}
      onMouseEnter={handleHoverOpen}
      onMouseLeave={handleHoverClose}
    >
      <div
        className={`relative flex items-center h-8 overflow-hidden border transition-colors duration-200 ${
          keepExpanded
            ? 'bg-zinc-950 border-zinc-800 rounded-md shadow-lg shadow-black/30'
            : 'bg-zinc-950/90 border-zinc-800 rounded-md hover:border-zinc-700'
        }`}
      >
        <Tooltip
          content={`${shortcutTitle('node-search')} · ${shortcutTitle('node-search-all')}`}
          placement="bottom"
        >
          <button
            type="button"
            onClick={() => openSearch()}
            className="shrink-0 w-8 h-8 inline-flex items-center justify-center text-zinc-500 hover:text-zinc-200 transition-colors"
            aria-label="Search nodes"
            aria-expanded={keepExpanded}
          >
            <Search size={13} />
          </button>
        </Tooltip>

        <input
          ref={inputRef}
          type="text"
          role="searchbox"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
            if (!expanded) setExpanded(true);
          }}
          onFocus={() => setExpanded(true)}
          onBlur={() => {
            requestAnimationFrame(() => collapseIfEmpty());
          }}
          onKeyDown={handleInputKeyDown}
          placeholder={`Search… (${shortcutKeys('node-search')}; comma = OR)`}
          className={`bg-transparent text-[11px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-[opacity,width,padding] duration-200 ease-out ${
            keepExpanded
              ? 'flex-1 min-w-0 opacity-100 pl-0 pr-14 py-1.5'
              : 'w-0 opacity-0 p-0 pointer-events-none'
          }`}
          tabIndex={keepExpanded ? 0 : -1}
        />

        {keepExpanded ? (
          <div className="absolute right-1 flex items-center gap-0.5">
            <Tooltip
              content={
                searchAllGraphs
                  ? 'Searching all graphs (click for this graph only)'
                  : 'Searching this graph only (click for all graphs)'
              }
              placement="bottom"
            >
              <button
                type="button"
                onClick={() => setSearchAllGraphs(!searchAllGraphs)}
                className={`p-1 rounded ${
                  searchAllGraphs
                    ? 'text-indigo-300 hover:text-indigo-200'
                    : 'text-zinc-600 hover:text-zinc-300'
                }`}
                aria-pressed={searchAllGraphs}
                aria-label={searchAllGraphs ? 'Search all graphs' : 'Search this graph only'}
              >
                <Layers size={11} />
              </button>
            </Tooltip>
            {query ? (
              <Tooltip content="Clear" placement="bottom">
                <button
                  type="button"
                  onClick={clearAndCollapse}
                  className="p-1 text-zinc-600 hover:text-zinc-300 rounded"
                  aria-label="Clear search"
                >
                  <X size={11} />
                </button>
              </Tooltip>
            ) : null}
          </div>
        ) : null}
      </div>

      {showDropdown ? (
        <div className="mt-1 rounded-md border border-zinc-800 bg-zinc-950 shadow-lg shadow-black/40 overflow-hidden max-h-56 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-2.5 py-2.5 text-[11px] text-zinc-500 text-center">No matching nodes</div>
          ) : (
            results.map((hit, index) => {
              const selected =
                selection.type === 'node' &&
                selection.id === hit.node.id &&
                hit.tabId === activeGraphTab;
              const highlighted = index === highlightedIndex;
              return (
                <button
                  key={`${hit.tabId}:${hit.node.id}`}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => focusHit(hit)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left transition-colors ${
                    highlighted ? 'bg-zinc-900' : 'hover:bg-zinc-900/80'
                  } ${selected ? 'border-l-2 border-indigo-500' : 'border-l-2 border-transparent'}`}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: nodeCategoryColor(hit.node.data.category) }}
                  />
                  <span className="text-[11px] text-zinc-200 truncate flex-1">
                    {nodeDisplayLabel(hit.node)}
                  </span>
                  {searchAllGraphs ? (
                    <span className="text-[9px] text-zinc-500 shrink-0 truncate max-w-[72px]">
                      {hit.tabLabel}
                    </span>
                  ) : (
                    <span className="text-[9px] text-zinc-600 shrink-0">{hit.node.data.category}</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
