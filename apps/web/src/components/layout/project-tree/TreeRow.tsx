'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { configureCanvasDrag } from '@/lib/treeDrag';
import { INDENT } from './constants';

export interface TreeRowProps {
  depth?: keyof typeof INDENT;
  active?: boolean;
  icon?: React.ReactNode;
  leading?: React.ReactNode;
  label: string;
  meta?: string;
  suffix?: React.ReactNode;
  onSelect?: () => void;
  onOpen?: () => void;
  hint?: string;
  className?: string;
  isDropTarget?: boolean;
  isDragging?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  canvasDrag?: { mimeType: string; payload: string };
  onCanvasDragStart?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  showOpenAffordance?: boolean;
}

export function TreeRow({
  depth = 'l1',
  active,
  icon,
  leading,
  label,
  meta,
  onSelect,
  onOpen,
  hint,
  suffix,
  className = '',
  isDropTarget = false,
  isDragging = false,
  onDragOver,
  onDrop,
  onDragLeave,
  canvasDrag,
  onCanvasDragStart,
  onDragStart,
  onDragEnd,
  showOpenAffordance = false,
}: TreeRowProps) {
  const interactive = Boolean(onSelect || onOpen);

  const handleCanvasDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e);
      return;
    }
    if (!canvasDrag) return;
    onCanvasDragStart?.();
    configureCanvasDrag(e, canvasDrag);
  };

  const draggable = Boolean(canvasDrag || onDragStart);

  return (
    <div
      draggable={draggable}
      onDragStart={draggable ? handleCanvasDragStart : undefined}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-1.5 py-1 pr-2 select-none group ${INDENT[depth]} ${
        interactive ? 'cursor-pointer' : ''
      } ${draggable && canvasDrag ? 'cursor-grab active:cursor-grabbing' : ''} ${active ? 'bg-indigo-500/10 text-indigo-100' : 'hover:bg-zinc-900/60 text-zinc-300'} ${
        isDropTarget ? 'ring-1 ring-inset ring-indigo-500/40 bg-indigo-500/5' : ''
      } ${isDragging ? 'opacity-40' : ''} ${className}`}
      title={hint}
      onClick={onSelect}
      onDoubleClick={(e) => {
        if (!onOpen) return;
        e.preventDefault();
        onOpen();
      }}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
    >
      {leading ? <span className="shrink-0">{leading}</span> : null}
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span className="truncate text-[11px] flex-1 min-w-0">{label}</span>
      {meta ? <span className="text-[9px] text-zinc-600 truncate max-w-[42%]">{meta}</span> : null}
      {suffix ? (
        <div className="pointer-events-none shrink-0 [&_button]:pointer-events-auto">{suffix}</div>
      ) : null}
      {showOpenAffordance && onOpen ? (
        <button
          type="button"
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-zinc-500 hover:text-zinc-200 shrink-0"
          title="Open graph"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          <ExternalLink size={10} />
        </button>
      ) : null}
    </div>
  );
}
