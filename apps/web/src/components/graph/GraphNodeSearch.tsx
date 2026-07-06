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
import { shortcutTitle } from '@/lib/graphShortcuts';

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
      setQuery('');
      setExpanded(false);
      inputRef.current?.blur();
    },
    [setCenter, setNodes, setSelection]
  );

  const collapse = React.useCallback(() => {
    setExpanded(false);
    setQuery('');
    inputRef.current?.blur();
  }, []);

  const openSearch = React.useCallback(() => {
    setExpanded(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openSearch]);

  React.useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as HTMLElement)) {
        collapse();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [expanded, collapse]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      collapse();
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

  if (!expanded) {
    return (
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <button
          type="button"
          onClick={openSearch}
          className="pointer-events-auto flex items-center justify-center w-8 h-8 rounded-full bg-zinc-900/90 border border-zinc-700/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors shadow-md"
          title={shortcutTitle('node-search')}
          aria-label="Search nodes"
        >
          <Search size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-full max-w-sm px-3 pointer-events-none"
    >
      <div className="pointer-events-auto">
        <div className="relative flex items-center bg-zinc-900/95 border border-zinc-700/80 rounded-lg shadow-lg">
          <Search size={14} className="absolute left-3 text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search nodes…"
            className="w-full bg-transparent pl-9 pr-8 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            autoFocus
          />
          <button
            type="button"
            onClick={collapse}
            className="absolute right-2 p-1 text-zinc-500 hover:text-zinc-300 rounded"
            title="Close"
          >
            <X size={12} />
          </button>
        </div>

        {showDropdown && (
          <div className="mt-1 rounded-lg border border-zinc-700/80 bg-zinc-900/95 shadow-lg overflow-hidden max-h-56 overflow-y-auto">
            {results.length === 0 ? (
              <div className="px-3 py-3 text-[11px] text-zinc-500 text-center">No matching nodes</div>
            ) : (
              results.map((node, index) => {
                const selected = selection.type === 'node' && selection.id === node.id;
                const highlighted = index === highlightedIndex;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => focusNode(node)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                      highlighted ? 'bg-zinc-800' : 'hover:bg-zinc-800/70'
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
        )}
      </div>
    </div>
  );
}
