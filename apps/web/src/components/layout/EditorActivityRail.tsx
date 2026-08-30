'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, GitBranch, Layers, Milestone, Package, PanelLeftClose, PanelLeftOpen, PenLine } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { useEditorNavigation } from '@/contexts/EditorNavigationContext';
import { useEditorPanels } from '@/contexts/EditorPanelContext';
import { DOCS_BROWSE_PATH } from '@/lib/startExplore';
import type { EditorViewTab } from '@/types/editorNavigation';

const TABS: { id: EditorViewTab; label: string; Icon: typeof PenLine }[] = [
  { id: 'canvas', label: 'Project', Icon: PenLine },
  { id: 'references', label: 'References', Icon: GitBranch },
  { id: 'library', label: 'Library', Icon: Package },
  { id: 'roadmap', label: 'Development roadmap', Icon: Milestone },
  { id: 'packs', label: 'Syntax packs', Icon: Layers },
];

export function EditorActivityRail({ activeTab }: { activeTab: EditorViewTab }) {
  const pathname = usePathname();
  const { navigate } = useEditorNavigation();
  const { graphNavOpen, toggleGraphNav } = useEditorPanels();
  const docsActive = pathname === DOCS_BROWSE_PATH || pathname.startsWith(`${DOCS_BROWSE_PATH}/`);

  return (
    <nav
      className="w-12 shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col items-stretch py-1"
      aria-label="Project"
    >
      {TABS.map(({ id, label, Icon }) => {
        const selected = !docsActive && activeTab === id;
        return (
          <Tooltip key={id} content={label} placement="right">
            <button
              type="button"
              aria-label={label}
              aria-current={selected ? 'page' : undefined}
              onClick={() => navigate({ editorView: id })}
              className={`relative w-full h-11 flex items-center justify-center transition-colors ${
                selected ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              {selected ? (
                <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-zinc-100 rounded-r-full" />
              ) : null}
              <Icon size={18} strokeWidth={1.75} />
            </button>
          </Tooltip>
        );
      })}
      <Tooltip content="Docs" placement="right">
        <Link
          href={DOCS_BROWSE_PATH}
          aria-label="Docs"
          aria-current={docsActive ? 'page' : undefined}
          className={`relative w-full h-11 flex items-center justify-center transition-colors ${
            docsActive ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-200'
          }`}
        >
          {docsActive ? (
            <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-zinc-100 rounded-r-full" />
          ) : null}
          <BookOpen size={18} strokeWidth={1.75} />
        </Link>
      </Tooltip>
      {activeTab === 'canvas' ? (
        <Tooltip content={graphNavOpen ? 'Hide sidebar (Ctrl+B)' : 'Show sidebar (Ctrl+B)'} placement="right">
          <button
            type="button"
            aria-label={graphNavOpen ? 'Hide sidebar' : 'Show sidebar'}
            onClick={toggleGraphNav}
            className="mt-auto mb-1 w-full h-11 flex items-center justify-center text-zinc-600 hover:text-zinc-300"
          >
            {graphNavOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
        </Tooltip>
      ) : null}
    </nav>
  );
}
