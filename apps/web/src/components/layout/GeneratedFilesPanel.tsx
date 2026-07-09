'use client';

import React, { useMemo, useState } from 'react';
import { ChevronRight, FileCode2, Folder, FolderOpen } from 'lucide-react';
import { buildGeneratedFileTree, type GeneratedFileTreeNode } from '@/lib/generatedFileTree';
import { useProjectTranspileResult } from '@/hooks/useProjectTranspileResult';
import { CopyPathButton } from '@/components/ui/CopyPathButton';

interface GeneratedFilesPanelProps {
  selectedFilePath: string | null;
  onSelectFile: (path: string) => void;
  onOpenFile: (path: string) => void;
}

function TreeNode({
  node,
  depth,
  selectedFilePath,
  onSelectFile,
  onOpenFile,
}: {
  node: GeneratedFileTreeNode;
  depth: number;
  selectedFilePath: string | null;
  onSelectFile: (path: string) => void;
  onOpenFile: (path: string) => void;
}) {
  const [open, setOpen] = useState(depth < 2);
  const isDir = node.kind === 'directory';
  const isSelected = !isDir && selectedFilePath === node.path;

  if (!isDir) {
    return (
      <button
        type="button"
        onClick={() => onSelectFile(node.path)}
        onDoubleClick={() => onOpenFile(node.path)}
        className={`group/row w-full flex items-center gap-1 py-0.5 pr-1 rounded text-left transition-colors ${
          isSelected ? 'bg-indigo-500/15 text-indigo-200' : 'hover:bg-zinc-800/50 text-zinc-400'
        }`}
        style={{ paddingLeft: depth * 14 + 8 }}
        title={node.path}
      >
        <FileCode2 size={12} className="text-emerald-500/80 shrink-0" />
        <span className="truncate text-[11px] font-mono flex-1 min-w-0">{node.name}</span>
        <CopyPathButton
          path={node.path}
          className="opacity-0 group-hover/row:opacity-100 shrink-0"
        />
      </button>
    );
  }

  const hasChildren = (node.children?.length ?? 0) > 0;

  return (
    <div>
      <div
        className="group/row flex items-center gap-0.5 py-0.5 pr-1 rounded hover:bg-zinc-800/40"
        style={{ paddingLeft: depth * 14 + 4 }}
      >
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex items-center gap-1 min-w-0 flex-1 text-left"
          title={node.path}
        >
          <ChevronRight
            size={11}
            className={`text-zinc-600 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
          />
          {open ? (
            <FolderOpen size={12} className="text-amber-500/80 shrink-0" />
          ) : (
            <Folder size={12} className="text-amber-500/80 shrink-0" />
          )}
          <span className="truncate text-[11px] font-mono text-zinc-300 font-semibold">
            {node.name}
          </span>
        </button>
        <CopyPathButton
          path={node.path}
          className="opacity-0 group-hover/row:opacity-100 shrink-0"
        />
      </div>
      {open && hasChildren
        ? node.children!.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedFilePath={selectedFilePath}
              onSelectFile={onSelectFile}
              onOpenFile={onOpenFile}
            />
          ))
        : null}
    </div>
  );
}

export function GeneratedFilesPanel({
  selectedFilePath,
  onSelectFile,
  onOpenFile,
}: GeneratedFilesPanelProps) {
  const { result: projectResult } = useProjectTranspileResult();
  const tree = useMemo(
    () => buildGeneratedFileTree(projectResult.files.map((file) => file.path)),
    [projectResult.files]
  );
  const fileCount = projectResult.files.length;

  return (
    <div className="h-full flex flex-col min-h-0 bg-zinc-950">
      <div className="flex-1 min-h-0 overflow-y-auto py-1">
        {fileCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 px-6 text-center">
            <Folder size={20} className="text-zinc-700" />
            <p className="text-[11px] text-zinc-500">
              No generated files yet. Add class graphs or functions on the canvas, then generate.
            </p>
          </div>
        ) : (
          tree.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              depth={0}
              selectedFilePath={selectedFilePath}
              onSelectFile={onSelectFile}
              onOpenFile={onOpenFile}
            />
          ))
        )}
      </div>

      {fileCount > 0 ? (
        <div className="shrink-0 border-t border-zinc-800 px-2 py-1 text-[9px] text-zinc-600 text-center">
          Select a file · double-click to open in Code
        </div>
      ) : null}
    </div>
  );
}
