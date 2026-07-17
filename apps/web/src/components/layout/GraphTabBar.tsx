import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useEditorNavigation } from '@/contexts/EditorNavigationContext';
import { useSymbolLifecycle } from '@/hooks/useSymbolLifecycle';
import { FilePlus, Code2, ChevronDown, List } from 'lucide-react';
import { createFunctionSymbol } from '@/lib/functionTabs';
import {
  canCloseGraphTab,
  closeGraphTab,
  openFunctionGraphTab,
  reorderOpenTabs,
  selectionForGraphTab,
} from '@/lib/graphTabs';
import { Tooltip } from '@/components/ui/Tooltip';

export function GraphTabBar() {
  const {
    openTabs,
    activeGraphTab,
    setOpenTabs,
    setActiveGraphTab,
    functions,
    activeClassId,
    isTabDirty,
  } = useProject();
  const { navigate } = useEditorNavigation();
  const { addFunctionWithDefine } = useSymbolLifecycle();
  const [showMenu, setShowMenu] = useState(false);
  const [showOverflow, setShowOverflow] = useState(false);
  const [draggingTabId, setDraggingTabId] = useState<string | null>(null);
  const [dropTabId, setDropTabId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const overflowRef = useRef<HTMLDivElement>(null);
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const tabElRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setShowMenu(false);
      }
      if (overflowRef.current && !overflowRef.current.contains(target)) {
        setShowOverflow(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const el = tabElRefs.current.get(activeGraphTab);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }, [activeGraphTab, openTabs]);

  const navigateToTab = useCallback(
    (tabId: string) => {
      navigate(
        {
          graphTab: tabId,
          editorView: 'canvas',
          selection: selectionForGraphTab(tabId),
        },
        { history: 'push' }
      );
    },
    [navigate]
  );

  const closeTab = useCallback(
    (id: string) => {
      const tab = openTabs.find((t) => t.id === id);
      if (!tab || !canCloseGraphTab(tab)) return;
      const { nextTabs, nextActiveId } = closeGraphTab(openTabs, id, activeGraphTab);
      setOpenTabs(nextTabs);
      if (nextActiveId !== activeGraphTab) {
        navigate(
          {
            graphTab: nextActiveId,
            selection: selectionForGraphTab(nextActiveId),
          },
          { history: 'replace' }
        );
      }
    },
    [openTabs, activeGraphTab, setOpenTabs, navigate]
  );

  const handleClose = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    closeTab(id);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'w') return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      closeTab(activeGraphTab);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeGraphTab, closeTab]);

  const handleTabDragStart = (e: React.DragEvent, tabId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tabId);
    setDraggingTabId(tabId);
  };

  const handleTabDragOver = (e: React.DragEvent, tabId: string) => {
    if (!draggingTabId || draggingTabId === tabId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTabId(tabId);
  };

  const handleTabDrop = (e: React.DragEvent, tabId: string) => {
    e.preventDefault();
    if (!draggingTabId || draggingTabId === tabId) return;
    setOpenTabs((prev) => reorderOpenTabs(prev, draggingTabId, tabId));
    setDraggingTabId(null);
    setDropTabId(null);
  };

  const handleTabDragEnd = () => {
    setDraggingTabId(null);
    setDropTabId(null);
  };

  const createNewFunctionTab = () => {
    const func = createFunctionSymbol('NewFunction', { classId: activeClassId });
    addFunctionWithDefine(func);
    // Open explicitly: navigate's ensureGraphTabOpen may not see `func` yet (stale functions).
    // ensureGraphTabOpen dedupes against prev, so this + navigate will not double-add.
    openFunctionGraphTab(func, setOpenTabs, setActiveGraphTab);
    navigate(
      {
        graphTab: func.id,
        editorView: 'canvas',
        selection: selectionForGraphTab(func.id),
      },
      { history: 'push' }
    );
    setShowMenu(false);
  };

  const openExistingFunctionTab = (func: { id: string; name: string }) => {
    // Only navigate — ensureGraphTabOpen opens the tab once (deduped).
    navigate(
      {
        graphTab: func.id,
        editorView: 'canvas',
        selection: selectionForGraphTab(func.id),
      },
      { history: 'push' }
    );
    setShowMenu(false);
  };

  const dirtyCount = openTabs.filter((t) => isTabDirty(t.id)).length;

  return (
    <div className="flex items-end gap-1 bg-zinc-950 border-b border-zinc-800 px-2 pt-2 h-9 shrink-0 relative w-full">
      <div
        ref={tabsScrollRef}
        className="flex items-end gap-1 overflow-x-auto overflow-y-hidden no-scrollbar min-w-0 flex-1"
      >
        {openTabs.map((tab) => {
          const active = activeGraphTab === tab.id;
          const dirty = isTabDirty(tab.id);
          return (
            <div
              key={tab.id}
              ref={(el) => {
                if (el) tabElRefs.current.set(tab.id, el);
                else tabElRefs.current.delete(tab.id);
              }}
              draggable
              onDragStart={(e) => handleTabDragStart(e, tab.id)}
              onDragOver={(e) => handleTabDragOver(e, tab.id)}
              onDrop={(e) => handleTabDrop(e, tab.id)}
              onDragEnd={handleTabDragEnd}
              onClick={() => navigateToTab(tab.id)}
              onAuxClick={(e) => {
                if (e.button === 1) {
                  e.preventDefault();
                  e.stopPropagation();
                  closeTab(tab.id);
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 h-7 border-x border-t rounded-t-md cursor-pointer select-none transition-colors shrink-0 ${
                active
                  ? 'bg-zinc-900 border-zinc-600 text-zinc-100 relative top-[1px] shadow-[inset_0_-2px_0_0_rgb(99,102,241)]'
                  : 'bg-zinc-950/50 hover:bg-zinc-900 border-zinc-800/50 hover:border-zinc-800'
              } ${draggingTabId === tab.id ? 'opacity-50' : ''} ${
                dropTabId === tab.id ? 'ring-1 ring-inset ring-indigo-500/50' : ''
              } ${dirty && !active ? 'border-amber-800/40' : ''}`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  tab.type === 'main' || tab.type === 'container'
                    ? 'bg-emerald-500'
                    : 'bg-indigo-500'
                }`}
              />
              <span
                className={`text-[11px] font-semibold whitespace-nowrap ${
                  active ? 'text-zinc-100' : 'text-zinc-500'
                }`}
              >
                {tab.name}
              </span>
              {dirty ? (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 ring-1 ring-amber-400/40"
                  title="Uncompiled changes"
                />
              ) : null}
              {canCloseGraphTab(tab) ? (
                <button
                  type="button"
                  onClick={(e) => handleClose(e, tab.id)}
                  className="text-zinc-600 hover:text-red-400 ml-0.5 transition-colors p-0.5 rounded hover:bg-zinc-800/50"
                  title="Close tab"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="relative shrink-0 mb-1" ref={overflowRef}>
        <Tooltip content="Open graphs" placement="bottom">
          <button
            type="button"
            onClick={() => {
              setShowOverflow((v) => !v);
              setShowMenu(false);
            }}
            className={`flex items-center gap-0.5 px-1.5 py-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors ${
              showOverflow ? 'bg-zinc-800 text-zinc-100' : ''
            }`}
            aria-label="Open graphs list"
          >
            <List size={14} />
            {dirtyCount > 0 ? (
              <span className="text-[9px] font-semibold text-amber-400 tabular-nums">
                {dirtyCount}
              </span>
            ) : null}
          </button>
        </Tooltip>
        {showOverflow ? (
          <div className="absolute top-full right-0 origin-top-right mt-2 w-56 bg-zinc-900 border border-zinc-700 shadow-2xl rounded-md py-1 z-50 max-h-64 overflow-y-auto">
            {openTabs.map((tab) => {
              const active = activeGraphTab === tab.id;
              const dirty = isTabDirty(tab.id);
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    navigateToTab(tab.id);
                    setShowOverflow(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                    active
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      tab.type === 'main' || tab.type === 'container'
                        ? 'bg-emerald-500'
                        : 'bg-indigo-500'
                    }`}
                  />
                  <span className="flex-1 text-left truncate">{tab.name}</span>
                  {dirty ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  ) : null}
                  {active ? (
                    <span className="text-[9px] text-indigo-400 shrink-0">active</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="relative shrink-0 mb-1" ref={menuRef}>
        <button
          type="button"
          onClick={() => {
            setShowMenu(!showMenu);
            setShowOverflow(false);
          }}
          title="Open or Create Graph"
          className={`flex items-center gap-1 px-2 py-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors ${showMenu ? 'bg-zinc-800 text-zinc-100' : ''}`}
        >
          <FilePlus size={14} />
          <ChevronDown size={12} className="opacity-70" />
        </button>

        {showMenu && (
          <div className="absolute top-full right-0 origin-top-right mt-2 w-48 bg-zinc-900 border border-zinc-700 shadow-2xl rounded-md py-1 z-50">
            <button
              type="button"
              onClick={createNewFunctionTab}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Function
            </button>

            <div className="h-px bg-zinc-800 my-1.5 mx-2" />

            <div className="max-h-48 overflow-y-auto">
              {functions.length > 0 ? (
                functions.map((func) => (
                  <button
                    key={func.id}
                    type="button"
                    onClick={() => openExistingFunctionTab(func)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Code2
                        size={12}
                        className="text-zinc-500 group-hover:text-indigo-400 transition-colors"
                      />
                      <span>{func.name}</span>
                    </div>
                    {openTabs.some((t) => t.id === func.id) && (
                      <span className="text-[9px] text-emerald-500">●</span>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-zinc-500 italic">None</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
