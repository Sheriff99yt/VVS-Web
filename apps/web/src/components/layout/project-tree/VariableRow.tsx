'use client';

import React from 'react';
import { configureCanvasDrag, TREE_DRAG_MIME } from '@/lib/treeDrag';
import { INDENT, type SectionViewMode } from './constants';
import { gridTileClass, listRowClass } from './explorerStyles';
import { RowActionsMenu } from './RowActionsMenu';
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
  onRename,
  onDelete,
  isRenaming,
  renameValue,
  onRenameValueChange,
  onSaveRename,
  onCancelRename,
  layout = 'list',
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
  onSelect?: () => void;
  onOpen?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  isRenaming?: boolean;
  renameValue?: string;
  onRenameValueChange?: (val: string) => void;
  onSaveRename?: () => void;
  onCancelRename?: () => void;
  layout?: SectionViewMode;
}) {
  const canRename = !!onRename;
  const canDelete = !!onDelete;

  if (layout === 'grid') {
    return (
      <div
        className={gridTileClass(isSelected)}
        onClick={onSelect}
        onDoubleClick={(e) => {
          if (!onOpen) return;
          e.preventDefault();
          onOpen();
        }}
        title={hint}
        draggable
        onDragStart={(e) => {
          configureCanvasDrag(e, {
            mimeType: TREE_DRAG_MIME.variable,
            payload: JSON.stringify(variable),
            effectAllowed: 'copy',
          });
        }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full border border-zinc-950 shrink-0 mb-0.5"
          style={{ backgroundColor: color }}
        />
        {isRenaming ? (
          <input
            type="text"
            value={renameValue}
            onChange={(e) => onRenameValueChange?.(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 bg-zinc-950 border border-zinc-800 rounded px-1 py-0.5 text-[9px] text-white focus:outline-none focus:border-zinc-600 leading-none"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveRename?.();
              if (e.key === 'Escape') onCancelRename?.();
            }}
          />
        ) : (
          <span className="text-[10px] font-medium truncate flex-1 min-w-0 text-left leading-none">
            {variable.name}
          </span>
        )}
        <div className="flex items-center gap-0.5 shrink-0">
          {declareBadge}
          {isRenaming ? (
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
          ) : null}
        </div>
        {!isRenaming && (canRename || canDelete) ? (
          <div className="absolute right-0.5 top-1/2 -translate-y-1/2 pointer-events-none [&_button]:pointer-events-auto scale-90 origin-right shrink-0 flex items-center bg-zinc-900/90 backdrop-blur-sm pl-1.5 py-1 rounded-l opacity-0 group-hover:opacity-100 transition-opacity z-10 ml-1">
            {hoverBadge}
            <RowActionsMenu
              actions={[
                ...(canRename ? [{ label: 'Rename', onClick: () => onRename?.() }] : []),
                ...(canDelete ? [{ label: 'Delete', onClick: () => onDelete?.(), danger: true }] : []),
              ]}
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`${listRowClass(isSelected, { depthClass: `gap-2 ${INDENT.l1}` })} cursor-pointer group`}
      onClick={onSelect}
      onDoubleClick={(e) => {
        if (!onOpen) return;
        e.preventDefault();
        onOpen();
      }}
      title={hint ?? (onOpen ? 'Click to select · Double-click to open' : 'Click to select')}
      draggable
      onDragStart={(e) => {
        configureCanvasDrag(e, {
          mimeType: TREE_DRAG_MIME.variable,
          payload: JSON.stringify(variable),
          effectAllowed: 'copy',
        });
      }}
    >
      <span className="w-4 shrink-0" />
      <div
        className="w-2 h-2 rounded-full border border-zinc-950 shrink-0"
        style={{ backgroundColor: color }}
      />
      {isRenaming ? (
        <input
          type="text"
          value={renameValue}
          onChange={(e) => onRenameValueChange?.(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] text-white focus:outline-none focus:border-zinc-600"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveRename?.();
            if (e.key === 'Escape') onCancelRename?.();
          }}
        />
      ) : (
        <span className="text-[11px] truncate flex-1">{variable.name}</span>
      )}
      {!isRenaming && (
        <>
          <span className="text-[9px] text-zinc-600 uppercase shrink-0">
            {LOGICAL_DATA_TYPE_DESCRIPTORS.find((d) => d.id === variable.type)?.shortLabel ??
              variable.type.replace(/^data_/, '')}
          </span>
          {variable.binding && variable.binding !== 'instance' ? (
            <span className="text-[8px] uppercase text-amber-500/80 shrink-0">{variable.binding}</span>
          ) : null}
          {variable.flags?.readonly ? (
            <span className="text-[8px] uppercase text-zinc-500 shrink-0">ro</span>
          ) : null}
        </>
      )}
      {declareBadge ? (
        <div className="pointer-events-none shrink-0 [&_button]:pointer-events-auto">{declareBadge}</div>
      ) : null}
      {isRenaming ? (
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
      ) : !variable.flags?.readonly && (canRename || canDelete) ? (
        <div className="absolute right-0.5 top-1/2 -translate-y-1/2 pointer-events-none [&_button]:pointer-events-auto shrink-0 flex items-center bg-zinc-950/90 backdrop-blur-sm pl-1.5 py-1 rounded-l opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {hoverBadge}
          <RowActionsMenu
            actions={[
              ...(canRename ? [{ label: 'Rename', onClick: () => onRename?.() }] : []),
              ...(canDelete ? [{ label: 'Delete', onClick: () => onDelete?.(), danger: true }] : []),
            ]}
          />
        </div>
      ) : null}
    </div>
  );
}
