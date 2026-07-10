'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { LOGICAL_DATA_TYPE_DESCRIPTORS } from '@vvs/graph-types';
import { configureCanvasDrag, TREE_DRAG_MIME } from '@/lib/treeDrag';
import { INDENT, type SectionViewMode } from './constants';
import { explorerRowDeleteClass, gridTileClass, listRowClass } from './explorerStyles';

export function VariableRow({
  variable,
  isSelected,
  color,
  hint,
  declareBadge,
  onSelect,
  onOpen,
  onDelete,
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
  onSelect?: () => void;
  onOpen?: () => void;
  onDelete?: () => void;
  layout?: SectionViewMode;
}) {
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
          className="w-2.5 h-2.5 rounded-full border border-zinc-950 shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-[10px] font-medium truncate w-full text-center">{variable.name}</span>
        <span className="text-[8px] text-zinc-600 uppercase">
          {LOGICAL_DATA_TYPE_DESCRIPTORS.find((d) => d.id === variable.type)?.shortLabel ??
            variable.type.replace(/^data_/, '')}
        </span>
        {declareBadge ? (
          <div className="pointer-events-none [&_button]:pointer-events-auto scale-90">{declareBadge}</div>
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
      <span className="text-[11px] truncate flex-1">{variable.name}</span>
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
      {declareBadge ? (
        <div className="pointer-events-none shrink-0 [&_button]:pointer-events-auto">{declareBadge}</div>
      ) : null}
      {onDelete ? (
        <button
          type="button"
          className={`opacity-0 group-hover:opacity-100 ${explorerRowDeleteClass} shrink-0`}
          title="Remove variable"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 size={11} />
        </button>
      ) : null}
    </div>
  );
}
