'use client';

import React from 'react';
import { GitBranch } from 'lucide-react';
import type { GraphContainer } from '@vvs/graph-types';
import { isClassFolderDragEvent } from '@/lib/classHelpers';

export interface ClassFolderDropStripProps {
  containers: GraphContainer[];
  draggingClassId: string | null;
  dropContainerId: string | null;
  onContainerDragOver: (e: React.DragEvent, containerId: string) => void;
  onContainerDrop: (e: React.DragEvent, containerId: string) => void;
  onContainerDragLeave: (containerId: string) => void;
}

export function ClassFolderDropStrip({
  containers,
  draggingClassId,
  dropContainerId,
  onContainerDragOver,
  onContainerDrop,
  onContainerDragLeave,
}: ClassFolderDropStripProps) {
  if (!draggingClassId) return null;

  return (
    <div className="flex-none px-2 py-1.5 border-b border-indigo-500/20 bg-indigo-500/5">
      <div className="text-[9px] uppercase tracking-wide text-indigo-300/80 mb-1">
        Drop on folder to move · drop on canvas for reference
      </div>
      <div className="flex flex-wrap gap-1">
        {containers.map((container) => {
          const isTarget = dropContainerId === container.id;
          return (
            <div
              key={container.id}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] cursor-copy ${
                isTarget
                  ? 'border-indigo-400/60 bg-indigo-500/20 text-indigo-100'
                  : 'border-zinc-700/80 bg-zinc-900/80 text-zinc-300 hover:border-indigo-500/40'
              }`}
              onDragOver={(e) => {
                if (!draggingClassId && !isClassFolderDragEvent(e)) return;
                onContainerDragOver(e, container.id);
              }}
              onDrop={(e) => onContainerDrop(e, container.id)}
              onDragLeave={() => onContainerDragLeave(container.id)}
            >
              <GitBranch size={9} className="text-emerald-500/80 shrink-0" />
              <span className="truncate max-w-[8rem]">{container.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
