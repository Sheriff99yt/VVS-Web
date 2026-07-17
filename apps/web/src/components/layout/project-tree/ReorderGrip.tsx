'use client';

import React from 'react';
import { GripVertical } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';

/** Visual size for explorer reorder handles (~70% of the prior 20px size). */
export const REORDER_GRIP_ICON_SIZE = 14;

export interface ReorderGripProps {
  title?: string;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

/** Dedicated drag handle so row-level canvas drag does not steal reorder. */
export function ReorderGrip({
  title = 'Drag to reorder',
  onDragStart,
  onDragEnd,
}: ReorderGripProps) {
  return (
    <Tooltip content={title} placement="top">
      <span
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          onDragStart(e);
        }}
        onDragEnd={onDragEnd}
        className="inline-flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300 p-0.5 -ml-0.5"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={REORDER_GRIP_ICON_SIZE} strokeWidth={2} />
      </span>
    </Tooltip>
  );
}
