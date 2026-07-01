'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search } from 'lucide-react';
import { MOCK_CATEGORIES } from '@/lib/nodeCatalog';
import { buildProjectNodeCategories } from '@/lib/projectNodeCatalog';
import { LibraryNodeTemplate } from '@/types/ui';
import { GraphTab } from '@/contexts/ProjectContext';

interface NodeContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onSelect: (template: LibraryNodeTemplate) => void;
  filter?: { pinType: string; lookingFor: 'input' | 'output' };
  currentGraphId: string;
  functions: { id: string; name: string }[];
  openTabs: GraphTab[];
}

export function NodeContextMenu({
  x,
  y,
  onClose,
  onSelect,
  filter,
  currentGraphId,
  functions,
  openTabs,
}: NodeContextMenuProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const allCategories = useMemo(
    () => [
      ...MOCK_CATEGORIES,
      ...buildProjectNodeCategories({ currentGraphId, functions, openTabs }),
    ],
    [functions, currentGraphId, openTabs]
  );

  // Focus search input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Filter categories based on search and pin filter
  const filteredCategories = allCategories
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => {
        const matchesSearch =
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.type.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesFilter = true;
        if (filter) {
          if (filter.lookingFor === 'input') {
            matchesFilter = (item.inputs || []).some(
              (pin) =>
                pin.type === filter.pinType ||
                pin.type === 'data_any' ||
                filter.pinType === 'data_any'
            );
          } else {
            matchesFilter = (item.outputs || []).some(
              (pin) =>
                pin.type === filter.pinType ||
                pin.type === 'data_any' ||
                filter.pinType === 'data_any'
            );
          }
        }

        return matchesSearch && matchesFilter;
      }),
    }))
    .filter((category) => category.items.length > 0);

  // Helper to map category to CSS variable for the mini-node color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Events':
        return 'var(--vvs-cat-events)';
      case 'Flow Control':
        return 'var(--vvs-cat-flow)';
      case 'Math':
        return 'var(--vvs-cat-math)';
      case 'Action':
        return 'var(--vvs-cat-action)';
      case 'Project':
        return 'var(--vvs-cat-project, #818cf8)';
      case 'Imports':
        return 'var(--vvs-cat-imports, #14b8a6)';
      default:
        return '#3f3f46';
    }
  };

  return (
    <div 
      ref={menuRef}
      className="fixed z-50 w-64 bg-zinc-950 border border-zinc-800 rounded shadow-2xl flex flex-col overflow-hidden"
      style={{ 
        left: x, 
        top: y,
        // Prevent clicking inside the menu from propagating to the canvas (which would close it)
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-2 border-b border-zinc-800 relative bg-zinc-900">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input 
          ref={inputRef}
          type="text" 
          placeholder="Search nodes..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs pl-8 pr-3 py-1.5 rounded focus:outline-none focus:border-zinc-600 transition-colors"
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
          }}
        />
      </div>
      
      <div className="flex-1 overflow-y-auto max-h-64 p-2 space-y-4">
        {filteredCategories.map(category => (
          <div key={category.name}>
            <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 px-2">{category.name}</h3>
            <div className="space-y-1">
              {category.items.map(item => (
                <button
                  key={item.type}
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="w-full text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white rounded px-2 py-1.5 transition-colors flex items-center gap-2 group"
                >
                  <div 
                    className="w-2 h-2 rounded-full opacity-80 group-hover:opacity-100 transition-opacity" 
                    style={{ backgroundColor: getCategoryColor(item.category) }} 
                  />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        {filteredCategories.length === 0 && (
          <div className="text-zinc-500 text-xs text-center py-4">No nodes found.</div>
        )}
      </div>
    </div>
  );
}
