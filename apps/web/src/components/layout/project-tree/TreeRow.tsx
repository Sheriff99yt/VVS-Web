'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';
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
  meta?: string;
  suffix?: React.ReactNode;
  hoverActions?: React.ReactNode;
  onSelect?: (e: React.MouseEvent) => void;
  /** Double-click: typically focus/select Declare on canvas. */
  onOpen?: () => void;
  /**
   * External-link button. Defaults to `onOpen` when omitted.
   * Use to open a different target (e.g. function body) than double-click.
   */
  onOpenAffordance?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  hint?: string;
  className?: string;
  /**
   * Built-in list+grid reorder: grip + drop targets.
   * When enabled, whole-row canvas drag is disabled; pass `canvasDrag` to drag from the label.
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

  // When reordering, never make the whole row the canvas drag source — grip owns DnD.
  const rowDraggable = !isRenaming && !reorderEnabled && Boolean(canvasDrag || onDragStart);
  const labelCanvasDrag = reorderEnabled && !isRenaming && Boolean(canvasDrag);

  const labelText = typeof label === 'string' ? label : undefined;
  const rowTitle = [labelText, hint, meta].filter(Boolean).join(' · ');

  const grip = reorderEnabled ? (
    <ReorderGrip
      title={reorder!.title}
      onDragStart={reorder!.onDragStart}
      onDragEnd={() => {
        reorder!.onDragEnd?.();
        onDragEnd?.();
      }}
    />
  ) : leading ? (
    <span className="inline-flex items-center shrink-0">{leading}</span>
  ) : null;

  const labelNode =
    typeof label === 'string' || labelCanvasDrag ? (
      <span
        className={`truncate font-medium min-w-0 flex-1 text-left ${
          layout === 'grid' ? 'text-[10px] leading-none pr-0.5' : 'text-[11px]'
        } ${labelCanvasDrag ? 'cursor-grab active:cursor-grabbing' : ''}`}
        draggable={labelCanvasDrag}
        onDragStart={labelCanvasDrag ? startCanvasDrag : undefined}
        title={labelCanvasDrag ? 'Drag to graph' : undefined}
      >
        {label}
      </span>
    ) : (
      <span
        className={`truncate min-w-0 flex-1 ${
          layout === 'grid' ? 'text-[10px] font-medium leading-none pr-0.5' : 'text-[11px]'
        }`}
      >
        {label}
      </span>
    );

  if (layout === 'grid') {
    return (
      <div
        draggable={rowDraggable}
        onDragStart={rowDraggable ? startCanvasDrag : undefined}
        onDragEnd={onDragEnd}
        className={`${gridTileClass(Boolean(active), {
          dropTarget,
          dragging,
          interactive,
        })} ${rowDraggable && canvasDrag ? 'cursor-grab active:cursor-grabbing' : ''} ${className}`}
        title={rowTitle || undefined}
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
    );
  }

  return (
    <div
      draggable={rowDraggable}
      onDragStart={rowDraggable ? startCanvasDrag : undefined}
      onDragEnd={onDragEnd}
      className={`${listRowClass(Boolean(active), {
        dropTarget,
        dragging,
        depthClass: INDENT[depth],
      })} ${rowDraggable && canvasDrag ? 'cursor-grab active:cursor-grabbing' : ''} ${className}`}
      title={rowTitle || undefined}
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
          className={`text-[9px] text-zinc-600 truncate max-w-[32%] shrink-[3] transition-opacity ${
            active || !hoverActions ? 'opacity-100' : 'opacity-100 group-hover:opacity-40'
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
      {hoverActions ? (
        <div className="pointer-events-none [&_button]:pointer-events-auto shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          {hoverActions}
        </div>
      ) : null}
      {showOpenAffordance && openAffordance ? (
        <button
          type="button"
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-zinc-500 hover:text-zinc-200 shrink-0"
          title="Open graph"
          onClick={(e) => {
            e.stopPropagation();
            openAffordance();
          }}
        >
          <ExternalLink size={10} />
        </button>
      ) : null}
    </div>
  );
}
