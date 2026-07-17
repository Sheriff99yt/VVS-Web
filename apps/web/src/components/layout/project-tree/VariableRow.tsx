'use client';

import React from 'react';
import { TREE_DRAG_MIME } from '@/lib/treeDrag';
import { type SectionViewMode } from './constants';
import { TreeRow } from './TreeRow';
import { LOGICAL_DATA_TYPE_DESCRIPTORS } from '@vvs/graph-types';

export function VariableRow({
  variable,
  isSelected,
  color,
  hint,
  declareBadge,
  hoverBadge,
  onSelect,
  onOpen,
  onContextMenu,
  onRename,
  onDelete,
  isRenaming,
  renameValue,
  onRenameValueChange,
  onSaveRename,
  onCancelRename,
  layout = 'list',
  canReorder = false,
  isDragging = false,
  isDropTarget = false,
  onReorderDragStart,
  onReorderDragEnd,
  onReorderDragOver,
  onReorderDrop,
  onReorderDragLeave,
}: {
  variable: {
    id: string;
    name: string;
    type: string;
    binding?: string;
    flags?: { readonly?: boolean };
  };
  isSelected: boolean;
  color: string;
  hint?: string;
  declareBadge?: React.ReactNode;
  hoverBadge?: React.ReactNode;
  onSelect?: (e: React.MouseEvent) => void;
  onOpen?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onRename?: () => void;
  onDelete?: () => void;
  isRenaming?: boolean;
  renameValue?: string;
  onRenameValueChange?: (val: string) => void;
  onSaveRename?: () => void;
  onCancelRename?: () => void;
  layout?: SectionViewMode;
  canReorder?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onReorderDragStart?: (e: React.DragEvent) => void;
  onReorderDragEnd?: () => void;
  onReorderDragOver?: (e: React.DragEvent) => void;
  onReorderDrop?: (e: React.DragEvent) => void;
  onReorderDragLeave?: () => void;
}) {
  const isGrid = layout === 'grid';

  const typeMeta = !isRenaming
    ? [
        LOGICAL_DATA_TYPE_DESCRIPTORS.find((d) => d.id === variable.type)?.shortLabel ??
          variable.type.replace(/^data_/, ''),
        variable.binding && variable.binding !== 'instance' ? variable.binding : null,
        variable.flags?.readonly ? 'ro' : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : undefined;

  return (
    <TreeRow
      layout={layout}
      depth="l1"
      className={layout === 'list' ? 'gap-2' : undefined}
      active={isSelected}
      icon={
        <div
          className={`${isGrid ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full border border-zinc-950 shrink-0`}
          style={{ backgroundColor: color }}
        />
      }
      label={
        isRenaming ? (
          <input
            type="text"
            value={renameValue}
            onChange={(e) => onRenameValueChange?.(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            className={
              isGrid
                ? 'w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded px-1 py-0.5 text-[9px] text-white focus:outline-none focus:border-zinc-600 leading-none'
                : 'w-full bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] text-white focus:outline-none focus:border-zinc-600'
            }
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveRename?.();
              if (e.key === 'Escape') onCancelRename?.();
            }}
          />
        ) : (
          variable.name
        )
      }
      isRenaming={isRenaming}
      hint={[
        typeMeta,
        hint ??
          (canReorder
            ? 'Hover for reorder grip · drag row to graph · right-click for actions · double-click to focus Declare'
            : onOpen
              ? 'Drag row to graph · click to select · right-click for actions · double-click to focus Declare'
              : 'Drag row to graph · click to select · right-click for actions'),
      ]
        .filter(Boolean)
        .join(' · ')}
      onSelect={onSelect}
      onOpen={onOpen}
      onContextMenu={onContextMenu}
      canvasDrag={{
        mimeType: TREE_DRAG_MIME.variable,
        payload: JSON.stringify(variable),
        effectAllowed: 'copy',
      }}
      reorder={
        canReorder && onReorderDragStart && onReorderDragOver && onReorderDrop
          ? {
              enabled: true,
              isDragging,
              isDropTarget,
              onDragStart: onReorderDragStart,
              onDragEnd: onReorderDragEnd,
              onDragOver: onReorderDragOver,
              onDrop: onReorderDrop,
              onDragLeave: onReorderDragLeave,
            }
          : undefined
      }
      suffix={
        isRenaming ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSaveRename?.();
            }}
            className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 hover:bg-indigo-500/30 shrink-0"
          >
            Save
          </button>
        ) : (
          declareBadge
        )
      }
      hoverActions={
        !isRenaming && !isGrid ? <>{hoverBadge}</> : undefined
      }
    />
  );
}
