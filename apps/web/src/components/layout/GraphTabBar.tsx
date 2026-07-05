import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useEditorNavigation } from '@/contexts/EditorNavigationContext';
import { FilePlus, Code2, ChevronDown } from 'lucide-react';
import { createFunctionSymbol, formatFunctionTabName } from '@/lib/functionTabs';

export function GraphTabBar() {
  const { openTabs, activeGraphTab, setOpenTabs, functions, setFunctions, isTabDirty } = useProject();
  const { navigate } = useEditorNavigation();
  const [showMenu, setShowMenu] = useState(false);
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

  const handleClose = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t.id !== id);
    setOpenTabs(newTabs);
    if (activeGraphTab === id && newTabs.length > 0) {
      const fallback = newTabs[newTabs.length - 1].id;
      navigate(
        { graphTab: fallback, selection: { type: 'graph', id: fallback === 'main' ? null : fallback } },
        { history: 'replace' }
      );
    } else if (newTabs.length === 0) {
      navigate({ graphTab: 'main', selection: { type: 'graph', id: null } }, { history: 'replace' });
    }
  };

  const openNewTab = (type: 'function', name?: string, id?: string) => {
    let tabId = id;
    let tabName = name;

    if (!tabId) {
      const func = createFunctionSymbol(tabName || 'NewFunction');
      tabId = func.id;
      tabName = func.name;
      setFunctions((prev) => [...prev, func]);
    }

    const displayName = formatFunctionTabName(tabName!);

    if (!openTabs.find((t) => t.id === tabId)) {
      setOpenTabs([...openTabs, { id: tabId!, type, name: displayName }]);
    }
    navigate(
      { graphTab: tabId!, editorView: 'canvas', selection: { type: 'graph', id: tabId! } },
      { history: 'push' }
    );
    setShowMenu(false);
  };

  return (
    <div className="flex items-end gap-1 bg-zinc-950 border-b border-zinc-800 px-2 pt-2 h-9 shrink-0 relative w-full">
      
      {/* Scrollable Tabs Area */}
      <div className="flex items-end gap-1 overflow-x-auto overflow-y-hidden no-scrollbar shrink-0 max-w-[calc(100%-4rem)]">
        {openTabs.map(tab => (
          <div 
            key={tab.id}
            onClick={() =>
              navigate(
                { graphTab: tab.id, editorView: 'canvas', selection: { type: 'graph', id: tab.id === 'main' ? null : tab.id } },
                { history: 'push' }
              )
            }
            className={`flex items-center gap-2 px-3 h-7 border-x border-t rounded-t-md cursor-pointer select-none transition-colors shrink-0 ${
              activeGraphTab === tab.id 
                ? 'bg-zinc-900 border-zinc-700 relative top-[1px]' 
                : 'bg-zinc-950/50 hover:bg-zinc-900 border-zinc-800/50 hover:border-zinc-800'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${tab.type === 'main' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
            <span className={`text-[11px] font-semibold whitespace-nowrap ${activeGraphTab === tab.id ? 'text-zinc-200' : 'text-zinc-500'}`}>
              {tab.name}
            </span>
            {isTabDirty(tab.id) ? (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Uncompiled changes" />
            ) : null}
            {tab.id !== 'main' && (
              <button 
                onClick={(e) => handleClose(e, tab.id)}
                className="text-zinc-600 hover:text-red-400 ml-1.5 transition-colors p-0.5 rounded hover:bg-zinc-800/50"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Tab Dropdown */}
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
              onClick={() => openNewTab('function')}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Function
            </button>

            <div className="h-px bg-zinc-800 my-1.5 mx-2" />
            
            <div className="max-h-48 overflow-y-auto">
              {functions.length > 0 ? functions.map(func => (
                <button 
                  key={func.id}
                  onClick={() => openNewTab('function', func.name, func.id)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Code2 size={12} className="text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                    <span>{func.name}</span>
                  </div>
                  {openTabs.some(t => t.id === func.id) && <span className="text-[9px] text-emerald-500">●</span>}
                </button>
              )) : (
                <div className="px-3 py-2 text-xs text-zinc-500 italic">None</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
