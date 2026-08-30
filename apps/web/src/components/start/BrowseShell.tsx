'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { StandaloneTopBar } from '@/components/layout/StandaloneTopBar';
import { StartActivityRail } from '@/components/start/StartActivityRail';
import { writeUiPreferences } from '@/lib/uiPreferences';
import { DOCS_BROWSE_PATH, LIBRARY_BROWSE_PATH, ROADMAP_BROWSE_PATH } from '@/lib/startExplore';
import type { StartActivityId } from '@/lib/startActivity';

function activityFromPath(pathname: string): StartActivityId {
  if (pathname === LIBRARY_BROWSE_PATH || pathname.startsWith(`${LIBRARY_BROWSE_PATH}/`)) return 'library';
  if (pathname === ROADMAP_BROWSE_PATH || pathname.startsWith(`${ROADMAP_BROWSE_PATH}/`)) return 'roadmap';
  if (pathname === DOCS_BROWSE_PATH || pathname.startsWith(`${DOCS_BROWSE_PATH}/`)) return 'docs';
  return 'start';
}

export function BrowseShell({
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const active = activityFromPath(pathname);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 flex flex-col">
      <StandaloneTopBar />
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <StartActivityRail
          active={active}
          onLocalActivity={(id) => {
            writeUiPreferences({ startActivity: id, startSidebarOpen: true });
            router.push('/');
          }}
        />
        <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
