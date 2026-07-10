'use client';

import React from 'react';
import { GitBranch, GripVertical, PenLine, Trash2 } from 'lucide-react';
import type { ClassSymbol, GraphContainer } from '@vvs/graph-types';
import { classesForContainer } from '@/lib/classScope';
import { CategorySection } from './CategorySection';
import { SymbolCreatePopover } from './SymbolCreatePopover';
import { TreeRow } from './TreeRow';
import { TreeRenameRow } from './TreeRenameRow';
import { graphContainerClassMeta, graphContainerLabel } from './graphContainerLabels';
import { INDENT, type SectionViewMode } from './constants';

export function GraphFoldersSection({
  containers,
  classes,
  expanded,
  onToggleExpanded,
  isAdding,
  onStartAdd,
  onCancelAdd,
  newName,
  onNewNameChange,
  onSaveNew,
  renamingId,
  renameName,
  onRenameNameChange,
  onStartRename,
  onSaveRename,
  onCancelRename,
  activeGraphTab,
  isReferenceMode,
  draggingId,
  dropContainerId,
  dropGraphContainerId,
  onGraphContainerDragStart,
  onGraphContainerDragEnd,
  onContainerDragOver,
  onContainerDrop,
  onContainerDragLeave,
  onSelectGraph,
  onOpenGraph,
  canRename,
  canDelete,
  onDelete,
  emptyHint,
  viewMode = 'list',
  onViewModeChange,
}: {
  containers: GraphContainer[];
  classes: ClassSymbol[];
  expanded: boolean;
  onToggleExpanded: () => void;
  isAdding: boolean;
  onStartAdd: () => void;
  onCancelAdd: () => void;
  newName: string;
  onNewNameChange: (value: string) => void;
  onSaveNew: () => void;
  renamingId: string | null;
  renameName: string;
  onRenameNameChange: (value: string) => void;
  onStartRename: (container: GraphContainer) => void;
  onSaveRename: (container: GraphContainer) => void;
  onCancelRename: () => void;
  activeGraphTab: string;
  isReferenceMode: boolean;
  draggingId: string | null;
  dropContainerId: string | null;
  dropGraphContainerId: string | null;
  onGraphContainerDragStart: (e: React.DragEvent, container: GraphContainer) => void;
  onGraphContainerDragEnd: () => void;
  onContainerDragOver: (e: React.DragEvent, containerId: string) => void;
  onContainerDrop: (e: React.DragEvent, containerId: string) => void;
  onContainerDragLeave: (containerId: string) => void;
  onSelectGraph: (graphId: string) => void;
  onOpenGraph: (container: GraphContainer) => void;
  canRename: (container: GraphContainer) => boolean;
  canDelete: (container: GraphContainer) => boolean;
  onDelete: (containerId: string) => void;
  emptyHint: React.ReactNode;
  viewMode?: SectionViewMode;
  onViewModeChange?: (mode: SectionViewMode) => void;
}) {
  return (
    <CategorySection
      title="Graphs"
      count={containers.length}
      icon={<GitBranch size={12} className="text-emerald-500/80 shrink-0" />}
      expanded={expanded}
      onToggle={onToggleExpanded}
      onAdd={isReferenceMode ? undefined : onStartAdd}
      addLabel="New graph"
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
    >
      {isAdding ? (
        <div className={viewMode === 'grid' ? 'col-span-2' : undefined}>
        <SymbolCreatePopover open title="New graph" onClose={onCancelAdd} anchorClassName={INDENT.l1}>
          <input
            type="text"
            placeholder="Graph name"
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-zinc-600"
            value={newName}
            onChange={(e) => onNewNameChange(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveNew();
              if (e.key === 'Escape') onCancelAdd();
            }}
          />
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onSaveNew}
              className="flex-1 px-2 py-1 rounded bg-indigo-500/20 text-[10px] text-indigo-200 border border-indigo-500/30 hover:bg-indigo-500/30"
            >
              Create
            </button>
            <button
              type="button"
              onClick={onCancelAdd}
              className="px-2 py-1 rounded text-[10px] text-zinc-500 border border-zinc-800 hover:text-zinc-300"
            >
              Cancel
            </button>
          </div>
        </SymbolCreatePopover>
        </div>
      ) : null}

      {containers.map((container) => {
        const containerClasses = classesForContainer(classes, container.id);
        return (
          <React.Fragment key={container.id}>
            <TreeRow
              layout={viewMode}
              leading={
                !isReferenceMode ? (
                  <span
                    draggable
                    className="inline-flex items-center p-0 text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing"
                    title="Drag to reorder"
                    onClick={(e) => e.stopPropagation()}
                    onDragStart={(e) => onGraphContainerDragStart(e, container)}
                    onDragEnd={onGraphContainerDragEnd}
                  >
                    <GripVertical size={10} />
                  </span>
                ) : (
                  <span className="w-2.5" />
                )
              }
              icon={<GitBranch size={10} className="text-emerald-500/80 shrink-0" />}
              label={renamingId === container.id ? renameName : graphContainerLabel(container)}
              meta={graphContainerClassMeta(containerClasses.length)}
              hint="Open graph · drag a class here to set its output graph"
              active={activeGraphTab === container.id}
              isDragging={draggingId === container.id}
              isDropTarget={dropContainerId === container.id || dropGraphContainerId === container.id}
              onSelect={() => onSelectGraph(container.id)}
              onOpen={() => onOpenGraph(container)}
              onDragOver={(e) => onContainerDragOver(e, container.id)}
              onDrop={(e) => onContainerDrop(e, container.id)}
              onDragLeave={() => onContainerDragLeave(container.id)}
              suffix={
                !isReferenceMode ? (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                    {canRename(container) ? (
                      <button
                        type="button"
                        className="p-0.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-200"
                        title="Rename graph"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartRename(container);
                        }}
                      >
                        <PenLine size={10} />
                      </button>
                    ) : null}
                    {canDelete(container) ? (
                      <button
                        type="button"
                        className="p-0.5 hover:bg-zinc-700 rounded text-zinc-500 hover:text-red-400"
                        title="Delete graph"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(container.id);
                        }}
                      >
                        <Trash2 size={10} />
                      </button>
                    ) : null}
                  </div>
                ) : null
              }
            />
            {renamingId === container.id ? (
              <TreeRenameRow
                value={renameName}
                onChange={onRenameNameChange}
                onSave={() => onSaveRename(container)}
                onCancel={onCancelRename}
                viewMode={viewMode}
              />
            ) : null}
          </React.Fragment>
        );
      })}

      {containers.length === 0 && !isAdding ? (
        <div className={viewMode === 'grid' ? 'col-span-2' : undefined}>{emptyHint}</div>
      ) : null}
    </CategorySection>
  );
}
