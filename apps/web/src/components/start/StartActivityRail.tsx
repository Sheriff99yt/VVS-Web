'use client';

import { useRouter } from 'next/navigation';
import { BookOpen, FilePlus, Layers, Library, Map, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { openExploreView } from '@/lib/startExplore';
import type { StartActivityId } from '@/lib/startActivity';

const RAIL_ITEMS: { id: StartActivityId; label: string; Icon: typeof FilePlus }[] = [
  { id: 'start', label: 'Start', Icon: FilePlus },
  { id: 'examples', label: 'Examples', Icon: Layers },
  { id: 'library', label: 'Library', Icon: Library },
  { id: 'roadmap', label: 'Roadmap', Icon: Map },
  { id: 'docs', label: 'Docs', Icon: BookOpen },
];

export function StartActivityRail({
  active,
  sidebarOpen,
  onToggleSidebar,
  onLocalActivity,
}: {
  active: StartActivityId;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onLocalActivity?: (id: 'start' | 'examples') => void;
}) {
  const router = useRouter();

  return (
    <nav
      className="w-12 shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col items-center py-2 gap-1"
      aria-label="Start"
    >
      {RAIL_ITEMS.map(({ id, label, Icon }) => {
        const selected = active === id;
        return (
          <Tooltip key={id} content={label} placement="right">
            <button
              type="button"
              aria-label={label}
              aria-current={selected ? 'page' : undefined}
              onClick={() => {
                if (id === 'library' || id === 'roadmap' || id === 'docs') {
                  openExploreView(router, id, id === 'library' ? 'templates' : undefined);
                  return;
                }
                if (selected) {
                  onToggleSidebar?.();
                  return;
                }
                onLocalActivity?.(id);
              }}
              className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors ${
                selected
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Icon size={18} strokeWidth={1.75} />
            </button>
          </Tooltip>
        );
      })}
      {onToggleSidebar ? (
        <Tooltip content={sidebarOpen ? 'Hide sidebar (Ctrl+B)' : 'Show sidebar (Ctrl+B)'} placement="right">
          <button
            type="button"
            aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            onClick={onToggleSidebar}
            className="mt-auto mb-1 w-10 h-10 flex items-center justify-center rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900"
          >
            {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
        </Tooltip>
      ) : null}
    </nav>
  );
}
