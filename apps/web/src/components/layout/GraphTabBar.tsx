import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useEditorNavigation } from '@/contexts/EditorNavigationContext';
import { useSymbolLifecycle } from '@/hooks/useSymbolLifecycle';
import { FilePlus, Code2, ChevronDown } from 'lucide-react';
import { createFunctionSymbol } from '@/lib/functionTabs';
import {
  canCloseGraphTab,
  closeGraphTab,
  openFunctionGraphTab,
  reorderOpenTabs,
  selectionForGraphTab,
} from '@/lib/graphTabs';

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
  const [draggingTabId, setDraggingTabId] = useState<string | null>(null);
  const [dropTabId, setDropTabId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleClose = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
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
  };

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

  return (
    <div className="flex items-end gap-1 bg-zinc-950 border-b border-zinc-800 px-2 pt-2 h-9 shrink-0 relative w-full">
      <div className="flex items-end gap-1 overflow-x-auto overflow-y-hidden no-scrollbar shrink-0 max-w-[calc(100%-4rem)]">
        {openTabs.map((tab) => (
          <div
            key={tab.id}
            draggable
            onDragStart={(e) => handleTabDragStart(e, tab.id)}
            onDragOver={(e) => handleTabDragOver(e, tab.id)}
            onDrop={(e) => handleTabDrop(e, tab.id)}
            onDragEnd={handleTabDragEnd}
            onClick={() => navigateToTab(tab.id)}
            className={`flex items-center gap-2 px-3 h-7 border-x border-t rounded-t-md cursor-pointer select-none transition-colors shrink-0 ${
              activeGraphTab === tab.id
                ? 'bg-zinc-900 border-zinc-700 relative top-[1px]'
                : 'bg-zinc-950/50 hover:bg-zinc-900 border-zinc-800/50 hover:border-zinc-800'
            } ${draggingTabId === tab.id ? 'opacity-50' : ''} ${
              dropTabId === tab.id ? 'ring-1 ring-inset ring-indigo-500/50' : ''
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                tab.type === 'main' || tab.type === 'container' ? 'bg-emerald-500' : 'bg-indigo-500'
              }`}
            />
            <span
              className={`text-[11px] font-semibold whitespace-nowrap ${
                activeGraphTab === tab.id ? 'text-zinc-200' : 'text-zinc-500'
              }`}
            >
              {tab.name}
            </span>
            {isTabDirty(tab.id) ? (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Uncompiled changes" />
            ) : null}
            {canCloseGraphTab(tab) ? (
              <button
                onClick={(e) => handleClose(e, tab.id)}
                className="text-zinc-600 hover:text-red-400 ml-1.5 transition-colors p-0.5 rounded hover:bg-zinc-800/50"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <div className="relative shrink-0 mb-1 ml-1" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          title="Open or Create Graph"
          className={`flex items-center gap-1 px-2 py-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors ${showMenu ? 'bg-zinc-800 text-zinc-100' : ''}`}
        >
          <FilePlus size={14} />
          <ChevronDown size={12} className="opacity-70" />
        </button>

        {showMenu && (
          <div className="absolute top-full left-0 origin-top-left mt-2 w-48 bg-zinc-900 border border-zinc-700 shadow-2xl rounded-md py-1 z-50">
            <button
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
                    onClick={() => openExistingFunctionTab(func)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Code2 size={12} className="text-zinc-500 group-hover:text-indigo-400 transition-colors" />
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
