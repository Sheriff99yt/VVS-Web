'use client';

import { usePathname, useRouter } from 'next/navigation';
import { AuthButton } from '@/components/auth/AuthButton';
import { TopNavPageSwitch } from '@/components/layout/TopNavPageSwitch';
import { useCoarsePointer, useIsMobile } from '@/hooks/useIsMobile';
import type { EditorViewTab } from '@/types/editorNavigation';

function tabFromPath(pathname: string): EditorViewTab {
  if (pathname.startsWith('/library')) return 'library';
  if (pathname.startsWith('/roadmap')) return 'roadmap';
  return 'canvas';
}

export function StandaloneTopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const coarsePointer = useCoarsePointer();
  const enlargeIconHit = coarsePointer || isMobile;
  const activeTab = tabFromPath(pathname);

  const onTab = (tab: EditorViewTab) => {
    if (tab === 'canvas') {
      router.push('/');
      return;
    }
    if (tab === 'library') {
      router.push('/library');
      return;
    }
    if (tab === 'roadmap') {
      router.push('/roadmap');
      return;
    }
    // References and packs are in-project views. No project is loaded here —
    // do not open a blank project.
    router.push('/');
  };

  return (
    <header className="h-12 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4 text-sm font-sans shrink-0 w-full z-50">
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="font-bold text-zinc-100 tracking-wide flex items-center gap-2 hover:text-zinc-300 transition-colors"
        >
          <div className="w-4 h-4 rounded bg-zinc-100" />
          VVS Web
        </button>
        <TopNavPageSwitch activeTab={activeTab} enlargeIconHit={enlargeIconHit} onTab={onTab} />
      </div>
      <div className="flex items-center gap-2">
        <AuthButton />
      </div>
    </header>
  );
}