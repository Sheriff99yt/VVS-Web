'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PenLine, GitBranch, Package, Milestone, Layers, BookOpen } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { topNavViewTabButtonClass } from '@/lib/mobileViewport';
import { DOCS_BROWSE_PATH } from '@/lib/startExplore';
import type { EditorViewTab } from '@/types/editorNavigation';

const TABS: { id: EditorViewTab; tip: string }[] = [
  { id: 'canvas', tip: 'Project' },
  { id: 'references', tip: 'References' },
  { id: 'library', tip: 'Library' },
  { id: 'roadmap', tip: 'Development roadmap' },
  { id: 'packs', tip: 'Syntax packs' },
];

const ICONS = {
  canvas: PenLine,
  references: GitBranch,
  library: Package,
  roadmap: Milestone,
  packs: Layers,
} as const;

export function TopNavPageSwitch({
  activeTab,
  enlargeIconHit,
  onTab,
}: {
  activeTab: EditorViewTab;
  enlargeIconHit: boolean;
  onTab: (tab: EditorViewTab) => void;
}) {
  const viewTabBtnClass = topNavViewTabButtonClass(enlargeIconHit);
  const pathname = usePathname();
  const docsActive = pathname === DOCS_BROWSE_PATH || pathname.startsWith(`${DOCS_BROWSE_PATH}/`);

  return (
    <div className="flex items-center bg-zinc-950 rounded border border-zinc-800 overflow-hidden">
      {TABS.map((tab, index) => {
        const Icon = ICONS[tab.id];
        const active = !docsActive && activeTab === tab.id;
        return (
          <Tooltip key={tab.id} content={tab.tip} placement="bottom" className="flex">
            <button
              type="button"
              onClick={() => onTab(tab.id)}
              className={`${viewTabBtnClass} transition-colors ${
                index > 0 ? 'border-l border-zinc-800 ' : ''
              }${active ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}
            >
              <Icon size={14} />
            </button>
          </Tooltip>
        );
      })}
      <Tooltip content="Docs" placement="bottom" className="flex">
        <Link
          href={DOCS_BROWSE_PATH}
          className={`${viewTabBtnClass} border-l border-zinc-800 transition-colors ${
            docsActive ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
          }`}
          aria-label="Docs"
        >
          <BookOpen size={14} />
        </Link>
      </Tooltip>
    </div>
  );
}