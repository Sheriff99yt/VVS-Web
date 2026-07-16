'use client';

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useNodes, useReactFlow } from '@xyflow/react';
import { useProject } from '@/contexts/ProjectContext';
import { VVSNode } from '@/types/graph';
import {
  filterOutlinerNodes,
  nodeCategoryColor,
  nodeDisplayLabel,
} from '@/lib/nodeOutliner';
import { shortcutKeys, shortcutTitle } from '@/lib/graphShortcuts';
import { FOCUS_GRAPH_NODE_SEARCH_EVENT } from '@/lib/uiPreferences';

const MAX_RESULTS = 12;

export function GraphNodeSearch() {
  const { selection, setSelection } = useProject();
  const { setCenter, setNodes } = useReactFlow();
  const nodes = useNodes();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const results = React.useMemo(() => {
    if (!query.trim()) return [];
    return filterOutlinerNodes(nodes, query).slice(0, MAX_RESULTS);
  }, [nodes, query]);

  const showDropdown = expanded && query.trim().length > 0;
  const highlightedIndex =
    results.length === 0 ? 0 : Math.min(activeIndex, results.length - 1);

  const focusNode = React.useCallback(
    (node: VVSNode) => {
      setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === node.id })));
      setSelection({ type: 'node', id: node.id });
      setCenter(node.position.x, node.position.y, { duration: 400, zoom: 1 });
      // Keep query + expanded so the user can jump through matches.
      inputRef.current?.focus();
    },
    [setCenter, setNodes, setSelection]
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

  const openSearch = React.useCallback(() => {
    setExpanded(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  React.useEffect(() => {
    const onFocusSearch = () => openSearch();
    window.addEventListener(FOCUS_GRAPH_NODE_SEARCH_EVENT, onFocusSearch);
    return () => window.removeEventListener(FOCUS_GRAPH_NODE_SEARCH_EVENT, onFocusSearch);
  }, [openSearch]);

  React.useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as HTMLElement)) {
        collapseIfEmpty();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [expanded, collapseIfEmpty]);

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
      const node = results[highlightedIndex];
      if (node) focusNode(node);
    }
  };

  const keepExpanded = expanded || query.trim().length > 0;

  return (
    <div
      ref={containerRef}
      className="absolute top-3 left-3 z-20 pointer-events-none"
    >
      <div
        className={`pointer-events-auto flex flex-col transition-[width] duration-200 ease-out ${
          keepExpanded ? 'w-64' : 'w-8'
        }`}
      >
        <div
          className={`relative flex items-center h-8 overflow-hidden border transition-colors duration-200 ${
            keepExpanded
              ? 'bg-zinc-950 border-zinc-800 rounded-md shadow-lg shadow-black/30'
              : 'bg-zinc-950/90 border-zinc-800 rounded-md hover:border-zinc-700'
          }`}
        >
          <button
            type="button"
            onClick={openSearch}
            className="shrink-0 w-8 h-8 inline-flex items-center justify-center text-zinc-500 hover:text-zinc-200 transition-colors"
            title={shortcutTitle('node-search')}
            aria-label="Search nodes"
            aria-expanded={keepExpanded}
          >
            <Search size={13} />
          </button>

          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
              if (!expanded) setExpanded(true);
            }}
            onFocus={() => setExpanded(true)}
            onBlur={() => {
              // Defer so result clicks still register; collapse only when empty.
              requestAnimationFrame(() => collapseIfEmpty());
            }}
            onKeyDown={handleInputKeyDown}
            placeholder={`Search nodes… (${shortcutKeys('node-search')})`}
            className={`bg-transparent text-[11px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-[opacity,width,padding] duration-200 ease-out ${
              keepExpanded
                ? 'flex-1 min-w-0 opacity-100 pl-0 pr-7 py-1.5'
                : 'w-0 opacity-0 p-0 pointer-events-none'
            }`}
            tabIndex={keepExpanded ? 0 : -1}
          />

          {keepExpanded && query ? (
            <button
              type="button"
              onClick={clearAndCollapse}
              className="absolute right-1.5 p-1 text-zinc-600 hover:text-zinc-300 rounded"
              title="Clear"
            >
              <X size={11} />
            </button>
          ) : null}
        </div>

        {showDropdown ? (
          <div className="mt-1 rounded-md border border-zinc-800 bg-zinc-950 shadow-lg shadow-black/40 overflow-hidden max-h-56 overflow-y-auto">
            {results.length === 0 ? (
              <div className="px-2.5 py-2.5 text-[11px] text-zinc-500 text-center">No matching nodes</div>
            ) : (
              results.map((node, index) => {
                const selected = selection.type === 'node' && selection.id === node.id;
                const highlighted = index === highlightedIndex;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => focusNode(node)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left transition-colors ${
                      highlighted ? 'bg-zinc-900' : 'hover:bg-zinc-900/80'
                    } ${selected ? 'border-l-2 border-indigo-500' : 'border-l-2 border-transparent'}`}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: nodeCategoryColor(node.data.category) }}
                    />
                    <span className="text-[11px] text-zinc-200 truncate flex-1">
                      {nodeDisplayLabel(node)}
                    </span>
                    <span className="text-[9px] text-zinc-600 shrink-0">{node.data.category}</span>
                  </button>
                );
              })
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
