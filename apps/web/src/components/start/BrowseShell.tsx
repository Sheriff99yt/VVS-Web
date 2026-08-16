'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function BrowseShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 flex flex-col">
      <header className="border-b border-zinc-800 px-8 py-5 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to projects
        </Link>
        <span className="text-sm font-semibold text-zinc-100">{title}</span>
      </header>
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
