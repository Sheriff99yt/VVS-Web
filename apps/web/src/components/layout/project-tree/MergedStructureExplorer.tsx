'use client';

import React, { useMemo, useState } from 'react';
import {
  Boxes,
  ChevronDown,
  ChevronRight,
  FileCode2,
  FileJson,
  FileText,
  Folder,
  FolderOpen,
  GitBranch,
  GripVertical,
  PenLine,
  PlaySquare,
  Trash2,
} from 'lucide-react';
import type {
  ClassSymbol,
  GraphContainer,
  ProjectFolderPathEntry,
  ProjectFolderPathKind,
} from '@vvs/graph-types';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import type { GeneratedFileTreeNode } from '@/lib/generatedFileTree';
import { dispatchSelectGeneratedFile } from '@/lib/generatedFileNavigation';
import { classesForContainer } from '@/lib/classScope';
import { CLASS_DRAG_MIME, classDragPayload } from '@/lib/classHelpers';
import type { GraphDocument } from '@/lib/graphDefaults';
import type { ProjectCodegenDefaults } from '@vvs/graph-types';
import { TreeRow } from './TreeRow';
import { CodegenSuffix } from './CodegenSuffix';
import { INDENT } from './constants';
import {
  displayEmitTreeForContainer,
  classForTab,
  draggableClassForTab,
  functionForTab,
  resolveGraphTabKind,
  rootOrphanEntries,
  vvsDisplayTree,
  vvsFolderEntries,
} from '@/lib/mergedStructureTree';
import { containerEmitHint } from '@/lib/structureOutputFiles';

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

function graphKindIcon(tabKind: 'class' | 'function' | 'container') {
  if (tabKind === 'class') {
    return <Boxes size={10} className="text-violet-400/80" />;
  }
  if (tabKind === 'function') {
    return <PlaySquare size={10} className="text-indigo-400/80" />;
  }
  return <GitBranch size={10} className="text-emerald-500/80" />;
}

function graphBackedFileIcon(tabKind: 'class' | 'function' | 'container') {
  return (
    <span className="inline-flex items-center gap-px shrink-0" title="Graph-backed emit file">
      {graphKindIcon(tabKind)}
      <FileCode2 size={9} className="text-zinc-500 -ml-px" />
    </span>
  );
}

function filesystemFolderIcon() {
  return <Folder size={10} className="text-zinc-500 shrink-0" />;
}

export interface MergedStructureExplorerProps {
  entries: ProjectFolderPathEntry[];
  fileOwners: Record<string, string>;
  filePaths: string[];
  pathKinds: Map<string, ProjectFolderPathKind>;
  graphContainers: GraphContainer[];
  classes: ClassSymbol[];
  functions: import('@vvs/graph-types').FunctionSymbol[];
  documents: Record<string, GraphDocument> | null;
  projectCodegenDefaults: ProjectCodegenDefaults;
  activeGraphTab: string;
  activeClassId: string;
  selection: { type: string; id: string | null };
  isReferenceMode: boolean;
  isTabDirty: (tabId: string) => boolean;
  expandedContainerIds: Record<string, boolean>;
  toggleContainerExpanded: (id: string) => void;
  draggingClassId: string | null;
  draggingGraphContainerId: string | null;
  dropContainerId: string | null;
  dropGraphContainerId: string | null;
  onClassDragStart: (e: React.DragEvent, cls: ClassSymbol) => void;
  onClassDragEnd: () => void;
  onGraphContainerDragStart: (e: React.DragEvent, container: GraphContainer) => void;
  onGraphContainerDragEnd: () => void;
  onContainerDragOver: (e: React.DragEvent, containerId: string) => void;
  onContainerDrop: (e: React.DragEvent, containerId: string) => void;
  onContainerDragLeave: (containerId: string) => void;
  selectGraph: (graphId: string) => void;
  openGraphContainer: (container: GraphContainer) => void;
  selectClass: (cls: ClassSymbol) => void;
  openClassGraph: (cls: ClassSymbol) => void;
  openGraph: (graphId: string, type: 'function') => void;
  classSymbolCounts: (classId: string) => {
    functions: number;
    events: number;
    variables: number;
  };
  canRenameContainer: (container: GraphContainer) => boolean;
  canDeleteContainer: (container: GraphContainer) => boolean;
  deleteContainer: (id: string) => void;
  onStartRenameContainer: (container: GraphContainer) => void;
  renamingContainerId: string | null;
  renameContainerName: string;
  setRenameContainerName: (name: string) => void;
  onSaveContainerRename: (container: GraphContainer) => void;
  onCancelContainerRename: () => void;
}

