'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { configureCanvasDrag } from '@/lib/treeDrag';
import { INDENT } from './constants';
import { gridTileClass, listRowClass } from './explorerStyles';

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
  layout?: 'list' | 'grid';
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
  layout = 'list',
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

  const rowTitle = [hint, meta].filter(Boolean).join(' · ');

  if (layout === 'grid') {
    return (
      <div
        draggable={draggable}
        onDragStart={draggable ? handleCanvasDragStart : undefined}
        onDragEnd={onDragEnd}
        className={`${gridTileClass(Boolean(active), {
          dropTarget: isDropTarget,
          dragging: isDragging,
          interactive,
        })} ${draggable && canvasDrag ? 'cursor-grab active:cursor-grabbing' : ''} ${className}`}
        title={rowTitle || undefined}
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
        <span className="shrink-0">{icon}</span>
        <span className="text-[10px] font-medium truncate w-full text-center leading-tight">
          {label}
        </span>
        {meta ? (
          <span className="text-[8px] text-zinc-600 truncate w-full text-center">{meta}</span>
        ) : null}
        {suffix ? (
          <div className="pointer-events-none [&_button]:pointer-events-auto scale-90 origin-center">
            {suffix}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      draggable={draggable}
      onDragStart={draggable ? handleCanvasDragStart : undefined}
      onDragEnd={onDragEnd}
      className={`${listRowClass(Boolean(active), {
        dropTarget: isDropTarget,
        dragging: isDragging,
        depthClass: INDENT[depth],
      })} ${draggable && canvasDrag ? 'cursor-grab active:cursor-grabbing' : ''} ${className}`}
      title={rowTitle || undefined}
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
      {leading ? <span className="inline-flex items-center shrink-0">{leading}</span> : null}
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span className="truncate text-[11px] flex-1 min-w-0">{label}</span>
      {meta ? (
        <span
          className={`text-[9px] text-zinc-600 truncate max-w-[32%] shrink-[3] transition-opacity ${
            active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {meta}
        </span>
      ) : null}
      {suffix ? (
        <div className="pointer-events-none shrink-0 flex items-center gap-0.5 [&_button]:pointer-events-auto [&_span[role=button]]:pointer-events-auto">
          {suffix}
        </div>
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
