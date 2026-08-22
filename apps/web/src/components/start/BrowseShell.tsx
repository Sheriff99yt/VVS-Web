'use client';

import React from 'react';
import { StandaloneTopBar } from '@/components/layout/StandaloneTopBar';

export function BrowseShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 flex flex-col">
      <StandaloneTopBar />
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
