'use client';

import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileJson,
  FileText,
  Folder,
  FolderOpen,
} from 'lucide-react';
import type {
  ClassSymbol,
  FunctionSymbol,
  GraphContainer,
  ProjectFolderPathEntry,
  ProjectFolderPathKind,
} from '@vvs/graph-types';
import type { GeneratedFileTreeNode } from '@/lib/generatedFileTree';
import { dispatchSelectGeneratedFile } from '@/lib/generatedFileNavigation';
import { rootOrphanEntries, vvsDisplayTree, vvsFolderEntries } from '@/lib/mergedStructureTree';
import { Tooltip } from '@/components/ui/Tooltip';
import { INDENT, type SectionViewMode } from './constants';
import { gridTileClass } from './explorerStyles';

function plainFileIcon(kind: ProjectFolderPathKind) {
  switch (kind) {
    case 'vvs':
      return <FileJson size={10} className="text-amber-500/80 shrink-0" />;
    case 'host':
      return <FileText size={10} className="text-sky-500/70 shrink-0" />;
    default:
      return <FileText size={10} className="text-zinc-500 shrink-0" />;
  }
}

function PlainFileRow({
  path,
  kind,
  depth,
  layout = 'list',
}: {
  path: string;
  kind: ProjectFolderPathKind;
  depth: number;
  layout?: SectionViewMode;
}) {
  const name = path.split('/').pop() ?? path;
  const isGenerated = kind === 'generated';

  if (layout === 'grid') {
    return (
      <Tooltip content={path} placement="right" className="block w-full min-w-0">
        <button
          type="button"
          className={`${gridTileClass(false)} text-left w-full`}
          onClick={() => {
            if (isGenerated) dispatchSelectGeneratedFile(path);
          }}
        >
          {plainFileIcon(kind)}
          <span
            className={`truncate text-[9px] font-mono text-left flex-1 min-w-0 ${
              isGenerated ? 'text-zinc-400 group-hover:text-emerald-200' : 'text-zinc-500'
            }`}
          >
            {name}
          </span>
        </button>
      </Tooltip>
    );
  }

  return (
    <Tooltip content={path} placement="right" className="block w-full min-w-0">
      <button
        type="button"
        className="group w-full flex items-center gap-1 py-0.5 pr-2 rounded text-left hover:bg-zinc-900/60"
        style={{ paddingLeft: depth * 12 + 20 }}
        onClick={() => {
          if (isGenerated) dispatchSelectGeneratedFile(path);
        }}
      >
        {plainFileIcon(kind)}
        <span
          className={`truncate text-[10px] font-mono flex-1 ${
            isGenerated ? 'text-zinc-400 group-hover:text-emerald-200' : 'text-zinc-500'
          }`}
        >
          {name}
        </span>
      </button>
    </Tooltip>
  );
}
function VvsDirNode({
  node,
  depth,
  pathKinds,
  resolveKind,
}: {
  node: GeneratedFileTreeNode;
  depth: number;
  pathKinds: Map<string, ProjectFolderPathKind>;
  resolveKind: (path: string) => ProjectFolderPathKind;
}) {
  const [open, setOpen] = useState(depth < 2);
  return (
    <div>
      <button
        type="button"
        className="flex items-center gap-1 py-0.5 pr-2 w-full hover:bg-zinc-900/50 text-left"
        style={{ paddingLeft: depth * 12 + 12 }}
        onClick={() => setOpen((v) => !v)}
      >
        <ChevronRight
          size={11}
          className={`text-zinc-600 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
        />
        <Folder size={10} className="text-amber-500/70 shrink-0" />
        <span className="truncate text-[10px] font-mono text-zinc-500">{node.name}</span>
      </button>
      {open
        ? node.children?.map((child) =>
            child.kind === 'directory' ? (
              <VvsDirNode
                key={child.path}
                node={child}
                depth={depth + 1}
                pathKinds={pathKinds}
                resolveKind={resolveKind}
              />
            ) : (
              <PlainFileRow
                key={child.path}
                path={`.vvs/${child.path}`}
                kind={resolveKind(child.path)}
                depth={depth + 1}
              />
            )
          )
        : null}
    </div>
  );
}

function VvsSubtree({
  paths,
  pathKinds,
}: {
  paths: string[];
  pathKinds: Map<string, ProjectFolderPathKind>;
}) {
  const tree = useMemo(() => vvsDisplayTree(paths), [paths]);
  const [open, setOpen] = useState(true);

  const resolveKind = (path: string) => {
    const full = path.startsWith('.vvs/') ? path : `.vvs/${path}`;
    return pathKinds.get(full) ?? pathKinds.get(path) ?? 'vvs';
  };

  return (
    <div className="border-b border-zinc-800/40 pb-1 mb-1">
      <button
        type="button"
        className={`flex items-center gap-1 py-1.5 pr-2 w-full hover:bg-zinc-900/50 ${INDENT.root}`}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <ChevronDown size={12} className="text-zinc-500" />
        ) : (
          <ChevronRight size={12} className="text-zinc-500" />
        )}
        <FolderOpen size={11} className="text-amber-500/70 shrink-0" />
        <span className="text-[10px] font-mono text-zinc-400 font-semibold">.vvs</span>
        <span className="text-[9px] text-zinc-600 ml-auto pr-1">project metadata</span>
      </button>
      {open
        ? tree.map((node) =>
            node.kind === 'directory' ? (
              <VvsDirNode
                key={node.path}
                node={node}
                depth={1}
                pathKinds={pathKinds}
                resolveKind={resolveKind}
              />
            ) : (
              <PlainFileRow
                key={node.path}
                path={`.vvs/${node.path}`}
                kind={resolveKind(node.path)}
                depth={1}
              />
            )
          )
        : null}
    </div>
  );
}

export function countMatchingProjectPaths(
  entries: ProjectFolderPathEntry[],
  filterQuery: string
): number {
  const q = filterQuery.trim().toLowerCase();
  if (!q) return entries.length;
  return entries.filter((entry) => entry.path.toLowerCase().includes(q)).length;
}

/** Project on-disk tree: `.vvs` metadata and workspace/host files only (no emit preview). */
export function ProjectFilesExplorer({
  entries,
  fileOwners,
  pathKinds,
  graphContainers,
  classes,
  functions,
  filterQuery = '',
  viewMode = 'list',
}: {
  entries: ProjectFolderPathEntry[];
  fileOwners: Record<string, string>;
  pathKinds: Map<string, ProjectFolderPathKind>;
  graphContainers: GraphContainer[];
  classes: ClassSymbol[];
  functions: FunctionSymbol[];
  filterQuery?: string;
  viewMode?: SectionViewMode;
}) {
  const q = filterQuery.trim().toLowerCase();
  const filteredEntries = useMemo(() => {
    if (!q) return entries;
    return entries.filter((entry) => entry.path.toLowerCase().includes(q));
  }, [entries, q]);

  const vvsEntries = useMemo(() => vvsFolderEntries(filteredEntries), [filteredEntries]);
  const orphans = useMemo(
    () => rootOrphanEntries(filteredEntries, fileOwners, graphContainers, classes, functions),
    [filteredEntries, fileOwners, graphContainers, classes, functions]
  );

  return (
    <div className={viewMode === 'grid' ? 'contents' : 'pb-1'}>
      {vvsEntries.length === 0 && orphans.length === 0 && !q ? (
        <div
          className={`${INDENT.l1} text-[10px] text-zinc-600 py-2 pr-2 space-y-1 ${viewMode === 'grid' ? 'col-span-full' : ''}`}
        >
          <p>No generated files yet.</p>
          <p className="text-zinc-700">Generate from the canvas to list outputs here. Click a path to open it in Code.</p>
        </div>
      ) : null}

      {vvsEntries.length > 0 ? (
        viewMode === 'grid' ? (
          vvsEntries.map((entry) => (
            <PlainFileRow
              key={entry.path}
              path={entry.path}
              kind={pathKinds.get(entry.path) ?? 'vvs'}
              depth={0}
              layout="grid"
            />
          ))
        ) : (
          <VvsSubtree paths={vvsEntries.map((e) => e.path)} pathKinds={pathKinds} />
        )
      ) : q ? (
        <div className={`${INDENT.l1} text-[10px] text-zinc-600 italic py-1 pr-2 ${viewMode === 'grid' ? 'col-span-full' : ''}`}>
          No matching files.
        </div>
      ) : null}

      {orphans.length > 0 ? (
        viewMode === 'grid' ? (
          orphans.map((entry) => (
            <PlainFileRow key={entry.path} path={entry.path} kind={entry.kind} depth={0} layout="grid" />
          ))
        ) : (
          <div className="pt-1 border-t border-zinc-800/40 mt-1">
            <div
              className={`${INDENT.l1} text-[9px] font-semibold uppercase tracking-wide text-zinc-600 py-1`}
            >
              Workspace & host files
            </div>
            {orphans.map((entry) => (
              <PlainFileRow key={entry.path} path={entry.path} kind={entry.kind} depth={0} />
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