function PlainFileRow({
  path,
  kind,
  depth,
}: {
  path: string;
  kind: ProjectFolderPathKind;
  depth: number;
}) {
  const name = path.split('/').pop() ?? path;
  const isGenerated = kind === 'generated';
  return (
    <button
      type="button"
      className="group w-full flex items-center gap-1 py-0.5 pr-2 rounded text-left hover:bg-zinc-900/60"
      style={{ paddingLeft: depth * 12 + 20 }}
      title={path}
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
        <ChevronRight size={11} className={`text-zinc-600 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
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
        {open ? <ChevronDown size={12} className="text-zinc-500" /> : <ChevronRight size={12} className="text-zinc-500" />}
        <FolderOpen size={11} className="text-amber-500/70 shrink-0" />
        <span className="text-[10px] font-mono text-zinc-400 font-semibold">.vvs</span>
        <span className="text-[9px] text-zinc-600 ml-auto pr-1">project metadata</span>
      </button>
      {open
        ? tree.map((node) =>
            node.kind === 'directory' ? (
              <VvsDirNode key={node.path} node={node} depth={1} pathKinds={pathKinds} resolveKind={resolveKind} />
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

function MergedEmitFileRow({
  node,
  depth,
  pathKinds,
  fileOwners,
  containerId,
  props,
}: {
  node: GeneratedFileTreeNode;
  depth: number;
  pathKinds: Map<string, ProjectFolderPathKind>;
  fileOwners: Record<string, string>;
  containerId: string;
  props: MergedStructureExplorerProps;
}) {
  const tabId = fileOwners[node.path];
  const tabKind = tabId
    ? resolveGraphTabKind(tabId, props.classes, props.functions, props.graphContainers)
    : undefined;
  const kind = pathKinds.get(node.path) ?? 'generated';

  if (!tabId || !tabKind || tabKind === 'container') {
    return <PlainFileRow path={node.path} kind={kind} depth={depth} />;
  }

  const cls = draggableClassForTab(tabId, props.classes, props.functions);
  const fn = functionForTab(tabId, props.functions);
  const classHome = tabKind === 'class' ? classForTab(tabId, props.classes) : undefined;
  const counts = classHome ? props.classSymbolCounts(classHome.id) : null;
  const isActive =
    tabKind === 'class' && classHome
      ? props.activeClassId === classHome.id && props.activeGraphTab === tabId
      : props.selection.type === 'function' && props.selection.id === tabId;

  const meta =
    tabKind === 'class' && classHome && counts && props.activeClassId === classHome.id
      ? 'active'
      : tabKind === 'function' && fn && fn.binding !== 'instance'
        ? fn.binding
        : undefined;

  return (
    <>
      <TreeRow
        depth={depth <= 1 ? 'l1' : 'l2'}
        active={isActive}
        leading={
          cls && !props.isReferenceMode ? (
            <span
              draggable
              className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 p-0"
              title="Drag grip to move output folder"
              onClick={(e) => e.stopPropagation()}
              onDragStart={(e) => {
                e.stopPropagation();
                props.onClassDragStart(e, cls);
              }}
              onDragEnd={props.onClassDragEnd}
            >
              <GripVertical size={10} />
            </span>
          ) : (
            <span className="w-2.5" />
          )
        }
        icon={graphBackedFileIcon(tabKind)}
        label={node.name}
        meta={meta}
        hint={
          tabKind === 'class' && classHome && counts
            ? `${classHome.name} · drag row to canvas · grip to move folder`
            : 'Double-click to open graph'
        }
        isDragging={cls ? props.draggingClassId === cls.id : false}
        canvasDrag={
          cls && !props.isReferenceMode
            ? { mimeType: CLASS_DRAG_MIME, payload: classDragPayload(cls) }
            : undefined
        }
        onSelect={() => {
          if (tabKind === 'class' && classHome) props.selectClass(classHome);
          else if (fn) props.openGraph(fn.id, 'function');
        }}
        onOpen={() => {
          if (tabKind === 'class' && classHome) props.openClassGraph(classHome);
          else if (fn) props.openGraph(fn.id, 'function');
          else dispatchSelectGeneratedFile(node.path);
        }}
        showOpenAffordance
        suffix={
          tabKind === 'class' && classHome ? (
            <CodegenSuffix
              tabId={tabId}
              documents={props.documents}
              projectDefaults={props.projectCodegenDefaults}
            />
          ) : props.isTabDirty(tabId) ? (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Uncompiled changes" />
          ) : null
        }
      />
    </>
  );
}

function MergedEmitDirNode({
  node,
  depth,
  pathKinds,
  fileOwners,
  containerId,
  props,
}: {
  node: GeneratedFileTreeNode;
  depth: number;
  pathKinds: Map<string, ProjectFolderPathKind>;
  fileOwners: Record<string, string>;
  containerId: string;
  props: MergedStructureExplorerProps;
}) {
  const [open, setOpen] = useState(depth < 2);
  return (
    <div key={node.path}>
      <button
        type="button"
        className="flex items-center gap-1 py-0.5 pr-2 w-full hover:bg-zinc-900/50 text-left"
        style={{ paddingLeft: depth * 12 + 12 }}
        onClick={() => setOpen((v) => !v)}
      >
        <ChevronRight size={11} className={`text-zinc-600 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
        {filesystemFolderIcon()}
        <span className="truncate text-[10px] font-mono text-zinc-500">{node.name}</span>
      </button>
      {open
        ? node.children?.map((child) => (
            <MergedFileNode
              key={child.path}
              node={child}
              depth={depth + 1}
              pathKinds={pathKinds}
              fileOwners={fileOwners}
              containerId={containerId}
              props={props}
            />
          ))
        : null}
    </div>
  );
}

function MergedFileNode({
  node,
  depth,
  pathKinds,
  fileOwners,
  containerId,
  props,
}: {
  node: GeneratedFileTreeNode;
  depth: number;
  pathKinds: Map<string, ProjectFolderPathKind>;
  fileOwners: Record<string, string>;
  containerId: string;
  props: MergedStructureExplorerProps;
}) {
  if (node.kind === 'directory') {
    return (
      <MergedEmitDirNode
        node={node}
        depth={depth}
        pathKinds={pathKinds}
        fileOwners={fileOwners}
        containerId={containerId}
        props={props}
      />
    );
  }
  return (
    <MergedEmitFileRow
      node={node}
      depth={depth}
      pathKinds={pathKinds}
      fileOwners={fileOwners}
      containerId={containerId}
      props={props}
    />
  );
}

export function MergedStructureExplorer(props: MergedStructureExplorerProps) {
  const {
    entries,
    fileOwners,
    filePaths,
    pathKinds,
    graphContainers,
    classes,
    functions,
    expandedContainerIds,
    toggleContainerExpanded,
  } = props;

  const vvsEntries = useMemo(() => vvsFolderEntries(entries), [entries]);
  const orphans = useMemo(
    () => rootOrphanEntries(entries, fileOwners, graphContainers, classes, functions),
    [entries, fileOwners, graphContainers, classes, functions]
  );

  return (
    <div className="pb-1">
      {vvsEntries.length > 0 ? (
        <VvsSubtree paths={vvsEntries.map((e) => e.path)} pathKinds={pathKinds} />
      ) : null}

      {graphContainers.map((container) => {
        const containerClasses = classesForContainer(classes, container.id);
        const isExpanded = expandedContainerIds[container.id] ?? true;
        const emitTree = displayEmitTreeForContainer(
          container,
          classes,
          functions,
          fileOwners,
          filePaths
        );
        const hasEmitTree = emitTree.length > 0;
        const isOrgMap = container.id === MAIN_GRAPH_CONTAINER_ID;
        const isDrop =
          props.dropContainerId === container.id || props.dropGraphContainerId === container.id;

        if (hasEmitTree && !isOrgMap) {
          return (
            <React.Fragment key={container.id}>
              <TreeRow
                leading={
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      className="p-0.5 text-zinc-500 hover:text-zinc-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleContainerExpanded(container.id);
                      }}
                    >
                      {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                    </button>
                    <span
                      draggable
                      className="p-0.5 text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing"
                      title="Drag to reorder folder"
                      onClick={(e) => e.stopPropagation()}
                      onDragStart={(e) => props.onGraphContainerDragStart(e, container)}
                      onDragEnd={props.onGraphContainerDragEnd}
                    >
                      <GripVertical size={10} />
                    </span>
                  </div>
                }
                icon={<GitBranch size={10} className="text-emerald-500/80 shrink-0" />}
                label={props.renamingContainerId === container.id ? props.renameContainerName : container.name}
                meta={
                  [
                    `${containerClasses.length} class${containerClasses.length === 1 ? '' : 'es'}`,
                    containerEmitHint(container),
                  ]
                    .filter(Boolean)
                    .join(' · ') || undefined
                }
                hint="Drop class from Symbols to set output folder · double-click to open canvas"
                active={props.activeGraphTab === container.id}
                isDragging={props.draggingGraphContainerId === container.id}
                isDropTarget={isDrop}
                onSelect={() => props.selectGraph(container.id)}
                onOpen={() => props.openGraphContainer(container)}
                showOpenAffordance
                onDragOver={(e) => props.onContainerDragOver(e, container.id)}
                onDrop={(e) => props.onContainerDrop(e, container.id)}
                onDragLeave={() => props.onContainerDragLeave(container.id)}
                suffix={
                  !props.isReferenceMode ? (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                      {props.canRenameContainer(container) ? (
                        <button
                          type="button"
                          className="p-0.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-200"
                          title="Rename folder"
                          onClick={(e) => {
                            e.stopPropagation();
                            props.onStartRenameContainer(container);
                          }}
                        >
                          <PenLine size={10} />
                        </button>
                      ) : null}
                      {props.canDeleteContainer(container) ? (
                        <button
                          type="button"
                          className="p-0.5 hover:bg-zinc-700 rounded text-zinc-500 hover:text-red-400"
                          title="Delete folder"
                          onClick={(e) => {
                            e.stopPropagation();
                            props.deleteContainer(container.id);
                          }}
                        >
                          <Trash2 size={10} />
                        </button>
                      ) : null}
                    </div>
                  ) : null
                }
              />
              {props.renamingContainerId === container.id ? (
                <div className={`${INDENT.l2} py-1 pr-2 flex gap-1`}>
                  <input
                    type="text"
                    value={props.renameContainerName}
                    onChange={(e) => props.setRenameContainerName(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-[10px] text-white"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') props.onSaveContainerRename(container);
                      if (e.key === 'Escape') props.onCancelContainerRename();
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => props.onSaveContainerRename(container)}
                    className="px-2 py-0.5 rounded text-[9px] bg-indigo-500/20 text-indigo-200 border border-indigo-500/30"
                  >
                    Save
                  </button>
                </div>
              ) : null}
              {isExpanded
                ? emitTree.map((node) => (
                    <MergedFileNode
                      key={node.path}
                      node={node}
                      depth={1}
                      pathKinds={pathKinds}
                      fileOwners={fileOwners}
                      containerId={container.id}
                      props={props}
                    />
                  ))
                : null}
            </React.Fragment>
          );
        }

        return (
          <React.Fragment key={container.id}>
            <TreeRow
              leading={
                !props.isReferenceMode ? (
                  <span
                    draggable
                    className="p-0.5 text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing"
                    onClick={(e) => e.stopPropagation()}
                    onDragStart={(e) => props.onGraphContainerDragStart(e, container)}
                    onDragEnd={props.onGraphContainerDragEnd}
                  >
                    <GripVertical size={10} />
                  </span>
                ) : (
                  <span className="w-2.5" />
                )
              }
              icon={<GitBranch size={10} className="text-emerald-500/80 shrink-0" />}
              label={props.renamingContainerId === container.id ? props.renameContainerName : container.name}
              meta={`${containerClasses.length} class${containerClasses.length === 1 ? '' : 'es'}`}
              onSelect={() => props.selectGraph(container.id)}
              onOpen={() => props.openGraphContainer(container)}
              showOpenAffordance
              isDropTarget={isDrop}
              onDragOver={(e) => props.onContainerDragOver(e, container.id)}
              onDrop={(e) => props.onContainerDrop(e, container.id)}
              onDragLeave={() => props.onContainerDragLeave(container.id)}
            />
          </React.Fragment>
        );
      })}

      {orphans.length > 0 ? (
        <div className="pt-1 border-t border-zinc-800/40 mt-1">
          <div className={`${INDENT.l1} text-[9px] font-semibold uppercase tracking-wide text-zinc-600 py-1`}>
            Workspace & host files
          </div>
          {orphans.map((entry) => (
            <PlainFileRow key={entry.path} path={entry.path} kind={entry.kind} depth={0} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
