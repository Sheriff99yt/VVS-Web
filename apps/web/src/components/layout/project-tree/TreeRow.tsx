'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { configureCanvasDrag, type TreeCanvasDrag } from '@/lib/treeDrag';
import { INDENT } from './constants';
import { gridTileClass, listRowClass } from './explorerStyles';
import { ReorderGrip } from './ReorderGrip';

export interface TreeRowReorderProps {
  enabled: boolean;
  title?: string;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
}

export interface TreeRowProps {
  depth?: keyof typeof INDENT;
  active?: boolean;
  icon?: React.ReactNode;
  /** Extra leading content when not using built-in reorder (rare). */
  leading?: React.ReactNode;
  label: React.ReactNode;
  /** Secondary text — shown on hover/selection; always in row title tooltip. */
  meta?: string;
  suffix?: React.ReactNode;
  hoverActions?: React.ReactNode;
  onSelect?: (e: React.MouseEvent) => void;
  /** Double-click: open the related graph (function body, class home, etc.). */
  onOpen?: () => void;
  /**
   * External-link button. Defaults to `onOpen` when omitted.
   * Functions: use **Edit function body** title; Define badge handles host-graph Define.
   */
  onOpenAffordance?: () => void;
  /** Tooltip for the open-affordance control (default: Open graph). */
  openAffordanceTitle?: string;
  onContextMenu?: (e: React.MouseEvent) => void;
  hint?: string;
  className?: string;
  /**
   * Built-in reorder: grip is the reorder source; whole row stays canvas-draggable (palette-first).
   */
  reorder?: TreeRowReorderProps;
  /** @deprecated Prefer `reorder` — kept for drop-target-only rows. */
  isDropTarget?: boolean;
  /** @deprecated Prefer `reorder` */
  isDragging?: boolean;
  /** @deprecated Prefer `reorder` */
  onDragOver?: (e: React.DragEvent) => void;
  /** @deprecated Prefer `reorder` */
  onDrop?: (e: React.DragEvent) => void;
  /** @deprecated Prefer `reorder` */
  onDragLeave?: () => void;
  canvasDrag?: TreeCanvasDrag;
  onCanvasDragStart?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  showOpenAffordance?: boolean;
  layout?: 'list' | 'grid';
  isRenaming?: boolean;
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
  onOpenAffordance,
  openAffordanceTitle,
  onContextMenu,
  hint,
  suffix,
  hoverActions,
  className = '',
  reorder,
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
  isRenaming = false,
}: TreeRowProps) {
  const interactive = Boolean(onSelect || onOpen);
  const openAffordance = onOpenAffordance ?? onOpen;
  const reorderEnabled = Boolean(reorder?.enabled);
  const dragging = reorder?.isDragging ?? isDragging;
  const dropTarget = reorder?.isDropTarget ?? isDropTarget;
  const handleDragOver = reorderEnabled ? reorder!.onDragOver : onDragOver;
  const handleDrop = reorderEnabled ? reorder!.onDrop : onDrop;
  const handleDragLeave = reorderEnabled ? reorder!.onDragLeave : onDragLeave;

  const startCanvasDrag = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e);
      return;
    }
    if (!canvasDrag) return;
    onCanvasDragStart?.();
    configureCanvasDrag(e, canvasDrag);
  };

  // Palette-first: whole row canvas-drags even when a reorder grip is present.
  // Grip uses its own draggable + stopPropagation so it does not start canvas drag.
  const rowDraggable = !isRenaming && Boolean(canvasDrag || onDragStart);

  const labelText = typeof label === 'string' ? label : undefined;
  const rowTitle = [labelText, hint, meta].filter(Boolean).join(' · ');
  const secondaryVisible = Boolean(active);

  const grip = reorderEnabled ? (
    <span
      className={`inline-flex shrink-0 transition-opacity ${
        dragging || dropTarget
          ? 'opacity-100'
          : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
      }`}
    >
      <ReorderGrip
        title={reorder!.title}
        onDragStart={reorder!.onDragStart}
        onDragEnd={() => {
          reorder!.onDragEnd?.();
          onDragEnd?.();
        }}
      />
    </span>
  ) : leading ? (
    <span className="inline-flex items-center shrink-0">{leading}</span>
  ) : null;

  const labelNode = (
    <span
      className={`truncate font-medium min-w-0 flex-1 text-left ${
        layout === 'grid' ? 'text-[10px] leading-none pr-0.5' : 'text-[11px]'
      }`}
    >
      {label}
    </span>
  );

  const secondaryClass = secondaryVisible
    ? 'opacity-100'
    : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100';

  if (layout === 'grid') {
    return (
      <Tooltip
        content={rowTitle || undefined}
        disabled={!rowTitle}
        placement="right"
        className="block w-full min-w-0"
      >
        <div
          draggable={rowDraggable}
          onDragStart={rowDraggable ? startCanvasDrag : undefined}
          onDragEnd={onDragEnd}
          className={`${gridTileClass(Boolean(active), {
            dropTarget,
            dragging,
            interactive,
          })} ${rowDraggable && canvasDrag ? 'cursor-grab active:cursor-grabbing' : ''} ${className}`}
          onClick={onSelect}
          onContextMenu={onContextMenu}
          onDoubleClick={(e) => {
            if (!onOpen) return;
            e.preventDefault();
            onOpen();
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragLeave={handleDragLeave}
        >
          {grip}
          {icon ? <span className="shrink-0">{icon}</span> : null}
          {labelNode}
          {suffix ? (
            <div className="absolute top-0.5 right-0.5 z-10 pointer-events-none [&_button]:pointer-events-auto flex items-center gap-0.5">
              {suffix}
            </div>
          ) : null}
        </div>
      </Tooltip>
    );
  }

  return (
    <Tooltip
      content={rowTitle || undefined}
      disabled={!rowTitle}
      placement="right"
      className="block w-full min-w-0"
    >
      <div
        draggable={rowDraggable}
        onDragStart={rowDraggable ? startCanvasDrag : undefined}
        onDragEnd={onDragEnd}
        className={`${listRowClass(Boolean(active), {
          dropTarget,
          dragging,
          depthClass: INDENT[depth],
        })} ${rowDraggable && canvasDrag ? 'cursor-grab active:cursor-grabbing' : ''} ${className}`}
        onClick={onSelect}
        onContextMenu={onContextMenu}
        onDoubleClick={(e) => {
          if (!onOpen) return;
          e.preventDefault();
          onOpen();
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={handleDragLeave}
      >
        {grip}
        {icon ? <span className="shrink-0">{icon}</span> : null}
        {labelNode}
        {meta ? (
          <span
            className={`text-[9px] text-zinc-600 truncate max-w-[32%] shrink-[3] transition-opacity ${secondaryClass}`}
          >
            {meta}
          </span>
        ) : null}
        {suffix ? (
          <div className="pointer-events-none shrink-0 flex items-center gap-0.5 [&_button]:pointer-events-auto [&_span[role=button]]:pointer-events-auto">
            {suffix}
          </div>
        ) : null}
        {hoverActions ? (
          <div
            className={`pointer-events-none [&_button]:pointer-events-auto shrink-0 flex items-center gap-0.5 transition-opacity ${secondaryClass}`}
          >
            {hoverActions}
          </div>
        ) : null}
        {showOpenAffordance && openAffordance ? (
          <Tooltip content={openAffordanceTitle ?? 'Open graph'} placement="top">
            <button
              type="button"
              className={`p-0.5 rounded text-zinc-500 hover:text-zinc-200 shrink-0 transition-opacity ${secondaryClass}`}
              onClick={(e) => {
                e.stopPropagation();
                openAffordance();
              }}
            >
              <ExternalLink size={10} />
            </button>
          </Tooltip>
        ) : null}
      </div>
    </Tooltip>
  );
}
